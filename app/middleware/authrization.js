const { RESPONSE_FORBIDDEN } = require("../utils/constants.js");
const { sendResponse } = require("../utils/util.service.js");

const roles = {
    Admin: "admin",
    User: 'user',
    Shop: 'shop'
}

const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (req.user && allowedRoles.includes(req.user.role)) {
            return next(); 
        }
        return sendResponse(res,RESPONSE_FORBIDDEN,"Forbidden: You do not have the necessary role","",[])
    };
};

module.exports = {
    roleMiddleware,
    roles
}