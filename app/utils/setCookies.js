const CONFIG = require('../../config/config')

const setTokenWithCookies = (req, res, token)=>{
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const options = {
        httpOnly: true,    // Prevents JavaScript access
        secure: (CONFIG.ENV === 'production' && protocol === 'https'), // Use HTTPS in production
        sameSite: (CONFIG.ENV === 'production' && protocol === 'https')?'none':"strict", // Prevents CSRF attacks
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    }
    return res.cookie("jwtToken", token, options);
}

module.exports = {
    setTokenWithCookies
}