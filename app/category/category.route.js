
const express 			= require('express');
const router 			= express.Router();
const categoryRoute =require("./category.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./category.validation.js')
const auth = require("../middleware/authentcation.js");



router.get('/all-categories', categoryRoute.getAllCategories);
router.get('/:categoryId', validation(validators.getOrDeleteCategory), categoryRoute.getCategory);
router.post('/create-category', validation(validators.createCategory), auth.requireAdmin, categoryRoute.createCategory);
router.put('/update-category/:categoryId', auth.requireAdmin, validation(validators.updateCategory), categoryRoute.updateCategory);
router.delete("/delete-category/:categoryId", auth.requireAdmin, validation(validators.getOrDeleteCategory), categoryRoute.deleteCategory)





module.exports = router;
