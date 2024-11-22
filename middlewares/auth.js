const User = require("../models/usermodel");

const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isblock){
                next();
            }else{
                res.redirect("/login")
            }
        })
        .catch(error=>{
            console.log("error in user middleware",error)
            res.status(500).send("internal server error")
        })
    }else{
        res.redirect("/login")
    }
}

const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect("/admin")
        }
    })
    .catch(error=>{
        console.log("error in admin middleware",error);
        res.status(500).send("internal server error")
    })
}


module.exports= {
    userAuth,
    adminAuth
}