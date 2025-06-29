const mongoose = require("mongoose");
const addPrefixedIdPlugin = require("../db.helper.js");
const { AddressSchema } = require("../../utils/utils.schema.js");

const orderSchema=new mongoose.Schema({
    orderId: String,
    userId: String,
    shopId: String,
    status: {
        type:String,
        enum: [ 'prepare', 'in way', 'delivered' ],
        default:"prepare"
    },
    products: [
        {
            productId: String,
            name: String,
            quantity: Number,
            price: Number,
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card'],
        default: 'cod'
    },
    deliveryAddress: {
        type: AddressSchema
    },
    deliveryFee: {
        type: Number,
        default: 0
    },
    deliveredAt: Date,
},{
    timestamps:true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});

orderSchema.plugin(addPrefixedIdPlugin, { prefix: 'Order', field: 'orderId' });

const orderModel=mongoose.model("order",orderSchema)

module.exports=orderModel