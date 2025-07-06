const userModel = require("../db/models/user.schema.js");
const shopModel = require("../db/models/shop.schema.js");
const { sendResponse, randomNumber, currentDate, validateExpiry } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")

const { sendConfirmEmail } = require("./auth.helper.js");
const jwtGenerator = require("../utils/jwt.generator.js");
const tokenSchema = require('./token.schema');
const bcrypt = require ('bcrypt');
const CONFIG = require('../../config/config.js')
const utils = require("../utils/utils.js");

const {setTokenWithCookies} = require('../utils/setCookies.js');



const chcekEmail = async (email, isUser) => {
    let userOrShop = null;
    if(isUser){
        userOrShop = await userModel.findOne({email});
    }
    else{
        userOrShop = await shopModel.findOne({email});
    }
    if (userOrShop) {
        return { exists: true, userOrShop}; 
    } else {
        return { exists: false, userOrShop: null };  
    }
};



//--------shop--------\\
const signUpShop = async ( req, res, next ) => {
    let uploadedFiles = [];
    try {
        const {shopName, email, password, ownerFullName, phone, address}=req.body;
        const shop = await shopModel.findOne({email});           
        if(shop){            
            return sendResponse(res,constants.RESPONSE_BAD_REQUEST,"email already exist",{},[])
        }
        else{
            const newShop=new shopModel({
                shopName,
                email,
                password,
                ownerFullName,
                phone,
                address,
                verificationCode:randomNumber(),
                verificationCodeDate:currentDate(Date.now())
            })
            if (req.files){
                if (!req.files['ownerNationalIdImage'][0]||!req.files['selfieWithId'][0]||!req.files['profileImage'][0]){
                    return sendResponse(res,constants.RESPONSE_BAD_REQUEST,"Missing file or files!",{},{});
                }
                const ownerNationalIdImage = req.files['ownerNationalIdImage'][0];
                const selfieWithId = req.files['selfieWithId'][0];
                const profileImage = req.files['profileImage'][0];

                const result1 = await utils.uploadFileToImageKit(ownerNationalIdImage.buffer, "owner_National_Id_Image", `/Bazarya/Shops/${newShop.shopName}/files/owner_National_Id_Image/`);
                uploadedFiles.push(result1.fileId);
                const result2 = await utils.uploadFileToImageKit(selfieWithId.buffer, "selfie_With_Id", `/Bazarya/Shops/${newShop.shopName}/images/selfie_With_Id/`);
                uploadedFiles.push(result2.fileId);
                const result3 = await utils.uploadFileToImageKit(profileImage.buffer, "profile_Image", `/Bazarya/Shops/${newShop.shopName}/images/profile-Image/`);
                uploadedFiles.push(result3.fileId);
                try {
                    newShop.addOwnerNationalIdImage(result1);
                    newShop.addSelfieWithId(result2);
                    newShop.addProfileImage(result3);
                } catch (methodError) {
                    return sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, "Error adding images: " + methodError.message, {}, []);
                }
            }
            const subject="Confirmation Email Send From Bazarya Application";
            const code=newShop.verificationCode;
            const info= await sendConfirmEmail(newShop.email,code,subject)
            if (info && info.messageId) {
                // Check if email was accepted by the server
                if (info.accepted && info.accepted.length > 0) {
                    console.log('Email accepted:', info.accepted);
                    const savedShop = await newShop.save();
                    sendResponse(res, constants.RESPONSE_CREATED, "Signup completed! Please check your email for verification.", {}, {});
                } else if (info.rejected && info.rejected.length > 0) {
                    console.log('Email rejected:', info.rejected);
                    sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Email address was rejected by the server", [], []);
                } else {
                    sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Email sending failed", [], []);
                }
            } else {
                sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Failed to send confirmation email", [], []);
            }
        }
    } catch (error) {
        for (const fileId of uploadedFiles) {
            try {
                utils.deleteFileFromImageKit(fileId);
            } catch (deleteError) {
                console.error('Failed to delete file:', fileId, deleteError);
            }
        }
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
}
const loginShop = async ( req, res, next ) => {
    try {
        const {email, password} = req.body;
        const shop = await shopModel.findOne({email});
        if(!shop){
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "this email is not found please try to signup!", {}, [])
        }
        const isPasswordCorrect =  await shop.comparePassword(password)
        if(!isPasswordCorrect){
            return sendResponse(res, constants.RESPONSE_FORBIDDEN, "Incorrect password.", {}, [])
        }
        if(!shop.activateEmail){
            const code = randomNumber();
            shop.verificationCode = code;
            shop.verificationCodeDate = currentDate(Date.now());
            await shop.save();
            await sendConfirmEmail(shop.email, code, 'Confirmation Email - Bzarya Application');
            return sendResponse(res, constants.RESPONSE_FORBIDDEN, "Please activate your email first.", {activateEmail:false}, [])
        }
        const shopId =  shop.shopId
        const accToken = await jwtGenerator({ shopId: shopId, role:shop.role }, 24, "h");
        const existingToken = await tokenSchema.findOne({ userId: shopId });
        if (existingToken) {
            await tokenSchema.updateOne(
                { userId: shopId },
                { $set: {token: accToken } }
            );
        } else {
            const newToken = new tokenSchema({
                userId: shopId,
                token: accToken,
            });
            await newToken.save();
        }
        setTokenWithCookies(req, res, accToken);
        const data = {
            token: accToken,
            shopId: shopId,
            role: shop.role
        }
        return sendResponse(res, constants.RESPONSE_SUCCESS, 'Login successful', data, [])
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
}
//--------user--------\\

//.......................signUp.........................\\
const signUpUser=async(req,res,next)=>{
    try {
        const {fName, lName, email, password}=req.body;
        const user = await userModel.findOne({email});           
        if(user){            
            sendResponse(res,constants.RESPONSE_BAD_REQUEST,"email already exist",{},[])
        }
        else{
            const newUser=new userModel({
                fName,
                lName,
                userName: fName+" "+lName,
                email,
                password,
                verificationCode:randomNumber(),
                verificationCodeDate:currentDate(Date.now())
            })
            const subject="Confirmation Email Send From Bazarya Application";
            const code=newUser.verificationCode;
            const info= await sendConfirmEmail(newUser.email,code,subject)
            console.log(info);
            if (info && info.messageId) {
                // Check if email was accepted by the server
                if (info.accepted && info.accepted.length > 0) {
                    console.log('Email accepted:', info.accepted);
                    const savedUser = await newUser.save();
                    sendResponse(res,constants.RESPONSE_CREATED,"Your signup was completed successfully! ",{},{});
                } else if (info.rejected && info.rejected.length > 0) {
                    console.log('Email rejected:', info.rejected);
                    sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Email address was rejected by the server", [], []);
                } else {
                    sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Email sending failed", [], []);
                }
            } else {
                sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Failed to send confirmation email", [], []);
            }
        }
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
}

const login = async (req, res, next)=>{
    try{
        const {email, password} = req.body;
        const user = await userModel.findOne({email});;
        if(!user){
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "this email is not found please try to signup!", {}, [])
        }
        const isPasswordCorrect =  await user.comparePassword(password)
        if(!isPasswordCorrect){
            return sendResponse(res, constants.RESPONSE_FORBIDDEN, "Incorrect password.", {}, [])
        }
        if(!user.activateEmail){
            const code = randomNumber();
            user.verificationCode = code;
            user.verificationCodeDate = currentDate(Date.now());
            await user.save()
            await sendConfirmEmail(user.email, code, 'Confirmation Email - Bzarya Application');
            return sendResponse(res, constants.RESPONSE_FORBIDDEN, "Please activate your email first.", {activateEmail:false}, [])
        }
        const userId =  user.userId
        const accToken = await jwtGenerator({ userId: userId, role:user.role }, 24, "h");
        const existingToken = await tokenSchema.findOne({ userId });
        if (existingToken) {
            await tokenSchema.updateOne(
                { userId },
                { $set: {token: accToken } }
            );
        } else {
            const newToken = new tokenSchema({
                userId: userId,
                token: accToken,
            });
            await newToken.save();
        }
        setTokenWithCookies(req, res, accToken);
        const data = {
            token: accToken,
            userId: userId,
            role: user.role
        }
        return sendResponse(res, constants.RESPONSE_SUCCESS, 'Login successful', data, [])
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
}


//--------General--------\\
//....................verifyEmail.....................\\
const verifyEmail =async(req,res,next)=>{
    try {
        const {email, code, isUser}=req.body;
        const { userOrShop } = await chcekEmail(email, isUser)     
        if(!userOrShop||userOrShop.verificationCode!==code||userOrShop.verificationCode==null||!validateExpiry(userOrShop.verificationCodeDate,"minutes",35)){
            console.log(typeof userOrShop.verificationCode, typeof code);
            sendResponse(res,constants.RESPONSE_BAD_REQUEST,"Invalid code or email",{},[])
        }
        else{
            userOrShop.activateEmail = true; 
            userOrShop.verificationCode = null;
            await userOrShop.save()
            sendResponse(res,constants.RESPONSE_SUCCESS,"Email confirmed success",{},[])
        }
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
        
    }
}

//.........................resendActivateCode.........................//
const resendCode=async(req,res,next)=>{
    try {
        const {email , codeType, isUser}=req.body;
        const { userOrShop }=await chcekEmail(email, isUser)
        if(userOrShop.activateEmail && codeType==="activate"){
            sendResponse(res,constants.RESPONSE_BAD_REQUEST,"Email already confirmed",{},[])
        }
        else{
            userOrShop.verificationCode=randomNumber(),
            userOrShop.verificationCodeDate=currentDate(Date.now())
            const subject=(codeType==="activate")? "Confirmation Email Send From Bazarya Application":
                        "an update password Email Send From Bazarya Application";
            const code=userOrShop.verificationCode;
            const info= await sendConfirmEmail(userOrShop.email,code,subject, codeType)
            if (info && info.messageId) {
                if (info.accepted && info.accepted.length > 0) {
                    console.log('Email accepted:', info.accepted);
                    await userOrShop.save();
                    sendResponse(res,constants.RESPONSE_CREATED,"Code send successfully","",{});
                } else if (info.rejected && info.rejected.length > 0) {
                    console.log('Email rejected:', info.rejected);
                    sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Email address was rejected by the server", [], []);
                } else {
                    sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Email sending failed", [], []);
                }
            } else {
                sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Failed to send code", [], []);
            }
        }
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
}

const forgetPassword = async (req, res, next) => {
    try {
        const {email, isUser} = req.body;
        const  { userOrShop } = await chcekEmail(email, isUser);
        if (!userOrShop) {
            sendResponse(res, constants.RESPONSE_BAD_REQUEST, "This email does not exist", {}, [])
        } else {
            const subject="an update password Email Send From Bazarya Application";
            const code=randomNumber();
            const info= await sendConfirmEmail(email,code,subject, "forget")
            if (info && info.messageId) {
                if (info.accepted && info.accepted.length > 0) {
                    console.log('Email accepted:', info.accepted);
                    userOrShop.verificationCode = code;
                    userOrShop.verificationCodeDate = currentDate(Date.now());
                    await userOrShop.save();
                    sendResponse(res, constants.RESPONSE_SUCCESS, `we sent you an email at ${email}`, {}, [])
                } else if (info.rejected && info.rejected.length > 0) {
                    console.log('Email rejected:', info.rejected);
                    sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Email address was rejected by the server", [], []);
                } else {
                    sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Email sending failed", [], []);
                }
            } else {
                sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Failed to send code", [], []);
            }
        }
    } catch (error) {
        sendResponse( res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
};

const setPassword = async (req, res, next) => {
    try {
        const { password, code, email, isUser } = req.body;
        const  { userOrShop } = await chcekEmail(email, isUser);
        if (userOrShop.verificationCode === code && validateExpiry(userOrShop.verificationCodeDate, 'minutes', 35) && code) {
            const encryptedPassword = bcrypt.hashSync(password, parseInt(CONFIG.BCRYPT_SALT));
            userOrShop.verificationCode = null;
            userOrShop.encryptedPassword = encryptedPassword;
            await userOrShop.save();
            sendResponse(res, constants.RESPONSE_SUCCESS, "Set new password successful", {}, [])
        } else {
            sendResponse( res, constants.RESPONSE_BAD_REQUEST, "Invalid or expired code", "", [])
        }
    } catch (error) {
        sendResponse( res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);;
    }
};



const signOut=async(req,res,next)=>{ 
    try {
        console.log(req.user);
        res.clearCookie("jwtToken");
        sendResponse(res, constants.RESPONSE_SUCCESS, "log out successful", {}, [])
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
};






module.exports={
    signUpShop,
    loginShop,
    signUpUser,
    verifyEmail,
    resendCode,
    login,
    forgetPassword,
    setPassword,
    signOut
}