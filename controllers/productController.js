const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const User = require("../models/usermodel");
const sharp = require("sharp");
const fs = require("fs");
const path =require("path");


exports.getproductsList = async(req,res)=>{
    try {
      const page = parseInt(req.query.page) || 1; 
        const limit = 4; 
        const skip = (page - 1) * limit; 

        // Fetch the paginated category data
        const productData = await Product.find({})
            .sort({ createdAt: 1 }) 
            .skip(skip) 
            .limit(limit)
            .populate('category') 
            .exec();

        const totalCategories = await Product.countDocuments(); 
        const totalPages = Math.ceil(totalCategories / limit); 

        const category = await Category.find({status:true})

        // Render the admin/category page with pagination data
        res.render('admin/productList', {
            product: productData,
            cate:productData.category,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
        
        // return res.render('admin/productList');
    } catch (error) {
        console.log("prodectlist page not found");
        res.status(404).send("page not found")
    }
}


exports.getAddProduct = async (req,res)=>{
    try {
        const category = await Category.find({status:true})
        return res.render('admin/product-add',{cat:category});
    } catch (error) {
        console.log("prodectlist page not found");
        res.status(404).send("page not found")
    }
}

exports.addProduct = async (req, res) => {
    try {
      const imgarr = [];
      const product = req.body;
      const images = req.files; 
  
      
      if (!images || images.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
  
      
      for (let i = 0; i < images.length; i++) {
        imgarr.push(images[i].filename);
      }
  
      
      // console.log("Uploaded images:", imgarr);

      const categoryId = await Category.findOne({name:product.category});
             if(!product.category){
            return res.status(400).json("Invalid category name")
           }
  
      //  save the new product
      const newProduct = new Product({
                productName: product.name,
                description: product.description,
                category: categoryId._id,
                stock:product.quantity,
                price: product.price,
                color: product.color,
                images: imgarr,
                //stastus: 'Available' 
      });
  
      await newProduct.save();
      return res.redirect("/admin/products");
    } catch (err) {
      console.error("Error adding product:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
 

// exports.addProduct = async(req,res)=>{
//     try {
//         const products = req.body;
//         const productExists = await Product.findOne({
//             productName:products.productName
//         });
//         if(!productExists){
//             const images = [];
             
//             if(req.files && req.files.length >0){
//                 for(let i=0; i<req.files.length;i++){
//                     const originalImagePath = req.files[i].path;

//                     const resizedImagePath = path.join('public','uploads','product-images',req.files[i].filename);
//                     await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath);
//                     images.push(req.files[i].filename);
//                 }
//             }
//             // const categoryId = await Category.findOne({_id:products.category});
//             // if(!products.category){
//             //     return res.status(400).json("Invalid category name")
//             // }
//             const newProduct = new Product({
//                 productName: products.productName,
//                 description: products.description,
//                 // category: categoryId._id,
//                 regularPrice: products.regularPrice,
//                 salePrice: products.salePrice,
//                 color: products.color,
//                 productImage: images,
//                 stastus: 'Available' ,
            
//         });
//         await newProduct.save();
//         return res.redirect("/admin/products");
//     }else{
//         return res.stastus(400).json("product already exist.")
//     }

//     } catch (error) {
//         console.log("error add new product");
//         return req.redirect("/pageerror");
//     }
// }



exports.getProductDetails = async(req,res)=>{
  try {
    const productId =req.params.id; 
    const product = await Product.findById(productId);
    
  //  console.log(product)
    res.render("user/product-details",{product:product})
  } catch (error) {
    console.log("error getting product-details");
    return res.redirect("/pageerror");
  }
}