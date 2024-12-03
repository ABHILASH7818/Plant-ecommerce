const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Address = require("../models/addressmodel");
const Cart = require("../models/cartmodel")
const Order = require("../models/ordermodel")




exports.getOrderSuccess = async (req, res) => {
    try {
      const userId = req.session.user;
  
      // Fetch the most recent order for the logged-in user
      const orderData = await Order.findOne({ userId:userId._id })
        .sort({ createAT: -1 })
        .populate({
          path: 'orderItems.productId',
          model: 'Product',
        });
          const orderId = orderData.id;
          console.log("orid",orderId)
  //         const addressData = await Order.findById({_id:orderId}).populate("address")
  //  console.log("address",addressData)
  //  console.log("adressss",addressData.address)
   console.log("or adressss",orderData.address)
   const addressId = orderData.address;
  //  const findAddress = await Address.findOne({"address._id":addressId});
  //  console.log("find address",findAddress)
      // console.log("Populated Order Data:", JSON.stringify(orderData, null, 2));
  
      if (!orderData) {
        return res.status(404).render("user/noOrders", {
          message: "No recent orders found.",
        });
      }
  
      res.render("user/orderSuccess", { order: orderData,address:orderData.address });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  


  exports.getOrderList = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; 
      const limit = 4; 
      const skip = (page - 1) * limit;
  
      
      const orderData = await Order.find({})
        .sort({ createdAt: 1 }) 
        .skip(skip)
        .limit(limit)
        .populate('userId') 
  
      const totalOrder = await Order.countDocuments();
      const totalPages = Math.ceil(totalOrder / limit);
  
   
      res.render('admin/orderlist', {
        order: orderData, 
        currentPage: page, 
        totalPages: totalPages, 
        totalOrders: totalOrder
      });
    } catch (error) {
      console.log("Error loading order list:", error);
      res.status(404).send("Page not found");
    }
  };
  