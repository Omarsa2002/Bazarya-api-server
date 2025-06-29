const multer = require("multer");
const mime = require('mime-types');
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
    const storage = multer.memoryStorage({}); 

    function fileFilter(req, file, cb) {
        const mimeType = mime.lookup(file.originalname); 
        
        // Validate image files
        if (imageMimeTypes.includes(mimeType)) {
            cb(null, true); // Accept the file
        } 
        // Validate video files
        else if (fileMimeTypes.includes(mimeType)) {
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
