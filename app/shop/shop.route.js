
const express 			= require('express');
const router 			= express.Router();
const shopRoute =require("./shop.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./shop.validation.js')
const {myMullter, HME, validateFileTypes} = require('../utils/multer.js')
const auth = require("../middleware/authentcation.js");



router.get('/all-shops', shopRoute.getAllShops);
router.get('/:shopId', shopRoute.getShop);
router.put('/update-shop', auth.requireShop, myMullter().fields([
    {name:"businessLicenseImage", maxCount:1},
    {name:"profileImage", maxCount:1}
]), HME, validateFileTypes, shopRoute.updateShop);

router.delete("/delete-shop", auth.requireShop, shopRoute.deleteShop)





module.exports = router;
