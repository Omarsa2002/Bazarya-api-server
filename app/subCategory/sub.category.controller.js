const subCategoryModel = require("../db/models/sub.category.schema.js");
const { sendResponse, paginationWrapper } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")


const getAllSubCategories = async (req, res, next)=>{
    try{
        const {categoryId} = req.params;
        const { page, size } = req.query;
        const { limit, offset } = paginationWrapper(page, size);
        const subCategories = await subCategoryModel.find({categoryId}).limit(limit).skip(offset)
        .select('-_id subCategoryId subCategoryName ');
        sendResponse(res, constants.RESPONSE_SUCCESS, "all sub-categories", subCategories, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const getSubCategory = async (req, res, next) => {
    try{
        const { subCategoryId } = req.params
        const subCategory = await subCategoryModel.aggregate([
            {
                $match: {
                    subCategoryId:subCategoryId
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "categoryId",
                    as: "category"
                }
            },
            {
                $unwind: {
                    path: "$category",
                }
            },
            {
                $project: {
                    _id:0,
                    categoryId:"$categoryId",
                    subCategoryId:"$subCategoryId",
                    subCategoryName:"$subCategoryName",
                    categoryName:"$category.categoryName"
                }
            }
        ])
        if(!subCategory){
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "sub-category not found or invalid category id", {}, []);
        }
        sendResponse(res, constants.RESPONSE_SUCCESS, "done", subCategory, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const createSubCategory = async (req, res, next) => {
    try{
        const { subCategoryName, categoryId } = req.body
        const subCategoryExist=await subCategoryModel.findOne({subCategoryName, categoryId});
        if(subCategoryExist){ 
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "sub-Category already exist", {}, [])
        }
        const newSubCategory = new subCategoryModel({
            subCategoryName,
            categoryId,
            createdBy: req.user.adminId
        })
        await newSubCategory.save();
        sendResponse(res, constants.RESPONSE_CREATED, "sub-Category created successfully", {}, [])
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const updateSubCategory = async (req, res, next) => {
    try{
        const { subCategoryId } = req.params;
        const { subCategoryName } = req.body;
        const subCategory = await subCategoryModel.findOne({subCategoryId});
        if (!subCategory) {
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "Invalid categoryId", {}, []);
        }
        const existingSubCategoryName = await subCategoryModel.findOne({ subCategoryName }).lean()
        if (existingSubCategoryName && existingSubCategoryName.subCategoryId !== subCategoryId) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "sub-Category name already exists", {}, []);
        }
        const updatedSubCategory = await subCategoryModel.findOneAndUpdate(
            { subCategoryId },
            { subCategoryName, updatedBy: req.user.adminId },
            { new: true, lean: true } 
        );
        if (updatedSubCategory) {
            sendResponse(res, constants.RESPONSE_SUCCESS, "sub-Category updated successfully",  updatedSubCategory , []);
        } else {
            sendResponse(res, constants.RESPONSE_BAD_REQUEST, "sub-Category update failed", {}, []);
        }
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const deleteSubCategory = async (req, res, next) => {
    try{
        const { subCategoryId } = req.params
        await subCategoryModel.deleteOne({subCategoryId});
        sendResponse(res, constants.RESPONSE_NO_CONTENT, "sub-Category deleted successfully", {}, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}






module.exports={
    getAllSubCategories,
    getSubCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
}