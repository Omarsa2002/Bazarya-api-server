const mongoose = require("mongoose");
const addPrefixedIdPlugin = require("../db.helper.js");
const { AddressSchema } = require("../../utils/utils.schema.js");

const orderSchema=new mongoose.Schema({
    orderId: String,
    userId: String,
    shopId: String,
    status: {
        type: String,
        enum: ['confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'],
        default: 'confirmed'
    },
    products: [{
        productId: String,
        name: String,
        quantity: Number,
        price: Number,
        priceAtTime: Number // Store price at time of order
    }],
    totalAmount: Number,
    deliveryAddress: AddressSchema,
    deliveryFee: Number,
    paymentMethod: String,
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    deliveredAt: Date,
},{
    timestamps:true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});

orderSchema.plugin(addPrefixedIdPlugin, { prefix: 'Order', field: 'orderId' });

const orderModel=mongoose.model("Order",orderSchema)

module.exports=orderModel