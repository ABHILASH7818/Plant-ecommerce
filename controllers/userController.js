const User = require("../models/usermodel");
const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Offer = require("../models/offermodel")
const mongoose = require('mongoose')
const nodemailer = require("nodemailer")
const env = require("dotenv").config()
const bcrypt = require("bcrypt")


//home page
exports.loadHome =async(req,res)=>{
    try {
        const offer = await Offer.find({});
        const categories =  await Category.find({status:true})
        let productData = await Product.find({
            category:{$in:categories.map(category=>category._id)},stock:{$gt:0}
        })

        productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        productData = productData.slice(0,4);
        if( req.session.user){
            const userId = req.session.user; 
            const userData = await User.findOne({_id:userId})
            res.render('user/index',{user:userData,products:productData,offer:offer});
        }else{
            
            return  res.render('user/index',{products:productData,offer:offer})
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

async function sendVerificationEmail(email,otp) {
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
        const emailSent = await sendVerificationEmail(email,otp);
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
            message: 'Invalid Otp'})
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
        // req.session.userOtp = otp;
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            req.session.userOtp = otp;
            console.log("Resend OTP :",otp);
            res.render('user/verify-otp',{message:"otp send success"});
        }else{
            res.render('user/verify-otp',{message:"failed to sent otp"});
        }
    } catch (error) {
        console.error("error sending error",error);
        res.render('user/verify-otp',{message:"please try again"});
    }
}



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
       const checkPassword = await bcrypt.compare(password, finduser.password)
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



//shoping-page
exports.getShopPage = async(req,res)=>{
    try {
        const { category, minPrice, maxPrice, search, sort } = req.query;
        if(!req.query){
        const categoryData = await Category.find({status:true})
        const userId = req.session.user; 
        const userData = await User.findOne({_id:userId})
        const page = parseInt(req.query.page) || 1; 
        const limit = 6; 
        const skip = (page - 1) * limit;

        // Fetch the paginated category data
        const productData = await Product.find({})
            .sort({ createdAt: -1 }) 
            .skip(skip) 
            .limit(limit)
            .populate('category') 
            .exec();

            const totalProducts = await Product.countDocuments({stock:{$gt:0}})
            const totalPages = Math.ceil(totalProducts / limit); 

        return res.render('user/shop',{
            user:userData,
            product:productData,
            category:categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalProducts: totalProducts
        })
    }
    if(req.query){
        const userId = req.session.user;
                const categories = await Category.find({ status: true });
                const page = parseInt(req.query.page) || 1; // Current page
                const limit = 6; // Items per page
                const skip = (page - 1) * limit; // Items to skip
                let filter = {};
                let sortOption = {};
        
                // Category Filtering
                if (category) {
                    const categoryDoc = await Category.findOne({ name: category });
                    if (categoryDoc) {
                        filter.category = categoryDoc._id;
                    }
                }
        
                // Price Filtering
                if (minPrice || maxPrice) {
                    filter.salePrice = {};
                    if (minPrice) filter.salePrice.$gte = parseFloat(minPrice);
                    if (maxPrice) filter.salePrice.$lte = parseFloat(maxPrice);
                }
        
                // Search Filtering
                if (search) {
                    filter.productName = { $regex: search, $options: 'i' }; // Case-insensitive search
                }
        
                // Sorting
                if (sort) {
                    switch (sort) {
                        case 'price-asc':
                            sortOption.salePrice = 1;
                            break;
                        case 'price-desc':
                            sortOption.salePrice = -1;
                            break;
                        case 'name-asc':
                            sortOption.productName = 1;
                            break;
                        case 'name-desc':
                            sortOption.productName = -1;
                            break;
                        case 'new':
                            sortOption.createdAt = -1;
                            break;
                        default:
                            break;
                    }
                }              
                
                
                // Existing logic for category, price, and search filtering...
                // Apply filter and sort, and limit results for pagination
                const totalProducts = await Product.countDocuments(filter); // Count products matching the filter
                const totalPages = Math.ceil(totalProducts / limit); // Calculate total pages
                
                const products = await Product.find(filter)
                    .populate('category')
                    .sort(sortOption)
                    .skip(skip)
                    .limit(limit);
                
                res.render('user/shop', { 
                    product: products, 
                    category: categories, 
                    selectedCategory: category || "", 
                    user: userId,
                    currentPage: page,
                    totalPages: totalPages
                });
    }
    } catch (error) {
        console.log("shop page not found");
        res.status(404).send("page not found")
    }
}

// exports.getShopFilterPage = async (req, res) => {
//     try {
//         const { category, minPrice, maxPrice, search, sort } = req.query;
//         const userId = req.session.user;
//         const categories = await Category.find({ status: true });
//         let filter = {};
//         let sortOption = {};

//         // Category Filtering
//         if (category) {
//             const categoryDoc = await Category.findOne({ name: category });
//             if (categoryDoc) {
//                 filter.category = categoryDoc._id;
//             }
//         }

//         // Price Filtering
//         if (minPrice || maxPrice) {
//             filter.salePrice = {};
//             if (minPrice) filter.salePrice.$gte = parseFloat(minPrice);
//             if (maxPrice) filter.salePrice.$lte = parseFloat(maxPrice);
//         }

//         // Search Filtering
//         if (search) {
//             filter.productName = { $regex: search, $options: 'i' }; // Case-insensitive search
//         }

//         // Sorting
//         if (sort) {
//             switch (sort) {
//                 case 'price-asc':
//                     sortOption.salePrice = 1;
//                     break;
//                 case 'price-desc':
//                     sortOption.salePrice = -1;
//                     break;
//                 case 'name-asc':
//                     sortOption.productName = 1;
//                     break;
//                 case 'name-desc':
//                     sortOption.productName = -1;
//                     break;
//                 case 'new':
//                     sortOption.createdAt = -1;
//                     break;
//                 default:
//                     break;
//             }
//         }

//         // Fetch and Render Products
//         const products = await Product.find(filter)
//             .populate('category')
//             .sort(sortOption);

//         res.render('user/shop', { 
//             product: products, 
//             category: categories, 
//             selectedCategory: category || "", 
//             user: userId 
//         });
//     } catch (error) {
//         console.error('Error in getShopFilterPage:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };

  


exports.getShopFilterPage = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search, sort } = req.query;
        const userId = req.session.user;
        const categories = await Category.find({ status: true });
        let filter = {};
        let sortOption = {};

        // Category Filtering
        if (category) {
            const categoryDoc = await Category.findOne({ name: category });
            if (categoryDoc) {
                filter.category = categoryDoc._id;
            }
        }

        // Price Filtering
        if (minPrice || maxPrice) {
            filter.salePrice = {};
            if (minPrice) filter.salePrice.$gte = parseFloat(minPrice);
            if (maxPrice) filter.salePrice.$lte = parseFloat(maxPrice);
        }

        // Search Filtering
        if (search) {
            filter.productName = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        // Sorting
        if (sort) {
            switch (sort) {
                case 'price-asc':
                    sortOption.salePrice = 1;
                    break;
                case 'price-desc':
                    sortOption.salePrice = -1;
                    break;
                case 'name-asc':
                    sortOption.productName = 1;
                    break;
                case 'name-desc':
                    sortOption.productName = -1;
                    break;
                case 'new':
                    sortOption.createdAt = -1;
                    break;
                default:
                    break;
            }
        }

        // Fetch and Render Products
        const products = await Product.find(filter)
            .populate('category')
            .sort(sortOption);

        res.render('user/shop', { product: products, category: categories, user: userId });
    } catch (error) {
        console.error('Error in getShopFilterPage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// exports.getShopFilterPage = async (req,res)=>{
//     try {
//         const userId = req.session.user;
//         const categories = await Category.find({status:true})
//         const { category, minPrice, maxPrice } = req.query;
//         const page = parseInt(req.query.page) || 1;
//         const limit = 6;

//   let filter = {};

//   if(category || category===all){
//     filter.Category= category;
//   }
  

//   if (minPrice && maxPrice) {
//     filter.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
//   }

  
//   const products = await Product.find(filter) 
//     .skip((page - 1) * limit)
//     .limit(limit);
  

//   res.render("user/shop", {
//     product: products,
//     category: categories, 
//    user:userId
//   });

   
//     } catch (error) {
//         console.log("shop filter page error",error);
//         res.status(404).send("page not found");
//     }
// }

