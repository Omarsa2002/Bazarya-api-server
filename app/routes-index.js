module.exports = {
    v1routes: function (app) {
        app.use('/api/v1/auth', require('./auth/auth.route'));
        app.use('/api/v1/admin', require('./admin/admin.route'));
        app.use('/api/v1/shop', require('./shop/shop.route'));
        app.use('/api/v1/category', require('./category/category.route'));
        app.use('/api/v1/sub-category', require('./subCategory/sub.category.route'));
    }
};