const joi = require("joi");

// Create product validation schema
const addToCart = {
    body: joi.object().required().keys({
        productId: joi.string()
            .trim()
            .min(2)
            .required()
            .messages({
                'string.base': 'Product Id must be a string.',
                'string.min': 'Product Id must be at least 2 characters long.',
                'string.empty': 'Product Id is required.'
            }),
        quantity: joi.number()
            .min(1)
            .optional()
            .default(1)
            .messages({
                'number.base': 'quantity must be a number.',
                'number.min': 'Amount cannot be less than one.'
            }),
    })
};

const getCartByShop = {
    params: joi.object().required().keys({
        shopId: joi.string().required().messages({
            'string.base': 'Shop ID must be a string.',
            'string.empty': 'Shop ID is required.'
        })
    })
};
const updateCartItem = {
    params: joi.object().required().keys({
        shopId: joi.string().required().messages({
            'string.base': 'Shop ID must be a string.',
            'string.empty': 'Shop ID is required.'
        }),
        productId: joi.string().required().messages({
            'string.base': 'product ID must be a string.',
            'string.empty': 'product ID is required.'
        })
    }),
    body: joi.object().required().keys({
        quantity: joi.number()
            .min(0)
            .optional()
            .default(1)
            .messages({
                'number.base': 'quantity must be a number.',
                'number.min': 'Amount cannot be less than zero.'
            }),
    })
};

module.exports = {
    addToCart,
    getCartByShop,
    updateCartItem
};