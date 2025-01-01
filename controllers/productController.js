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
            .sort({ createdAt: -1 }) 
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
                salePrice: product.price,
                regularPrice:product.price,
                color: product.color,
                rating:product.rating,
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
 

exports.deleteProduct =  async (req,res)=>{
  try {
      await Product.findByIdAndDelete(req.params.id);
  res.redirect('/admin/products');
  } catch (error) {
      res.status(404).json({error:"Internal server error"})      
  }
}
exports.getEditProduct =  async (req,res)=>{
  try {    
     const category = await Category.find({status:true})
     const product = await Product.findById(req.params.id) .populate('category');
     res.render('admin/edit-product',{product:product,cat:category});   
  } catch (error) {
      res.redirect('/pageerror')
  }
}

//user side
exports.getProductDetails = async(req,res)=>{
  try {
    const productId =req.params.id; 
    const product = await Product.findById(productId);
    const category = product.category;
    console.log("product category",category)
    const products =await Product.find({category:category}).populate('category');
    console.log("similar product",products)
    const userId = req.session.user; 
    const userData = await User.findOne({_id:userId})
  //  console.log(product)
    return res.render("user/product-details",{user:userData,product:product,category:category, products:products})
  } catch (error) {
    console.log("error getting product-details",error);
    return res.redirect("/pagenotfound");
  }
}

exports.postEditProduct = async(req,res)=>{
  try {
    // const imgarr = [];
    const id = req.params.id;
      const product = req.body;
      // const images = req.files; 
      const existingImages = req.body.existingImages || []; // Images that are not deleted

      const newImages = req.files.map((file) => file.filename); // Uploaded images
      const updatedImages = [...existingImages, ...newImages]; // Combine old and new images

    

      const categoryId = await Category.findOne({name:product.category});
             if(!product.category){
            return res.status(400).json("Invalid category name")
           }
  
      //  save the new product
      const newProduct = await Product.findByIdAndUpdate(id,{
                productName: product.name,
                description: product.description,
                category: categoryId._id,
                stock:product.quantity,
                salePrice: product.price,
                regularPrice:product.price,
                color: product.color,
                rating:product.rating,
                images: updatedImages
                // images: imgarr,
                //stastus: 'Available' 
      });
  console.log("updation",newProduct);
      // await newProduct.save();
      return res.redirect("/admin/products");
  } catch (error) {
    
  }
}
