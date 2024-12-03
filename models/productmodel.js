const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
     description: { type: String },
    category: { type:mongoose.Types.ObjectId,ref:"Category", },
    // regularPrice:{ type:Number,required:true,},
    // salePrice:{type:Number,required:true},
    price: { type: Number, required: true },
     stock: { type: Number, required: true },
    images:{type: [String],required:true},
    // productOffer:{type:Number,default:0},
    color:{type:String,required:true},
    rating: { type: Number, default: 0 },
    // stastus:{type:String,enum :["Available","Out of stok"],require:true,default:"Available"},
    // //  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    createdAt: { type: Date, default: Date.now },
    // // updatedAt: { type: Date }
   // name: {type:String},
    // description: String,
    // quantity: Number,
    // price: Number,
    // images:{type:[String]},
  });
 
  const Product = mongoose.model('Product', productSchema);
  module.exports = Product;