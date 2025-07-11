
const express 			= require('express');
const router 			= express.Router();
const productRoute =require("./product.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./product.validation.js')
const auth = require("../middleware/authentcation.js");
const { myMullter, HME, validateFileTypes } = require('../utils/multer.js')



router.get('/all-products', validation(validators.getProducts), productRoute.getAllProducts);
router.get('/:productId', validation(validators.getProductById), productRoute.getProduct);
router.post('/create-product', auth.requireShop, 
    myMullter().array("productImages", 3), HME, validateFileTypes,
    validation(validators.createProduct), productRoute.createProduct);
router.put('/update-product/:productId', auth.requireShop,
    myMullter().array("productImage", 3), HME, validateFileTypes,
    validation(validators.updateProduct), productRoute.updateProduct);
router.delete("/delete-product/:productId", auth.requireAdminOrShop, validation(validators.deleteProduct), productRoute.deleteProduct)





module.exports = router;
