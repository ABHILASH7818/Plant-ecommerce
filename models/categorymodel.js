const { name } = require("ejs");
const mongoose =require("mongoose");

const categorySchema = new mongoose.Schema({
    name:{ type: String,required: true } ,
    description :{ type: String,required: true } ,
    status :{type:Boolean,required:true},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
})

const Category = mongoose.model("Category",categorySchema);
module.exports = Category;