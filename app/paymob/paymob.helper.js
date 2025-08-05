const productModel = require('../db/models/product.schema');
const { releaseInventoryReservation, sendOrderConfirmation } = require('../order/order.helper');

function determineOperationType(webhookObj) {
    const { is_refunded, is_voided, refunded_amount_cents, amount_cents } = webhookObj;
    
    if (is_voided) {
        return 'void';
    }
    if (is_refunded) {
        // check refund type
        if (refunded_amount_cents && refunded_amount_cents < amount_cents) {
            return 'partial_refund';
        } else {
            return 'refund';
        }
    }
    return 'payment';
}


async function handlePayment(order, webhookObj) {
    const { success, id: transactionId } = webhookObj;
    const txn_response_code = webhookObj.data?.txn_response_code || 'UNKNOWN';
    
    if (order.paymentStatus === 'completed' || order.paymentStatus === 'failed') {
        console.log(`Order ${order.orderId} already in final state: ${order.paymentStatus}`);
        return;
    }

    if (success === true || success === "true") {
        // Payment successful
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        order.paidAt = new Date();
        
        // Convert reserved stock to sold
        for (const product of order.products) {
            await productModel.updateOne(
                { productId: product.productId },
                { $inc: { stock: -product.quantity, soldItems: product.quantity } }
            );
        }
        
        // add transaction to transactionHistory
        if (!order.transactionHistory) {
            order.transactionHistory = [];
        }
        
        order.transactionHistory.push({
            type: 'payment',
            transactionId: transactionId,
            amount: webhookObj.amount_cents,
            status: 'completed',
            processedAt: new Date(),
            responseCode: txn_response_code
        });
        
        // Send confirmation notifications
        await sendOrderConfirmation(order);
        console.log(`✅ Payment successful for order: ${order.orderId}`);
        
    } else {
        // Payment failed
        order.paymentStatus = 'failed';
        order.status = 'payment_failed';
        order.failureReason = txn_response_code;
        
        // Release reserved inventory
        await releaseInventoryReservation(order.products);
        
        // add failed transaction
        if (!order.transactionHistory) {
            order.transactionHistory = [];
        }
        
        order.transactionHistory.push({
            type: 'payment',
            transactionId: transactionId,
            amount: webhookObj.amount_cents,
            status: 'failed',
            processedAt: new Date(),
            responseCode: txn_response_code,
            failureReason: txn_response_code
        });
        
        console.log(`❌ Payment failed for order: ${order.orderId}, Response: ${txn_response_code}`);
    }
}


async function handleRefund(order, webhookObj) {
    const { success, id: transactionId, refunded_amount_cents, parent_transaction } = webhookObj;
    
    console.log(`Processing full refund for order: ${order.orderId}`);
    
    if (success === true || success === "true") {
        // Refund successful
        const previousStatus = order.paymentStatus;
        order.paymentStatus = 'refunded';
        order.status = 'refunded';
        order.refundedAt = new Date();
        order.refundAmount = refunded_amount_cents/100;
        
        // إرجاع المخزون (لو الطلب كان مكتمل)
        if (previousStatus === 'completed') {
            for (const product of order.products) {
                await productModel.updateOne(
                    { productId: product.productId },
                    { 
                        $inc: { 
                            soldItems: -product.quantity,        // إرجاع من المبيعات
                            stock: product.quantity     // إضافة للمخزون المتاح
                        } 
                    }
                );
            }
            console.log('✅ Inventory restored for refunded order');
        }
        
        // add refund transaction
        if (!order.transactionHistory) {
            order.transactionHistory = [];
        }
        
        order.transactionHistory.push({
            type: 'refund',
            transactionId: transactionId,
            parentTransactionId: parent_transaction,
            amount: refunded_amount_cents,
            status: 'completed',
            processedAt: new Date()
        });
        
        await sendRefundNotification(order, refunded_amount_cents);
        console.log(`✅ Full refund processed for order: ${order.orderId}, Amount: ${refunded_amount_cents/100} EGP`);
        
    } else {
        // Refund failed
        console.log(`❌ Refund failed for order: ${order.orderId}`);
        
        if (!order.transactionHistory) {
            order.transactionHistory = [];
        }
        
        order.transactionHistory.push({
            type: 'refund',
            transactionId: transactionId,
            parentTransactionId: parent_transaction,
            amount: refunded_amount_cents,
            status: 'failed',
            processedAt: new Date()
        });
    }
}


async function handlePartialRefund(order, webhookObj) {
    const { success, id: transactionId, refunded_amount_cents, parent_transaction, amount_cents } = webhookObj;
    
    console.log(`Processing partial refund for order: ${order.orderId}`);
    
    if (success === true || success === "true") {
        // Partial refund successful
        order.status = 'partially_refunded';
        order.paymentStatus = 'partially_refunded';
        order.lastRefundAt = new Date();
        
        // حساب إجمالي المبلغ المسترد
        const totalRefunded = (order.refundAmount || 0) + refunded_amount_cents/100;
        order.refundAmount = totalRefunded;
        
        // تحقق لو الـ refund بقى كامل
        if (totalRefunded >= order.subtotal) {
            order.paymentStatus = 'refunded';
            order.status = 'refunded';
        }
        
        // حساب نسبة الـ refund للمخزون
        const refundPercentage = refunded_amount_cents / amount_cents;
        
        // إرجاع جزئي للمخزون
        for (const product of order.products) {
            const quantityToRestore = Math.floor(product.quantity * refundPercentage);
            if (quantityToRestore > 0) {
                await productModel.updateOne(
                    { productId: product.productId },
                    { 
                        $inc: { 
                            soldItems: -quantityToRestore,
                            stock: quantityToRestore
                        } 
                    }
                );
            }
        }
        
        // إضافة partial refund transaction
        if (!order.transactionHistory) {
            order.transactionHistory = [];
        }
        
        order.transactionHistory.push({
            type: 'partial_refund',
            transactionId: transactionId,
            parentTransactionId: parent_transaction,
            amount: refunded_amount_cents,
            status: 'completed',
            processedAt: new Date(),
            refundPercentage: refundPercentage
        });
        
        await sendPartialRefundNotification(order, refunded_amount_cents);
        console.log(`✅ Partial refund processed for order: ${order.orderId}, Amount: ${refunded_amount_cents/100} EGP`);
        
    } else {
        console.log(`❌ Partial refund failed for order: ${order.orderId}`);
    }
}

async function handleVoid(order, webhookObj) {
    const { success, id: transactionId } = webhookObj;
    
    console.log(`Processing void/cancel for order: ${order.orderId}`);
    
    if (success === true || success === "true") {
        // Void successful
        const previousStatus = order.paymentStatus;
        order.paymentStatus = 'cancelled';
        order.status = 'cancelled';
        order.voidedAt = new Date();
        
        // إرجاع المخزون المحجوز
        if (previousStatus === 'processing' || previousStatus === 'pending') {
            await releaseInventoryReservation(order.products);
            console.log('✅ Reserved inventory released for voided order');
        }
        
        // لو الطلب كان مكتمل، ارجع المخزون
        if (previousStatus === 'completed') {
            for (const product of order.products) {
                await productModel.updateOne(
                    { productId: product.productId },
                    { 
                        $inc: { 
                            soldItems: -product.quantity,
                            stock: product.quantity
                        } 
                    }
                );
            }
            console.log('✅ Inventory restored for voided completed order');
        }
        
        // إضافة void transaction
        if (!order.transactionHistory) {
            order.transactionHistory = [];
        }
        
        order.transactionHistory.push({
            type: 'void',
            transactionId: transactionId,
            amount: webhookObj.amount_cents,
            status: 'completed',
            processedAt: new Date()
        });
        
        await sendVoidNotification(order);
        console.log(`✅ Void processed for order: ${order.orderId}`);
        
    } else {
        console.log(`❌ Void failed for order: ${order.orderId}`);
    }
}


async function sendRefundNotification(order, refundAmount) {
    try {
        // إرسال إيميل للعميل
        await sendEmail({
            to: order.customerEmail,
            subject: `استرداد مبلغ الطلب ${order.orderId}`,
            template: 'refund_notification',
            data: {
                orderId: order.orderId,
                refundAmount: refundAmount / 100,
                customerName: order.customerName
            }
        });
        
        console.log(`Refund notification sent for order: ${order.orderId}`);
    } catch (error) {
        console.error('Failed to send refund notification:', error);
    }
}

async function sendPartialRefundNotification(order, refundAmount) {
    try {
        await sendEmail({
            to: order.customerEmail,
            subject: `استرداد جزئي للطلب ${order.orderId}`,
            template: 'partial_refund_notification',
            data: {
                orderId: order.orderId,
                refundAmount: refundAmount / 100,
                totalRefunded: (order.totalRefundedAmount || 0) / 100,
                customerName: order.customerName
            }
        });
        
        console.log(`Partial refund notification sent for order: ${order.orderId}`);
    } catch (error) {
        console.error('Failed to send partial refund notification:', error);
    }
}

async function sendVoidNotification(order) {
    try {
        await sendEmail({
            to: order.customerEmail,
            subject: `إلغاء الطلب ${order.orderId}`,
            template: 'void_notification',
            data: {
                orderId: order.orderId,
                customerName: order.customerName,
                cancelledAt: order.voidedAt
            }
        });
        
        console.log(`Void notification sent for order: ${order.orderId}`);
    } catch (error) {
        console.error('Failed to send void notification:', error);
    }
}

module.exports = {
    determineOperationType,
    handlePayment,
    handleRefund,
    handlePartialRefund,
    handleVoid
}