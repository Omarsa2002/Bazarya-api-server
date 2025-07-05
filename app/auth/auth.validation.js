const joi = require("joi");


const signUpShop={
    body:joi.object().required().keys({
        shopName: joi.string()
            .required()
            .min(1)
            .messages({
                'string.base': 'Shop name must be a string.',
                'string.empty': 'Shop name is required.',
                'string.min': 'Username must be at least 1 characters long.',
            }),
        email: joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email must be a valid email address.',
                'string.empty': 'Email is required.',
            }),
        password:joi.string()
            .min(8)
            .pattern(/[A-Z]/, 'at least one uppercase letter')
            .pattern(/[a-z]/, 'at least one lowercase letter')
            .pattern(/[0-9]/, 'at least one number')
            .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'at least one special character')
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long.',
                'string.pattern.name': 'Password must include {#name}.',
                'string.empty': 'Password is required.',
            }),
        ownerFullName:joi.string().required()
            .min(2)
            .max(100)
            .messages({
                'string.base': 'Owner full name must be a string.',
                'string.empty': 'Owner full name is required.',
                'string.min': 'Owner full name must be at least 2 characters long.',
                'string.max': 'Owner full name must not exceed 100 characters.',
                'any.required': 'Owner full name is required.'
            }),
        phone:joi.string().required()
            .pattern(/^[+]?[0-9\s\-()]+$/)
            .min(10)
            .max(15)
            .messages({
                'string.base': 'Phone number must be a string.',
                'string.empty': 'Phone number is required.',
                'string.pattern.base': 'Phone number must contain only numbers, spaces, dashes, parentheses, and plus sign.',
                'string.min': 'Phone number must be at least 10 characters long.',
                'string.max': 'Phone number must not exceed 15 characters.',
                'any.required': 'Phone number is required.'
            }),
        address:joi.object().required().keys({
            address: joi.string().required()
                .min(5)
                .max(200)
                .messages({
                    'string.base': 'Address must be a string.',
                    'string.empty': 'Address is required.',
                    'string.min': 'Address must be at least 5 characters long.',
                    'string.max': 'Address must not exceed 200 characters.',
                    'any.required': 'Address is required.'
                }),
            city: joi.string()
                .required()
                .min(2)
                .max(50)
                .messages({
                    'string.base': 'City must be a string.',
                    'string.empty': 'City is required.',
                    'string.min': 'City must be at least 2 characters long.',
                    'string.max': 'City must not exceed 50 characters.',
                    'any.required': 'City is required.'
                }),
            state: joi.string()
                .required()
                .min(2)
                .max(50)
                .messages({
                    'string.base': 'State must be a string.',
                    'string.empty': 'State is required.',
                    'string.min': 'State must be at least 2 characters long.',
                    'string.max': 'State must not exceed 50 characters.',
                    'any.required': 'State is required.'
                }),
            country: joi.string()
                .required()
                .min(2)
                .max(50)
                .messages({
                    'string.base': 'Country must be a string.',
                    'string.empty': 'Country is required.',
                    'string.min': 'Country must be at least 2 characters long.',
                    'string.max': 'Country must not exceed 50 characters.',
                    'any.required': 'Country is required.'
                }),
            postalCode: joi.string()
                .required()
                .min(3)
                .max(10)
                .pattern(/^[A-Za-z0-9\s\-]+$/)
                .messages({
                    'string.base': 'Postal code must be a string.',
                    'string.empty': 'Postal code is required.',
                    'string.min': 'Postal code must be at least 3 characters long.',
                    'string.max': 'Postal code must not exceed 10 characters.',
                    'string.pattern.base': 'Postal code must contain only letters, numbers, spaces, and dashes.',
                    'any.required': 'Postal code is required.'
                })
        }).messages({
            'object.base': 'Address must be an object.',
            'any.required': 'Address object is required.'
        })
    })
}

const signUpUser={
    body:joi.object().required().keys({
        fName: joi.string()
        .required()
        .min(3)
        .max(25)
        .messages({
            'string.base': 'first name must be a string.',
            'string.empty': 'first name is required.',
            'string.min': 'first name must be at least 3 characters long.',
            'string.max': 'first name must be at most 25 characters long.',
        }),
        lName: joi.string()
        .required()
        .min(3)
        .max(25)
        .messages({
            'string.base': 'last name must be a string.',
            'string.empty': 'last name is required.',
            'string.min': 'last name must be at least 3 characters long.',
            'string.max': 'last name must be at most 25 characters long.',
        }),
    email: joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email must be a valid email address.',
            'string.empty': 'Email is required.',
        }),
    password:joi.string()
        .min(8)
        .pattern(/[A-Z]/, 'at least one uppercase letter')
        .pattern(/[a-z]/, 'at least one lowercase letter')
        .pattern(/[0-9]/, 'at least one number')
        .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'at least one special character')
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long.',
            'string.pattern.name': 'Password must include {#name}.',
            'string.empty': 'Password is required.',
        }),
    })
}

const verifyEmail = {
    body:joi.object().required().keys({
        email: joi.string().email().required().messages({
            'string.email': 'Email must be a valid email address.',
            'string.empty': 'Email is required.',
        }),
        code:joi.string().max(6).min(6).pattern(/^\d+$/, 'must be just numbers').required().messages({
            'string.base': 'Code must be a string.',
            'string.max': 'Code must be 6 Numbers',
            'string.min': 'Code must be 6 Numbers.',
            'string.pattern.name': 'Code must include just numbers.',
            'string.empty': 'Code is required.',
        }),
        isUser:joi.boolean().required().messages({"boolean.empty":"User type is requir"})
    })
}

const resendCode = {
    body:joi.object().required().keys({
        email: joi.string().email().required().messages({
            'string.email': 'Email must be a valid email address.',
            'string.empty': 'Email is required.',
        }),
        codeType:joi.string().valid("activate", "updatePassword").required().messages({
            'string.base': 'Code type must be a string.',
            'any.only': 'Code type must include just one of two values (activate, updatePassword).',
            'string.empty': 'Code type is required.',
        }),
        isUser:joi.boolean().required().messages({"boolean.empty":"User type is requir"})
    })
}

const login = {
    body:joi.object().required().keys({
        email: joi.string().email().required().messages({
            'string.email': 'Email must be a valid email address.',
            'string.empty': 'Email is required.',
        }),
        password:joi.string().required().messages({
                'string.empty': 'Password is required.',
        }),
    })
}

const forgetPassword = {
    body:joi.object().required().keys({
        email: joi.string().email().required().messages({
            'string.email': 'Email must be a valid email address.',
            'string.empty': 'Email is required.',
        }),
        isUser:joi.boolean().required().messages({"boolean.empty":"User type is requir"})
    })
}

const setPassword = {
    body:joi.object().required().keys({
        email: joi.string().email().required().messages({
            'string.email': 'Email must be a valid email address.',
            'string.empty': 'Email is required.',
        }),
        code:joi.string().max(6).min(6).pattern(/^\d+$/, 'must be just numbers').required().messages({
            'string.base': 'Code must be a string.',
            'string.max': 'Code must be 6 Numbers',
            'string.min': 'Code must be 6 Numbers.',
            'string.pattern.name': 'Code must include just numbers.',
            'string.empty': 'Code is required.',
        }),
        password:joi.string().min(8)
            .pattern(/[A-Z]/, 'at least one uppercase letter')
            .pattern(/[a-z]/, 'at least one lowercase letter')
            .pattern(/[0-9]/, 'at least one number')
            .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'at least one special character')
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long.',
                'string.pattern.name': 'Password must include {#name}.',
                'string.empty': 'Password is required.',
            }),
        isUser:joi.boolean().required().messages({"boolean.empty":"User type is requir"})
    })
}

module.exports={
    signUpShop,
    signUpUser,
    verifyEmail,
    resendCode,
    login,
    forgetPassword,
    setPassword
}