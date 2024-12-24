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

exports.getCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);
    let cartData = await Cart.findOne({ userId: userId }).populate({
      path: "items.productId",
      populate: { path: "category", select: "name categoryOffer" },
    });

    let totalprice = 0;

    if (cartData) {
      // Filter out invalid items
      const validItems = [];
      for (const item of cartData.items) {
        if (item.productId) {
          // Calculate total price for valid items
          totalprice += item.productId.salePrice * item.quantity;
          validItems.push(item);
        } else {
          // Remove invalid item
          await Cart.updateOne(
            { _id: cartData._id },
            { $pull: { items: { _id: item._id } } }
          );
          console.log( item._id)," have no data Removed from cart items";
        }
      }

      // Update the cartData items array to reflect valid items only
      cartData.items = validItems;
    }

    res.render("user/cart", { user: userData, cartData: cartData, totalprice: totalprice });
  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(404).send("Page not found");
  }
};

// exports.getCart = async(req,res)=>{
//     try {
//         const userId = req.session.user; 
//         const userData = await User.findOne({_id:userId})
//         const cartData = await Cart.findOne({userId:userId._id}).populate({path:"items.productId",populate:{path:'category',select:"name categoryOffer"}})
//         let totalprice = 0;
//         if (cartData){
//           cartData.items.forEach(item=>{
//              let productId = item.productId;
//              console.log("productId",productId)
//              console.log("itemsId",item._id)
//              if(!productId){
//              cartData = await Cart.updateOne({"items._id":item._id},
//                 {$pull : {items : {_id :item._id}}}
//               )
//               console.log("No product data available in this id",item.productId._id)
//              }
//             // let product = await Product.findById(item.productId);
//           })
//         }
//         if(cartData){
//             cartData.items.forEach(item =>{
//                 totalprice +=item.productId.salePrice*item.quantity;
//             });
//         }
//         res.render("user/cart",{user:userData,cartData:cartData,totalprice:totalprice});
//     } catch (error) {
//         res.status(404).send("page not found")
//     }
// }

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
        const deliveryCharge=40;
        if(cartData){
            cartData.items.forEach(item =>{
                totalprice +=item.productId.salePrice*item.quantity;
            });
        }
        res.render("user/order-summary",{user:userData,userAddress:addressData,cartData:cartData,totalprice:totalprice,deliveryCharge:deliveryCharge})
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

  
  
  exports.postOrderSummary =  async (req, res) => {
  //   const orderId = req.query.orderId;
  //   console.log("oouuhhgg",orderId)
  //  if (orderId) {
  //       // Update order status for failed payment retry
  //       await Order.updateOne(
  //         { orderId: orderId },
  //         { $set: { paymentStatus: 'Success', orderStatus: 'Processed' } }
  //       );
  //       return res.json({success:true, message:'Yay! your order has been successfully placed!'})
      // }
  
      if(req.query.razorpayOrderId && req.query.retry){
        console.log('request for retry payment reached herer', req.query)
        console.log('request for retry payment reached here order id differnciated', req.query.razorpayOrderId)
        //find the failed order user try to success
        const retryOrder = await Order.findOne({_id:req.query.razorpayOrderId})
        console.log("retry retry-order",retryOrder)
        //create a new razorpay order
        try {
          const options = {
            amount: retryOrder.finalAmount * 100, 
            currency:  "INR",
            receipt: retryOrder.id, 
          };
      
          const retrypayOrder = await razorpay.orders.create(options);
          retryOrder.razorpayOrderId = retrypayOrder.id;
          retryOrder.save();
          console.log("create order",retrypayOrder)
          console.log('database updated accordingly!')
          console.log('every thing is fine, return proceed')
         return res.status(200).json(retrypayOrder);
        } catch (err) {
        return   res.status(500).send(err.message);
        }     
       }

    try {
     
      const { selectedAddress, finalAmount, discountAmount, couponCode, cartProducts, paymentMethod } = req.body;
      const userId = req.session.user;
  
      if (!selectedAddress || !finalAmount || !cartProducts || !Array.isArray(cartProducts)) {
        return res.status(400).send('Missing or invalid order details');
      }
      let couponApplied;
      if (!couponCode){
        couponApplied="No Coupon Applied";
      }else{
        couponApplied= "Coupon Applied"
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
  
      const userData = await User.findOne({ _id: userId });
  
      // Create a new order
      const newOrder = new Order({
        userId: userData._id,
        address: selectedAddress,
        totalAmount: finalAmount,
        discount: discountAmount,
        finalAmount: finalAmount,
        couponCode: couponCode,
        couponApplied :couponApplied,
        paymentMethod: paymentMethod,
        orderItems: orderItems,
        orderStatus: 'Pending',
        paymentStatus: 'Pending',

      });
  
      await newOrder.save();
      const orderId = newOrder.id;
      console.log('ordrid',orderId)
  
      if (paymentMethod === 'COD') {
        newOrder.paymentStatus = 'COD';
        newOrder.orderStatus = 'Processed';
        await newOrder.save();
        return res.status(200).send('Order placed successfully with COD');
      } else if (paymentMethod === 'Online') {
        // Create Razorpay order
        try {
          const options = {
            amount: finalAmount * 100, // Amount in paise (1 INR = 100 paise)
            currency:  "INR",
            receipt: orderId, // Order ID or unique receipt ID
          };
      
          const order = await razorpay.orders.create(options);
          newOrder.razorpayOrderId = order.id;
          newOrder.save();
          res.status(200).json(order);
          console.log("create order",order)
        } catch (err) {
          res.status(500).send(err.message);
        }
      }
    } catch (error) {
      console.error('Error placing order:', error.message);
      res.status(500).send('Order placement failed');
    }
  };
  

    exports.verifypayment =  async (req, res) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const orderId = req.query.orderId;
    console.log("verify",req.query.orderId)
    try {
  
      console.log("razorpay orderid" , razorpay_order_id)
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
  
      if (generatedSignature === razorpay_signature) {
       const updatedata = await Order.updateOne(
          { _id: orderId },
          { $set: { paymentStatus: 'Success', orderStatus: 'Processed' } }
        ); 
        console.log(updatedata)
        res.status(200).json({ message: "Payment verified successfully" });
      } else {
        await Order.updateOne(
          { orderId: orderId },
          { $set: { paymentStatus: 'Failed', orderStatus: 'Pending' } }
        );
        res.status(400).json({ message: "Invalid signature" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error verifying payment", error });
    }
  };
  
  exports.createOrder = async(req,res)=>{
    console.log("create order")
    // const { amount, currency, receipt } = req.body;
    // console.log("create orderrr",amount)
    try {
      const options = {
        amount:  500 * 100, // Amount in paise (1 INR = 100 paise)
        currency:  "INR",
        receipt: 'receipt1', // Order ID or unique receipt ID
      };
  
      const order = await razorpay.orders.create(options);
      res.status(200).json(order);
      console.log("create order",order)
    } catch (err) {
      res.status(500).send(err.message);
    }
  }


  exports.paymentFailed =  async(req,res)=>{
    try {
      const { error } = req.body; // Razorpay sends the error details in the request body
      const razorpayOrderId = req.query.orderId;
      console.log("orderid :",razorpayOrderId)

      if (!error) {
          return res.status(400).json({
              success: false,
              message: "Invalid request, no error details provided.",
          });
      }

      // Extract and log error details for debugging
      const errorDetails = {
          code: error.code || "UNKNOWN_ERROR",
          description: error.description || "No description provided",
          source: error.source || "Unknown source",
          step: error.step || "Unknown step",
          reason: error.reason || "Unknown reason",
          metadata: error.metadata || {},
      };
      

      console.error("Payment Failure Details:", errorDetails);

      const updatedata = await Order.updateOne(
        { _id: razorpayOrderId },
        { $set: { paymentStatus: 'Failed', orderStatus: 'Pending' } }
      );
      console.log(updatedata)
     
      // Respond to the user with a friendly message
      res.status(200).json({
          success: false,
          message: "Your Payment has failed. Please try again .",
          errorDetails,// Optionally include error details for debugging (avoid sensitive info)
         razorpayOrderId,
      });

      // Optionally, send a notification to the user/admin
      // e.g., send an email to the user or log the issue for further investigation

  } catch (error) {
      console.error("Error handling payment failure:", error);

      // Respond with a generic error message
      res.status(500).json({
          success: false,
          message: "Something went wrong while handling the payment failure. Please try again later.",
      });
  }
  }

exports.paymentCancel  =async(req,res)=>{
  try {
    const { error } = req.body; // Razorpay sends the error details in the request body
    const orderId = req.query.orderId;
    console.log("orderid :",orderId)

    if (!error) {
        return res.status(400).json({
            success: false,
            message: "Invalid request, no error details provided.",
        });
    }
    
    // Extract and log error details for debugging
    const errorDetails = {
        code: error.code || "UNKNOWN_ERROR",
        description: error.description || "No description provided",
        source: error.source || "Unknown source",
        step: error.step || "Unknown step",
        reason: error.reason || "Unknown reason",
        metadata: error.metadata || {},
    };
// const updatedata = await Order.updateOne(
//       { _id: orderId },
//       { $set: { paymentStatus: 'cancelld', orderStatus: 'Pending' } }
//     );
    console.error("Payment  cancelled Details:", errorDetails);

    res.status(200).json({
      success: false,
      message: "Your Payment has cancelled.",
      errorDetails,// Optionally include error details for debugging (avoid sensitive info)
  });

    // Optionally, send a notification to the user/admin
    // e.g., send an email to the user or log the issue for further investigation

} catch (err) {
    console.error("Error handling payment failure:", err);

    // Respond with a generic error message
    res.status(500).json({
        success: false,
        message: "Something went wrong while handling the payment failure. Please try again later.",
    });
}
}









  
  // exports.verifypayment = async(req,res)=>{
    
  //     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  //     console.log("varify payment",razorpay_order_id)
  // try {
  // const generatedSignature = crypto
  //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // Replace with your Key Secret
  //   .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  //   .digest('hex');

  // if (generatedSignature === razorpay_signature) {
  //   res.status(200).json({ success: true, message: 'Payment verified successfully' });
  // } else {
  //   res.status(400).json({ success: false, message: 'Invalid signature, payment verification failed' });
  // }
  //   } catch (error) {
  //     console.log("payment failed",error)
  //     res.status(500).send("Order payment failed");
  //   }
  // }






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