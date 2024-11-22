const express =require("express");
const router = express.Router();
const path = require('path');
const Product = require("../models/productmodel");
const adminController =require("../controllers/adminController")
const customerController = require('../controllers/customerController')
const categoryController =require('../controllers/categoryController')
const productController = require("../controllers/productController")
const {userAuth,adminAuth} = require("../middlewares/auth")
const upload = require("../middlewares/multer");


router.get('/',adminController.getadminlogin);
router.post('/login',adminController.postlogin)
router.get('/dashboard',adminAuth,adminController.getadminpanel);
router.get('/logout',adminController.logout)

//user management
router.get("/users",adminAuth,customerController.customerInfo)
router.get("/blockCustomer",customerController.blockUser)
router.get("/unblockCustomer",customerController.unblockUser)

router.get("/offers",adminController.getoffersList)

// category management
router.get("/category",categoryController.categoryInfo)
router.get("/addcategory",categoryController.getaddCategory)
router.post("/addcategory",categoryController.addCategory)
router.get('/editCategory/:id',categoryController.getEditCategory)
router.post('/edit-Category/:id',categoryController.editCategory)
router.post('/deleteCategory/:id',categoryController.deleteCategory)

// product management
router.get("/products",productController.getproductsList);
router.get("/add-product",productController.getAddProduct);
router.post("/add-product", upload.array("image", 3),productController.addProduct);


module.exports =router
