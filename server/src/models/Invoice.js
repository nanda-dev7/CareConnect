import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../utils/constants.js';

const invoiceSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  partsCost: {
    type: Number,
    default: 0,
    min: 0
  },
  serviceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  additionalCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

invoiceSchema.index({ customerId: 1, paymentStatus: 1 });
invoiceSchema.index({ providerId: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
