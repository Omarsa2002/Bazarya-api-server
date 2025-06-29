const { ExtractJwt, Strategy } = require('passport-jwt');
const CONFIG = require('../../config/config.js');
const { to } = require('./util.service');
const LOG = require('../../config/logger.js');
const userModel = require('../db/models/user.schema.js');

// const passportAuth = (passport) => {
//     const opts = {
//         secretOrKey: CONFIG.jwt_encryption,
//         jwtFromRequest: ExtractJwt.fromExtractors([
//             ExtractJwt.fromAuthHeaderAsBearerToken(), // Mobile
//             (req) => req?.cookies?.jwtToken, // Web
//         ]),
//     };
//     passport.use(
//         'appAuth',
//         new Strategy(opts, async (jwt_payload, done) => {
//             try {
//                 const { role, userId } = jwt_payload;
//                 const Model = role === 'company' ? companyModel : userModel;

//                 const user = await Model.findOne({ userId });
//                 if (!user) {
//                     return done(null, false, { message: 'User not found.' });
//                 }

//                 return done(null, { userId: user.userId, role: role });
//             } catch (error) {
//                 return done(error, false);
//             }
//         })
//     );
// };




const passportAuth = (passport) => {
    const opts = {};
    opts.secretOrKey = CONFIG.jwt_encryption;
    opts.jwtFromRequest = ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Mobile
        (req) => req?.cookies?.jwtToken, // Web
    ]);
    passport.use(
        "appAuth",
        new Strategy(opts, async (jwt_payload, done) => {
            try {
                // Determine the user type from the payload
                const { role } = jwt_payload;
                const [err, user] = await to(userModel.findOne({ userId: jwt_payload.userId }))
                // if (role === 'user') {
                //     [err, user] = await to(userModel.findOne({ userId: jwt_payload.userId }));
                // } else if (role === 'company') {
                //     [err, user] = await to(companyModel.findOne({ companyId: jwt_payload.userId }));
                // } else {
                //     return done(null, false, { message: 'Invalid user type in token.' });
                // }
                if (err) return done(err, false);
                if (!user) return done(null, false, { message: 'User not found.' });
                LOG.info(`Logged ${role}: ${user.email}`);
                return done(null, { userId: user.userId, role: role });
            } catch (error) {
                LOG.error('Error in JWT Strategy:', error);
                return done(error, false);
            }
        })
    );
};
module.exports = {
    passportAuth,
};
// const passportAuthCookies = (passport) => {
//     const opts = {};
//     opts.secretOrKey = CONFIG.jwt_encryption;
//     opts.jwtFromRequest = ExtractJwt.fromExtractors([
//         // ExtractJwt.fromAuthHeaderAsBearerToken(), // Mobile
//         (req) => req?.cookies?.jwtToken, // Web
//     ]);
//     passport.use(
//         "appAuthCookies",
//         new Strategy(opts, async (jwt_payload, done) => {
//             try {
//                 // Determine the user type from the payload
//                 const { role } = jwt_payload;
//                 const [err, user] = (role==='user')? await to(userModel.findOne({ userId: jwt_payload.userId })):
//                                                 await to(companyModel.findOne({ companyId: jwt_payload.userId }))
//                 // if (role === 'user') {
//                 //     [err, user] = await to(userModel.findOne({ userId: jwt_payload.userId }));
//                 // } else if (role === 'company') {
//                 //     [err, user] = await to(companyModel.findOne({ companyId: jwt_payload.userId }));
//                 // } else {
//                 //     return done(null, false, { message: 'Invalid user type in token.' });
//                 // }
//                 if (err) return done(err, false);
//                 if (!user) return done(null, false, { message: 'User not found.' });
//                 LOG.info(`Logged ${role}: ${user.email}`);
//                 return done(null, { userId: user.userId || user.companyId, role: role });
//             } catch (error) {
//                 LOG.error('Error in JWT Strategy:', error);
//                 return done(error, false);
//             }
//         })
//     );
// };
// module.exports = {
//     passportAuth,
// };

// const { ExtractJwt, Strategy } = require('passport-jwt');
// const CONFIG        = require('../../config/config');
// const {to}          = require('./util.service');
// const LOG = require('../../config/logger');
// const userModel = require('../db/models/user.schema.js');





// const passportAuth=(passport)=>{
//     var opts = {};
//     opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
//     opts.secretOrKey = CONFIG.jwt_encryption;    
//     passport.use("appAuth",new Strategy(opts, async function(jwt_payload, done){        
//         let err, user;
//         [err, user] = await to(userModel.findOne({userId: jwt_payload.userId}));
//         //validTokenSchema.findOne({userId: jwt_payload.user_id, token: fromAuthHeaderAsBearerToken()});
//         if(err) return done(err, false);
//         if(user) {
//             LOG.info("logged user :" + user.loginId);
//             return done(null, {userId:user.userId,role:user.role});
//         } else {
//             return done(null, false);
//         }
//     }));
// }

// module.exports={
//     passportAuth
// }




// module.exports = function(passport) {
//     var opts = {};
//     opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
//     opts.secretOrKey = CONFIG.jwt_encryption;    
//     passport.use("appAuth",new Strategy(opts, async function(jwt_payload, done){        
//         let err, user;
//         [err, user] = await to(userModel.findOne({userId: jwt_payload.userId}));
//         //validTokenSchema.findOne({userId: jwt_payload.user_id, token: fromAuthHeaderAsBearerToken()});
//         if(err) return done(err, false);
//         if(user) {
//             LOG.info("logged user :" + user.loginId);
//             return done(null, user);
//         } else {
//             return done(null, false);
//         }
//     }));
// }