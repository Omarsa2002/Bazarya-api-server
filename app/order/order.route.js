
const express 			= require('express');
const router 			= express.Router();
const orderRoute =require("./order.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./order.validation.js')
const auth = require("../middleware/authentcation.js");



router.get('/:orderId', auth.requireAny, validation(validators), orderRoute.getOrder);
router.get('/:userId/orders', auth.requireUserOrAdmin, validation(validators), orderRoute.getAllUserOrders);
router.get('/:shopId/orders', auth.requireAdminOrShop, validation(validators), orderRoute.getAllShopoOrders);
router.post('/create-order', auth.requireUser, validation(validators), orderRoute.createOrderFromCart);
router.put('/cancel-order/:orderId', auth.requireUser, validation(validators), orderRoute.cancelOrder);
router.put('/refund-request/:orderId', auth.requireUser, validation(validators), orderRoute.refundRequest);






module.exports = router;
