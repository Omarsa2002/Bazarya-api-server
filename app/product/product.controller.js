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



const getAllProducts = async (req, res, next) => {
    try {
        const {
        categoryId,
        brandId,
        subCategories,
        minPrice,
        maxPrice,
        colors,
        size,
        minRating,
        inStock,
        page,
        skip} = req.query
        const { limit } = paginationWrapper(page, skip);
        // Aggregation pipeline
        const pipeline = aggregation.getAllProducts(req); 

        // Execute aggregation
        const result = await productModel.aggregate(pipeline);
        
        const products = result[0].products;
        const totalProducts = result[0].totalCount[0]?.count || 0;
        const totalPages = Math.ceil(totalProducts / limit);

        // Response data
        const responseData = {
            products,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalProducts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: {
                categoryId,
                subCategories,
                brandId,
                minPrice,
                maxPrice,
                colors,
                size,
                minRating,
                inStock
            }
        };
        return sendResponse(res, constants.RESPONSE_SUCCESS, "Products retrieved successfully", responseData, []);
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, "", constants.UNHANDLED_ERROR);
    }
}

const getProduct = async (req, res, next) => {
    try{
        const { productId } = req.params
        const product = await productModel.aggregate(aggregation.getProduct(productId));
        if(!product){
            return sendResponse(res, constants.RESPONSE_NOT_FOUND, "product not found or invalid product id", {}, []);
        }
        sendResponse(res, constants.RESPONSE_SUCCESS, "done", product, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const createProduct = async (req, res, next) => {
    let uploadedFiles = [];
    try{
        const { shopId } = req.user;
        const shop = await shopModel.findOne({shopId}).select("shopName")
        if(!req.files?.length){
            return sendResponse(res,constants.RESPONSE_BAD_REQUEST,"images is requires please upload",{},[])
        }
        const { amount, price, discount, categoryId, brandId, subCategories }=req.body
        req.body.stock=amount;
        if(discount){
            req.body.finalPrice=price-price*((discount||0)/100);
        }
        const categoryExist=await categoryModel.findOne({categoryId}).lean()
        if(!categoryExist){
            return sendResponse(res,constants.RESPONSE_BAD_REQUEST,"in-valid CategoryId",{},[])
        }
        const brandExist=await brandModel.findOne({brandId}).lean()
        if(!brandExist){
            return sendResponse(res,constants.RESPONSE_BAD_REQUEST,"in-valid brandId",{},[])
        }
        const subCategoriesExist = await subCategoryModel.find({subCategoryId:{$in:subCategories}})
        if (subCategoriesExist.length !== subCategories.length) {
            return sendResponse(res,constants.RESPONSE_BAD_REQUEST,"Some subcategory IDs are invalid",{},[])
        }
        req.body.createdBy = shopId;
        req.body.slug = slugify(req.body.productName)
        const newProduct = new productModel(req.body)
        const images = req.files;
        const uploadedImages = [];
        const uploadPromises = images.map(async (image) => {
            const result = await utils.uploadFileToImageKit(image.buffer, newProduct.productName, `Bazarya/Shops/${shop.shopName}/images/products/${newProduct.productName}/`)
            uploadedFiles.push(result.fileId);
            return result;
        });
        const uploadResults = await Promise.all(uploadPromises);
        uploadedImages.push(...uploadResults);
        newProduct.addProductImages(uploadedImages);
        await newProduct.save();
        sendResponse(res, constants.RESPONSE_SUCCESS, "Product created successfully", {}, []);
    }catch(error){
        for (const fileId of uploadedFiles) {
            try {
                utils.deleteFileFromImageKit(fileId);
            } catch (deleteError) {
                console.error('Failed to delete file:', fileId, deleteError);
            }
        }
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const updateProduct = async (req, res, next) => {
    let uploadedFiles = [];
    try{
        const { shopId } = req.user;
        const { productId } = req.params;
        
        const product = await productModel.findOne({ productId, createdBy: shopId });
        if (!product) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Product not found or unauthorized", {}, []);
        }
        
        // Handle image operations
        const { action, imageIndices } = req.body; // action: 'add', 'delete', 'replace'
        if (req.files?.length || action === 'delete') {
            const currentImages = product.productImages || [];
            let updatedImages = [...currentImages];
            const oldImageIds = [];
            // Handle DELETE operation
            if (action === 'delete' && imageIndices) {
                if (currentImages.length <= 1) {
                    return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Cannot delete all images. At least 1 image required", {}, []);
                }
                const indicesToDelete = Array.isArray(imageIndices) ? imageIndices : [imageIndices];
                // Validate indices
                if (indicesToDelete.some(index => index < 0 || index >= currentImages.length)) {
                    return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Invalid image indices", {}, []);
                }
                
                // Check if deletion would leave at least 1 image
                if (currentImages.length - indicesToDelete.length < 1) {
                    return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Cannot delete all images. At least 1 image required", {}, []);
                }
                
                // Store file IDs for cleanup and remove images
                indicesToDelete.sort((a, b) => b - a); // Sort descending to avoid index shifting
                indicesToDelete.forEach(index => {
                    oldImageIds.push(currentImages[index].imageId);
                    updatedImages.splice(index, 1);
                });
                req.body.productImages = updatedImages;
                req.oldImageIds = oldImageIds;
            }
            
            // Handle ADD/REPLACE operations
            else if (req.files) {
                const images = req.files;
                const shop = await shopModel.findOne({shopId}).select("shopName");
                const productName = req.body.productName || product.productName;
                
                if (action === 'add') {
                    // ADD new images
                    if (currentImages.length + images.length > 3) {
                        return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Maximum 3 images allowed", {}, []);
                    }
                    
                    const uploadedImages = [];
                    for (const image of images) {
                        const result = await utils.uploadFileToImageKit(
                            image.buffer, 
                            productName, 
                            `Bazarya/Shops/${shop.shopName}/images/products/${productName}/`
                        );
                        uploadedImages.push({
                            imageId: result.fileId,
                            imageURL: result.url,
                            imageName: result.name
                        });
                        uploadedFiles.push(result.fileId);
                    }
                    
                    req.body.productImages = [...currentImages, ...uploadedImages];
                    
                } else if (action === 'replace' && imageIndices) {
                    // REPLACE specific images
                    const indicesToReplace = Array.isArray(imageIndices) ? imageIndices : [imageIndices];
                    
                    if (images.length !== indicesToReplace.length) {
                        return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Number of images must match number of indices to replace", {}, []);
                    }
                    
                    // Validate indices
                    if (indicesToReplace.some(index => index < 0 || index >= currentImages.length)) {
                        return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Invalid image indices", {}, []);
                    }
                    
                    // Replace images using replaceFileByDeleteAndUpload
                    updatedImages = [...currentImages];
                    for (let i = 0; i < images.length; i++) {
                        const index = indicesToReplace[i];
                        const oldFileId = currentImages[index].imageId;
                        
                        const result = await utils.replaceFileByDeleteAndUpload(
                            oldFileId,
                            images[i].buffer,
                            productName,
                            `Bazarya/Shops/${shop.shopName}/images/products/${productName}/`
                        );
                        
                        updatedImages[index] = {
                            imageId: result.fileId,
                            imageURL: result.url,
                            imageName: result.name
                        };
                        uploadedFiles.push(result.fileId);
                    }
                    req.body.productImages = updatedImages;
                } else {
                    // Default behavior - replace all images
                    if (images.length > 3) {
                        return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Maximum 3 images allowed", {}, []);
                    }
                    
                    const uploadedImages = [];
                    for (const image of images) {
                        const result = await utils.uploadFileToImageKit(
                            image.buffer, 
                            productName, 
                            `Bazarya/Shops/${shop.shopName}/images/products/${productName}/`
                        );
                        uploadedImages.push({
                            imageId: result.fileId,
                            imageURL: result.url,
                            imageName: result.name
                        });
                        uploadedFiles.push(result.fileId);
                    }
                    // Store old image IDs for cleanup
                    const oldImageIds = currentImages.map(img => img.imageId).filter(Boolean);
                    req.body.productImages = uploadedImages;
                    req.oldImageIds = oldImageIds;
                }
            }
        }
        
        const { amount, price, discount, categoryId, brandId, subCategories } = req.body;
        
        // Update stock if amount is provided
        if (amount !== undefined) {
            req.body.stock = amount;
        }
        
        // Calculate final price if price or discount is provided
        if (price !== undefined || discount !== undefined) {
            const currentPrice = price !== undefined ? price : product.price;
            const currentDiscount = discount !== undefined ? discount : product.discount;
            req.body.finalPrice = currentPrice - currentPrice * ((currentDiscount || 0) / 100);
        }
        
        // Validate categoryId if provided
        if (categoryId) {
            const categoryExist = await categoryModel.findOne({ categoryId }).lean();
            if (!categoryExist) {
                return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "in-valid CategoryId", {}, []);
            }
        }
        
        // Validate brandId if provided
        if (brandId) {
            const brandExist = await brandModel.findOne({ brandId }).lean();
            if (!brandExist) {
                return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "in-valid brandId", {}, []);
            }
        }
        
        // Validate subCategories if provided
        if (subCategories && subCategories.length > 0) {
            const subCategoriesExist = await subCategoryModel.find({ subCategoryId: { $in: subCategories } });
            if (subCategoriesExist.length !== subCategories.length) {
                return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Some subcategory IDs are invalid", {}, []);
            }
        }
        
        // Update slug if productName is provided
        if (req.body.productName) {
            req.body.slug = slugify(req.body.productName);
        }
        
        // Set updatedBy
        req.body.updatedBy = shopId;
        
        // Update the product
        const updatedProduct = await productModel.findOneAndUpdate(
            { productId, createdBy: shopId },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Failed to update product", {}, []);
        }
        
        // Clean up old images if images were updated successfully
        if (req.oldImageIds?.length > 0) {
            req.oldImageIds.forEach(fileId => {
                try {
                    utils.deleteFileFromImageKit(fileId);
                } catch (deleteError) {
                    console.error('Failed to delete old image:', fileId, deleteError);
                }
            });
        }
        
        return sendResponse(res, constants.RESPONSE_SUCCESS, "Product updated successfully", updatedProduct, []);
        
    } catch (error) {
        // Clean up uploaded files if any
        uploadedFiles.forEach(fileId => {
            try {
                utils.deleteFileFromImageKit(fileId);
            } catch (deleteError) {
                console.error('Failed to delete file:', fileId, deleteError);
            }
        });
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, "", constants.UNHANDLED_ERROR);
    }
}


const deleteProduct = async (req, res, next) => {
    try{
        const { productId } = req.params
        const {shopId} = req.user;
        const product =  await productModel.findOne({productId, createdBy:shopId});
        const shop = await shopModel.findOne({shopId}).select('shopName')
        product.productImages.forEach((image)=>{
            utils.deleteFileFromImageKit(image.imageId);
        })
        await utils.deleteFolder(`/Bazarya/Shops/${shop.shopName}/images/products/${product.productName}`);
        await product.deleteOne();
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