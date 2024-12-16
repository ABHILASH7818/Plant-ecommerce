const express =require("express");
const router = express.Router();
const path = require('path');
const Product = require("../models/productmodel");
const adminController =require("../controllers/adminController")
const customerController = require('../controllers/customerController')
const categoryController =require('../controllers/categoryController')
const productController = require("../controllers/productController")
const orderController = require("../controllers/orderController")
const offerController = require("../controllers/offerController")
const couponController = require("../controllers/couponController")
const {userAuth,adminAuth} = require("../middlewares/auth")
const upload = require("../middlewares/multer");


router.get('/',adminController.getadminlogin);
router.post('/login',adminController.postlogin)
router.get('/dashboard',adminAuth,adminController.getadminpanel);
router.get('/logout',adminController.logout)

//user management
router.get("/users",adminAuth,customerController.customerInfo)
router.get("/blockCustomer",adminAuth,customerController.blockUser)
router.get("/unblockCustomer",adminAuth,customerController.unblockUser)


//order management
router.get("/order",adminAuth,orderController.getOrderList)
router.get("/approve/:id",adminAuth,orderController.approve)
router.post("/cancel/:id",adminAuth,orderController.cancel)
// category management
router.get("/category",adminAuth,categoryController.categoryInfo)
router.get("/addcategory",adminAuth,categoryController.getaddCategory)
router.post("/addcategory",adminAuth,categoryController.addCategory)
router.get('/editCategory/:id',adminAuth,categoryController.getEditCategory)
router.post('/edit-Category/:id',adminAuth,categoryController.editCategory)
router.post('/deleteCategory/:id',adminAuth,categoryController.deleteCategory)

//coupon management
router.get("/Coupons",adminAuth,couponController.getCoupon)
router.get("/addCoupon",adminAuth,couponController.getAddCoupon)
router.post("/addCoupon",adminAuth,couponController.postAddCoupon)
router.get("/editCoupen/:id",adminAuth,couponController.getEditCoupon)
router.post("/editCoupon/:id",adminAuth,couponController.postEditCoupon)
router.post("/deleteCoupen/:id",adminAuth,couponController.deleteCoupon)

//offfer management
router.get("/offers",adminAuth,offerController.getoffersList)
router.get("/addOffer",adminAuth,offerController.getAddOffer)
router.post("/addOffer",adminAuth, upload.single('image'),offerController.postAddOffer)
router.post("/deleteOffer/:id",adminAuth,offerController.deleteOffer)

// product management
router.get("/products",adminAuth,productController.getproductsList);
router.get("/add-product",adminAuth,productController.getAddProduct);
router.post("/add-product",adminAuth, upload.array("image", 3),productController.addProduct);
router.post("/deleteProduct/:id",adminAuth,productController.deleteProduct)
router.get('/editProduct/:id',adminAuth,productController.getEditProduct)

// sales-report
router.get("/salesreport",adminAuth,orderController.getSalesReport)
router.get("/salesreportfilter",adminAuth,orderController.getSalesFilter)
router.get("/salesreport/pdf",adminAuth,orderController.getSalesReportpdf)
// router.get("/salesreport/excel",adminAuth,orderController.getsalesReportexcel)

module.exports =router
