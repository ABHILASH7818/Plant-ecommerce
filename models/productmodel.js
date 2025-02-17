const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
     description: { type: String },
    category: { type:mongoose.Types.ObjectId,ref:"Category", },
    // regularPrice:{ type:Number,required:true},
    salePrice:{type:Number,required:true},
    regularPrice: { type: Number, required: true },
     stock: { type: Number, required: true },
    images:{type: [String],required:true},
    productOffer:{type:Number,default:0},
    color:{type:String,required:true},
    rating: { type: Number, default: 0 },
    inWishList: {type:Boolean,default:false},
    // stastus:{type:String,enum :["Available","Out of stok"],require:true,default:"Available"},
    // //  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    createdAt: { type: Date, default: Date.now },
  });
 
  const Product = mongoose.model('Product', productSchema);
  module.exports = Product;