
const express 			= require('express');
const router 			= express.Router();
const authRoute =require("./auth.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./auth.validation.js')
const {myMullter, HME} = require('../utils/multer')
const auth = require("../middleware/authentcation.js");



router.post("/signup", validation(validators.signUpUser), authRoute.signUpUser)
router.post("/verifyemail", validation(validators.verifyEmail), authRoute.verifyEmail)
router.post("/resendcode", validation(validators.resendCode), authRoute.resendCode)
router.post("/login", validation(validators.login), authRoute.login)
router.post("/forgetpassword", validation(validators.forgetPassword), authRoute.forgetPassword)
router.patch("/setPassword", validation(validators.setPassword), authRoute.setPassword);
router.post("/logout", auth.requireAny, authRoute.signOut)



module.exports = router;
