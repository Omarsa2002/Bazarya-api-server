const mongoose = require("mongoose");
("use strict");
const db = {};
const dbConfig = require("./db.config.js");
const { error } = require("winston");
// mongoose.Promise = global.Promise;
mongoose.set("strictQuery", false);
db.mongoose = mongoose;
db.url = dbConfig.url;
const connectiondb = async () => {
    return await db.mongoose
        .connect(db.url,{
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        }).then(()=>{
            console.log("Connected to the database!");
        }).catch((error)=>{
            console.log("Cannot connect to the database!", error);
            process.exit();
        });
}

module.exports.connectiondb = connectiondb;