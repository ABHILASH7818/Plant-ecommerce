const mongoose = require("mongoose")
//const { v4: uuidv4 } = require('uuid');
async function generateSixDigitOrderId() {
    while (true) {
        const orderId = Math.floor(100000 + Math.random() * 900000).toString();
        const existingOrder = await mongoose.models.order.findOne({ orderId });
        if (!existingOrder) {
            return orderId; // Return the orderId if it's unique
        }
    }
}


const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, unique: true },
    orderItems :[{productId : {type: mongoose.Schema.Types.ObjectId, ref:"Product", required:true},
        quantity : { type:Number,required:true},
        
    }],
    totalprice : {type:Number,require:true},
    paymentMethod :{type:String,require:true},
    discount : {type:Number, default:0},
    finalAmount : {type:Number,required:true},
    couponCode: {type:String},
    address :  {type: mongoose.Schema.Types.ObjectId,ref:"Address",required:true},
    invoiceDate : {type:Date,default: Date.now,required:true},
    paymentStatus: {type:String, enum:["COD","Success","Failed","Pending"], required:true},
    orderStatus : {type:String,required:true, enum:["Pending","Processed","Shipped", "Delivered", "Cancelled","Return requested","Returned"]},
    createAT: {type:Date,default: Date.now,required:true},
    couponApplied : {type:String,enum:["Coupon Applied","No Coupon Applied"],default:"No Coupon Applied"},
    razorpayOrderId:{type:String},
})

orderSchema.pre("save", async function (next) {
    if (!this.orderId) {
        this.orderId = await generateSixDigitOrderId();
    }
    next();
})

module.exports = mongoose.model("order",orderSchema);