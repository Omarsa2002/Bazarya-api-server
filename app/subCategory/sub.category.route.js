
const express 			= require('express');
const router 			= express.Router();
const subCategoryRoute =require("./sub.category.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./sub.category.validation.js')
const auth = require("../middleware/authentcation.js");



router.get('/:categoryId/all-sub-categories', subCategoryRoute.getAllSubCategories);
router.get('/:subCategoryId', validation(validators.getOrDeleteSubCategory), subCategoryRoute.getSubCategory);
router.post('/create-sub-category', validation(validators.createSubCategory), auth.requireAdmin, subCategoryRoute.createSubCategory);
router.put('/update-sub-category/:subCategoryId', auth.requireAdmin, validation(validators.updateSubCategory), subCategoryRoute.updateSubCategory);
router.delete("/delete-sub-category/:subCategoryId", auth.requireAdmin, validation(validators.getOrDeleteSubCategory), subCategoryRoute.deleteSubCategory)





module.exports = router;
