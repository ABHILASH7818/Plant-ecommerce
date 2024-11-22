const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const mongoose = require('mongoose')
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require("bcrypt")


//home page
exports.loadHome =async(req,res)=>{
    try {
        const categories =  await Category.find({status:true})
        let productData = await Product.find({
            category:{$in:categories.map(category=>category._id)},stock:{$gt:0}
        })

        productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        productData = productData.slice(0,4);
        if( req.session.user){
            const user =  req.session.user;
            res.render('user/index',{user,products:productData});
        }else{
            
            return  res.render('user/index',{products:productData})
        }
        
    } catch (error) {
        console.log("home page not found");
        res.status(404).send("page not found")
    }
}





    //otp-generate

function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}

async function sentVerificationEmail(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port :587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL, 
                pass:process.env.NODEMAILER_PASSWORD ,
            }
        })
        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to: email,
            subject:"verify your account",
            text:`Your OTP is ${otp}`,
            html: `<b>Your OTP : ${otp}</b>`
        })
        return info.accepted.length>0
    } catch (error) {
        console.error("Error sending email",error);
        return false;
    }
}


    //signup
 exports.getsignup = async(req,res)=>{
       try {
           return res.render('user/signup')
       } catch (error) {
           console.log("signup page not found");
           res.status(404).send("page not found")
       }
   }

exports.postsignup = async(req,res)=>{
    const {name,email,phone,password}= req.body;
    try {
        const existingUser = await User.findOne(  { email });
        
        if (existingUser) {
            return res.render('user/signup', {
                message: 'Username or email already exists'});
        }
        const otp =generateOtp();
        const emailSent = await sentVerificationEmail(email,otp);
        if(!emailSent){
            return res.json("email.errorr")
        }

        req.session.userOtp = otp;
        req.session.userData = {name,email,phone,password};

        res.render("user/verify-otp"); 
       
        console.log("OTP Sent",otp);
    } catch (error) {
        console.log("signup error",error);
        res.status(404).redirect("/pageNoteFound");
    }
}
    const hashedPassword = async function (password) {
        try {
         const passwordhash = await bcrypt.hash(password, 10);
         return passwordhash;
        } catch (error) {
            
        }
        
    }

    //otp-verification
    
// exports.getotpverification = async(req,res)=>{
//     try {
      
//        return res.render('user/otp')
//     } catch (error) {
//         console.log("user not create",error);
//         res.status(404).send("page not found")
//     }
// }
exports.verifyotp = async(req,res)=>{
    try {
      const {otp}= req.body;
      console.log(otp);

      if(otp==req.session.userOtp){
        const user =req.session.userData;
        const passwordhash =await hashedPassword(user.password);
            const newUser = new User({ name:user.name, email:user.email, phone : user.phone, password: passwordhash });
            await newUser.save();
            
           
            res.render('user/login')
      }else{
        res.render('user/verify-otp',{
            message: 'Username or email already exists'})
      }
      
    } catch (error) {
        console.error("error  verifying OTP",error);
        res.status(404).send("page not found confirm")
    }
}

exports.resendOtp = async(req,res)=>{
    try {
        const {email} = req.session.userData;
        if(!email){
            return res.render('user/verify-otp',{message:"email not fount in session"}) 
        }
        const otp =generateOtp();
        req.session.userOtp = otp;
        const emailsent =await sendVerificationEmail(email,otp);
        if(emailsent){
            console.log("resend otp :",otp);
            res.render('user/verify-otp',{message:"otp send success"});
        }else{
            res.render('user/verify-otp',{message:"failed to sent otp"});
        }
    } catch (error) {
        console.error("error sending error",error);
        res.render('user/verify-otp',{message:"please try again"});
    }
}


    //user auth 

exports.getlogin =async(req,res)=>{
    try {
        if(req.session.user){
           return res.redirect("/")
        }else{
             return res.render('user/login');
        }
       
    } catch (error) {
        console.log("home page not found");
        res.status(404).send("page not found")
    }
}

exports.postlogin = async(req,res)=>{
    const {email,password} = req.body;
    try {
         const finduser =await User.findOne({isAdmin:false, email:email });
         if(!finduser){
            return res.render('user/login', {
                message: 'User not found'});
         }
         if(finduser.isblock){
            return res.render('user/login',{message:"User blocked by admin"})
         }
       const checkPassword = await bcrypt.compare(password ,finduser.password)
       if( !checkPassword){
       return res.render("user/login",{message:"Incorrect password"})
       }
       req.session.user = finduser
     console.log(" logined")
        res.redirect('/');
       
    } catch (error) {
        console.error("login error",error);
        res.render("user/login",{message:"login failed, please try again later "})
    }
}

exports.logout= async(req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("session destruction error",err.message);
                 return res.redirect("/pagenotefound");
            }
            console.log("logout");
            return res.redirect("/login")           
        })
    } catch (error) {
        console.log("logout error",error);
        res.redirect('/pagenotfound')
    }
}


exports.getproducts = async(req,res)=>{
    try {
        return res.render('user/shop')
    } catch (error) {
        console.log("shop page not found");
        res.status(404).send("page not found")
    }
}