const mongoose = require('mongoose');

const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Address = require("../models/addressmodel");
const Cart = require("../models/cartmodel")
const Order = require("../models/ordermodel")
const Coupon =require("../models/couponmodel")
const Wallet = require("../models/walletmodel")
const env = require("dotenv").config()
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');






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
          console.log("orderrid",orderId)
  //         const addressData = await Order.findById({_id:orderId}).populate("address")
  //  console.log("address",addressData)
  //  console.log("adressss",addressData.address)
   console.log(" adressss",orderData.address)
   
  //  const shippingAddressId = orderDetails[0].address
        // console.log('shipping address', shippingAddressId)
        
        // const findAddress = await Address.findOne({"address._id":addressId});
        const addressId = orderData.address;
        const addressDoc = await Address.findOne({address:{$elemMatch:{_id:addressId}}}).lean()
        const addressArray = addressDoc.address
        const addressData = addressArray.find((address) => {
            return address._id = new mongoose.Types.ObjectId(addressId)
        })
  //  
  //  console.log("find address",findAddress)
      // console.log("Populated Order Data:", JSON.stringify(orderData, null, 2));
  
      // if (!orderData) {
      //   return res.status(404).render("user/noOrders", {
      //     message: "No recent orders found.",
      //   });
      // }
  
      res.render("user/orderSuccess", { order: orderData,address:addressData });
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
  
  exports.approve = async(req,res)=>{
    try {
      const orderId = req.params.id;
      await Order.findByIdAndUpdate(orderId, { status: 'Processed' }); // Update status to 'Processed'
      res.redirect('/admin/order'); // Redirect back to the order page
  } catch (error) {
      console.error(error);
      res.status(500).send('Error approving the order');
  }
  //   try {
  //     let id = req.query.id;
  //     await User.updateOne({_id:id},{$set:{status:"Processing"}});
  //     res.redirect("/admin/order");
  // } catch (error) {
  //     res.redirect("/pageerror")
  // }
  }
  exports.cancel = async(req,res)=>{
    try {
      const orderId = req.params.id;
      await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' }); // Update status to 'Cancelled'
      res.redirect('/admin/order'); // Redirect back to the order page
  } catch (error) {
      console.error(error);
      res.status(500).send('Error canceling the order');
  }
  }

  exports.couponsValidate = async(req,res)=>{
    try {
      const { couponCode, totalAmount } = req.body;
      console.log("values",couponCode)
      const coupon = await Coupon.findOne({ code: couponCode });
      console.log("vcoupon",coupon)
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid coupon code.' });
      }
    
      if (new Date() > coupon.expireDate) {
        return res.status(400).json({ message: 'Coupon has expired.' });
      }
    
      if (totalAmount < coupon.minPurchase) {
        return res.status(400).json({
          message: `Minimum purchase of ₹${coupon.minPurchase} is required to use this coupon.`,
        });
      }
    
      if (coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: 'Coupon usage limit reached.' });
      }
    
      discountAmount = Math.floor(totalAmount * (coupon.discount / 100));
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
      // const discount = Math.min(totalAmount, coupon.maxDiscount);
    
      coupon.usageCount += 1; // Update usage count
      await coupon.save();
      return res.json({ message: 'Coupon applied successfully!', discountAmount });
    
    } catch (error) {
      console.log("coupen not validate",error)
      res.redirect("/pagenotfound")
    }
  }

  exports.getWallet = async(req,res)=>{
    try {
      const userId = req.session.user; 
      const userData = await User.findOne({_id:userId})
      const wallet = await Wallet.find({});
      let totalprice = 0;
        if(wallet){
            wallet.forEach((item) =>{
                totalprice +=item.Amount
            });
        }
      res.render("user/wallet",{user:userData,wallet:wallet,totalprice:totalprice})
    } catch (error) {
      console.log("wallet error",error)
      res.redirect("/pagenot found")
    }
  }

  exports.orderReturn = async(req,res)=>{
    try {
      const orderId = req.params.id;
      console.log(orderId)
      const orderData = await Order.findById(orderId)
      const userId = req.session.user; 
      const userData = await User.findOne({_id:userId})
      console.log("orderdata",orderData)
      if (orderData.paymentMethod === "Online") {
        
        const wallet = new Wallet({userId:userData._id,Amount:orderData.finalAmount})
        
        await wallet.save();
  
        // Update the order status
        orderData.status = "returned";
        await orderData.save();
        res.redirect("/user/order")
      }
    } catch (error) {
      console.log("order return failed",error)
      res.redirect("/pagenotfound");
    }
  }

  exports.getSalesReport = async(req,res)=>{
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
  
   
      res.render("admin/salesreport", {
        order: orderData, 
        currentPage: page, 
        totalPages: totalPages, 
        totalOrders: totalOrder
      });
    } catch (error) {
      console.log("Error loading order list:", error);
      res.status(404).send("Page not found");
    }
  }

  exports.getSalesFilter = async(req,res)=>{
    try {
      const { startDate, endDate, filterType } = req.query;
  
      // Initialize date filter
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          createAT: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        };
      } else if (filterType === '1-day') {
        const today = new Date();
        dateFilter = {
          createAT: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lte: new Date(today.setHours(23, 59, 59, 999)),
          },
        };
      } else if (filterType === '1-week') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateFilter = { createAT: { $gte: lastWeek, $lte: new Date() } };
      } else if (filterType === '1-month') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateFilter = { createAT: { $gte: lastMonth, $lte: new Date() } };
      }
  
      const page = parseInt(req.query.page) || 1;
      const limit = 4; // Number of items per page
      const skip = (page - 1) * limit;
      
      const totalCount = await Order.countDocuments(dateFilter);
      const totalPages = Math.ceil(totalCount / limit);
      
      const orders = await Order.find(dateFilter).skip(skip).limit(limit);
      
      res.render('admin/salesreport', {
        order: orders,
        currentPage: page,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching sales report');
    }
  }
  
  exports.getSalesReportpdf = async(req,res)=>{
    try {
      const { filterType, startDate, endDate } = req.query;
  const reportData = generateReportData(filterType, startDate, endDate);

  const doc = new PDFDocument();
  res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  doc.fontSize(18).text('Sales Report', { align: 'center' });
  doc.moveDown();

  reportData.forEach((order) => {
    doc.fontSize(12).text(`Order ID: ${order.orderId}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Discount: ${order.discount}`);
    doc.text(`Date: ${new Date(order.createAT).toLocaleDateString()}`);
    doc.text(`Final Amount: ${order.finalAmount}`);
    doc.moveDown();
  });

  doc.end();
    } catch (error) {
      console.log("erro in downloading pdf",error)
      res.redirect('/pagenotfound')
    }
  }