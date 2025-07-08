const joi = require('joi');

const createCategory={
    body:joi.object().required().keys({
        categoryName:joi.string().trim().min(4).max(25).required()
    })
}

const updateCategory={
    body:joi.object().required().keys({
        categoryName:joi.string().trim().min(4).max(25).required()
    }),
    params:joi.object().required().keys({
        categoryId:joi.string().required()
    })
}
const getOrDeleteCategory={
    params:joi.object().required().keys({
        categoryId:joi.string().required()
    })
}



module.exports={
    createCategory,
    updateCategory,
    getOrDeleteCategory
}