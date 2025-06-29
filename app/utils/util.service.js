const { to } = require('await-to-js');

const MomentRange = require('moment-range');
const Moment = require('moment');
const moment = MomentRange.extendMoment(Moment);
const path = require("path");
const pe = require('parse-error');
const CONFIG        = require('../../config/config.js');
const customError = require('./custom.error.js');
const   rateLimit = require('express-rate-limit');
const constants = require('./constants.js');


const sendResponse = (res, status, message = '', data = any, errors = []) => {
    let errList = [];
    if (typeof errors === 'object' && errors.message) {
        errList.push({ message: errors.message, key: null });
    }
    if (typeof errors === 'string') {
        errList.push({ message: errors, key: null });
    }
    return res.status(status).json({
        success: !(status > 300),
        message,
        data,
        errors: errList.length ? errList : errors,
    });
};
module.exports.sendResponse = sendResponse;

module.exports.to = async (promise) => {
    let err, res;
    [err, res] = await to(promise);
    if (err) return [pe(err)];
    return [null, res];
};

module.exports.ReE = function (res, err, code) { // Error Web Response
    if (typeof err == 'object' && typeof err.message != 'undefined') {
        err = err.message;
        console.error(err);
    }
    if (typeof code !== 'undefined') res.statusCode = code;
    return res.json({ success: false, errors: err });
};

module.exports.ReS = function (res, data, code) { // Success Web Response
    let send_data = { success: true };

    if (typeof data == 'object') {
        send_data = Object.assign(data, send_data);//merge the objects
    }

    if (typeof code !== 'undefined') res.statusCode = code;

    return res.json(send_data)
};

module.exports.TE = TE = function (err_message, log) { // TE stands for Throw Error
    console.error(err_message);
    throw new Error(err_message);
};

module.exports.removeJSONKey = function (json, keys) {
    for (let key of keys) {
        delete json[key];
    }
    return json;
};

module.exports.TCE = TCE = function (err_message, data, code) { // TE stands for Throw Custom Error
    throw new IsekaiError(err_message, data);
};

const formatError = (msg, field) => {
    const errors = [];
    errors.push({
        message : msg,
        field : field
    });
    return errors;
};
module.exports.formatError = formatError;

const randomString = (length, chars) => {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
}
module.exports.randomString = randomString;

const randomNumber=()=>{
    return Math.floor(100000 + Math.random() * 900000).toString();
}
module.exports.randomNumber=randomNumber;

const validateExpiry = (inputDate,dateType,expireTime) => {
    let diffHours = moment().diff(moment(inputDate), `${dateType}`, true);
    return diffHours <= expireTime;
}
module.exports.validateExpiry = validateExpiry;

const currentDate = (inputDate) => {
    return moment();
}
module.exports.currentDate = currentDate;

const paginationWrapper = (page, size) => {

    const limit = size ? +size : CONFIG.PAGINATION_SIZE;

    const  offset = page ? (page-1) * limit : 0;
    
    return { limit, offset };
};
module.exports.paginationWrapper = paginationWrapper;

const paginationResponse = (data) => {
    return {
        totalItems: data.totalDocs,
        type: data.docs,
        totalPages: data.totalPages,
        currentPage: data.page - 1,
    };
};
module.exports.paginationResponse = paginationResponse;

const airTableLastModifiedDate = (minusDay) => {
    let minusDate = moment().subtract(minusDay, "days");
    return minusDate.format("YYYY-MM-DD");
}
module.exports.airTableLastModifiedDate = airTableLastModifiedDate;

const getPreviousDateByDay = (minusDay) => {
    return moment().subtract(minusDay, "days");
}
module.exports.getPreviousDateByDay = getPreviousDateByDay;



const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: (req, res) => {
        if (req.user && req.user.role === 'admin') {
            return 1000; // Allow 1000 requests for admins
        } else {
            return 10; // Allow 10 requests for regular users
        }
    },
    handler: (req, res) => {
        sendResponse(res,constants.RESPONSE_TOO_MANY_REQUESTS,'You have exceeded the 10 requests in 5 minutes limit!',{},[])
    }
})

module.exports.limit=limiter
