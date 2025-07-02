const userModel = require("../db/models/user.schema.js");
const { sendResponse, randomNumber, currentDate, validateExpiry } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")

const { sendConfirmEmail } = require("./auth.helper.js");
const jwtGenerator = require("../utils/jwt.generator.js");
const tokenSchema = require('./token.schema');
const bcrypt = require ('bcrypt');
const CONFIG = require('../../config/config.js')

const {setTokenWithCookies} = require('../utils/setCookies.js');



const chcekEmail = async (email) => {
    const user = await userModel.findOne({email});
    if (user) {
        return { exists: true, user}; 
    } else {
        return { exists: false, user: null };  
    }
};



//--------shop--------\\
const signUpShop = async ( req, res, next ) => {
    try {
        
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
}
//--------user--------\\

//.......................signUp.........................\\
const signUpUser=async(req,res,next)=>{
    try {
        const {userName,email,password}=req.body;
        const user=await chcekEmail(email)           
        if(user.exists){            
            sendResponse(res,constants.RESPONSE_BAD_REQUEST,"email already exist",{},[])
        }
        else{
            const newUser=new userModel({
                userName,
                email,
                password,
                verificationCode:randomNumber(),
                verificationCodeDate:currentDate(Date.now())
            })
            const subject="Confirmation Email Send From Bazarya Application";
            const code=newUser.verificationCode;
            const info= sendConfirmEmail(newUser.email,code,subject)
            if (info) {
                const savedUser = await newUser.save();
                sendResponse(res,constants.RESPONSE_CREATED,"Your signup was completed successfully! ",{},{});
            }else {
                sendResponse(res,constants.RESPONSE_BAD_REQUEST,"rejected Eamil", [], []);
            }
        }
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
}

//....................verifyEmail.....................\\
const verifyEmail =async(req,res,next)=>{
    try {
        const {email,code}=req.body;
        const {user} = await chcekEmail(email)     
        if(!user||user.verificationCode!==code||user.verificationCode==null||!validateExpiry(user.verificationCodeDate,"minutes",35)){
            sendResponse(res,constants.RESPONSE_BAD_REQUEST,"Invalid code or email",{},[])
        }
        else{
            user.activateEmail = true; 
            user.verificationCode = null;
            await user.save()
            sendResponse(res,constants.RESPONSE_SUCCESS,"Email confirmed success",{},[])
        }
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
        
    }
}

//.........................resendActivateCode.........................//
const resendCode=async(req,res,next)=>{
    try {
        const {email , codeType}=req.body;
        const {user}=await chcekEmail(email)
        if(user.activateEmail && codeType==="activate"){
            sendResponse(res,constants.RESPONSE_BAD_REQUEST,"Email already confirmed",{},[])
        }
        else{
            user.verificationCode=randomNumber(),
            user.verificationCodeDate=currentDate(Date.now())
            const subject=(codeType==="activate")? "Confirmation Email Send From Chat Application":
                        "an update password Email Send From Chat Application";
            const code=user.verificationCode;
            const info= sendConfirmEmail(user.email,code,subject, codeType)
            if (info) {
                await user.save();
                sendResponse(res,constants.RESPONSE_CREATED,"Code send successfully","",{});
            } else {
                sendResponse(res,constants.RESPONSE_BAD_REQUEST,"rejected Eamil", {}, []);
            }
        }
    } catch (error) {
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
}

//.......................login.........................//

const login = async (req, res, next)=>{
    try{
        const {email, password} = req.body;
        const {user}=await chcekEmail(email);
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
            // await Model.findOneAndUpdate({ email: user.email },{ $set: { verificationCode: code, verificationCodeDate: currentDate(Date.now())}});
            await sendConfirmEmail(user.email, code, 'Confirmation Email - Chat Application');
            return sendResponse(res, constants.RESPONSE_FORBIDDEN, "Please activate your email first.", {activateEmail:false}, [])
        }
        const userId = (user.userId)?  user.userId: user.companyId;
        const accToken = await jwtGenerator({ userId: userId, role:user.role }, 24, "h");
        const existingToken = await tokenSchema.findOne({ userId });
        if (existingToken) {
            await tokenSchema.updateOne(
                { userId },
                { $set: {token: accToken } }
            );
        } else {
            newToken = new tokenSchema({
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

const forgetPassword = async (req, res, next) => {
    try {
        const {email} = req.body;
        const  {user} = await chcekEmail(email);
        if (!user) {
            sendResponse(res, constants.RESPONSE_BAD_REQUEST, "This email does not exist", {}, [])
        } else {
            const subject="an update password Email Send From Chat Application";
            const code=randomNumber();
            const info= await sendConfirmEmail(email,code,subject, "forget")
            if (info) {
                user.verificationCode = code;
                user.verificationCodeDate = currentDate(Date.now());
                await user.save();
                sendResponse(res, constants.RESPONSE_SUCCESS, `we sent you an email at ${email}`, {}, [])
            }
        }
    } catch (error) {
        sendResponse( res,constants.RESPONSE_INT_SERVER_ERROR,error.message,{},constants.UNHANDLED_ERROR);
    }
};

const setPassword = async (req, res, next) => {
    try {
        const { password, code, email } = req.body;
        const  {user} = await chcekEmail(email);
        if (user.verificationCode === code && validateExpiry(user.verificationCodeDate, 'minutes', 35) && code) {
            const encryptedPassword = bcrypt.hashSync(password, parseInt(CONFIG.BCRYPT_SALT));
            user.verificationCode = null;
            user.encryptedPassword = encryptedPassword;
            await user.save();
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
    signUpUser,
    verifyEmail,
    resendCode,
    login,
    forgetPassword,
    setPassword,
    signOut
}