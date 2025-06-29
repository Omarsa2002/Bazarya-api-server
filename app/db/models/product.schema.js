const mongoose = require("mongoose");
const addPrefixedIdPlugin = require("../db.helper.js");
const { ImageSchema, VideoSchema } = require("../../utils/utils.schema.js");

const productSchema=new mongoose.Schema({
    productId:{
        type:String,
        required:true,
        unique:true
    },
    productName:{
        type:String,
        required:true,
        unique: [true, 'product name must be unique'],
        min: [2, 'minimum length 2 char'],
        max: [20, 'max length 2 char'],
    },
    slug: String,
    categoryId:{
        type:String,
        required:true
    },
    productDescription:{
        type:String,
    },
    image: ImageSchema,

    video: VideoSchema,

    amount:{
        type:Number,
        default:0
    },

    stock: {
        type: Number,
        default: 0
    },
    soldItems: {
        type: Number,
        default: 0
    },

    price:{
        type:Number,
        default:0
    },

    finalPrice:{
        type:Number,
        default:0
    },

    discount:{
        type:Number,
        default:0
    },

    colors: {
        type: [String],
    },
    size: {
        type: [String],
        enum: ['s', 'm', 'l', 'xl']
    },
    brandId: {
        type:String,
        required:true
    },
    avgRate:{
        type:Number,
        default:0
    },
    reviewId:{
        type:String
    },
    createdBy: {
        type: String,
        required: true,
    },
    updatedBy: {
        type: String,
    },
},
{
    timestamps:true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
}
)

productSchema.plugin(addPrefixedIdPlugin, { prefix: 'Product', field: 'productId' })

//if you are going to use aggregate it is not neccssary to make population here

// productSchema.virtual("categoryDetails",{
//     ref:"Category",
//     localField:"categoryId",
//     foreignField:"categoryId",
// })

// productSchema.virtual("brandDetails",{
//     ref:"Brand",
//     localField:"brandId",
//     foreignField:"brandId",
// })

// productSchema.virtual("reviewDetails",{
//     ref:"Review",
//     localField:"reviewId",
//     foreignField:"reviewId",
// })

const productModel=mongoose.model("Product",productSchema)

module.exports=productModel