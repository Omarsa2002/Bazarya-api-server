const productModel = require("../db/models/product.schema.js");
const categoryModel = require('../db/models/category.schema.js');
const subCategoryModel = require('../db/models/sub.category.schema.js');
const brandModel = require('../db/models/brand.schema.js');
const shopModel = require("../db/models/shop.schema.js");
const slugify = require('slugify');
const { sendResponse, paginationWrapper } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")
const utils = require('../utils/utils.js');
const aggregation = require('./product.aggregationQuery.js');



const getAllProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params

        sendResponse(res, constants.RESPONSE_SUCCESS, "Products retrieved successfully", responseData, []);
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, "", constants.UNHANDLED_ERROR);
    }
}

const getAllShopoReviews = async (req, res, next) => {
    try{
        const { shopId } = req.params

        sendResponse(res, constants.RESPONSE_SUCCESS, "done", product, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const postReview = async (req, res, next) => {
    try{
        const { userId } = req.user;

        sendResponse(res, constants.RESPONSE_SUCCESS, "Product created successfully", {}, []);
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
    createProduct,
    updateProduct,
    deleteProduct
}