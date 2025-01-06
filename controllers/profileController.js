const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Address = require("../models/addressmodel");
const Order = require("../models/ordermodel");
const Coupon = require("../models/couponmodel");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

//user-account
exports.getUserAccount = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });

    res.render("user/profile", { user: userData });
  } catch (error) {
    console.log("profile page error", error);
    res.redirect("/pagenotfound");
  }
};

exports.getEditProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    res.render("user/edit-profile", { user: userData });
  } catch (error) {
    console.log("edit-profile page error", error);
    res.status(404).redirect("/pagenotfound");
  }
};

//otp
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP : ${otp}</b>`,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
}

//hashed password
const hashedPassword = async function (password) {
  try {
    const passwordhash = await bcrypt.hash(password, 10);
    return passwordhash;
  } catch (error) {}
};

exports.postEditProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json("email.errorr");
    }

    req.session.userOtp = otp;
    req.session.userData = { name, email, phone };

    res.render("user/profile-update-otp");
    console.log("OTP Sent", otp);
  } catch (error) {
    console.log("signup error", error);
    res.status(404).redirect("/pagenotfound");
  }
};

exports.verifyotp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);

    if (otp == req.session.userOtp) {
      const { name, email, phone } = req.session.userData;
      const userId = req.session.user;
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { name: name, email: email, phone: phone }
      );

      if (!updatedUser) {
        return res.status(404).send({ message: "User not found" });
      }

      res.redirect("/profile");
      req.session.user = updatedUser;
    } else {
      res.render("user/profile-update-otp", {
        message: "Invalid Otp",
      });
    }
  } catch (error) {
    console.error("error  verifying OTP", error);
    res.status(404).send("page not found confirm");
  }
};

exports.getChangePassword = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("user/change-password", { user });
  } catch (error) {
    res.redirect("/pagenotfound");
  }
};

exports.postChangePasword = async (req, res) => {
  const { currentpassword, newpassword } = req.body;
  try {
    const userId = req.session.user;
    const finduser = await User.findOne({ _id: userId });
    const checkPassword = await bcrypt.compare(
      currentpassword,
      finduser.password
    );
    if (!checkPassword) {
      return res.render("user/change-password", {
        user: userId,
        message: "wrong password",
      });
    }
    const passwordhash = await hashedPassword(newpassword);
    await User.findOneAndUpdate({ _id: userId }, { password: passwordhash });
    return res.redirect("/profile");
  } catch (error) {
    res.redirect("/pagenotfound");
  }
};

exports.getAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    const addressData = await Address.findOne({ userId: userId._id });
    res.render("user/address", { user: userData, userAddress: addressData });
  } catch (error) {
    console.log("address page error", error);
    res.redirect("/pagenotfound");
  }
};

exports.postrAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, phone, street, city, state, pinCode } = req.body;
    const userData = await User.findOne({ _id: userId });
    const useraddress = await Address.findOne({ userId: userId._id });
    if (!useraddress) {
      const newAddress = new Address({
        userId: userData._id,
        address: [{ name, phone, street, city, state, pinCode }],
      });
      await newAddress.save();
      res.redirect("/address");
    } else {
      useraddress.address.push({ name, phone, street, city, state, pinCode });
      await useraddress.save();
      res.redirect("/address");
    }
  } catch (error) {
    console.log("addaddress page error", error);
    res.redirect("/pagenotfound");
  }
};

exports.editAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const addressId = req.params.id;
    const currentAddress = await Address.findOne({ "address._id": addressId });

    if (!currentAddress) {
      return res.send("edit address page not found");
    }
    const addressData = currentAddress.address.find((item) => {
      return item._id.toString() === addressId.toString();
    });
    if (!addressData) {
      console.log("address data not find");
      return res.redirect("/pagenotfound");
    }
    res.render("user/edit-address", { user: user, address: addressData });
  } catch (error) {
    return res.redirect("/pagenotfound");
  }
};

exports.postEditAddress = async (req, res) => {
  try {
    const { name, phone, street, city, state, pinCode } = req.body;
    const user = req.session.user;
    const addressId = req.params.id;
    const findAddress = await Address.findOne({ "address._id": addressId });
    if (!findAddress) {
      res.redirect("/pagenotfind");
    }
    await Address.updateOne(
      { "address._id": addressId },
      {
        $set: {
          "address.$": {
            _id: addressId,
            name: name,
            phone: phone,
            street: street,
            city: city,
            state: state,
            pinCode: pinCode,
          },
        },
      }
    );
    console.log("address :", Address.address);
    res.redirect("/address");
  } catch (error) {
    console.log("address not update", error);
    return res.redirect("/pagenotfound");
  }
};

exports.deleteAddeess = async (req, res) => {
  try {
    const addressId = req.params.id;
    const finduser = await Address.findOne({ "address._id": addressId });
    if (!finduser) {
      return res.status(404).send("Address not found");
    }
    await Address.updateOne(
      { "address._id": addressId },
      { $pull: { address: { _id: addressId } } }
    );
    res.redirect("/profile");
  } catch (error) {
    console.log("Address not delecte", error);
    res.redirect("/pagenotfound");
  }
};

exports.getorder = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const orders = await Order.find({ userId: userId })
      .populate({ path: "orderItems.productId", select: "productName" })
      .sort({ createAT: -1 })
      .skip(skip)
      .limit(limit);
    const orderData = orders.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      createAT: order.createAT,
      orderStatus: order.orderStatus,
      finalAmount: order.finalAmount,
      products: order.orderItems.map((item) => ({
        name: item.productId ? item.productId.productName : "Unknown",
      })),
    }));

    const totalOrder = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrder / limit);
    // console.log("product",orderData[1].products)
    res.render("user/orderList", {
      order: orderData,
      user: userData,
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalOrder,
    });
  } catch (error) {
    console.error("Error fetching order data:", error);
    res.status(500).json({ message: "Error fetching order data" });
  }
};

exports.getorderview = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Fetch order details by ID
    const order = await Order.findById(orderId)
      .populate("orderItems.productId")
      .exec();

    if (!order) {
      return res.status(404).send("Order not found").redirect("/pagenotfound");
    }

    const addressId = order.address;
    const addressDoc = await Address.findOne({
      address: { $elemMatch: { _id: addressId } },
    }).lean();
    const addressArray = addressDoc.address;
    const addressData = addressArray.find((address) => {
      return (address._id = new mongoose.Types.ObjectId(addressId));
    });
    // Render the order success page
    res.render("user/oderDetails", {
      order: order, // Pass order data
      address: addressData,
      // products: order.items, // Pass order items (product details, quantity, etc.)
      // billingAddress: order.billingAddress, // Assuming order has a `billingAddress` field
      // finalAmount: order.totalAmount, // Assuming order has `totalAmount`
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getUserCoupon = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    const coupon = await Coupon.find({});
    res.render("user/userCoupons", { user: userData, coupon: coupon });
  } catch (error) {
    console.error(err);
    res.status(500).send("Internal Server Error").redirect("/pagenotfound");
  }
};

exports.getorderdetailsinvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Fetch order details from the database
    const order = await Order.findById(orderId).populate(
      "orderItems.productId"
    );
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Fetch the address details
    const addressId = order.address;
    const addressDoc = await Address.findOne({
      address: { $elemMatch: { _id: addressId } },
    }).lean();
    const addressArray = addressDoc.address;
    const addressData = addressArray.find((address) => {
      return address._id.equals(new mongoose.Types.ObjectId(addressId));
    });

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 30 });

    // Set the response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${orderId}.pdf`
    );

    // Pipe the PDF into the response
    doc.pipe(res);

    // Title and Invoice Header
    doc.fontSize(20).text("PLANTA", { align: "center", bold: true });
    doc.moveDown();
    doc.fontSize(16).text("INVOICE", { align: "center", underline: true });
    doc.moveDown(2);

    // Invoice Details
    doc.fontSize(12).text(`Invoice Number: ${order.orderId}`);
    doc.text(`Order Date: ${new Date(order.createAT).toLocaleDateString()}`);
    doc.moveDown();

    // Billing Details
    doc.fontSize(12).text("BILLED TO:", { underline: true });
    doc.text(`Name: ${addressData.name}`);
    doc.text(
      `Address:  ${addressData.street},  ${addressData.city}, ${addressData.pinCode}`
    );
    doc.moveDown();

    // Order Details Table
    doc.fontSize(16).text("Order Details", { align: "center" });
    doc.moveDown(1);

    // Table Headers
    const tableTop = 250; // Starting Y position for the table
    const col1X = 28;
    const col2X = 220;
    const col3X = 310;
    const col4X = 440;

    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Product Name", col1X, tableTop);
    doc.text("Quantity", col2X, tableTop);
    doc.text("Unit Price", col3X, tableTop);
    doc.text("Total Price", col4X, tableTop);
    doc
      .moveTo(col1X, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke(); // Horizontal line below header

    // Table Rows
    const rowHeight = 25; // Height of each row
    let currentY = tableTop + 25;

    doc.font("Helvetica");
    order.orderItems.forEach((item) => {
      const totalPrice = item.quantity * item.productId.salePrice;

      doc.text(item.productId.productName, col1X, currentY);
      doc.text(item.quantity.toString(), col2X, currentY);
      doc.text(`₹${item.productId.salePrice.toFixed(2)}`, col3X, currentY);
      doc.text(`₹${totalPrice.toFixed(2)}`, col4X, currentY);

      // Draw horizontal line after each row
      doc
        .moveTo(col1X, currentY + rowHeight - 10)
        .lineTo(550, currentY + rowHeight - 10)
        .stroke();

      currentY += rowHeight;
    });

    // Grand Total
    doc.moveDown();
    doc
      .font("Helvetica-Bold")
      .text(
        `Discount: ${order.discount.toFixed(2)}`,
        col4X - 50,
        currentY + 10
      );
    doc.moveDown();
    doc
      .font("Helvetica-Bold")
      .text(
        `Grand Total: ${order.finalAmount.toFixed(2)}`,
        col4X - 50,
        currentY + 22
      );

    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.redirect("/pagenotfound");
  }
};
