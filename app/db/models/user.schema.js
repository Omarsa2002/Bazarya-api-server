const  mongoose  = require("mongoose");
const { AddressSchema, ImageSchema } = require("../../utils/utils.schema.js");
const bcrypt = require('bcrypt');
const CONFIG = require("../../../config/config.js");
const addPrefixedIdPlugin = require("../db.helper.js");

const userSchema=new mongoose.Schema({
    userId:String,
    userName:String,
    encryptedPassword:String,
    phone: String,
    profileImage: ImageSchema,
    email:{
        type:String,
        required:true,
        unique:true
    },
    activateEmail: {
        type: Boolean,
        default: false,
    },
    verificationCode:Number,
    verificationCodeDate:Date,
    recoveryCode: String,
    recoveryCodeDate: Date,
    gender:{
        type: String,
        enum: ['male', 'female', "none"],
        defult:"none"
    },
    role:{
        type:String,
        enum: ['user', 'admin', 'vendor'],
        default:"user"
    },
    address: AddressSchema,
    accountType:{
        type: String,
        enum : ['system', 'google'],
        defult: "system"
    }
},{
    timestamps: true
})

userSchema.plugin(addPrefixedIdPlugin, { prefix: 'User', field: 'userId' }); 

//this function to add virtual field to schema 
userSchema.virtual('password')
    .set(function(password) {
    this._password = password; 
})
.get(function() {
    return this._password;
});

userSchema.pre('save', async function (next) {
    if (this.password) {         
        this.encryptedPassword =  bcrypt.hashSync(this.password, parseInt(CONFIG.BCRYPT_SALT));  
    }
    next();
});

// Password comparison method
userSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.encryptedPassword);
};

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;