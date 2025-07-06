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
    selfieWithId: ImageSchema,
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
    reasonIfRejected:String,
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
    verificationCode:String,
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


shopSchema.methods.addOwnerNationalIdImage = function(result) {
    if (!result || !result.fileId || !result.url || !result.name) {
        throw new Error('Invalid result object for owner national ID image');
    }
    if (!this.ownerNationalIdImage) {
        this.ownerNationalIdImage = {};
    }
    this.ownerNationalIdImage.pdfId = result.fileId;
    this.ownerNationalIdImage.pdfURL = result.url;
    this.ownerNationalIdImage.pdfName = result.name;
    return this;
};

shopSchema.methods.addBusinessLicenseImage = function(result) {
    if (!result || !result.fileId || !result.url || !result.name) {
        throw new Error('Invalid result object for owner national ID image');
    }
    if (!this.businessLicenseImage) {
        this.businessLicenseImage = {};
    }
    this.businessLicenseImage.pdfId = result.fileId;
    this.businessLicenseImage.pdfURL = result.url;
    this.businessLicenseImage.pdfName = result.name;
    return this;
};

shopSchema.methods.addSelfieWithId = function(result) {
    if (!result || !result.fileId || !result.url || !result.name) {
        throw new Error('Invalid result object for selfie with ID');
    }
    if (!this.selfieWithId) {
        this.selfieWithId = {};
    }
    this.selfieWithId.imageId = result.fileId;
    this.selfieWithId.imageURL = result.url;
    this.selfieWithId.imageName = result.name;
    return this;
};

shopSchema.methods.addProfileImage = function(result) {
    if (!result || !result.fileId || !result.url || !result.name) {
        throw new Error('Invalid result object for profile image');
    }
    if (!this.profileImage) {
        this.profileImage = {};
    }
    this.profileImage.imageId = result.fileId;
    this.profileImage.imageURL = result.url;
    this.profileImage.imageName = result.name;
    
    return this;
};


const shopModel = mongoose.model('Shop', shopSchema);

module.exports = shopModel;