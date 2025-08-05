const orderModel = require('../db/models/order.schema');
const { verifyPaymobWebhook } = require('../utils/paymob');
const { determineOperationType, handlePayment, handleRefund, handlePartialRefund, handleVoid } = require('./paymob.helper')
const { sendResponse } = require('../utils/util.service')

const handlePaymobWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        //console.log(webhookData);
        // Verify webhook signature
        const hmac = req.query.hmac
        const webhookObj = webhookData.obj;
        
        if (!verifyPaymobWebhook(hmac, webhookObj)) {
            console.log('Invalid signature')
            return res.status(200).send('ok');
        }
        const { 
            success, 
            id: transactionId,
            is_refunded,
            is_voided,
            refunded_amount_cents,
        } = webhookObj;
        const paymobOrderId = webhookObj.order.id
        const txn_response_code = webhookObj.data?.txn_response_code || 'UNKNOWN';

        console.log('Processing transaction:', {
            transactionId,
            paymobOrderId,
            success,
            is_refunded,
            is_voided,
            refunded_amount_cents
        });

        console.log('Processing order:', paymobOrderId, 'Success:', success);
        // Find order  paympbOrderId
        const order = await orderModel.findOne({ paymobOrderId });
        if (!order) {
            console.error('Order not found for webhook:', paymobOrderId);
            return res.status(200).send('OK');
        }

        const operationType = determineOperationType(webhookObj);
        console.log('Operation type:', operationType);

        const webhookSignature = `${transactionId}-${success}-${txn_response_code}`;
        if (order.lastWebhookSignature === webhookSignature) {
            console.log('Duplicate webhook content for transaction:', transactionId);
            return res.status(200).send('OK');
        }

        // Update order with transaction details
        order.paymobTransactionId = transactionId;
        order.lastWebhookSignature = webhookSignature;
        order.paymentStatus = 'processing';

        switch (operationType) {
            case 'payment':
                await handlePayment(order, webhookObj);
                break;
                
            case 'refund':
                await handleRefund(order, webhookObj);
                break;
                
            case 'void':
                await handleVoid(order, webhookObj);
                break;
                
            case 'partial_refund':
                await handlePartialRefund(order, webhookObj);
                break;
                
            default:
                console.log('Unknown operation type, processing as payment');
                await handlePayment(order, webhookObj);
        }

        await order.save();
        res.status(200).send('OK');

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(200).send('ok');
    }
};


const getAvailablePaymentMethods = async (req, res) => {
    try {
        const paymentMethods = [
            { 
                id: 'card', 
                name: 'Credit/Debit Card', 
                name_ar: 'كارت ائتمان/خصم مباشر',
                icon: 'credit-card',
                enabled: true 
            },
            { 
                id: 'wallet', 
                name: 'Mobile Wallet', 
                name_ar: 'محفظة موبايل',
                icon: 'wallet',
                enabled: false 
            },
            { 
                id: 'vodafone_cash', 
                name: 'Vodafone Cash', 
                name_ar: 'فودافون كاش',
                icon: 'vodafone',
                enabled: false 
            },
            { 
                id: 'orange_cash', 
                name: 'Orange Cash', 
                name_ar: 'أورانج كاش',
                icon: 'orange',
                enabled: false
            },
            { 
                id: 'etisalat_cash', 
                name: 'Etisalat Cash', 
                name_ar: 'اتصالات كاش',
                icon: 'etisalat',
                enabled: false
            },
            { 
                id: 'bank_installment', 
                name: 'Bank Installments', 
                name_ar: 'تقسيط بنكي',
                icon: 'bank',
                enabled: false
            },
            { 
                id: 'cash', 
                name: 'Cash on Delivery', 
                name_ar: 'الدفع عند الاستلام',
                icon: 'cash',
                enabled: false
            }
        ];
        sendResponse(res, constants.RESPONSE_SUCCESS, "Payment methods retrieved", { 
            paymentMethods: paymentMethods.filter(method => method.enabled)
        });
    } catch (error) {
        sendResponse(res, constants.RESPONSE_INT_SERVER_ERROR, error.message, {});
    }
};


module.exports = {
    handlePaymobWebhook,
    getAvailablePaymentMethods
}