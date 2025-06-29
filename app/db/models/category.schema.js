const mongoose = require("mongoose");
const addPrefixedIdPlugin = require("../db.helper.js");


const categorySchema=new mongoose.Schema({
    categoryId:String,
    categoryName:{
        type:String,
        unique: true,
        min: [2, "minimum length 2 char"],
        max: [20, "max length 2 char"],
        required:true
    },
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

categorySchema.plugin(addPrefixedIdPlugin, { prefix: 'Category', field: 'categoryId' })

const categoryModel=mongoose.model("Category",categorySchema)
module.exports=categoryModel;