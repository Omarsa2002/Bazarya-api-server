const jwt = require('jsonwebtoken');
const CONFIG = require('../../config/config');

module.exports = async (payload, expir , expirType = 'h')=>{
    const token = jwt.sign(
        payload,
        CONFIG.JWT_ENCRYPTION,
        {expiresIn: `${expir}${expirType}`})
    return token;
}