const shopModel = require("../db/models/shop.schema.js");
const { sendResponse, randomNumber, currentDate, validateExpiry, paginationWrapper } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")

//const { sendConfirmEmail } = require("./auth.helper.js");
const jwtGenerator = require("../utils/jwt.generator.js");
const bcrypt = require ('bcrypt');
const CONFIG = require('../../config/config.js')
const utils = require("../utils/utils.js");

const {setTokenWithCookies} = require('../utils/setCookies.js');



const getAllShops = async (req, res, next)=>{
    try{
        const { page, size } = req.query;
        const { limit, offset } = paginationWrapper(page, size);
        const shops = await shopModel.find().limit(limit).skip(offset)
        .select('-_id shopId shopName profileImage activateEmail checkedShop isFeatured rating reviewsCount status');
        sendResponse(res, constants.RESPONSE_SUCCESS, "all shops", shops, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const getShop = async (req, res, next) => {
    try{
        const { shopId } = req.params
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const updateShop = async (req, res, next) => {
    try{
        const { shopId } = req.user;
        const shop = await shopModel.findOne({shopId});
        if(req.body.phone){
            shop.phone = req.body.phone;
            shop.checkedShop = false;
        }
        if(req.body.description){
            shop.description = req.body.description
        }
        if(req.body.categories){
            req.body.categories.forEach(category => {
                if(!shop.categories.includes(category)){
                    shop.categories.push(category);
                }
            });
        }
        if(req.body.commercialRegNo){
            shop.commercialRegNo = req.body.commercialRegNo;
        }
        if(req.body.taxCardNo){
            shop.taxCardNo = req.body.taxCardNo;
        }
        if(req.body.deliveryAvailable){
            shop.deliveryAvailable = req.body.deliveryAvailable;
        }
        if(req.files['businessLicenseImage'][0]){
            if(!shop.businessLicenseImage.pdfId){
                const result = await utils.uploadFileToImageKit(req.files['businessLicenseImage'][0].buffer,'business_License_Image',`/Bazarya/Shops/${shop.shopName}/files/business_License_Image/`)
                shop.addBusinessLicenseImage(result);
            }else{
                return sendResponse(res, constants.RESPONSE_FORBIDDEN, "you are not allowed to change this file", {}, []);
            }
        }
        if(req.files['profileImage'][0]){
            const result = await utils.replaceFileByDeleteAndUpload(shop.profileImage.imageId, req.files['profileImage'][0].buffer, 'profile_Image', `/Bazarya/Shops/${shop.shopName}/files/profile_Image/`)
            shop.addProfileImage(result);
        }
        await shop.save();
        sendResponse(res, constants.RESPONSE_SUCCESS, "your data updated", {}, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const add = async (req, res, next) => {
    try{
        const { shopId } = req.params
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const deleteShop = async (req, res, next) => {
    try{
        const { shopId } = req.params
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}






module.exports={
    getAllShops,
    getShop,
    updateShop,
    deleteShop
}