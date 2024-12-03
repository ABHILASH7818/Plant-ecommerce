const mongoose = require("mongoose")


const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId:{type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
        quantity : { type:Number,default:1},
        // price : { type:Number,required:true },
        totalprice : {type:Number},
        status : {type:String,default:"placed"} 
    }]
})

module.exports = mongoose.model('Cart', cartSchema);