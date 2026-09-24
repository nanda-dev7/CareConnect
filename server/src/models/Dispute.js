import mongoose from 'mongoose';
import { DISPUTE_STATUS } from '../utils/constants.js';

const disputeSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
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
  reason: {
    type: String,
    required: [true, 'Dispute reason is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Dispute description is required'],
    trim: true
  },
  evidence: [{
    type: String
  }],
  status: {
    type: String,
    enum: Object.values(DISPUTE_STATUS),
    default: DISPUTE_STATUS.OPEN
  },
  resolution: {
    type: String,
    default: '',
    trim: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

disputeSchema.index({ status: 1 });
disputeSchema.index({ bookingId: 1 });

export const Dispute = mongoose.model('Dispute', disputeSchema);
