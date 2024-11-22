const User = require("../models/usermodel");


exports.customerInfo = async(req,res)=>{
    try {
        let search = "";
        if(req.query.search){
            search =req.query.search;
        }
        let page = 1;
        if(req.query.page){
            page =req.query.page
        }
        const limit=4;
        const data = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ]
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();

        const count = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ]
        }).countDocuments();
        // const data = await User.find({isAdmin:false});
         res.render('admin/usersList',{data,
            totalPages:Math.ceil(count/limit),
            currentPage: page
         });
    } catch (error) {
        console.log("adminpanel page not found");
        res.status(404).send("page not found")
       
    }
}


exports.blockUser = async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isblock:true}});
        res.redirect("/admin/users");
    } catch (error) {
        res.redirect("/pageerror")
    }
}

exports.unblockUser = async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isblock:false}});
        res.redirect("/admin/users");
    } catch (error) {
        res.redirect("/pageerror")
    }
}