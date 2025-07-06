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
        const clientMimeType = file.mimetype;
        const mimeFromExtension = mime.lookup(file.originalname);
        
        console.log('File validation:', {
            originalname: file.originalname,
            clientMimeType: clientMimeType,
            mimeFromExtension: mimeFromExtension
        });
        
        // Basic validation using client-provided mimetype and file extension
        if (imageMimeTypes.includes(clientMimeType) || 
            fileMimeTypes.includes(clientMimeType) ||
            imageMimeTypes.includes(mimeFromExtension) || 
            fileMimeTypes.includes(mimeFromExtension)) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error(`Invalid file format: ${clientMimeType}. Only images (JPEG, PNG, GIF, BMP, SVG, TIFF) and documents (PDF, DOC, TXT) are allowed.`), false);
        }
    }

    const upload = multer({ 
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 15 * 1024 * 1024 } // Max file size 15MB
    });
    return upload;
}

const validateFileTypes = async (req, res, next) => {
    try {
        if (!req.files) {
            return next();
        }
        // Validate each uploaded file using magic bytes
        for (const fieldName in req.files) {
            const files = req.files[fieldName];
            
            for (const file of files) {
                if (!file.buffer || file.buffer.length === 0) {
                    return sendResponse(res, RESPONSE_BAD_REQUEST, `File ${file.originalname} is empty`, {}, []);
                }
                try {
                    // Use magic bytes to detect real file type
                    const detected = await fileType.fileTypeFromBuffer(file.buffer);
                    
                    if (!detected) {
                        return sendResponse(res, RESPONSE_BAD_REQUEST, `Cannot determine file type for ${file.originalname}`, {}, []);
                    }
                    const realMimeType = detected.mime;
                    console.log(`File ${file.originalname}: Real type = ${realMimeType}, Client type = ${file.mimetype}`);
                    // Validate against allowed types
                    const isValidImage = imageMimeTypes.includes(realMimeType);
                    const isValidFile = fileMimeTypes.includes(realMimeType);
                    const isValidVideo = videosMimeTypes.includes(realMimeType);
                    if (!isValidImage && !isValidFile && !isValidVideo) {
                        return sendResponse(res, RESPONSE_BAD_REQUEST, 
                            `Invalid file type for ${file.originalname}. Detected: ${realMimeType}. Only images, PDFs, and documents are allowed.`, 
                            {}, []
                        );
                    }
                    // Optional: Check if client-provided mimetype matches real mimetype
                    if (file.mimetype !== realMimeType) {
                        console.warn(`Mimetype mismatch for ${file.originalname}: Client=${file.mimetype}, Real=${realMimeType}`);
                        // You can choose to reject or just log the warning
                    }
                } catch (typeError) {
                    console.error('File type detection error:', typeError);
                    return sendResponse(res, RESPONSE_BAD_REQUEST, `Error validating file ${file.originalname}`, {}, []);
                }
            }
        }
        next();
    } catch (error) {
        console.error('File validation error:', error);
        sendResponse(res, RESPONSE_BAD_REQUEST, 'File validation failed', {}, []);
    }
};
module.exports = {
    myMullter,
    HME,
    validateFileTypes
};
