const joi = require('joi');

const createBrand={
    body:joi.object().required().keys({
        brandName:joi.string().trim().min(2).max(20).required().messages({
            'string.base': 'brand name must be a string.',
            'string.empty': 'brand name is required.',
            'string.min': 'brand name must be at least 2 characters long.',
            'string.max': 'brand name must be at most 20 characters long.',
        })
    })
}

const updateBrand={
    body:joi.object().required().keys({
        brandName:joi.string().trim().min(2).max(20).optional().messages({
            'string.base': 'brand name must be a string.',
            'string.min': 'brand name must be at least 2 characters long.',
            'string.max': 'brand name must be at most 20 characters long.',
        })
    }),
    params:joi.object().required().keys({
        brandId:joi.string().required()
    })
}
const getOrDeleteBrand={
    params:joi.object().required().keys({
        brandId:joi.string().required()
    })
}



module.exports={
    createBrand,
    updateBrand,
    getOrDeleteBrand
}