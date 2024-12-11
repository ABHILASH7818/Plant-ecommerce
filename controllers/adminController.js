const User = require("../models/usermodel");
const bcrypt = require("bcrypt")


exports.getadminlogin =async(req,res)=>{
    try {
        if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
        return res.render('admin/login');
    } catch (error) {
        console.log("adminpanel page not found");
        res.status(404).send("page not found")
    }
}

exports.postlogin= async(req,res)=>{
    const {email,password} = req.body;
    try {
        const findadmin =await User.findOne({ email,isAdmin:true });
        if(!findadmin){
           return res.render('admin/login', {
               message: 'admin not found'});
        }
        const checkPassword = await bcrypt.compare(password ,findadmin.password)
       if( !checkPassword){
        console.log("password wrong")
       return res.render("admin/login",{message:"Incorrect password"})
       }
       req.session.admin=findadmin._id;
       res.redirect('/admin/dashboard')
        
    } catch (error) {
        console.error("login found",error);
        res.render("admin/login",{message:"login failed, please try again later "})
    }
}

exports.getadminpanel =async(req,res)=>{
    try {
        if(req.session.admin){
            return res.render('admin/adminhome');
        }else{
            return res.redirect('/admin')
        }
        
    } catch (error) {
        console.log("adminpanel page not found");
        res.status(404).send("page not found")
    }
}

exports.logout = async(req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("session destruction error",err.message);
                 return res.redirect("/pagenotefound");
            }
            console.log("logout");
            return res.redirect("/admin")           
        })
    } catch (error) {
        console.log("logout error",error);
        res.redirect('/pagenotfound')
    }
}





