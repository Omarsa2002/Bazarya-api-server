const express 			= require('express');
const router 			= express.Router();
const paymobRoute =require("./paymob.controller.js")
const auth = require("../middleware/authentcation.js");



router.post('/webhook', paymobRoute.handlePaymobWebhook);
router.get('available-payment-methods', auth.requireUserOrAdmin, paymobRoute.getAvailablePaymentMethods)



module.exports = router;