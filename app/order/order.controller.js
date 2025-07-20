const productModel = require("../db/models/product.schema.js");
const userModel = require("../db/models/user.schema.js");
const orderModel = require("../db/models/order.schema.js");
const shopModel = require("../db/models/shop.schema.js");
const slugify = require('slugify');
const { sendResponse, paginationWrapper } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")
const utils = require('../utils/utils.js');
//const aggregation = require('./order.aggregationQuery.js');



const getAllUserOrders = async (req, res, next) => {
    try {
        const { userId } = req.params

        sendResponse(res, constants.RESPONSE_SUCCESS, "Orders retrieved successfully", responseData, []);
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, "", constants.UNHANDLED_ERROR);
    }
}

const getAllShopoOrders = async (req, res, next) => {
    try{
        const { shopId } = req.params

        sendResponse(res, constants.RESPONSE_SUCCESS, "done", product, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const createOrder = async (req, res, next) => {
    try{
        const userOrAdminId = (req.user.userId)? req.user.userId: req.user.adminId;
        const {productId, quantity, deliveryAddress} = req.body 
        const productExist = await productModel.findOne({productId: productId})
        //check if product exist
        if(!productExist){
            return sendResponse(res,constants.RESPONSE_BAD_REQUEST,"in-valid ProductId",{},[])
        }
        //check if product pelong to shop that exist in old orders and status is preparing
        const shopId = productExist.createdBy;
        const oldPreparingOrder = await orderModel.findOne({userId: userOrAdminId, shopId, status: "preparing"})
        if(oldPreparingOrder){
            // Check if product already exists in the order
            const existingProductIndex = oldPreparingOrder.products.findIndex(
                p => p.productId === productId
            );
            if (existingProductIndex !== -1) {
                // Update existing product quantity
                oldPreparingOrder.products[existingProductIndex].quantity += quantity;
                oldPreparingOrder.products[existingProductIndex].price += productExist.finalPrice * quantity;
            } else {
                // Add new product
                oldPreparingOrder.products.push({
                    productId: productId,
                    productName: productExist.productName,
                    quantity: quantity,
                    price: productExist.finalPrice * quantity,
                });
            }
            oldPreparingOrder.products.push({
                productId: productId,
                productName: productExist.productName,
                quantity: quantity,
                price: productExist.finalPrice * quantity,
            })
            oldPreparingOrder.totalAmount += productExist.finalPrice * quantity
            await oldPreparingOrder.save();
            return sendResponse(res, constants.RESPONSE_SUCCESS, "Product added to your cart", {}, []);
        }
        const [user, shop] = await Promise.all([
            userModel.findOne({ userId: userOrAdminId }),
            shopModel.findOne({ shopId })
        ]);
        const finalDeliveryAddress = deliveryAddress || user.address;
        if (!finalDeliveryAddress) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Delivery address is required", {}, []);
        }
        const newOrder = new orderModel({
            userId: userOrAdminId,
            shopId,
            products: [{
                productId,
                productName: productExist.productName,
                quantity,
                price: productExist.finalPrice * quantity
            }],
            totalAmount: productExist.finalPrice * quantity,
            deliveryAddress: finalDeliveryAddress,
            deliveryFee: shop.deliveryFee
        })
        await newOrder.save() 
        sendResponse(res, constants.RESPONSE_CREATED, "new Order created successfully", {}, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const updateReview = async (req, res, next) => {
    try{
        const { shopId } = req.user;
        const { productId } = req.params;

        sendResponse(res, constants.RESPONSE_SUCCESS, "Product updated successfully", updatedProduct, []);
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, "", constants.UNHANDLED_ERROR);
    }
}


const deleteProduct = async (req, res, next) => {
    try{
        const { productId } = req.params

        sendResponse(res, constants.RESPONSE_NO_CONTENT, "Category deleted successfully", {}, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}






module.exports={
    getAllProducts,
    getProduct,
    createOrder,
    updateProduct,
    deleteProduct
}