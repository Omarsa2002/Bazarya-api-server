const userModel = require("../db/models/user.schema.js");
const shopModel = require("../db/models/shop.schema.js");
const { sendResponse, randomNumber, currentDate, validateExpiry } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")

//const { sendConfirmEmail } = require("./auth.helper.js");
const jwtGenerator = require("../utils/jwt.generator.js");
const bcrypt = require ('bcrypt');
const CONFIG = require('../../config/config.js')
const utils = require("../utils/utils.js");

const {setTokenWithCookies} = require('../utils/setCookies.js');
const { date } = require("joi");



const acceptShop = async (req, res, next)=>{
    try{
        const { shopId } = req.params
        const { accepted, reason } = req.body
        if(accepted){
            const shop = await shopModel.findOneAndUpdate(
                {shopId}, 
                {$set:{checkedShop: true, status: "accepted", reasonIfRejected: null, verifiedAt:currentDate(Date.now())}},
                {new:true}
            );
            if(shop){
                const data ={
                    shopId: shopId,
                    shopName: shop.shopName,
                    status: shop.status,
                }
                sendResponse(res, constants.RESPONSE_SUCCESS, "this shop verified successfully", data, []);
            }else{
                sendResponse(res, constants.RESPONSE_NOT_FOUND, "shop not found", {}, []);
            }
        }else{
            const shop = await shopModel.findOneAndUpdate(
                {shopId}, 
                {$set:{checkedShop: false, reasonIfRejected: reason, status: "suspended", verifiedAt:currentDate(Date.now())}},
                {new:true}
            );
            if(shop){
                const data ={
                    shopId: shopId,
                    shopName: shop.shopName,
                    status: shop.status,
                }
                sendResponse(res, constants.RESPONSE_SUCCESS, "you reject this shop", data, []);
            }else{
                sendResponse(res, constants.RESPONSE_NOT_FOUND, "shop not found", {}, []);
            }
        }
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}





module.exports={
    acceptShop
}