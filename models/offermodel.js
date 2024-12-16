const mongoose = require('mongoose');
// const { image } = require('pdfkit');

const offerSchema = new mongoose.Schema({
  image :{
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['category', 'product'],
    required: true,
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId, // Refers to Category/Product ID
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  expireDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('Offer', offerSchema);
