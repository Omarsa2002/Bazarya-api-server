const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const CONFIG = require('../../config/config.js');
const { to } = require('./util.service');
const LOG = require('../../config/logger.js');
const userModel = require('../db/models/user.schema.js');
const shopModel = require('../db/models/shop.schema.js');



const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies.jwtToken;
    }
    return token;
};

// User Strategy
passport.use('user-jwt', new JwtStrategy({
    jwtFromRequest: cookieExtractor,
    secretOrKey: CONFIG.JWT_ENCRYPTION
}, async (payload, done) => {
    try {
        const { role, userId } = payload;
        if (role !== 'user') {
            return done(null, false, { message: 'Invalid role for user access.' });
        }
        const [err, user] = await to(userModel.findOne({ userId: userId }));
        if (err) return done(err, false);
        if (!user) return done(null, false, { message: 'User not found.' });
        if (user.role !== 'user') return done(null, false, { message: 'Role mismatch.' });
        LOG.info(`Logged user: ${user.email}`);
        return done(null, { userId: user.userId, role: user.role });
    } catch (error) {
        LOG.error('Error in User JWT Strategy:', error);
        return done(error, false);
    }
}));

// Admin Strategy
passport.use('admin-jwt', new JwtStrategy({
    jwtFromRequest: cookieExtractor,
    secretOrKey: CONFIG.JWT_ENCRYPTION
}, async (payload, done) => {
    try {
        const { role, userId } = payload;
        if (role !== 'admin') {
            return done(null, false, { message: 'Invalid role for admin access.' });
        }
        const [err, admin] = await to(userModel.findOne({ userId: userId }));
        if (err) return done(err, false);
        if (!admin) return done(null, false, { message: 'Admin not found.' });
        if (admin.role !== 'admin') return done(null, false, { message: 'Role mismatch.' });
        LOG.info(`Logged admin: ${admin.email}`);
        return done(null, { adminId: admin.userId, role: admin.role });
    } catch (error) {
        LOG.error('Error in Admin JWT Strategy:', error);
        return done(error, false);
    }
}));

// Shop Strategy
passport.use('shop-jwt', new JwtStrategy({
    jwtFromRequest: cookieExtractor,
    secretOrKey: CONFIG.JWT_ENCRYPTION
}, async (payload, done) => {
    try {
        const { role, shopId } = payload;
        if (role !== 'shop') {
            return done(null, false, { message: 'Invalid role for shop access.' });
        }
        const [err, shop] = await to(shopModel.findOne({ shopId: shopId }));
        if (err) return done(err, false);
        if (!shop) return done(null, false, { message: 'Shop not found.' });
        if (shop.role !== 'shop') return done(null, false, { message: 'Role mismatch.' });
        LOG.info(`Logged shop: ${shop.email}`);
        return done(null, { shopId: shop.shopId, role: shop.role });
    } catch (error) {
        LOG.error('Error in User JWT Strategy:', error);
        return done(error, false);
    }
}));

module.exports = passport;