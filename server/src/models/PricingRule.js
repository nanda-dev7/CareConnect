import mongoose from 'mongoose';

const pricingRuleSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    unique: true
  },
  categoryName: {
    type: String,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  emergencyFee: {
    type: Number,
    default: 150,
    min: 0
  },
  weekendFee: {
    type: Number,
    default: 100,
    min: 0
  },
  serviceFee: {
    type: Number,
    default: 50,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);
