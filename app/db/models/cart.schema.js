const mongoose = require("mongoose");
const addPrefixedIdPlugin = require("../db.helper.js");

const cartSchema = new mongoose.Schema({
    cartId: String,
    userId: String,
    shopId: String,
    items: [{
        productId: String,
        productName: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
        shopId: String,
        addedAt: { type: Date, default: Date.now() }
    }],
    totalAmount: Number,
    updatedAt: { type: Date, default: Date.now() }
});

cartSchema.index({ userId: 1, shopId: 1 }, { unique: true });

cartSchema.plugin(addPrefixedIdPlugin, { prefix: 'Cart', field: 'cartId' });

const cartModel=mongoose.model("Cart",cartSchema)

module.exports=cartModel