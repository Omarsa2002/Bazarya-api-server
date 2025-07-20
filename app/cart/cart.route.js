
const express 			= require('express');
const router 			= express.Router();
const cartRoute =require("./cart.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./cart.validation.js')
const auth = require("../middleware/authentcation.js");



router.get('/all-carts', auth.requireUserOrAdmin, cartRoute.getUserCarts);
router.get('/:shopId', auth.requireUserOrAdmin, validation(validators.getCartByShop), cartRoute.getCartByShop);
router.post('/add-cart', auth.requireUserOrAdmin, validation(validators.addToCart), cartRoute.addToCart);
router.put('/:shopId/update-item/:productId', auth.requireUserOrAdmin, validation(validators.updateCartItem), cartRoute.updateCartItem);





module.exports = router;
