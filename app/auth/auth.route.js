
const express 			= require('express');
const router 			= express.Router();
const authRoute =require("./auth.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./auth.validation.js')
const {myMullter, HME, validateFileTypes} = require('../utils/multer')
const auth = require("../middleware/authentcation.js");


router.post("/signup-shop", 
    myMullter().fields([
        { name:"ownerNationalIdImage", maxCount:1 },
        { name:"selfieWithId", maxCount:1 },
        { name:"profileImage", maxCount:1 },
    ]), 
    HME, validateFileTypes, validation(validators.signUpShop), authRoute.signUpShop);
router.post("/login-shop", validation(validators.login), authRoute.loginShop);

router.post("/signup-user", validation(validators.signUpUser), authRoute.signUpUser)
router.post("/login-user", validation(validators.login), authRoute.login)

router.post("/verifyemail", validation(validators.verifyEmail), authRoute.verifyEmail)
router.post("/resendcode", validation(validators.resendCode), authRoute.resendCode)
router.post("/forgetpassword", validation(validators.forgetPassword), authRoute.forgetPassword)
router.patch("/setPassword", validation(validators.setPassword), authRoute.setPassword);
router.post("/logout", auth.requireAny, authRoute.signOut)



module.exports = router;
