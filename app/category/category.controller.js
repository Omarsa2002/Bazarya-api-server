const categoryModel = require("../db/models/category.schema.js");
const { sendResponse, paginationWrapper } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")


const getAllCategories = async (req, res, next)=>{
    try{
        const { page, size } = req.query;
        const { limit, offset } = paginationWrapper(page, size);
        const categories = await categoryModel.find().limit(limit).skip(offset)
        .select('-_id categoryId categoryName ');
        sendResponse(res, constants.RESPONSE_SUCCESS, "all categories", categories, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const getCategory = async (req, res, next) => {
    try{
        const { categoryId } = req.params
        const category = await categoryModel.findOne({categoryId}).select('-_id categoryId categoryName');
        if(!category){
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "category not found or invalid category id", {}, []);
        }
        sendResponse(res, constants.RESPONSE_SUCCESS, "done", category, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const createCategory = async (req, res, next) => {
    try{
        console.log(req.user);
        const { categoryName } = req.body
        const categoryExist=await categoryModel.findOne({categoryName:categoryName})
        if(categoryExist){ 
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Category already exist", {}, [])
        }
        const newCategory = new categoryModel({
            categoryName,
            createdBy: req.user.adminId
        })
        await newCategory.save();
        sendResponse(res, constants.RESPONSE_CREATED, "Category created successfully", {}, [])
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const updateCategory = async (req, res, next) => {
    try{
        const { categoryId } = req.params;
        const { categoryName } = req.body;
        const category = await categoryModel.findOne({categoryId});
        if (!category) {
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "Invalid categoryId", {}, []);
        }
        const existingCategoryName = await categoryModel.findOne({ categoryName }).lean()
        console.log(existingCategoryName);
        if (existingCategoryName && existingCategoryName.categoryId !== categoryId) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Category name already exists", {}, []);
        }
        const updatedCategory = await categoryModel.findOneAndUpdate(
            { categoryId },
            { categoryName, updatedBy: req.user.adminId },
            { new: true, lean: true } 
        );
        if (updatedCategory) {
            sendResponse(res, constants.RESPONSE_SUCCESS, "Category updated successfully",  updatedCategory , []);
        } else {
            sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Category update failed", {}, []);
        }
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const deleteCategory = async (req, res, next) => {
    try{
        const { categoryId } = req.params
        await categoryModel.deleteOne({categoryId});
        sendResponse(res, constants.RESPONSE_NO_CONTENT, "Category deleted successfully", {}, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}






module.exports={
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
}