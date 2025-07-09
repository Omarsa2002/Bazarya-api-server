const mongoose = require("mongoose");
const addPrefixedIdPlugin = require("../db.helper.js");


const categorySchema=new mongoose.Schema({
    subCategoryId:String,
    subCategoryName:{
        type:String,
        unique: true,
        trim: true,
        min: [2, "minimum length 2 char"],
        max: [20, "max length 2 char"],
        required:true
    },
    categoryId: String,
    createdBy: {
        type: String,
        required: true,
    },
    updatedBy: {
        type: String,
    },
},{
    timestamps:true
})

categorySchema.plugin(addPrefixedIdPlugin, { prefix: 'SubCategory', field: 'subCategoryId' })

const subCategoryModel=mongoose.model("SubCategory",categorySchema)
module.exports=subCategoryModel;