const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
    description: String,
    videoLink: String,
    videoId: String
}, { _id: false });
// module.exports.Video = mongoose.model("Video", VideoSchema);
module.exports.VideoSchema = VideoSchema;

const SeoTagSchema = new Schema({
    keyName: String,
    value: String
}, { _id: false });
// module.exports.SeoTag = mongoose.model("SeoTag", SeoTagSchema);
module.exports.SeoTagSchema = SeoTagSchema;

const ImageSchema = new Schema({
    caption: String,
    imageURL: String,
    imageName: String,
    imageId: String
}, { _id: false });
// module.exports.Image = mongoose.model("Image", ImageSchema);
module.exports.ImageSchema = ImageSchema;

const pdfSchema = new Schema({
    caption: String,
    pdfURL: String,
    pdfName: String,
    pdfId: String
}, { _id: false });
// module.exports.Image = mongoose.model("Image", ImageSchema);
module.exports.pdfSchema = pdfSchema;

const AddressSchema = new Schema({
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
}, { _id: false });
// module.exports.Address = mongoose.model("Address", AddressSchema);
module.exports.AddressSchema = AddressSchema;

const KVSchema = new Schema({
    keyName: String,
    value: String
}, { _id: false });
// module.exports.KV = mongoose.model("KVSchema", KVSchema);
module.exports.KVSchema = KVSchema;


const CommunicationSchema = new Schema({
    phone: [KVSchema],
    email: [KVSchema]
}, { _id: false });
// module.exports.Communication = mongoose.model("Communication", CommunicationSchema);
module.exports.CommunicationSchema = CommunicationSchema;

