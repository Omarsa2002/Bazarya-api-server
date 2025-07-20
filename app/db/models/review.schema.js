const mongoose = require("mongoose");


const reviewSchema=new mongoose.Schema({
    reviewId:{
        type:String,
        required:true
    },
    userId:{
        type:String,
        required:true
    },
    productId:{
        type:String,
    },
    shopId:{
        type:String,
    },
    rating: {
        type: Number,
        default: 1,
        min: [1, "1 is minimum"],
        max: [5, "5 is maximum"],
    },
    reviewText:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

reviewSchema.plugin(addPrefixedIdPlugin, { prefix: 'Review', field: 'reviewId' })

const reviewModel=mongoose.model("Review",reviewSchema)

module.exports=reviewModel