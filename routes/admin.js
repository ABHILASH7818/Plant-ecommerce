const express =require("express");
const router = express.Router();
const path = require('path');
const Product = require("../models/productmodel");
const adminController =require("../controllers/adminController")
const customerController = require('../controllers/customerController')
const categoryController =require('../controllers/categoryController')
const productController = require("../controllers/productController")
const orderController =require("../controllers/orderController")
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

router.get("/offers",adminAuth,adminController.getoffersList)

//order management
router.get("/order",adminAuth,orderController.getOrderList)
// category management
router.get("/category",adminAuth,categoryController.categoryInfo)
router.get("/addcategory",adminAuth,categoryController.getaddCategory)
router.post("/addcategory",adminAuth,categoryController.addCategory)
router.get('/editCategory/:id',adminAuth,categoryController.getEditCategory)
router.post('/edit-Category/:id',adminAuth,categoryController.editCategory)
router.post('/deleteCategory/:id',adminAuth,categoryController.deleteCategory)

// product management
router.get("/products",adminAuth,productController.getproductsList);
router.get("/add-product",adminAuth,productController.getAddProduct);
router.post("/add-product",adminAuth, upload.array("image", 3),productController.addProduct);
router.post("/deleteProduct/:id",adminAuth,productController.deleteProduct)
router.get('/editProduct/:id',adminAuth,productController.getEditProduct)



module.exports =router
