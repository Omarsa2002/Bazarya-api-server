const joi = require("joi");

// Create product validation schema
const createProduct = {
    body: joi.object().required().keys({
        productName: joi.string()
            .trim()
            .min(2)
            .max(20)
            .required()
            .messages({
                'string.base': 'Product name must be a string.',
                'string.min': 'Product name must be at least 2 characters long.',
                'string.max': 'Product name cannot exceed 20 characters.',
                'string.empty': 'Product name is required.'
            }),
        categoryId: joi.string()
            .required()
            .messages({
                'string.base': 'Category ID must be a string.',
                'string.empty': 'Category ID is required.'
            }),
        subCategories: joi.array()
            .items(joi.string())
            .optional()
            .default([])
            .messages({
                'array.base': 'Sub categories must be an array.',
                'string.base': 'Each sub category must be a string.'
            }),
        productDescription: joi.string()
            .max(1000)
            .required()
            .allow('')
            .messages({
                'string.empty': 'Product description is required.',
                'string.base': 'Product description must be a string.',
                'string.max': 'Product description cannot exceed 1000 characters.'
            }),
        
        amount: joi.number()
            .min(0)
            .optional()
            .default(0)
            .messages({
                'number.base': 'Amount must be a number.',
                'number.min': 'Amount cannot be negative.'
            }),
        
        
        price: joi.number()
            .min(0)
            .optional()
            .default(0)
            .messages({
                'number.base': 'Price must be a number.',
                'number.min': 'Price cannot be negative.'
            }),
        discount: joi.number()
            .min(0)
            .max(100)
            .optional()
            .default(0)
            .messages({
                'number.base': 'Discount must be a number.',
                'number.min': 'Discount cannot be negative.',
                'number.max': 'Discount cannot exceed 100%.'
            }),
        colors: joi.array()
            .items(joi.string().trim())
            .optional()
            .default([])
            .messages({
                'array.base': 'Colors must be an array.',
                'string.base': 'Each color must be a string.'
            }),
        size: joi.array()
            .items(joi.string().valid('s', 'm', 'l', 'xl'))
            .optional()
            .default([])
            .messages({
                'array.base': 'Size must be an array.',
                'any.only': 'Size must be one of: s, m, l, xl.'
            }),
        brandId: joi.string()
            .required()
            .messages({
                'string.base': 'Brand ID must be a string.',
                'string.empty': 'Brand ID is required.'
            }),
    })
};

// Update product validation schema
const updateProduct = {
    body: joi.object().required().keys({
        productName: joi.string()
            .trim()
            .min(2)
            .max(20)
            .optional()
            .messages({
                'string.base': 'Product name must be a string.',
                'string.min': 'Product name must be at least 2 characters long.',
                'string.max': 'Product name cannot exceed 20 characters.'
            }),
        categoryId: joi.string()
            .optional()
            .messages({
                'string.base': 'Category ID must be a string.'
            }),
        subCategories: joi.array()
            .items(joi.string())
            .optional()
            .messages({
                'array.base': 'Sub categories must be an array.',
                'string.base': 'Each sub category must be a string.'
            }),
        productDescription: joi.string()
            .max(1000)
            .optional()
            .allow('')
            .messages({
                'string.base': 'Product description must be a string.',
                'string.max': 'Product description cannot exceed 1000 characters.'
            }),
        amount: joi.number()
            .min(0)
            .optional()
            .messages({
                'number.base': 'Amount must be a number.',
                'number.min': 'Amount cannot be negative.'
            }),
        price: joi.number()
            .min(0)
            .optional()
            .messages({
                'number.base': 'Price must be a number.',
                'number.min': 'Price cannot be negative.'
            }),
        discount: joi.number()
            .min(0)
            .max(100)
            .optional()
            .messages({
                'number.base': 'Discount must be a number.',
                'number.min': 'Discount cannot be negative.',
                'number.max': 'Discount cannot exceed 100%.'
            }),
        colors: joi.array()
            .items(joi.string().trim())
            .optional()
            .messages({
                'array.base': 'Colors must be an array.',
                'string.base': 'Each color must be a string.'
            }),
        size: joi.array()
            .items(joi.string().valid('s', 'm', 'l', 'xl'))
            .optional()
            .messages({
                'array.base': 'Size must be an array.',
                'any.only': 'Size must be one of: s, m, l, xl.'
            }),
        brandId: joi.string()
            .optional()
            .messages({
                'string.base': 'Brand ID must be a string.'
            }),
        action: joi.string().optional().valid('add', 'delete', 'replace')
            .messages({
                'string.base': 'action must be a string.',
                'any.only': 'action must be one of: add, delete, replace.'
            }),
        imageIndices: joi.alternatives()
            .try(
                joi.number().min(0).messages({
                    'number.base': 'imageIndices must be a number.',
                    'number.min': 'imageIndices must be >= 0.'
                }),
                joi.array().items(joi.number().min(0)).messages({
                    'array.base': 'imageIndices must be an array.',
                    'number.base': 'Array items must be numbers.',
                    'number.min': 'Array items must be >= 0.'
                })
            )
            .optional()
            .messages({
                'alternatives.match': 'imageIndices must be either a number >= 0 or an array of numbers >= 0.'
            })
    })
};

// Query/filter validation schema
const getProducts = {
    query: joi.object().keys({
        productId: joi.string().optional().messages({
            'string.base': 'Product ID must be a string.'
        }),
        productName: joi.string().optional().messages({
            'string.base': 'Product name must be a string.'
        }),
        categoryId: joi.string().optional().messages({
            'string.base': 'Category ID must be a string.'
        }),
        subCategories: joi.array().items(joi.string()).optional().default([])
            .messages({
                'array.base': 'Sub categories must be an array.',
                'string.base': 'Each sub category must be a string.'
            }),
        brandId: joi.string().optional().messages({
            'string.base': 'Brand ID must be a string.'
        }),
        minPrice: joi.number().min(0).optional().messages({
            'number.base': 'Minimum price must be a number.',
            'number.min': 'Minimum price cannot be negative.'
        }),
        maxPrice: joi.number().min(0).optional().messages({
            'number.base': 'Maximum price must be a number.',
            'number.min': 'Maximum price cannot be negative.'
        }),
        colors: joi.alternatives().try(
            joi.string(),
            joi.array().items(joi.string())
        ).optional().messages({
            'alternatives.match': 'Colors must be a string or array of strings.'
        }),
        size: joi.alternatives().try(
            joi.string().valid('s', 'm', 'l', 'xl'),
            joi.array().items(joi.string().valid('s', 'm', 'l', 'xl'))
        ).optional().messages({
            'alternatives.match': 'Size must be a valid size or array of valid sizes.',
            'any.only': 'Size must be one of: s, m, l, xl.'
        }),
        minRating: joi.number().min(0).max(5).optional().messages({
            'number.base': 'Minimum rating must be a number.',
            'number.min': 'Minimum rating cannot be negative.',
            'number.max': 'Minimum rating cannot exceed 5.'
        }),
        inStock: joi.boolean().optional().messages({
            'boolean.base': 'In stock must be a boolean.'
        }),
        page: joi.number().integer().min(1).optional().default(1).messages({
            'number.base': 'Page must be a number.',
            'number.integer': 'Page must be a whole number.',
            'number.min': 'Page must be at least 1.'
        }),
        skip: joi.number().integer().min(1).max(100).optional().default(10).messages({
            'number.base': 'Limit must be a number.',
            'number.integer': 'Limit must be a whole number.',
            'number.min': 'Limit must be at least 1.',
            'number.max': 'Limit cannot exceed 100.'
        }),
        sortBy: joi.string().valid('price', 'avgRate', 'createdAt', 'soldItems', 'productName').optional().messages({
            'string.base': 'Sort by must be a string.',
            'any.only': 'Sort by must be one of: price, avgRate, createdAt, soldItems, productName.'
        }),
        sortOrder: joi.string().valid('asc', 'desc').optional().default('desc').messages({
            'string.base': 'Sort order must be a string.',
            'any.only': 'Sort order must be either asc or desc.'
        })
    })
};

// Validation for product ID parameter
const getProductById = {
    params: joi.object().required().keys({
        productId: joi.string().required().messages({
            'string.base': 'Product ID must be a string.',
            'string.empty': 'Product ID is required.'
        })
    })
};

// Validation for deleting product
const deleteProduct = {
    params: joi.object().required().keys({
        productId: joi.string().required().messages({
            'string.base': 'Product ID must be a string.',
            'string.empty': 'Product ID is required.'
        })
    })
};

module.exports = {
    createProduct,
    updateProduct,
    getProducts,
    getProductById,
    deleteProduct
};