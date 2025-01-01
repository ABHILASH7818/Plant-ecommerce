const User = require("../models/usermodel");
const Category = require("../models/categorymodel");


exports.categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 4; 
        const skip = (page - 1) * limit; 

        // Fetch the paginated category data
        const categoryData = await Category.find({})
            .sort({ createdAt: 1 }) 
            .skip(skip) 
            .limit(limit); 

        const totalCategories = await Category.countDocuments(); 
        const totalPages = Math.ceil(totalCategories / limit); 

        // Render the admin/category page with pagination data
        res.render('admin/category', {
            category: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};



exports.addCategory = async(req,res)=>{
    const {name,description,status} =req.body;
    try {
        const existCategory = await Category.findOne({name});
        if(existCategory){
            return res.status(400).render('admin/addCategory',{
                message: "Category already exists"})
        }
        const newCategory = new Category({name:name,description:description,status:status})
        await newCategory.save();
        return res.redirect("/admin/category")
        // return res.json({message:"Category added successfully"})
    } catch (error) {
        console.log("newCategiry is not added");
        res.status(404).json({error:"Internal server error"})
    }
}

exports.getaddCategory = async(req,res)=>{
    try {
        return res.render('admin/addCategory');
    } catch (error) {
        console.log("adminpanel page not found");
        res.status(404).send("page not found")
    }
}


exports.getEditCategory = async (req,res)=>{
    try {        
        const category = await Category.findById(req.params.id);
        res.render('admin/edit-category',{category})
    } catch (error) {
        res.redirect('/pageerror')
    }
}

exports.editCategory = async (req,res)=>{
    try {
        const id = req.params.id;
        const {name,description,status} = req.body;
        const existCategory = await Category.findOne({name:req.name});
       
        if(existCategory){
           return res.render("admin/edit-category",{message:" not exist category"})
        }
        const updateCategory  = await Category.findByIdAndUpdate(id,{
            name:name,
            description:description,
            status:status,
            
        });
       
    
        if(updateCategory){
            
           return res.redirect('/admin/category')
        }
        else{
            return res.render("admin/edit-category",{message:"category not found"})
        }
        return res.redirect('/admin/category');
    } catch (error) {
        console.log("change is not added");
        res.status(404).send({error:"Internal server error"})        
    }
}


exports.deleteCategory = async (req,res)=>{
    try {
        await Category.findByIdAndDelete(req.params.id);
    res.redirect('/admin/category');
    } catch (error) {
        res.status(404).json({error:"Internal server error"})      
    }
}