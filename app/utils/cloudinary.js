const CONFIG = require('../../config/config.js');

const cloudinary = require('cloudinary').v2




cloudinary.config({
    cloud_name: CONFIG.cloudinary_name,
    api_key: CONFIG.cloudinary_api_key,
    api_secret: CONFIG.cloudinary_api_secret,
    secure: true,
  });
  

  module.exports={cloudinary}
  