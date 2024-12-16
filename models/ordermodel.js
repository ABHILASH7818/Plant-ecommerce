const mongoose = require("mongoose")
const { v4: uuidv4 } = require('uuid');


const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId : {type:String,default:()=>uuidv4(), unique:true},
    orderItems :[{productId : {type: mongoose.Schema.Types.ObjectId, ref:"Product", required:true},
        quantity : { type:Number,required:true},
        
    }],
    totalprice : {type:Number,require:true},
    paymentMethod :{type:String,require:true},
    discount : {type:Number, default:0},
    finalAmount : {type:Number,required:true},
    couponCode: {type:String},
    address :  {type: mongoose.Schema.Types.ObjectId,ref:"Address",required:true},
    // payment : {type:String,enum:["Pending","Success","Failed"]},
    invoiceDate : {type:Date},
    paymentStatus: {type:String, enum:["COD","Succuss","Failed","Pending"], required:true},
    orderStatus : {type:String,required:true, enum:["Pending","Processed","Shipped", "Delivered", "Cancelled","Return requested","Returned"]},
    createAT: {type:Date,default: Date.now,required:true},
    couponApplied : {type:Boolean,default:false}
})

module.exports = mongoose.model("order",orderSchema);