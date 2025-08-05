const productModel = require('../db/models/product.schema');

const reserveInventory = async (items) => {
    try {
        for (const item of items) {
            const product = await productModel.findOne({ productId: item.productId });
            if (!product || product.stock < item.quantity) {
                return {
                    success: false,
                    message: `Insufficient stock for ${item.productName}`
                };
            }
            await productModel.updateOne(
                { productId: item.productId },
                { 
                    $inc: { 
                        stock: -item.quantity,
                        reservedStock: item.quantity 
                    }
                }
            );
        }
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const releaseInventoryReservation = async (items) => {
    try {
        for (const item of items) {
            await productModel.updateOne(
                { productId: item.productId },
                { 
                    $inc: { 
                        stock: item.quantity,
                        reservedStock: -item.quantity 
                    }
                }
            );
        }
    } catch (error) {
        console.error('Failed to release inventory reservation:', error);
    }
};

const sendOrderConfirmation = async (order) => {
    // Send SMS, email, push notification, etc.
    console.log(`Order confirmed: ${order.orderId}`);
    // Integration with SMS providers popular in Egypt like Vodafone, Orange, etc.
};


module.exports = {
    reserveInventory,
    releaseInventoryReservation,
    sendOrderConfirmation
}