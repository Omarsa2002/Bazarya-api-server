const productModel = require("../db/models/product.schema.js");
const cartModel = require('../db/models/cart.schema.js')
const slugify = require('slugify');
const { sendResponse, paginationWrapper, currentDate } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")
const aggregation = require('./cart.aggregationQuery.js');


const addToCart = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.adminId;
        const { productId, quantity } = req.body;

        // Get product details
        const product = await productModel.findOne({ productId });
        if (!product) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Product not found", {});
        }
        // Check inventory
        if (product.stock < quantity) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Insufficient stock", {});
        }
        const shopId = product.createdBy;
        const unitPrice = product.finalPrice;
        const totalPrice = unitPrice * quantity;
        // Find or create cart for this specific shop
        let cart = await cartModel.findOne({ userId, shopId });
        if (!cart) {
            cart = new cartModel({ 
                userId, 
                shopId, 
                items: [],
                totalAmount: 0
            });
        }
        // Check if product already in this shop's cart
        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
        
        if (existingItemIndex !== -1) {
            // Update existing item
            const oldQuantity = cart.items[existingItemIndex].quantity;
            const newQuantity = oldQuantity + quantity;
            
            // Check total quantity doesn't exceed stock
            if (newQuantity > product.stock) {
                return sendResponse(res, constants.RESPONSE_BAD_REQUEST, 
                    `Cannot add ${quantity} items. Only ${product.stock - oldQuantity} more available`, {});
            }
            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].unitPrice = unitPrice;
            cart.items[existingItemIndex].totalPrice = unitPrice * newQuantity;
        } else {
            // Add new item to cart
            cart.items.push({
                productId,
                productName: product.productName,
                quantity,
                unitPrice,
                totalPrice
            });
        }
        // Recalculate cart total
        cart.totalAmount = cart.items.reduce((sum, item) => {return sum + item.totalPrice}, 0);
        cart.updatedAt = currentDate(Date.now());
        await cart.save();
        sendResponse(res, constants.RESPONSE_CREATED, "Item added to cart", { 
            cartId: cart.cartId,
            shopId: cart.shopId,
            totalItems: cart.items.length,
            totalAmount: cart.totalAmount
        });
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, {});
    }
};

const getUserCarts = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.adminId;
        
        const carts = await cartModel.aggregate(aggregation.allUserCarts(userId))
        if (!carts || carts.totalCount === 0) {
            return sendResponse(res, constants.RESPONSE_SUCCESS, "No items in cart", { carts: [] });
        }
        sendResponse(res, constants.RESPONSE_SUCCESS, "Carts retrieved", carts[0], []);
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, {});
    }
};

const getCartByShop = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.adminId;
        const { shopId } = req.params;

        const cart = await cartModel.aggregate(aggregation.getCartByShop(userId, shopId))
        if (!cart[0] || cart[0].items.length === 0) {
            return sendResponse(res, constants.RESPONSE_SUCCESS, "Cart is empty for this shop", { cart: null });
        }

        sendResponse(res, constants.RESPONSE_SUCCESS, "Shop cart retrieved", cart, []);
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, {});
    }
};

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.adminId;
        const { shopId, productId } = req.params;
        const { quantity } = req.body;

        const cart = await cartModel.findOne({ userId, shopId });
        if (!cart) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Cart not found", {});
        }

        const itemIndex = cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Item not in cart", {});
        }

        if (quantity === 0) {
            // Remove item
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            const product = await productModel.findOne({ productId });
            if (quantity > product.stock) {
                return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Insufficient stock", {});
            }
            
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].totalPrice = cart.items[itemIndex].unitPrice * quantity;
        }

        // Recalculate total
        cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        cart.updatedAt = new Date();

        // If cart is empty, delete it
        if (cart.items.length === 0) {
            await cartModel.deleteOne({ userId, shopId });
            return sendResponse(res, constants.RESPONSE_SUCCESS, "Cart emptied", {});
        }

        await cart.save();
        sendResponse(res, constants.RESPONSE_SUCCESS, "Cart updated", { 
            totalAmount: cart.totalAmount,
            itemCount: cart.items.length 
        });
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, {});
    }
};




module.exports={
    addToCart,
    getUserCarts,
    getCartByShop,
    updateCartItem,
}