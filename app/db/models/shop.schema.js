const  mongoose = require("mongoose");
const { AddressSchema, ImageSchema, pdfSchema } = require("../../utils/utils.schema.js");
const bcrypt = require('bcrypt');
const CONFIG = require("../../../config/config.js");
const addPrefixedIdPlugin = require("../db.helper.js");

const shopSchema=new mongoose.Schema({
    shopId:String,
    shopName:String,
    ownerFullName:String,
    encryptedPassword:String,
    phone: String,
    description: String,
    categories: [ String ],
    reviews: [ String ],
    ownerNationalIdImage: pdfSchema,
    selfieWithId: pdfSchema,
    businessLicenseImage: pdfSchema,
    commercialRegNo: String,
    taxCardNo: String,
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
    checkedShop: {
        type: Boolean,
        default: false,
    },
    deliveryAvailable: {
        type: Boolean,
        default: false,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    rating: Number,
    reviewsCount: Number,
    verificationCode:Number,
    verificationCodeDate:Date,
    recoveryCode: String,
    recoveryCodeDate: Date,
    verifiedAt: Date,
    status:{
        type:String,
        enum: [ 'active', 'suspended', 'pending' ],
        default:"pending"
    },
    role:{
        type:String,
        enum: ['shop'],
        default:"shop"
    },
    address: AddressSchema,
    accountType:{
        type: String,
        enum : ['system', 'google'],
        default: "system"
    }
},{
    timestamps: true
})

shopSchema.plugin(addPrefixedIdPlugin, { prefix: 'Shop', field: 'shopId' }); 

//this function to add virtual field to schema 
shopSchema.virtual('password')
    .set(function(password) {
    this._password = password; 
})
.get(function() {
    return this._password;
});

shopSchema.pre('save', async function (next) {
    if (this.password) {         
        this.encryptedPassword =  bcrypt.hashSync(this.password, parseInt(CONFIG.BCRYPT_SALT));  
    }
    next();
});

// Password comparison method
shopSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.encryptedPassword);
};

const shopModel = mongoose.model('Shop', shopSchema);

module.exports = shopModel;