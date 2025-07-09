const joi = require('joi');

const createSubCategory={
    body:joi.object().required().keys({
        subCategoryName:joi.string().trim().min(4).max(25).required(),
        categoryId:joi.string().trim().required()
    })
}

const updateSubCategory={
    body:joi.object().required().keys({
        subCategoryName:joi.string().trim().min(4).max(25).required()
    }),
    params:joi.object().required().keys({
        subCategoryId:joi.string().required()
    })
}
const getOrDeleteSubCategory={
    params:joi.object().required().keys({
        subCategoryId:joi.string().required()
    })
}



module.exports={
    createSubCategory,
    updateSubCategory,
    getOrDeleteSubCategory
}