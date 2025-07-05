const { v4: uuidv4 } = require("uuid");

const userModel = require("../db/models/user.schema.js");



const admin={
    userId:"Admin"+uuidv4(),
    userName:"Abdullah Ahmed",
    email:`omersa2002${uuidv4()}@gmail.com`,
    phone:"01090524452",
    password:"Omar@123",
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




