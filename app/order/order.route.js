
const express 			= require('express');
const router 			= express.Router();
const orderRoute =require("./order.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./order.validation.js')
const auth = require("../middleware/authentcation.js");



router.get('/:orderId', auth.requireAny, validation(validators), orderRoute);
router.get('/:userId/orders', auth.requireUserOrAdmin, validation(validators), orderRoute);
router.get('/:shopId/orders', auth.requireAdminOrShop, validation(validators), orderRoute);
router.post('/create-order', auth.requireUserOrAdmin, validation(validators), orderRoute);
router.put('/update-order/:orderId', auth.requireUserOrAdmin, validation(validators), orderRoute);
router.delete("/delete-order/:orderId", auth.requireUserOrAdmin, validation(validators), orderRoute)





module.exports = router;
