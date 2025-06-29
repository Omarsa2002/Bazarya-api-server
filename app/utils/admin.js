const { v4: uuidv4 } = require("uuid");
var bcrypt = require('bcryptjs');
const CONFIG = require("../../config/config.js");
const userModel = require("../db/models/user.schema.js");



const admin={
    userId:"admin"+uuidv4(),
    userName:"Abdullah Ahmed",
    email:`abdullahahmed02000${uuidv4()}@gmail.com`,
    phone:"01090524452",
    password:"abdullah@123",
    role:"admin",
    activateEmail:true,
    gender:"male"
}



const addAdmin=async(req,res,next)=>{
    try {
        const newAdmin=new userModel(admin);
        await newAdmin.save();
        console.log("admin added");
        
    } catch (error) {
        console.log(error);
        
    }
}

module.exports={
    addAdmin
}




