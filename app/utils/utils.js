const sharp = require('sharp');
const csvtojson = require('csvtojson/v2')

const MomentRange = require('moment-range');
const Moment = require('moment');
const moment = MomentRange.extendMoment(Moment);
const { v4: uuidv4 } = require("uuid");

const fs = require('fs');
const { cloudinary } = require('./cloudinary.js');




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
    compressImage, 
    getDate, 
    currentDate,
    uploadImageToCloudinary,
    replaceImage
}

