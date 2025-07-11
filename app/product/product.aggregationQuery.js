const { paginationWrapper } = require("../utils/util.service.js");

const getAllProducts = (req) => {
    const {
        productId,
        productName,
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
        skip,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;
    
    // Build match conditions
    const matchConditions = {};

    // Basic filters
    if (productId) matchConditions.productId = productId;
    if (productName) matchConditions.productName = { $regex: productName, $options: 'i' };
    if (categoryId) matchConditions.categoryId = categoryId;
    if (brandId) matchConditions.brandId = brandId;

    // Subcategories filter
    if (subCategories) {
        const subCategoryArray = Array.isArray(subCategories) ? subCategories : [subCategories];
        matchConditions.subCategories = { $in: subCategoryArray };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        matchConditions.finalPrice = {};
        if (minPrice !== undefined) matchConditions.finalPrice.$gte = Number(minPrice);
        if (maxPrice !== undefined) matchConditions.finalPrice.$lte = Number(maxPrice);
    }

    // Colors filter
    if (colors) {
        const colorArray = Array.isArray(colors) ? colors : [colors];
        matchConditions.colors = { $in: colorArray };
    }

    // Size filter
    if (size) {
        const sizeArray = Array.isArray(size) ? size : [size];
        matchConditions.size = { $in: sizeArray };
    }

    // Stock filter
    if (inStock !== undefined) {
        matchConditions.stock = inStock === 'true' ? { $gt: 0 } : { $eq: 0 };
    }

    // Rating filter (using local avgRate field)
    if (minRating !== undefined) {
        matchConditions.avgRate = { $gte: Number(minRating) };
    }

    // Sorting
    const sortConditions = {};
    if (sortBy === 'price') {
        sortConditions.finalPrice = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'avgRate') {
        sortConditions.avgRate = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
        sortConditions.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'soldItems') {
        sortConditions.soldItems = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'productName') {
        sortConditions.productName = sortOrder === 'asc' ? 1 : -1;
    }

    // Calculate pagination
    const { limit, offset } = paginationWrapper(page, skip);

    return [
        // Match all conditions including rating filter
        { $match: matchConditions },
        
        // Lookup category details
        {
            $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: 'categoryId',
                as: 'category'
            }
        },
        
        // Lookup brand details
        {
            $lookup: {
                from: 'brands',
                localField: 'brandId',
                foreignField: 'brandId',
                as: 'brand'
            }
        },
        
        // Lookup subcategories
        {
            $lookup: {
                from: 'subcategories',
                localField: 'subCategories',
                foreignField: 'subCategoryId',
                as: 'subCategoryDetails'
            }
        },
        
        // Add calculated fields
        {
            $addFields: {
                category: { $arrayElemAt: ['$category', 0] },
                brand: { $arrayElemAt: ['$brand', 0] },
                isInStock: { $gt: ['$stock', 0] },
                firstImage: { $arrayElemAt: ['$productImages', 0] }
            }
        },
        
        // Project only required fields
        {
            $project: {
                _id: 0,
                productId: 1,
                productName: 1,
                price: 1,
                discount: 1,
                finalPrice: 1,
                firstImage: 1,
                avgRate: 1,
                isInStock: 1,
                'category.categoryId': 1,
                'category.categoryName': 1,
                'brand.brandId': 1,
                'brand.brandName': 1,
                subCategoryDetails: {
                    subCategoryId: 1,
                    subCategoryName: 1
                }
            }
        },
        
        // Sort results
        { $sort: sortConditions },
        
        // Add pagination info
        {
            $facet: {
                products: [
                    { $skip: offset },
                    { $limit: Number(limit) }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ];
}

const getProduct = (productId)=>{
    return [
        {
            $match: {
                productId: productId
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: 'categoryId',
                as: "category"
            }
        },
        {
            $unwind: {
                path: "$category",
            }
        },
        {
            $lookup: {
                from: 'brands',
                localField: 'brandId',
                foreignField: 'brandId',
                as: "brand"
            }
        },
        {
            $unwind: {
                path: "$brand",
            }
        },
        {
            $lookup: {
                from: 'subcategories',
                localField: 'subCategories',
                foreignField: 'subCategoryId',
                as: "subCategoryDetails"
            }
        },
        {
            $lookup: {
                from: 'reviews',
                localField: 'reviewId',
                foreignField: "reviewId",
                as: 'reviewsDetails'
            }
        },
        {
            $project: {
                _id:0,
                productId:1,
                productName:1,
                productDescription:1,
                amount:1,
                stock:1,
                soldItems:1,
                price:1,
                finalPrice:1,
                discount:1,
                colors:1,
                size:1,
                avgRate:1,
                createdAt:1,
                updatedAt:1,
                productImages:1,
                'category.categoryId':1,
                'category.categoryName':1,
                'brand.brandId':1,
                'brand.brandName':1,
                subCategoryDetails:{
                    subCategoryId: 1,
                    subCategoryName: 1
                },
                reviewsDetails:{
                    reviewId:1,
                    rating:1,
                    reviewText:1,
                    userId:1
                }
            }
        }
    ]
}

module.exports = {
    getAllProducts,
    getProduct
}