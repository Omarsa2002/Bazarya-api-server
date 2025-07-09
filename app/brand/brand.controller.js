const brandModel = require("../db/models/brand.schema.js");
const { sendResponse, paginationWrapper } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")
const utils = require('../utils/utils.js');


const getAllBrands = async (req, res, next)=>{
    try{
        const { page, size } = req.query;
        const { limit, offset } = paginationWrapper(page, size);
        const brands = await brandModel.find().limit(limit).skip(offset)
        .select('-_id brandId brandName image ');
        sendResponse(res, constants.RESPONSE_SUCCESS, "all brands", brands, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const getBrand = async (req, res, next) => {
    try{
        const { brandId } = req.params
        const brand = await brandModel.findOne({brandId}).select('-_id brandId brandName image');
        if(!brand){
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "brand not found or invalid brand id", {}, []);
        }
        sendResponse(res, constants.RESPONSE_SUCCESS, "done", brand, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const createBrand = async (req, res, next) => {
    let uploadedFile = null;
    try{
        const { brandName } = req.body
        const adminOrShopId = (req.user.adminId)? req.user.adminId:req.user.shopId;
        const brandExist=await brandModel.findOne({brandName})
        if(brandExist){ 
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Brand already exist", {}, [])
        }
        const newBrand = new brandModel({
            brandName,
            createdBy: adminOrShopId
        })
        if(!req.file){
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "brand image is required", {}, []);
        }
        const brandImage = req.file
        const result = await utils.uploadFileToImageKit(brandImage.buffer, "Brand_Image", `/Bazarya/Brands/${newBrand.brandName}/Brand_Image/`);
        uploadedFile = result
        newBrand.addBrandImage(result);
        await newBrand.save();
        sendResponse(res, constants.RESPONSE_CREATED, "Brand created successfully", {}, [])
    }catch(error){
        utils.deleteFileFromImageKit(uploadedFile.fileId);
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const updateBrand = async (req, res, next) => {
    let uploadedFile = null;
    try{
        const { brandId } = req.params;
        const { brandName } = req.body;
        const brand = await brandModel.findOne({brandId});
        if (!brand) {
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "Invalid categoryId", {}, []);
        }
        if(brandName){
            const existingBrandName = await brandModel.findOne({ brandName }).lean()
            if (existingBrandName && existingBrandName.brandId !== brandId) {
                return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "brand name already exists", {}, []);
            }
            brand.brandName = brandName;
        }
        if(req.file){
            const brandImage = req.file
            const result = await utils.replaceFileByDeleteAndUpload(brand.image.imageId, brandImage.buffer, "Brand_Image", `/Bazarya/Brands/${brand.brandName}/Brand_Image/`);
            uploadedFile = result
            brand.addBrandImage(result);
        }
        const updatedBrand = await brand.save()
        if (updatedBrand) {
            sendResponse(res, constants.RESPONSE_SUCCESS, "Brand updated successfully",  updatedBrand , []);
        } else {
            sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Brand update failed", {}, []);
        }
    }catch(error){
        utils.deleteFileFromImageKit(uploadedFile.fileId);
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const deleteBrand = async (req, res, next) => {
    try{
        const { brandId } = req.params
        const brand =  await brandModel.findOne({brandId});
        utils.deleteFileFromImageKit(brand.image.imageId);
        await utils.deleteFolder(`/Bazarya/Brands/${brand.brandName}`);
        await brand.deleteOne();
        sendResponse(res, constants.RESPONSE_NO_CONTENT, "Category deleted successfully", {}, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}






module.exports={
    getAllBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand
}