const productModel = require("../db/models/product.schema.js");
const userModel = require("../db/models/user.schema.js");
const orderModel = require("../db/models/order.schema.js");
const shopModel = require("../db/models/shop.schema.js");
const cartModel = require('../db/models/cart.schema.js');
const slugify = require('slugify');
const { sendResponse, paginationWrapper, validateExpiry } = require("../utils/util.service.js");
const constants=require("../utils/constants.js")
const constantTimes=require("../utils/constantTimes.js")
const { reserveInventory, releaseInventoryReservation, sendOrderConfirmation } = require('./order.helper.js')
const utils = require('../utils/utils.js');
const { createPaymobPayment, getTransactionById, voidTransaction  } = require('../utils/paymob.js');
//const aggregation = require('./order.aggregationQuery.js');



const getAllUserOrders = async (req, res, next) => {
    try {
        const { userId } = req.params

        sendResponse(res, constants.RESPONSE_SUCCESS, "Orders retrieved successfully", responseData, []);
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, "", constants.UNHANDLED_ERROR);
    }
}

const getAllShopoOrders = async (req, res, next) => {
    try{
        const { shopId } = req.params

        sendResponse(res, constants.RESPONSE_SUCCESS, "done", product, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}
const getOrder = async (req, res, next) => {
    try{
        const { shopId } = req.params

        sendResponse(res, constants.RESPONSE_SUCCESS, "done", product, []);
    }catch(error){
        sendResponse(res,constants.RESPONSE_INT_SERVER_ERROR,error.message,"", constants.UNHANDLED_ERROR);
    }
}

const createOrderFromCart = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.adminId;
        const { shopId, deliveryAddress, paymentMethod, phoneNumber } = req.body;

        // Validate payment method for Egypt
        const validPaymentMethods = ['card', 'wallet', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'cash'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Invalid payment method", {});
        }

        // Get cart and validate
        const cart = await cartModel.findOne({ userId, shopId });
        if (!cart || cart.items.length === 0) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "No items in cart for this shop", {});
        }

        // Get user and shop details
        const [user, shop] = await Promise.all([
            userModel.findOne({ userId }),
            shopModel.findOne({ shopId })
        ]);

        if (!shop) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Shop not found", {});
        }

        // Reserve inventory
        const reservationResults = await reserveInventory(cart.items);
        if (!reservationResults.success) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, 
                `Insufficient stock: ${reservationResults.message}`, {});
        }

        try {
            // Create order
            const subtotal = cart.totalAmount;
            const deliveryFee = shop.deliveryFee;
            const totalAmount = subtotal + deliveryFee;
            const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            const order = new orderModel({
                userId,
                shopId,
                status: 'pending_payment',
                products: cart.items.map(item => ({
                    productId: item.productId,
                    name: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                })),
                subtotal,
                deliveryFee,
                totalAmount,
                deliveryAddress: deliveryAddress || user.address,
                paymentMethod,
                paymentStatus: 'pending',
                paymentExpiresAt
            });

            await order.save();

            // Handle Cash on Delivery
            if (paymentMethod === 'cash') {
                order.status = 'confirmed';
                order.paymentStatus = 'pending'; // Will be completed on delivery
                await order.save();
                await cartModel.deleteOne({ userId, shopId });
                
                return sendResponse(res, constants.RESPONSE_CREATED, "Order created successfully (Cash on Delivery)", {
                    orderId: order.orderId,
                    totalAmount: order.totalAmount,
                    paymentMethod: 'cash'
                });
            }

            // For online payments, create Paymob payment
            const paymobPayment = await createPaymobPayment(order, user, phoneNumber);
            
            if (paymobPayment.success) {
                // Update order with Paymob details
                order.paymobOrderId = paymobPayment.orderId;
                order.paymentToken = paymobPayment.token;
                await order.save();

                // Clear cart only after successful payment initiation
                await cartModel.deleteOne({ userId, shopId });

                sendResponse(res, constants.RESPONSE_CREATED, "Order created, proceed to payment", {
                    orderId: order.orderId,
                    totalAmount: order.totalAmount,
                    paymentMethod: order.paymentMethod,
                    paymentUrl: paymobPayment.paymentUrl,
                    paymentToken: paymobPayment.token,
                    expiresAt: order.paymentExpiresAt
                });
            } else {
                // Release inventory if Paymob payment creation failed
                await releaseInventoryReservation(cart.items);
                await orderModel.deleteOne({ orderId: order.orderId });
                
                return sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, 
                    "Failed to initiate payment", { error: paymobPayment.error }, []);
            }
        } catch (orderError) {
            await releaseInventoryReservation(cart.items);
            throw orderError;
        }
    } catch (error) {
        // If order creation fails, don't clear the cart
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, []);
    }
};

const cancelOrder = async (req, res, next) => {
    try{
        const { userId } = req.user;
        const { orderId } = req.params;
        const order = await orderModel.findOne({orderId, userId});
        if(!order){
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "invalid order Id", {}, []);
        }
        if (order.paymentStatus === 'canceled' || order.paymentStatus === 'completed') {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Order cannot be canceled", {}, []);
        }
        const transactionId = order.paymobTransactionId;

        if (!transactionId) {
            // Order not paid yet (no transaction ID)
            console.log(`Canceling unpaid order: ${orderId}`);
            
            await orderModel.updateOne(
                { orderId }, 
                { 
                    paymentStatus: 'canceled',
                    canceledAt: new Date(),
                }
            );
            return sendResponse(res, constants.RESPONSE_SUCCESS, "Order canceled successfully (no payment to refund)", 
                { orderId, status: 'canceled' }, []
            );
        }

        const voidResult = await voidTransaction(transactionId);
        if (!voidResult.success) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, voidResult.message || "Failed to void transaction", {}, []);
        }
        await orderModel.updateOne({ orderId }, { paymentStatus: 'canceled', canceledAt: new Date() });

        console.log(voidResult);
        sendResponse(res, constants.RESPONSE_SUCCESS, "order canceled successfully", voidResult, []);
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, "", constants.UNHANDLED_ERROR);
    }
}
const refundRequest = async (req, res, next) => {
    try{
        const { userId } = req.user;
        const { orderId } = req.params;
        const { refundedProducts, refundReason } = req.body
        const order = await orderModel.findOne({orderId, userId});
        if(!order){
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "Order not found", {}, [])
        }
        if(!order.delivered){
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "this order is not delivered yet", {}, [])
        }
        if (order.refundStatus === 'pending') {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "A refund request is already pending for this order", {}, []);
        }
        if (order.refundStatus === 'accepted') {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "This order has already been refunded", {}, []);
        }
        if(!validateExpiry(order.deliveredAt, constantTimes.DAYS, 15)){
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "The 15-day refund window for this order has expired.", {}, [])
        }
        const productsToRefund = [];
        let totalRefundAmount = 0;
        for (const refundProductId of refundedProducts) {
            const orderProduct = order.products.find(product => 
                product.productId === refundProductId
            );

            if (!orderProduct) {
                return sendResponse(res, constants.RESPONSE_BAD_REQUEST, 
                    `Product with ID ${refundProductId} not found in this order`, {}, []);
            }

            // Check if this specific product is already refunded (if you track per-product status)
            if (orderProduct.refundStatus === 'approved') {
                return sendResponse(res, constants.RESPONSE_BAD_REQUEST, 
                    `Product "${orderProduct.name}" has already been refunded`, {}, []);
            }

            productsToRefund.push({
                productId: orderProduct.productId,
                name: orderProduct.name,
                unitPrice: orderProduct.unitPrice,
                quantity: orderProduct.quantity,
                refundAmount: orderProduct.unitPrice * orderProduct.quantity
            });
            totalRefundAmount += (orderProduct.unitPrice * orderProduct.quantity);
        }
        if (productsToRefund.length === 0) {
            return sendResponse(res, constants.RESPONSE_BAD_REQUEST, "One or more of the selected products for refund are not found in this order.", {}, []);
        }
        order.refundedProducts = productsToRefund;
        order.refundReason = refundReason.trim();
        order.refundStatus = "pending";
        order.refundAmount = totalRefundAmount;
        order.refundRequestedAt = new Date();
        await order.save();
        sendResponse(res, constants.RESPONSE_SUCCESS, 
            "Refund request submitted successfully. The shop will review your request within 2-3 business days.", 
            {
                refundAmount: totalRefundAmount,
                productsCount: productsToRefund.length,
                status: 'pending'
            }, 
            []
        );
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, "", constants.UNHANDLED_ERROR);
    }
}





module.exports={
    getAllUserOrders,
    getAllShopoOrders,
    getOrder,
    createOrderFromCart,
    cancelOrder,
    refundRequest
}