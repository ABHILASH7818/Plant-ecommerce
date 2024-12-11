const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({ 
  name: { type: String, required: true},
  description: { type: String, required: true},
  code: { type: String, required: true, unique: true},
  maxDiscount: { type: Number, default: 0 },
  minPurchase: { type: Number, required: true },
  discount: { type: Number, required: true, min: 1, max: 100 },
  expireDate: { type: Date, required: true },
  usageCount: { type: Number, default: 0 }, // Track usage
  usageLimit: { type: Number, default: 1 }, // Max times coupon can be used
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Coupon', couponSchema);
