const mongoose = require("mongoose")



const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    Amount : {type:Number,require:true},
    createAT: {type:Date,default: Date.now,required:true},
})

module.exports = mongoose.model("Wallet",walletSchema);