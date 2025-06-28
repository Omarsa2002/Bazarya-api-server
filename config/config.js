require('dotenv').config();//instatiate environment variables

let CONFIG = {} //Make this global to use all over the application

CONFIG.APP_NAME = process.env.APP_NAME

CONFIG.ENV          = process.env.ENV   || 'dev';
CONFIG.PORT         = process.env.PORT  || '3000';

CONFIG.DB_NAME      = process.env.DB_NAME || '..';
CONFIG.DB_USER      = process.env.DB_USER;
CONFIG.DB_PASSWORD  = process.env.DB_PASSWORD;
CONFIG.DB_CLUSTER   = process.env.DB_CLUSTER;

CONFIG.PAGINATION_SIZE = process.env.PAGINATION_SIZE || 10;

CONFIG.MOOD = process.env.MOOD

CONFIG.JWT_ENCRYPTION  = process.env.JWT_ENCRYPTION || 'BAZARYA_API@ENCRYPTION';
CONFIG.JWT_EXPIRATION  = process.env.JWT_EXPIRATION || 90000;

CONFIG.LOG_FILE_LOCATION = process.env.LOG_FILE_LOCATION;


CONFIG.BCRYPT_SALT = process.env.BCRYPT_SALT || 10;

CONFIG.DUMMY_PASSWORD = `${CONFIG.APP_NAME}_PASS$#ord`;


// CONFIG.cloudinary_name=process.env.CLOUDINARY_NAME;
// CONFIG.cloudinary_api_key=process.env.CLOUDINARY_API_KEY;
// CONFIG.cloudinary_api_secret=process.env.CLOUDINARY_API_SECRET;

//Send Grid API Configuration
// CONFIG.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
// CONFIG.SENDGRID_EMAIL_FROM = process.env.SENDGRID_EMAIL_FROM;

CONFIG.NODEMAILER_EMAIL_FROM = process.env.NODE_MAILER_EMAIL;
CONFIG.NODEMAILER_API_KEY = process.env.NODE_MAILER_PASSWORD;

CONFIG.IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY;
CONFIG.IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
CONFIG.IMAGEKIT_ENDPOINT = process.env.IMAGEKIT_ENDPOINT;

CONFIG.CLINT_ORIGIN = process.env.CLINT_ORIGIN
CONFIG.CLINT_ORIGIN_2 = process.env.CLINT_ORIGIN_2
CONFIG.CLINT_ORIGIN_3 = process.env.CLINT_ORIGIN_3

// CONFIG.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// CONFIG.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

module.exports = CONFIG;
