const mongoose = require("mongoose");
const addPrefixedIdPlugin = require("../db.helper.js");
const { AddressSchema } = require("../../utils/utils.schema.js");

const orderSchema=new mongoose.Schema({
    orderId: String,
    userId: String,
    shopId: String,
    status: {
        type: String,
        enum: ['pending_payment', 'payment_failed', 'confirmed', 'refunded', 'partially_refunded', 'preparing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending_payment'
    },
    products: [{
        productId: String,
        name: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number
    }],
    subtotal: Number,
    deliveryFee: Number,
    totalAmount: Number,
    deliveryAddress: AddressSchema,
    paymentMethod: {
        type: String,
        enum: ['card', 'wallet', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'cash'],
        required: true,
        default: 'card'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
        default: 'pending'
    },
    refundStatus:{
        type: String,
        enum: ['pending', 'processing', 'accepted', 'rejected', 'non'],
        default: 'non'
    },
    refundReason: {
        type: String,
        default: 'non'
    },
    refundedProducts: [{
        productId: String,
        name: String,
        quantity: Number,
        unitPrice: Number,
        refundAmount: Number
    }],
    paymobOrderId: Number, // Paymob order ID
    paymobTransactionId: Number, // Paymob transaction ID
    lastWebhookSignature: String,
    failureReason: String,
    paymentToken: String, // Paymob payment token
    paymentAttempts: { type: Number, default: 0 },
    paymentExpiresAt: Date,
    paidAt: Date,
    canceledAt: Date,
    refundedAt: Date,
    lastRefundAt: Date,
    refundRequestedAt: Date,
    refundAmount: Number,
    transactionHistory: [Object],
    reservedUntil: Date,
    delivered: Boolean,
    deliveredAt: Date,
},{
    timestamps:true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});

orderSchema.plugin(addPrefixedIdPlugin, { prefix: 'Order', field: 'orderId' });

const orderModel=mongoose.model("Order",orderSchema)

module.exports=orderModel