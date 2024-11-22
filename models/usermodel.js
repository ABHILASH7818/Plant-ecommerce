const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },    
    email: { type: String, required: true },
    password: { type: String, required: false },
    phone: {type:String, required:false},
    googleId:{type: String,unique:true,},
    isAdmin: {type:Boolean,default:false},
    // role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isblock:{ type:Boolean,default:false},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
    cart :[{type:mongoose.Schema.Types.ObjectId,ref:'cart'}],
    whshlist:[{type:mongoose.Schema.Types.ObjectId,ref:'wishlist'}],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],  
     wallet:{type:Number,default:0},
    referalcode:{type:String},
    redeemed:{type:Boolean},
});

module.exports =mongoose.model("User",userSchema);