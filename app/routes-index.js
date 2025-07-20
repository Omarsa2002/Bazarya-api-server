module.exports = {
    v1routes: function (app) {
        app.use('/api/v1/auth', require('./auth/auth.route'));
        app.use('/api/v1/admin', require('./admin/admin.route'));
        app.use('/api/v1/shop', require('./shop/shop.route'));
        app.use('/api/v1/category', require('./category/category.route'));
        app.use('/api/v1/sub-category', require('./subCategory/sub.category.route'));
        app.use('/api/v1/brand', require('./brand/brand.route'));
        app.use('/api/v1/product', require('./product/product.route'));
        app.use('/api/v1/cart', require('./cart/cart.route'));
        //app.use('/api/v1/order', require('./order/order.route'));
        //app.use('/api/v1/review', require('./review/review.route'));
    }
};