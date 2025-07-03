const express = require('express');
const compression = require('compression')
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const pe = require('parse-error');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require("helmet")
const app   = express();
var LOG = require('./config/logger');
const CONFIG = require('./config/config');
const routes = require('./app/routes-index');
const { connectiondb } = require('./app/db/connectiondb.js');
require('./app/utils/passport.js');
//const { limit } = require('./app/utils/util.service.js');

app.use(morgan('combined', { stream: LOG.stream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(helmet());

//Database connection
connectiondb()

//Passport
app.use(require('passport').initialize());
//------------------


console.log("Environment:", CONFIG.ENV)
app.set("trust proxy", true);

// CORS
const whitelist = [CONFIG.CLINT_ORIGIN]

const allowedOrigin = (origin, callback)=>{
    console.log("origin------>",origin, whitelist, whitelist.includes(origin)); 
    if (!origin && CONFIG.ENV === 'dev') return callback(null, true);
    if (whitelist.includes(origin)){
        return callback(null, true)
    }
    return callback(new Error("not allowed origin"), null)
}

app.use(cors({
    origin: allowedOrigin,
    // origin:(origin, callback)=>{
    //     console.log("origin------> ",origin, whitelist, whitelist.includes(origin)); 
    //     if (whitelist.includes(origin)){
    //         return callback(null, true)
    //     }
    //     return callback(new Error("not allowed origin"), null)
    // },
    credentials: true,
}));

app.use(function(req, res, next) {
    const originalUrl = req.originalUrl;
    const method = req.method;
    const contentType = req.headers['content-type'];
    const path = req.path;
    console.log(path);
    // Skip validation for GET requests (they don't have body)
    if (method === 'GET' || method === 'DELETE') {
        return next();
    }
    // Paths that use form-data (file uploads), using regex to handle dynamic productId
    const formDataPaths = [
        '/common/uploadFile',
        /^\/api\/v1\/auth\/signup-shop$/  // Regex to match '/api/v1/.../....'
        ///^\/api\/v1\/auth\/signup-shop\/[^\/]+$/  // Regex to match '/api/v1/.../..../...'
    ];
    // Check if the path matches any form-data path
    const isFormDataPath = formDataPaths.some((formDataPath) => {
        return formDataPath instanceof RegExp
            ? formDataPath.test(path)  // Test if path matches the regex
            : formDataPath === path;  // Exact string match for non-dynamic paths
    });
    // Check if the request content-type is either application/json or multipart/form-data
    if (!isFormDataPath && contentType !== 'application/json') {
        res.status(415).json({
            error: 'Unsupported Content-Type. Only application/json is allowed for this path.',
            success: false,
            path: path,
            expectedContentType: 'application/json',
            receivedContentType: contentType
        });
    } else if (isFormDataPath && contentType.indexOf('multipart/form-data') === -1) {
        res.status(415).json({
            error: 'Unsupported Content-Type. Only multipart/form-data is allowed for file uploads.',
            success: false,
            path: path,
            expectedContentType: 'multipart/form-data',
            receivedContentType: contentType
        });
    } else {
        next();
    }
});

routes.v1routes(app)

app.get('/', function(req, res){
	res.status(200).json({
        message:"Bazarya API Server",
        status: "running",
        timestamp: new Date().toISOString()
    })
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Requested resource not found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'dev' ? err : {};
    LOG.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    // render the error page
    res.status(err.status || 500);
    //res.render('error');
    res.json({
        message: err.message,
        error: err
    });
});

app.listen(CONFIG.PORT, err => {
    if (err) {
        return console.log('something bad happened', err);
    }
    console.log('Bazarya API Server is listening on %s', CONFIG.PORT);
});


//This is here to handle all the uncaught promise rejections
app.on('unhandledRejection', error => {
    console.log(error)
    console.error('Uncaught Error', pe(error));
});
