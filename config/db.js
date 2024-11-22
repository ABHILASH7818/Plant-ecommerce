const mongoose = require("mongoose");
const env = require("dotenv").config();


const connectDB =//mongodb connect
mongoose.connect(process.env.DB_URL)
.then(()=>console.log("mongodb connected"))
.catch((error)=>console.log("failed to connect",error))


module.exports = connectDB