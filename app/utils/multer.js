const multer = require("multer");
const mime = require('mime-types');
const fileType = require('file-type');
const { sendResponse } = require('./util.service')
const { RESPONSE_BAD_REQUEST } = require('./constants')
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/svg+xml", "image/tiff"];
const fileMimeTypes = ["application/pdf", "application/msword", "text/plain"];
const videosMimeTypes = ["video/mp4", "video/x-msvideo"]; 

const HME = (err, req, res, next) => {
    if (err) {
        sendResponse(res, RESPONSE_BAD_REQUEST, err.message, {}, []);
    } else {
        next();
    }
};

function myMullter() {

    // if you want to store the file on any cloud provider
    const storage = multer.memoryStorage({});

    // if you want to store the file in local machine
    // const storage = multer.diskStorage({
    //     destination: function (req, file, cb) {
    //         cb(null, '/tmp/my-uploads')
    //     },
    //     filename: function (req, file, cb) {
    //         cb(null, ``+file.originalname + '-' + Date.now())
    //     }
    // })

    function fileFilter(req, file, cb) {
        const mimeType = mime.lookup(file.originalname); 
        
        // detect file type useing magic bytes
        const buffer = file.buffer;
        const detected = fileType.fileTypeFromBuffer(buffer);
        if (!detected) return cb("Cannot determine file type", false);
        const realMime = detected.mime;
        // Validate image files
        if (imageMimeTypes.includes(realMime)) {
            cb(null, true); // Accept the file
        } 
        // Validate files
        else if (fileMimeTypes.includes(realMime)) {
            cb(null, true); // Accept the file
        } 
        else {
            cb("Invalid file format. Only images and videos are allowed.", false);
        }
    }

    const upload = multer({ 
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 15 * 1024 * 1024 } // Max file size 15MB
    });

    return upload;
}

module.exports = {
    myMullter,
    HME,
};
