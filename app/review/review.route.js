
const express 			= require('express');
const router 			= express.Router();
const reviewRoute =require("./review.controller.js")
const {validation} = require('../middleware/validation.js')
const validators = require('./review.validation.js')
const auth = require("../middleware/authentcation.js");
const { myMullter, HME, validateFileTypes } = require('../utils/multer.js')



router.get('/:productId/reviews', validation(validators), reviewRoute);
router.get('/:shopId/reviews', validation(validators), reviewRoute);
router.post('/post-review', auth.requireUser, validation(validators), reviewRoute);
router.put('/update-review/:reviewId', auth.requireUser, validation(validators), reviewRoute);
router.delete("/delete-review/:reviewId", auth.requireUserOrAdmin, validation(validators), reviewRoute)





module.exports = router;
