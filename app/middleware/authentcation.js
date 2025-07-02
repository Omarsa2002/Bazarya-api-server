const passport = require('passport');

const requireUser = passport.authenticate('user-jwt', { session: false });
const requireAdmin = passport.authenticate('admin-jwt', { session: false });
const requireShop = passport.authenticate('shop-jwt', { session: false });


const { sendResponse } = require('../utils/util.service');
const constants = require('../utils/constants')

const requireUserOrAdmin = (req, res, next) => {
    passport.authenticate('user-jwt', { session: false }, (err, user) => {
        if (user) {
            req.user = user;
            return next();
        }
        passport.authenticate('admin-jwt', { session: false }, (err, admin) => {
                if (admin) {
                req.user = admin;
                return next();
            }
            return sendResponse(res, constants.RESPONSE_UNAUTHORIZED, "Authentication required", {}, []);
        })(req, res, next);
    })(req, res, next);
};

const requireAdminOrShop = (req, res, next) => {
    passport.authenticate('admin-jwt', { session: false }, (err, admin) => {
        if (admin) {
            req.user = admin;
            return next();
        }
        passport.authenticate('shop-jwt', { session: false }, (err, shop) => {
            if (shop) {
                req.user = shop;
                return next();
            }
            return sendResponse(res, constants.RESPONSE_UNAUTHORIZED, "Authentication required", {}, []);
        })(req, res, next);
    })(req, res, next);
};

const requireAny = (req, res, next) => {
    passport.authenticate('user-jwt', { session: false }, (err, user) => {
        if (user) {
            req.user = user;
            return next();
        }
        passport.authenticate('admin-jwt', { session: false }, (err, admin) => {
            if (admin) {
                req.user = admin;
                return next();
            }
            passport.authenticate('shop-jwt', {session: false}, (err, shop)=>{
                if (shop) {
                    req.user = shop;
                    return next();
                }
                return sendResponse(res, constants.RESPONSE_UNAUTHORIZED, "Authentication required", {}, []);
            })(req, res, next)
        })(req, res, next);
    })(req, res, next);
};
module.exports = {
    requireUser,
    requireAdmin,
    requireShop,
    requireUserOrAdmin,
    requireAdminOrShop,
    requireAny
};