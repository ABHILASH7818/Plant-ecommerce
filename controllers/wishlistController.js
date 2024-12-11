const mongoose = require('mongoose');
const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Wishlist = require("../models/wishlistmodel");

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
   const  userData = await User.findOne({_id:userId})
   const wishlist = await Wishlist.findOne({userId:userId}).populate({path:"products",populate:{path:"category",select:"name"}});

    res.render("user/wish-list",{user:userData,wishlist:wishlist});
  } catch (error) {
    console.error("Error rendering wishlist page:", error);
    res.redirect("/pagenotfound");
  }
}

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user; 

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ status: false, message: "Invalid Product ID" });
    }

    const userData = await User.findOne({ _id: userId });
    if (!userData) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Check if wishlist exists for the user
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      // Create a new wishlist if it doesn't exist
      wishlist = new Wishlist({ userId, products: [] });
    }

    // Check if the product is already in the wishlist
    if (wishlist.products.some((p) => p.toString() === productId)) {
      return res.status(200).json({ status: false, message: "Product already in Wishlist" });
    }

    // Add the product to the wishlist
    wishlist.products.push(productId);
    await wishlist.save();

    return res.status(200).json({ status: true, message: "Product added to wishlist" });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

exports.deleteWishlist = async(req,res)=>{
  try {
    const productId = req.params.id;
    const findProduct = await Wishlist.findOne({products:productId});
    if(!findProduct){
      console.log("product not found")
      return res.status(404).send("Product not found")
    }
    await Wishlist.updateOne({products:productId},
    {$pull: {products: productId}})
    res.redirect("/wishlist")
  } catch (error) {
    console.error("Error adding to wishlist:", error);
  res.redirect('/pagenotfound');
  }
}


// exports.addToWishlist = async (req, res) => {
//   try {
//     const { productId } = req.body; 
//     const userId = req.session.user; 
//     console.log( "useer",userId)
//     // Ensure user is logged in
//     if (!userId) {
//       return res.status(401).json({ status: false, message: "User not logged in" });
//     }

//     console.log("product", productId)
//     // Validate the product ID
//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({ status: false, message: "Invalid Product ID" });
//     }

//     const userData = await User.findOne({ _id: userId });
//     console.log("productId",userData)
//     if (!userData) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     // Check if the product is already in the wishlist
//     if (userData.wishlist.includes(productId)) {
//       return res.status(200).json({ status: false, message: "Product already in Wishlist" });
//     }

//     // Add the product to the wishlist
//     userData.wishlist.push(productId);
//     await userData.save();

//     return res.status(200).json({ status: true, message: "Product added to wishlist" });
//   } catch (error) {
//     console.error("Error adding to wishlist:", error);
//     res.status(500).json({ status: false, message: "Server error" });
//   }
// };
