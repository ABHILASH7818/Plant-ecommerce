const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Address = require("../models/addressmodel");
const Cart = require("../models/cartmodel")
const Order = require("../models/ordermodel")


exports.addToCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user; // Assuming this contains the user ID
        const quantity = req.body.quantity || 1; // Default quantity is 1 if not provided

        // Fetch the cart for the user
        let cart = await Cart.findOne({ userId });

        // If no cart exists, create a new one
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if the product is already in the cart
        const existingProductIndex = cart.items.findIndex(
            (p) => p.productId.toString() === productId
        );

        if (existingProductIndex >= 0) {
            // If the product already exists, update the quantity
            cart.items[existingProductIndex].quantity += parseInt(quantity, 10);
        } else {
            // If the product does not exist, add it to the cart
            cart.items.push({ productId, quantity: parseInt(quantity, 10) });
        }

        // Save the cart
        await cart.save();

        res.redirect("/cart");
    } catch (error) {
        console.log("Error:", error);
        res.redirect("/pagenotfound");
    }
};


exports.getCart = async(req,res)=>{
    try {
        const userId = req.session.user; 
        const userData = await User.findOne({_id:userId})
        const cartData = await Cart.findOne({userId:userId._id}).populate("items.productId")
        let totalprice = 0;
        if(cartData){
            cartData.items.forEach(item =>{
                totalprice +=item.productId.price*item.quantity;
            });
        }
        res.render("user/cart",{user:userData,cartData:cartData,totalprice:totalprice});
    } catch (error) {
        res.status(404).send("page not found")
    }
}

exports.deleteCart = async(req,res)=>{
    try {
        const cartId =req.params.id;
        const finduser =await Cart.findOne({"items._id":cartId});
        if(!finduser){
          return res.status(404).send("Address not found")
        }
        await Cart.updateOne({"items._id":cartId},
          {$pull : {items : {_id :cartId}}}
        )
        res.redirect("/cart");
      } catch (error) {
        console.log("cart not delecte",error)
        res.redirect("/pagenotfound")
      }
}

// Update cart on checkout
exports.updateCart = async (req, res) => {
    try {
      const { items } = req.body; 
  console.log("items",items);
     
      for (const item of items) {
        const { id, quantity } = item;
        await Cart.updateOne(
          { "items._id": id },
          {
            $set: {
              "items.$.quantity": quantity,
            },
          }
        );
      }
      res.status(200).send({ success: true, message: "Cart updated successfully!" });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).send({ success: false, message: "Failed to update cart" });
  }
};

  exports.getOrderSummary = async(req,res)=>{
    try {
        const userId =req.session.user;
        const userData = await User.findOne({_id:userId})
        const addressData =  await Address.findOne({userId:userId._id})
        const cartData = await Cart.findOne({userId:userId._id}).populate("items.productId")
        let totalprice = 0;
        if(cartData){
            cartData.items.forEach(item =>{
                totalprice +=item.productId.price*item.quantity;
            });
        }
        res.render("user/order-summary",{user:userData,userAddress:addressData,cartData:cartData,totalprice:totalprice})
    } catch (error) {
        
    }
  }


  exports.addNewAddress = async(req,res)=>{
    try {
      const userId =req.session.user;
      const {name,phone,street,city,state,pinCode} = req.body;
      const userData = await User.findOne({_id:userId})
      const useraddress = await Address.findOne({userId:userId._id});
      if(!useraddress){
         const newAddress =new Address({
          userId : userData._id,
          address : [{name,phone,street,city,state,pinCode}]
         });
         await newAddress.save();
         res.redirect("/order-summary")
      }else{
        useraddress.address.push({name,phone,street,city,state,pinCode});
        await useraddress.save();
        res.redirect("/order-summary")
      }
  
    } catch (error) {
      console.log("addaddress page error",error);
      res.redirect('/pagenotfound')
    }
  }

  exports.postOrderSummary = async (req, res) => {
    try {
      const { selectedAddress, finalAmount, cartProducts,paymentMethod } = req.body;
      const userId = req.session.user;
  
      
      if (!selectedAddress || !finalAmount || !cartProducts || !Array.isArray(cartProducts)) {
        return res.status(400).send("Missing or invalid order details");
      }
  
    
      const orderItems = cartProducts.map(item => {
        if (!item.productId || !item.quantity) {
          throw new Error(`Invalid cart item: ${JSON.stringify(item)}`);
        }
        return {
          productId: item.productId, 
          quantity: item.quantity,
        };
      });
  
    //  console.log("address",selectedAddress)
    
      const userData = await User.findOne({ _id: userId });
     
  
     
      const newOrder = new Order({
        userId: userData._id,
        address: selectedAddress,
        totalAmount: finalAmount,
        finalAmount:finalAmount,
        paymentMethod :paymentMethod,
        orderItems:orderItems, // Add mapped orderItems
        status: "Pending",
      });
  
      // Save the order to the database
      await newOrder.save();
      
      res.status(200).send("Order placed successfully!");
    } catch (error) {
      console.error("Error placing order:", error.message);
      res.status(500).send("An error occurred while placing the order");
    }
  };
  

  // exports.postOrderSummary = async(req,res)=>{
  //   try {
  //       const { selectedAddress, finalAmount, cartProducts } = req.body;
  //       const userId =req.session.user;
  //       const userData = await User.findOne({_id:userId})
  //       // Validate inputs
  //       if (!selectedAddress || !finalAmount || !cartProducts) {
  //         return res.status(400).send("Missing order details");
  //       }
  //       const orderItems = cartProducts.map(item => {
  //         if (!item.productId || !item.quantity) {
  //           throw new Error(`Invalid cart item: ${JSON.stringify(item)}`);
  //         }
  //         return {
  //           productId: item.productId,
  //           quantity: item.quantity,
  //         };
  //       });
  //       const{productId, quantity}= cartProducts;
  //       console.log("cart",cartProducts)
  //       // Create a new order
  //       const newOrder = new Order({
  //         userId: userData._id, // Assuming user is authenticated
  //         address: selectedAddress,
  //         totalAmount: finalAmount,
  //         finalAmount:finalAmount,
  //         orderItems, // Expecting an array of products with quantity
  //         status: "Pending",
  //       });
        
    
  //       await newOrder.save(); // Save order to the database
    
  //       res.status(200).send("Order placed successfully!");
  //     } catch (error) {
  //       console.error("Error placing order:", error);
  //       res.status(500).send("An error occurred while placing the order");
  //     }    
  // }