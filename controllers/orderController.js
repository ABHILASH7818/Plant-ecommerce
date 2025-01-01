const mongoose = require("mongoose");

const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Address = require("../models/addressmodel");
const Cart = require("../models/cartmodel");
const Order = require("../models/ordermodel");
const Coupon = require("../models/couponmodel");
const Wallet = require("../models/walletmodel");
const env = require("dotenv").config();
const Razorpay = require("razorpay");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");

exports.getOrderSuccess = async (req, res) => {
  try {
    const userId = req.session.user;

    // Fetch the most recent order for the logged-in user
    const orderData = await Order.findOne({ userId: userId._id })
      .sort({ createAT: -1 })
      .populate({
        path: "orderItems.productId",
        model: "Product",
      });
    const orderId = orderData.id;
    console.log("orderrid", orderId);
    
    console.log(" adressss", orderData.address);

    
    const addressId = orderData.address;
    const addressDoc = await Address.findOne({
      address: { $elemMatch: { _id: addressId } },
    }).lean();
    const addressArray = addressDoc.address;
    const addressData = addressArray.find((address) => {
      return (address._id = new mongoose.Types.ObjectId(addressId));
    });
    //
    //  console.log("find address",findAddress)
    // console.log("Populated Order Data:", JSON.stringify(orderData, null, 2));

    // if (!orderData) {
    //   return res.status(404).render("user/noOrders", {
    //     message: "No recent orders found.",
    //   });
    // }

    res.render("user/orderSuccess", { order: orderData, address: addressData });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).send("Internal Server Error",error);
  }
};

exports.getOrderList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const orderData = await Order.find({})
      .sort({ createAT: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId");

    const totalOrder = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrder / limit);

    res.render("admin/orderlist", {
      order: orderData,
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalOrder,
    });
  } catch (error) {
    console.log("Error loading order list:", error);
    res.status(404).send("Page not found");
  }
};

exports.approve = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    console.log("order", order);
    if (order.orderStatus === "Processed") {
      await Order.findByIdAndUpdate(orderId, { orderStatus: "Shipped" }); // Update status to 'Processed'
      return res.redirect("/admin/order"); // Redirect back to the order page
    }
    if (order.orderStatus === "Shipped") {
      await Order.findByIdAndUpdate(orderId, { orderStatus: "Delivered" });
      return res.redirect("/admin/order");
    }
   res.redirect("/admin/order");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error approving the order");
  }
};
exports.cancel = async (req, res) => {
  try {
    const orderId = req.params.id;
    await Order.findByIdAndUpdate(orderId, { orderStatus: "Cancelled" }); // Update status to 'Cancelled'
    res.redirect("/admin/order"); // Redirect back to the order page
  } catch (error) {
    console.error(error);
    res.status(500).send("Error canceling the order");
  }
};

exports.couponsValidate = async (req, res) => {
  try {
    const { couponCode, totalAmount } = req.body;
    console.log("values", couponCode);
    const coupon = await Coupon.findOne({ code: couponCode });
    console.log("vcoupon", coupon);
    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon code." });
    }

    if (new Date() > coupon.expireDate) {
      return res.status(400).json({ message: "Coupon has expired." });
    }

    if (totalAmount < coupon.minPurchase) {
      return res.status(400).json({
        message: `Minimum purchase of ₹${coupon.minPurchase} is required to use this coupon.`,
      });
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached." });
    }

    couponDiscountAmount = Math.floor(totalAmount * (coupon.discount / 100));
    if (coupon.maxDiscount > 0 && couponDiscountAmount > coupon.maxDiscount) {
      couponDiscountAmount = coupon.maxDiscount;
    }
    // const discount = Math.min(totalAmount, coupon.maxDiscount);

    coupon.usageCount += 1; // Update usage count
    await coupon.save();
    return res.json({
      message: "Coupon applied successfully!",
      couponDiscountAmount,
    });
  } catch (error) {
    console.log("coupen not validate", error);
    res.redirect("/pagenotfound");
  }
};

exports.getWallet = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    const wallet = await Wallet.find({});
    let totalprice = 0;
    if (wallet) {
      wallet.forEach((item) => {
        totalprice += item.Amount;
      });
    }
    res.render("user/wallet", {
      user: userData,
      wallet: wallet,
      totalprice: totalprice,
    });
  } catch (error) {
    console.log("wallet error", error);
    res.redirect("/pagenot found");
  }
};

exports.getWalletTransaction = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    const wallet = await Wallet.find({});
    let totalprice = 0;
    if (wallet) {
      wallet.forEach((item) => {
        totalprice += item.Amount;
      });
    }
    return res.render("user/walletTransactions", {
      user: userData,
      wallet: wallet,
      totalprice: totalprice,
    });
  } catch (error) {
    console.log("wallet error", error);
    res.redirect("/pagenotfound");
  }
};

exports.orderReturn = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.user;
    console.log("orderstatus ", orderId);

    const orderData = await Order.findById(orderId);
    if (!orderData) {
      console.log("Order not found");
      return res.redirect("/pagenotfound");
    }

    const userData = await User.findById(userId);
    if (!userData) {
      console.log("User not found");
      return res.redirect("/pagenotfound");
    }

    if (
      orderData.paymentMethod === "Online" &&
      orderData.finalAmount > 0 &&
      orderData.paymentStatus === "Success"
    ) {
      // Create or update wallet balance
      // let wallet = await Wallet.findOne({ userId: userData._id });
      
      const  wallet = new Wallet({
          userId: userData._id,
          Amount: orderData.finalAmount,
        });
     
        // wallet.Amount += orderData.finalAmount;
      
      console.log("orderstatus wallet change");
      await wallet.save();
    }

    // Update order status
    if (orderData.orderStatus === "Delivered") {
      orderData.orderStatus = "Returned";
      await orderData.save();
      return res.redirect("/order");
    } else if (
      ["Processed", "Shipped", "Pending"].includes(orderData.orderStatus)
    ) {
      orderData.orderStatus = "Cancelled";
      console.log("orderstatus pending change");
      await orderData.save();
      return res.redirect("/order");
    }
    console.log("orderstatus  change");
  } catch (error) {
    console.log("Order return failed", error);
    res.redirect("/pagenotfound");
  }
};

exports.getSalesReport = async (req, res) => {
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
    } else if (filterType === "1-day") {
      const today = new Date();
      dateFilter = {
        createAT: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      };
    } else if (filterType === "1-week") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter = { createAT: { $gte: lastWeek, $lte: new Date() } };
    } else if (filterType === "1-month") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateFilter = { createAT: { $gte: lastMonth, $lte: new Date() } };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 4; 
    const skip = (page - 1) * limit;

    const totalCount = await Order.countDocuments(dateFilter);
    const totalPages = Math.ceil(totalCount / limit);

    const orders = await Order.find(dateFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createAT: -1 });

    res.render("admin/salesreport", {
      order: orders,
      currentPage: page,
      totalPages: totalPages,
      filterType: filterType,
      startDate: startDate,
      endDate: endDate,
    });
  } catch (error) {
    console.log("Error loading order list:", error);
    res.status(404).send("Page not found");
  }
};

exports.getsalesReportexcel = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;

    // Fetch the filtered data from the database
    const filterCriteria = {};
    if (filterType === "custom-date" && startDate && endDate) {
      filterCriteria.createAT = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (filterType === "1-day") {
      const today = new Date();
      filterCriteria.createAT = { $gte: today.setDate(today.getDate() - 1) };
    } else if (filterType === "1-week") {
      const today = new Date();
      filterCriteria.createAT = { $gte: today.setDate(today.getDate() - 7) };
    } else if (filterType === "1-month") {
      const today = new Date();
      filterCriteria.createAT = { $gte: today.setMonth(today.getMonth() - 1) };
    }

    const orders = await Order.find(filterCriteria); // Replace with your database query logic

    // Transform data for Excel
    const data = orders.map((order) => ({
      "Order ID": order.orderId,
      "Payment Method": order.paymentMethod,
      Discount: order.discount,
      Date: new Date(order.createAT).toLocaleDateString(),
      "Sold Price": order.finalAmount,
    }));

    // Calculate order summary
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.finalAmount, 0);
    const onlinePayments = orders.filter((order) => order.paymentMethod === "Online").length;
    const codPayments = orders.filter((order) => order.paymentMethod === "COD").length;

    // Create a new workbook and add data to a worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the order summary at the end of the worksheet
    const summaryStartRow = data.length + 2; // Leave a row gap between data and summary
    XLSX.utils.sheet_add_aoa(worksheet, [
      ["Order Summary"],
      ["Total Orders", totalOrders],
      ["Total Sales", totalSales],
      ["Online Payments", onlinePayments],
      ["COD Payments", codPayments],
    ], { origin: `A${summaryStartRow}` });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

    // Generate the Excel file
    const filePath = path.join(__dirname, "sales-report.xlsx");
    XLSX.writeFile(workbook, filePath);

    // Send the file as a response
    res.download(filePath, "sales-report.xlsx", (err) => {
      if (err) {
        console.error("Error sending file:", err);
      }

      // Delete the file after sending it
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.log("Error in downloading excel", error);
    res.redirect("/pagenotfound");
  }
};


exports.getSalesReportpdf = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;

    // Fetch the filtered data from the database based on query parameters
    const filterCriteria = {};

    if (filterType === "custom-date" && startDate && endDate) {
      filterCriteria.createAT = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (filterType === "1-day") {
      const today = new Date();
      filterCriteria.createAT = { $gte: today.setDate(today.getDate() - 1) };
    } else if (filterType === "1-week") {
      const today = new Date();
      filterCriteria.createAT = { $gte: today.setDate(today.getDate() - 7) };
    } else if (filterType === "1-month") {
      const today = new Date();
      filterCriteria.createAT = { $gte: today.setMonth(today.getMonth() - 1) };
    }
    console.log("filterCriteria", filterCriteria);

    const orders = await Order.find(filterCriteria); // Replace with your database query logic

    // Create a PDF document
    const doc = new PDFDocument();
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf"
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Add the title
    doc.fontSize(18).text("Sales Report", { align: "center" }).moveDown(1.5);

    // Define table positions and sizes
    const tableTop = 100;
    const rowHeight = 25;
    const columnWidths = [150, 100, 80, 120, 100]; // Width for each column
    const columnPositions = [50, 200, 300, 380, 500]; // Starting positions for each column
    // Calculate summary data
    const totalOrders = orders.length;
    const totalOnlinePayments = orders.filter(
      (order) => order.paymentMethod === "Online"
    ).length;
    const totalCODPayments = orders.filter(
      (order) => order.paymentMethod === "COD"
    ).length;
    const totalSalesAmount = orders.reduce(
      (sum, order) => sum + order.finalAmount,
      0
    );

    // Add the summary to the end of the PDF
    function addSummary(doc, currentY) {
      const summaryTop = currentY + 50; // Add some spacing before the summary
      const summaryLeft = 50;

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Orders Summary", summaryLeft, summaryTop);

      doc.font("Helvetica").fontSize(12);
      doc.text(`Total Orders: ${totalOrders}`, summaryLeft, summaryTop + 30);
      doc.text(
        `Number of Online Payments: ${totalOnlinePayments}`,
        summaryLeft,
        summaryTop + 50
      );
      doc.text(
        `Number of COD Payments: ${totalCODPayments}`,
        summaryLeft,
        summaryTop + 70
      );
      doc.text(
        `Total Sales Amount: ₹${totalSalesAmount.toFixed(2)}`,
        summaryLeft,
        summaryTop + 90
      );
    }

    // Add Table Heading (Styled Header)
    doc.font("Helvetica-Bold").fontSize(12); // Bold font for header
    doc
      .rect(
        columnPositions[0],
        tableTop,
        columnWidths.reduce((a, b) => a + b, 0),
        rowHeight
      ) // Draw a shaded rectangle for the header background
      .fill("#f2f2f2")
      .stroke("#000");

    // Draw Table Header Text
    const headers = [
      "Order ID",
      "Payment Method",
      "Discount",
      "Date",
      "Sold Price",
    ];

    headers.forEach((header, index) => {
      doc
        .fill("#000") // Black font color
        .text(header, columnPositions[index], tableTop + rowHeight / 4, {
          width: columnWidths[index],
          align: "center",
        });
    });

    // Reset font to normal for table rows
    doc.font("Helvetica").fontSize(10);

    // Draw Table Rows
    let currentY = tableTop + rowHeight;

    orders.forEach((order) => {
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        currentY = tableTop;
      }

      const rowData = [
        order.orderId,
        order.paymentMethod,
        order.discount ? order.discount : "N/A",
        new Date(order.createAT).toLocaleDateString(),
        order.finalAmount,
      ];

      // Draw each row cell
      rowData.forEach((data, colIndex) => {
        doc.text(data, columnPositions[colIndex], currentY, {
          width: columnWidths[colIndex],
          align: "center",
        });
      });

      // Draw borders for the row
      columnPositions.forEach((pos, colIndex) => {
        doc.rect(pos, currentY, columnWidths[colIndex], rowHeight).stroke();
      });

      currentY += rowHeight;
    });
    if (currentY + 150 > doc.page.height) { // Check if there's enough space for the summary
      doc.addPage();
      currentY = 50;
    }
    addSummary(doc, currentY);
    doc.end();
  } catch (error) {
    console.log("Error in downloading PDF", error);
    res.redirect("/pagenotfound");
  }
};

exports.getSalesFilter = async (req, res) => {
  try {
    if (!req.query) {
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const skip = (page - 1) * limit;

      const orderData = await Order.find({})
        .sort({ createAT: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId");

      const totalOrder = await Order.countDocuments();
      const totalPages = Math.ceil(totalOrder / limit);

      res.render("admin/salesreport", {
        order: orderData,
        currentPage: page,
        totalPages: totalPages,
        totalOrders: totalOrder,
      });
    }
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
    } else if (filterType === "1-day") {
      const today = new Date();
      dateFilter = {
        createAT: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      };
    } else if (filterType === "1-week") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateFilter = { createAT: { $gte: lastWeek, $lte: new Date() } };
    } else if (filterType === "1-month") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateFilter = { createAT: { $gte: lastMonth, $lte: new Date() } };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 4; // Number of items per page
    const skip = (page - 1) * limit;

    const totalCount = await Order.countDocuments(dateFilter);
    const totalPages = Math.ceil(totalCount / limit);

    const orders = await Order.find(dateFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createAT: -1 });

    res.render("admin/salesreport", {
      order: orders,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching sales report");
  }
};
