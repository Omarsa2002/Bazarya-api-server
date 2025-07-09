
const express 			= require('express');
const router 			= express.Router();
const brandRoute =require("./brand.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./brand.validation.js')
const auth = require("../middleware/authentcation.js");
const { myMullter, HME, validateFileTypes } = require('../utils/multer.js')



router.get('/all-brands', brandRoute.getAllBrands);
router.get('/:brandId', validation(validators.getOrDeleteBrand), brandRoute.getBrand);
router.post('/create-brand', auth.requireAdminOrShop, 
    myMullter().single("brandImage"), HME, validateFileTypes,
    validation(validators.createBrand), brandRoute.createBrand);
router.put('/update-brand/:brandId', auth.requireAdmin,
    myMullter().single("brandImage"), HME, validateFileTypes,
    validation(validators.updateBrand), brandRoute.updateBrand);
router.delete("/delete-brand/:brandId", auth.requireAdmin, validation(validators.getOrDeleteBrand), brandRoute.deleteBrand)





module.exports = router;
