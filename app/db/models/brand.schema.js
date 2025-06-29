const { Schema, model } = require("mongoose");
const addPrefixedIdPlugin = require("../db.helper.js");
const { ImageSchema } = require("../../utils/utils.schema.js");

const brandSchema = new Schema({
    brandId:{
        type:String,
        required:true,
        unique:true
    },
    brandName: {
        type: String,
        required: [true, "brandName is required"],
        unique: true,
        min: [2, "minimum length 2 char"],
        max: [20, "max length 2 char"],
    },
    image: ImageSchema,
    createdBy: {
        type: String,
        required: true,
    },
    updatedBy: {
        type: String,
    },
},{
    timestamps: true,
});

brandSchema.plugin(addPrefixedIdPlugin, { prefix: 'Brand', field: 'brandId' })

const brandModel = model("Brand", brandSchema);
module.exports= brandModel;
