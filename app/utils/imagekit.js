const ImageKit = require("imagekit");
const CONFIG = require("../../config/config.js");

let imageKit = new ImageKit({
    publicKey: CONFIG.IMAGEKIT_PUBLIC_KEY,
    privateKey:CONFIG.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: CONFIG.IMAGEKIT_ENDPOINT,
});

module.exports.imageKit=imageKit