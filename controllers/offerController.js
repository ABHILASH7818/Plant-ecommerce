const Product = require("../models/productmodel");
const Category = require("../models/categorymodel");
const Offer = require("../models/offermodel")


exports.getoffersList = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 4; 
        const skip = (page - 1) * limit; 

        // Fetch the paginated category data
        const offertData = await Offer.find({})
            .sort({ createdAt: 1 }) 
            .skip(skip) 
            .limit(limit)
            .populate("typeId")
            .exec();

             
        const totalOffers = await Offer.countDocuments(); 
        const totalPages = Math.ceil(totalOffers / limit); 

        return res.render('admin/offers',{offer:offertData,  currentPage: page, totalPages:totalPages});
    } catch (error) {
        console.log("offer page not found");
        res.status(404).send("page not found")
    }
}

exports.getAddOffer = async(req,res)=>{
    try {
        const category = await Category.find({status:true})
        const product = await Product.find({})
        res.render('admin/addOffer',{category:category,product:product})
    } catch (error) {
        console.log("add offer error",error);
        res.redirect('/pagenotfound')
    }
}
exports.postAddOffer = async(req,res)=>{
    try {
        const { name, discount, type, typeId, startDate, expireDate } = req.body;

    
    const newOffer = new Offer({
      name,
      discount,
      type,
      typeId,
      startDate,
      expireDate,
    });
    await newOffer.save();

    // Update the corresponding collection
    if (type === 'category') {
      await Category.findByIdAndUpdate(typeId, { categoryOffer: discount });
      const category =await Category.findById(typeId)
      const products = await Product.find({category:category._id})
      if(products.length>0){ 
        for(const product of products ){
             product.salePrice =product.regularPrice - Math.floor(product.regularPrice * (discount/100))
            product.productOffer = 0;
            await product.save();
        }
      }
    } else if (type === 'product') {
        const product = await Product.findById(typeId);
        product.salePrice = product.regularPrice - Math.floor(product.regularPrice * (discount / 100));
        product.productOffer = discount;
        await product.save();
    }

    res.redirect("/admin/offers")
    } catch (error) {
        console.error(error);
    res.status(500).send('An error occurred while adding the offer.')
    }
}

exports.deleteOffer = async(req,res)=>{
    try {
        const offerId =req.params.id;
        const offerData = await Offer.findById(offerId);
        console.log("offerdata",offerData.typeId,offerData.type)
        if(offerData.type == "category"){
            await Category.findByIdAndUpdate(offerData.typeId, { categoryOffer: 0 });
            const category =await Category.findById(offerData.typeId)
            const products = await Product.find({category:category._id})
            if(products.length>0){ 
              for(const product of products ){
                //    product.salePrice =product.regularPrice + Math.floor(product.regularPrice * (offerData.discount/100))
                product.salePrice =product.regularPrice;
                await product.save();
              }
            }
        }else if (offerData.type === 'product') {
            const product = await Product.findById(offerData.typeId);
            // product.salePrice = product.regularPrice + Math.floor(product.regularPrice * (offerData.discount / 100));
            product.salePrice =product.regularPrice; 
            product.productOffer = 0;
            await product.save();
        }
        await Offer.findByIdAndDelete(req.params.id);
    res.redirect("/admin/offers")
    } catch (error) {
        console.log("offer not delete",error)
        res.redirect("/pagenotfound")
    }
}