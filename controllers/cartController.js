const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Address = require("../models/addressmodel");
const Cart = require("../models/cartmodel")
const Order = require("../models/ordermodel")
const env = require("dotenv").config()
const Razorpay = require('razorpay');
const crypto = require('crypto');



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.addToCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user; 
        const quantity = req.body.quantity || 1; 
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
        const cartData = await Cart.findOne({userId:userId._id}).populate({path:"items.productId",populate:{path:'category',select:"name categoryOffer"}})
        let totalprice = 0;
        if(cartData){
            cartData.items.forEach(item =>{
                totalprice +=item.productId.salePrice*item.quantity;
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
          return res.status(404).send("Product not found")
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
                totalprice +=item.productId.salePrice*item.quantity;
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
      const { selectedAddress, finalAmount,  discountAmount, couponCode, cartProducts,paymentMethod } = req.body;
      const userId = req.session.user;
  
      console.log("discount amount",discountAmount)
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
        discount:discountAmount,
        finalAmount:finalAmount,
        couponCode:couponCode,
        paymentMethod :paymentMethod,
        orderItems:orderItems, 
        status: "Pending",
        payment:"Pending",
      });
    
      await newOrder.save(); 
      res.status(200).send("Order placed successfully");
      const orderId =newOrder.id;
      // console.log("order.id",newOrder.orderId)
      // if(paymentMethod==="COD"){
        
      // }else if (paymentMethod === "Online") {
      //   const options = {
      //     amount: parseInt(finalAmount) * 100, // Convert rupees to paise
      //     currency: 'INR',
      //     // receipt: `${orderId}_${Date.now()}`,
      //     receipt:`receipt_${Date.now()}`,
      //   };
  
      //   const order = await razorpay.orders.create(options);
      //   console.log("Razorpay order:", order);
      //   res.status(200).json({ order });
      // }
    } catch (error) {
      console.error("Error placing order:", error.message);
      res.status(500).send("Order placement failed");
    }
  };
  
  exports.createOrder = async(req,res)=>{
    console.log("create order")
    const { amount, currency, receipt } = req.body;
    console.log("create orderrr",amount)
    try {
      const options = {
        amount: amount * 100, // Amount in paise (1 INR = 100 paise)
        currency: currency,
        receipt: receipt, // Order ID or unique receipt ID
      };
  
      const order = await razorpay.orders.create(options);
      res.status(200).json(order);
      console.log("create order",order)
    } catch (err) {
      res.status(500).send(err.message);
    }
  }

  exports.verifypayment = async(req,res)=>{
    
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      console.log("varify payment",razorpay_order_id)
  try {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // Replace with your Key Secret
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature === razorpay_signature) {
    res.status(200).json({ success: true, message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid signature, payment verification failed' });
  }
    } catch (error) {
      console.log("payment failed",error)
      res.status(500).send("Order payment failed");
    }
  }

  // exports.verifyPayment = async(req,res)=>{
  //   const { paymentId, orderId, signature } = req.body;
  //   console.log("Verify Payment Body:", req.body);
  //   try {
  //     const generatedSignature = crypto
  //   .createHmac('sha256', )
  //   .update(orderId + '|' + paymentId)
  //   .digest('hex');

  // if (generatedSignature === signature) {
  //   // Save order details to the database
  //   res.json({ success: true, message: 'Payment verified and order placed successfully.' });
  // } else {
  //   res.status(400).json({ success: false, message: 'Payment verification failed.' });
  // }
      
  //   } catch (error) {
  //     console.log("payment failed",error)
  //     res.status(500).send("Order payment failed");
  //   }
  // }

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