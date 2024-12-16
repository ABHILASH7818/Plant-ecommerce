const User = require("../models/usermodel");
const Coupon = require("../models/couponmodel")


exports.getCoupon = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 4; 
        const skip = (page - 1) * limit; 

        const coupon =await Coupon.find({})
        .sort({ createdAt: 1 }) 
        .skip(skip) 
        .limit(limit) 
        .exec();

        const totalCoupons = await Coupon.countDocuments(); 
        const totalPages = Math.ceil(totalCoupons / limit); 

        res.render("admin/coupons",{
            coupon:coupon,  
            currentPage: page,
            totalPages: totalPages,
            totalCoupons: totalCoupons
        })
    } catch (error) {
        console.log("coupen page error",error)
        res.redirect("/pagenotfound")
    }
}

exports.getAddCoupon = async(req,res)=>{
    try {
        res.render("admin/addCoupon")
    } catch (error) {
        console.loge("add coupen page error",error)
        res.redirect("/pagenotfound")
    }
}

 exports.postAddCoupon = async(req,res)=>{
    try {
        const { name, description, code, minPurchase, discount, maxDiscount, usageLimit,  expireDate } = req.body;
    
        const newCoupon = new Coupon({
          name,
          description,
          code,
          minPurchase,
          discount,
          maxDiscount,
          usageLimit,
          expireDate,
        });
    
        await newCoupon.save();
         res.redirect('/admin/Coupons'); 
        // res.render('admin/addCoupon', { message: 'Failed to add coupon. Please try again.' });
      } catch (error) {
        console.log("coupon add error",error);
        res.redirect("/pagenotfond")
      }
 }

 exports.getEditCoupon =async(req,res)=>{
    try {
        const coupon = await Coupon.findById(req.params.id);
        res.render('admin/editCoupon',{coupon})
    } catch (error) {
        console.log("not get edit coupon",error)
        res.redirect("/pagenotfound");
    }
 }

 exports.postEditCoupon =async(req,res)=>{
    try {
        const id = req.params.id;
        const { name, description, code, minPurchase, discount, maxDiscount, usageLimit,  expireDate } = req.body;
        // const existCoupon = await Category.findOne({name:req.name});
       
        // if(existCoupon){
        //    return res.render("admin/edit-category",{message:" not exist category"})
        // }
        const updateCoupon  = await Coupon.findByIdAndUpdate(id,{
            name:name,
            description:description,
            code:code,
            minPurchase:minPurchase,
            discount:discount,
            maxDiscount:maxDiscount,
            usageLimit:usageLimit,
            expireDate:expireDate,
            
        });
       
    //   await  Category.findByIdAndUpdate(req.params.id,req.body);
        if(updateCoupon){
            
           return res.redirect('/admin/Coupons')
        }
        else{
            return res.render("admin/editCoupon",{message:"Coupon not found"})
        }
        // return res.redirect('/admin/category');
    } catch (error) {
        console.log("change is not added",error);
        res.status(404).send({error:"Internal server error"})        
    }
 }


 exports.deleteCoupon =  async (req,res)=>{
    try {
        await Coupon.findByIdAndDelete(req.params.id);
    res.redirect('/admin/Coupons');
    } catch (error) {
        res.status(404).json({error:"Internal server error"})      
    }
  }