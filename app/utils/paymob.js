const CONFIG = require('../../config/config');
const axios = require('axios')

const PAYMOB_CONFIG = {
    API_KEY: CONFIG.PAYMOB_API_KEY,
    BASE_URL: CONFIG.PAYMOB_BASE_URL,
    INTEGRATION_IDS: {
        card: CONFIG.PAYMOB_CARD_INTEGRATION_ID,
        wallet: CONFIG.PAYMOB_WALLET_INTEGRATION_ID,
        vodafone_cash: CONFIG.PAYMOB_VODAFONE_INTEGRATION_ID,
        orange_cash: CONFIG.PAYMOB_ORANGE_INTEGRATION_ID,
        etisalat_cash: CONFIG.PAYMOB_ETISALAT_INTEGRATION_ID,
        bank_installment: CONFIG.PAYMOB_INSTALLMENT_INTEGRATION_ID
    },
    HMAC_SECRET: CONFIG.PAYMOB_HMAC_SECRET
};



const createPaymobPayment = async (order, user, phoneNumber) => {
    try {
        // Step 1: Get authentication token
        const authToken = await getPaymobAuthToken();
        if (!authToken) {
            return { success: false, error: "Failed to authenticate with Paymob" };
        }

        // Step 2: Create order in Paymob
        const paymobOrder = await createPaymobOrder(authToken, order);
        if (!paymobOrder.success) {
            return { success: false, error: "Failed to create Paymob order" };
        }

        // Step 3: Get payment token
        const paymentToken = await getPaymobPaymentToken(authToken, order, paymobOrder.orderId, user, phoneNumber);
        if (!paymentToken.success) {
            return { success: false, error: "Failed to get payment token" };
        }

        // Step 4: Generate payment URL based on payment method
        const paymentUrl = generatePaymentUrl(order.paymentMethod, paymentToken.token);

        return {
            success: true,
            orderId: paymobOrder.orderId,
            token: paymentToken.token,
            paymentUrl
        };

    } catch (error) {
        console.error('Paymob payment creation error:', error);
        return { success: false, error: error.message };
    }
};

const getPaymobAuthToken = async () => {
    try {
        const response = await axios.post(`${PAYMOB_CONFIG.BASE_URL}/auth/tokens`, {
            api_key: PAYMOB_CONFIG.API_KEY
        });
        return response.data.token;
    } catch (error) {
        console.error('Paymob auth error:', error);
        return null;
    }
};

const createPaymobOrder = async (authToken, order) => {
    try {
        const orderData = {
            auth_token: authToken,
            delivery_needed: "true",
            amount_cents: Math.round(order.totalAmount * 100), // Convert to cents
            currency: "EGP",
            items: order.products.map(product => ({
                name: product.name,
                amount_cents: Math.round(product.totalPrice * 100),
                description: `${product.name} x${product.quantity}`,
                quantity: product.quantity
            }))
        };

        const response = await axios.post(`${PAYMOB_CONFIG.BASE_URL}/ecommerce/orders`, orderData);
        
        return {
            success: true,
            orderId: response.data.id
        };
    } catch (error) {
        console.error('Paymob order creation error:', error);
        return { success: false, error: error.message };
    }
};

const getPaymobPaymentToken = async (authToken, order, paymobOrderId, user, phoneNumber) => {
    try {
        const integrationId = PAYMOB_CONFIG.INTEGRATION_IDS[order.paymentMethod];
        if (!integrationId) {
            throw new Error(`Integration ID not found for payment method: ${order.paymentMethod}`);
        }

        const tokenData = {
            auth_token: authToken,
            amount_cents: Math.round(order.totalAmount * 100),
            expiration: 3600, // 1 hour
            order_id: paymobOrderId,
            billing_data: {
                apartment: "NA",
                email: user.email || `${user.userId}@example.com`,
                floor: "NA",
                first_name: user.fName || "Customer",
                street: order.deliveryAddress?.street || "NA",
                building: "NA",
                phone_number: phoneNumber || user.phone || "+201000000000",
                shipping_method: "PKG",
                postal_code: order.deliveryAddress.postalCode || user.adress.postalCode || "NA",
                city: order.deliveryAddress?.city || user.adress.city,
                country: "EG",
                last_name: user.lName || "Customer",
                state: order.deliveryAddress?.state || user.adress.state
            },
            currency: "EGP",
            integration_id: integrationId,
            lock_order_when_paid: "false"
        };

        const response = await axios.post(`${PAYMOB_CONFIG.BASE_URL}/acceptance/payment_keys`, tokenData);
        
        return {
            success: true,
            token: response.data.token
        };
    } catch (error) {
        console.error('Paymob payment token error:', error);
        return { success: false, error: error.message };
    }
};

const generatePaymentUrl = (paymentMethod, token) => {
    const baseUrls = {
        card: `https://accept.paymob.com/api/acceptance/iframes/${CONFIG.PAYMOB_IFRAME_ID}?payment_token=${token}`,
        //wallet: `https://accept.paymob.com/api/acceptance/iframes/${CONFIG.PAYMOB_WALLET_IFRAME_ID}?payment_token=${token}`,
        //vodafone_cash: `https://accept.paymob.com/api/acceptance/payments/pay`,
        //orange_cash: `https://accept.paymob.com/api/acceptance/payments/pay`,
        //etisalat_cash: `https://accept.paymob.com/api/acceptance/payments/pay`,
        //bank_installment: `https://accept.paymob.com/api/acceptance/iframes/${CONFIG.PAYMOB_INSTALLMENT_IFRAME_ID}?payment_token=${token}`
    };

    return baseUrls[paymentMethod] || baseUrls.card;
};

//-------------------------------------------------
async function getTransactionById(transactionId) {
    try {
        // Authentication Request -- step 1 in the docs
        const authToken = await getPaymobAuthToken();
        const url = `${PAYMOB_CONFIG.BASE_URL}/acceptance/transactions/${transactionId}`;
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };

        const response = await axios.get(url, { headers });

        return response.data;
    } catch (error) {
        console.error("Error fetching transaction:", error.response.data);
    }
}


async function refundTransaction(transactionId, refundAmount) {
    try {
        // Authentication Request -- step 1 in the docs
        const authToken = await getPaymobAuthToken();
        const url = `${PAYMOB_CONFIG.BASE_URL}/acceptance/void_refund/refund`;
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };
        const data = {
            auth_token: PAYMOB_CONFIG.API_KEY,
            transaction_id: transactionId,
            amount_cents: refundAmount,
        };
        const response = await axios.post(url, data, { headers });
        // console.log('Refund transaction successful.');
        // console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.error("Error refunding transaction:", error.response.data);
    }
}

async function voidTransaction(transactionId) {
    try {
        const authToken = await getPaymobAuthToken();
        
        // Correct API endpoint - remove API key from URL since we're using Bearer token
        const url = `${PAYMOB_CONFIG.BASE_URL}/acceptance/void_refund/void`;
        
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };
        
        const data = {
            transaction_id: transactionId,
        };

        console.log("Voiding transaction:", transactionId);
        
        const response = await axios.post(url, data, { headers });
        
        // Return structured response
        return {
            success: true,
            data: response.data,
            message: "Transaction voided successfully"
        };
    } catch (error) {
        console.error("Error voiding transaction:", error);
        let errorMessage = "Failed to void transaction";
        let errorDetails = {};
        
        if (error.response) {
            // Server responded with error status
            errorMessage = error.response.data?.message || `HTTP ${error.response.status}: ${error.response.statusText}`;
            errorDetails = error.response.data;
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        } else if (error.request) {
            // Request was made but no response received
            errorMessage = "No response from payment gateway";
        }
        
        return {
            success: false,
            message: errorMessage,
            error: errorDetails
        };
    }
}

//------------------------------------------


const verifyPaymobWebhook = (hmac ,webhookObj) => {
    try {
        const crypto = require('crypto');
        
        if (!webhookObj) {
            console.log('Missing webhook data');
            return false;
        }
        // Create HMAC string according to Paymob documentation
        const hmacString = [
            webhookObj.amount_cents || '',                    // 100000
            webhookObj.created_at || '',                      // "2024-06-13T11:33:44.592345"
            webhookObj.currency || '',                        // "EGP"
            webhookObj.error_occured || false,                // false
            webhookObj.has_parent_transaction || false,       // false
            webhookObj.id || '',                              // 192036465
            webhookObj.integration_id || '',                  // 4097558
            webhookObj.is_3d_secure || false,                 // true
            webhookObj.is_auth || false,                      // false
            webhookObj.is_capture || false,                   // false
            webhookObj.is_refunded || false,                  // false
            webhookObj.is_standalone_payment || false,        // true
            webhookObj.is_voided || false,                    // false
            webhookObj.order?.id || '',                       // 217503754
            webhookObj.owner || '',                           // 302852
            webhookObj.pending || false,                      // false
            webhookObj.source_data?.pan || '',                // "2346"
            webhookObj.source_data?.sub_type || '',           // "MasterCard"
            webhookObj.source_data?.type || '',               // "card"
            webhookObj.success || false                       // true
        ].join('');

        const calculatedHmac = crypto
            .createHmac('sha512', PAYMOB_CONFIG.HMAC_SECRET)
            .update(hmacString)
            .digest('hex');

        return calculatedHmac === hmac;
    } catch (error) {
        console.error('HMAC verification error:', error);
        return false;
    }
};


module.exports = {
    createPaymobPayment,
    getTransactionById,
    refundTransaction,
    voidTransaction,
    verifyPaymobWebhook
}