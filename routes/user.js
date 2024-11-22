const express =require("express");
const router = express.Router();
const userController =require("../controllers/userController");
const productController = require("../controllers/productController")
const passport = require("passport");
const {userAuth,adminAuth} = require("../middlewares/auth")

router.get('/',userController.loadHome)
router.get('/shop',userController.getproducts)
router.post("/signup",userController.postsignup)
router.get('/signup',userController.getsignup)
// router.get('/otp',userController.getotpverification)
router.post('/verify-otp',userController.verifyotp)
router.post("/resend-otp",userController.resendOtp)

router.get("/login",userController.getlogin)
router.post('/login',userController.postlogin)
router.get('/logout',userController.logout)

router.get("/productDetails/:id",productController.getProductDetails)

router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}))
router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect: '/signup'}),(req,res)=>{
    res.redirect('/');
})





module.exports =router