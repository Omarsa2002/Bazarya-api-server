
const express 			= require('express');
const router 			= express.Router();
const adminRoute =require("./admin.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./admin.validation.js')
const {myMullter, HME, validateFileTypes} = require('../utils/multer')
const auth = require("../middleware/authentcation.js");

/**
 * 
 *  get all shops
 *  get all users
 *  accept shop
 *  reject shop
 *  Suspend vendors or users
 *  View all products and orders across the platform
 *  Manage system settings, categories, and analytics
 *  View and control shops, users, orders
 *  View system metrics: sales, active vendors, popular products
 */

router.patch('/accept-reject-shop/:shopId', auth.requireAdmin, adminRoute.acceptShop)





module.exports = router;
