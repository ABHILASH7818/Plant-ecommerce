const express =require("express");
const router = express.Router();
const userController =require("../controllers/userController");
const productController = require("../controllers/productController")
const profileController = require("../controllers/profileController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")
const passport = require("passport");
const {userAuth,adminAuth} = require("../middlewares/auth")


router.get('/',userController.loadHome)
//singup
router.post("/signup",userController.postsignup)
router.get('/signup',userController.getsignup)
// router.get('/otp',userController.getotpverification)
router.post('/verify-otp',userController.verifyotp)
router.post("/resend-otp",userController.resendOtp)

//signup with google
router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}))
router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect: '/signup'}),(req,res)=>{
    res.redirect('/');
})

//loginlogout
router.get("/login",userController.getlogin)
router.post('/login',userController.postlogin)
router.get('/logout',userController.logout)

//productlist management
router.get('/shop',userController.getShopPage)
router.get('/shopFilter',userController.getShopFilerPage)

//product management
router.get("/productDetails/:id",productController.getProductDetails)

//user-account
router.get("/profile",userAuth,profileController.getUserAccount);
router.get("/edit-profile",userAuth,profileController.getEditProfile);
router.post("/edit-profile",userAuth,profileController.postEditProfile);
router.post("/verify-profile-otp",userAuth,profileController.verifyotp)
router.get("/order",userAuth,profileController.getorder)
router.get("/orderview/:id",userAuth,profileController.getorderview)
//password change
router.get("/change-password",userAuth,profileController.getChangePassword);
router.post("/change-password",userAuth,profileController.postChangePasword)
//address management
router.get("/address",userAuth,profileController.getAddress);
router.post("/address",userAuth,profileController.postrAddress);
router.get("/editAddress/:id",userAuth,profileController.editAddress)
router.post("/editAddress/:id",userAuth,profileController.postEditAddress)
router.get("/deleteAddress/:id",userAuth,profileController.deleteAddeess)

//cart-management
router.get("/cart",userAuth,cartController.getCart);
router.post("/add-to-cart/:id",userAuth,cartController.addToCart)
router.post("/cart-delete/:id",userAuth,cartController.deleteCart)
router.post("/checkout",userAuth,cartController.updateCart)

//order-management
router.get("/order-summary",userAuth,cartController.getOrderSummary)
router.post("/saveAddress",userAuth,cartController.addNewAddress)
router.post("/placeOrder",userAuth,cartController.postOrderSummary)
router.get("/orderSuccess",userAuth,orderController.getOrderSuccess)


module.exports =router