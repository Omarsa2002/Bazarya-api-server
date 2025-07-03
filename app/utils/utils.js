const sharp = require('sharp');
//const csvtojson = require('csvtojson/v2')

const MomentRange = require('moment-range');
const Moment = require('moment');
const moment = MomentRange.extendMoment(Moment);
const { v4: uuidv4 } = require("uuid");

const fs = require('fs');
//const { cloudinary } = require('./cloudinary.js');

const {imageKit} = require('./imagekit.js');

function validateAndFormatFolder(folder) {
    // If no folder provided, use root
    if (!folder || folder.trim() === '') {
        return '/';
    }
    
    // Replace spaces with underscores, keep other valid characters
    let cleanFolder = folder.replace(/ /g, '_');
    
    // Ensure folder starts with /
    if (!cleanFolder.startsWith('/')) {
        cleanFolder = '/' + cleanFolder;
    }
    
    // Ensure folder ends with / (ImageKit requirement)
    if (!cleanFolder.endsWith('/')) {
        cleanFolder = cleanFolder + '/';
    }
    
    // Remove double slashes
    cleanFolder = cleanFolder.replace(/\/+/g, '/');
    
    return cleanFolder;
}

/**
 * Uploads a file to ImageKit.io.
 * @param {string} fileBuffer - the file Buffer you want to upload.
 * @param {string} fileName - The desired name for the file in ImageKit.
 * @param {string} [folder="/"] - Optional: The folder path in ImageKit to upload to. Defaults to root.
 */
async function uploadFileToImageKit(fileBuffer, fileName, folder = "/") {
    try {
        folder = validateAndFormatFolder(folder);
        const result = await imageKit.upload({
            file: fileBuffer,             // Required: The actual file content (buffer, base64, or URL)
            fileName: fileName,           // Required: The name the file will have in ImageKit
            folder: folder,               // Optional: Specify a folder
            //tags: ["demo", "nodejs-upload"], // Optional: Add tags for better organization/search
            useUniqueFileName: true,      // Optional: ImageKit will add a unique suffix if true
            isPrivateFile: false          // Optional: Set to true if the file should be private
        });
        console.log("File uploaded successfully:");
        console.log("  File ID:", result.fileId);
        console.log("  File Name:", result.name);
        console.log("  File URL:", result.url);
        console.log("  Thumbnail URL:", result.thumbnailUrl);
        return result;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error; // Re-throw the error for upstream handling
    }
}

/**
 * Deletes a single file from ImageKit.io.
 * @param {string} fileId - The unique ID of the file to delete.
 */
function deleteFileFromImageKit(fileId) {
    imageKit.deleteFile(fileId, function(error, result) {
        if (error) {
            console.error(`Error deleting file with ID ${fileId}:`, error);
        } else {
            console.log(`File with ID ${fileId} deleted successfully.`, result);
        }
    });
}

/**
 * Deletes multiple files from ImageKit.io in a single batch operation.
 * @param {string[]} fileIdsArray - An array of unique file IDs to delete.
 */
async function bulkDeleteFilesFromImageKit(fileIdsArray) {
    try {
        const response = await imageKit.bulkDeleteFiles(fileIdsArray);
        console.log("Bulk delete operation completed.");
        console.log("Successfully deleted file IDs:", response.successfullyDeletedFileIds);
        return response;
    } catch (error) {
        console.error("Error during bulk delete:", error);
        throw error;
    }
}

/**
 * Updates details (metadata) of an existing file in ImageKit.io.
 * @param {string} fileId - The unique ID of the file to update.
 * @param {object} updates - An object containing the properties to update.
 * Example: { tags: ["new-tag"], folder: "/new-folder", fileName: "renamed-file.jpg" }
 */
function updateFileDetailsInImageKit(fileId, updates) {
    imageKit.updateFileDetail({
        fileId: fileId,
        ...updates 
    }, function(error, result) {
        if (error) {
            console.error(`Error updating file details for ID ${fileId}:`, error);
        } else {
            console.log(`File details for ID ${fileId} updated successfully:`, result);
        }
    });
}

/**
 * Replaces a file by first deleting the old one and then uploading a new one.
 * @param {string} oldFileId - The ID of the file to be deleted.
 * @param {string} newFilePath - The local path to the new file content.
 * @param {string} newFileName - The desired name for the new file.
 * @param {string} [newFolder="/"] - The folder for the new file.
 */
async function replaceFileByDeleteAndUpload(oldFileId, newFileBuffer, newFileName, newFolder = "/") {
    try {
        // 1. Delete the old file
        await new Promise((resolve, reject) => {
            imageKit.deleteFile(oldFileId, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
        console.log(`Old file (ID: ${oldFileId}) deleted.`);

        // 2. Upload the new file (reusing the uploadFileToImageKit function from earlier)
        const uploadResult = await uploadFileToImageKit(newFileBuffer, newFileName, newFolder);
        console.log("New file uploaded successfully:", uploadResult.url);
        return uploadResult;
    } catch (error) {
        console.error("Error replacing file via delete+upload:", error);
        throw error;
    }
}



const uploadImageToCloudinary = async (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const publicId = `image-${uuidv4()}`; // Create a unique public ID
        cloudinary.uploader.upload_stream(
            {
                public_id: publicId,
                resource_type: "image",
                folder:"sportStore/images", // Specify resource type as image
                transformation: [
                    { width: 500, height: 500, crop: "scale" }, 
                    { format: "svg" } // Convert to SVG
                ],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(fileBuffer);
    });
};

const replaceImage = async (imageId, fileBuffer) => {
    return new Promise((resolve, reject) => {
        // Use the same public ID to replace the existing image
        cloudinary.uploader.upload_stream(
            {
                public_id: imageId, // Reuse the public ID to replace the image
                resource_type: "image",
                folder: "sportStore/images", // Keep the same folder or specify another if needed
                overwrite: true, // Ensures that the existing image is replaced
                transformation: [
                    { width: 500, height: 500, crop: "scale" }, 
                    { format: "svg" } // Convert to SVG
                ],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(fileBuffer);
    });
}

const compressImage = async(buffer, ext) => {
    let newBuff, error;
    if(ext !== 'svg' && ext !== 'png'){
        await sharp(buffer)
            .webp({ quality: 80 })
            .toBuffer()
            .then(data => newBuff = data)
            .catch(err => error = err)
        if(error){
            console.log("error while compressing: ", error)
            return [buffer, ext];
        }

        return [newBuff, 'jpeg'];
    }else return ext === 'svg' ? [buffer, 'svg'] : [buffer, 'png'];
}

const getDate = () => {
    const dateValue = new Date();
    return dateValue.toISOString()
}


const currentDate = (inputDate) => {
    return moment();
}

// function readCSVFile(filePath) {
//   try {
//     const csvData = fs.readFileSync(filePath, 'utf8');
//     return csvData;
//   } catch (err) {
//     console.error(err);
//     return null;
//   }
// }

// function omit(obj, keys) {
//     return Object.keys(obj)
//       .filter(key => !keys.includes(key))
//       .reduce((acc, key) => {
//         acc[key] = obj[key];
//         return acc;
//       }, {});
// }

// const csvToObject = async(csvStr,options) => {
//     return await csvtojson(options ? options : {} ).fromString(csvStr)
// }

// const objectToCsv = (headers, object) => {
//     let csvString = ''
//     headers.forEach(el => csvString+= el + ',')
//     csvString += '\n'
//     object.forEach((element) => {
//       headers.forEach((el) => csvString+= `"${element[el] ?? '' }"`   + ',')
//       csvString+= '\n'
//     })
//     return csvString
// }




// function writeToJson(data, outputFilePath) {
//     const jsonData = JSON.stringify(data, null, 4);
//     fs.writeFileSync(outputFilePath, jsonData);
//     console.log(`Data successfully written to ${outputFilePath}.`);
// }





module.exports = {
    uploadFileToImageKit,
    deleteFileFromImageKit,
    bulkDeleteFilesFromImageKit,
    updateFileDetailsInImageKit,
    replaceFileByDeleteAndUpload,
    compressImage, 
    getDate, 
    currentDate,
    //uploadImageToCloudinary,
    //replaceImage
}

