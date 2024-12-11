const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },    
    email: { type: String, required: true },
    password: { type: String, required: false },
    phone: {type:Number, required:false},
    googleId:{type: String,unique:true,},
    isAdmin: {type:Boolean,default:false},
    isblock:{ type:Boolean,default:false},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
    cart :[{type:mongoose.Schema.Types.ObjectId,ref:'cart'}],
    wishlist:[{type:mongoose.Schema.Types.ObjectId,ref:'Wishlist'}],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],  
     wallet:{type:Number,default:0},
    referalcode:{type:String},
    redeemed:{type:Boolean},
});

module.exports =mongoose.model("User",userSchema);