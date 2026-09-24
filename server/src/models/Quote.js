import mongoose from 'mongoose';
import { QUOTE_STATUS } from '../utils/constants.js';

const quoteSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Quote price is required'],
    min: [0, 'Price cannot be negative']
  },
  estimatedDuration: {
    type: String,
    required: [true, 'Estimated duration is required'],
    trim: true
  },
  availableDate: {
    type: Date,
    required: [true, 'Available date is required']
  },
  availableTime: {
    type: String,
    required: [true, 'Available time is required'],
    trim: true
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(QUOTE_STATUS),
    default: QUOTE_STATUS.PENDING
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

quoteSchema.virtual('amount')
  .get(function() { return this.price; })
  .set(function(v) { this.price = v; });

quoteSchema.virtual('request')
  .get(function() { return this.requestId; });

quoteSchema.virtual('provider')
  .get(function() { return this.providerId; });

quoteSchema.index({ requestId: 1, providerId: 1 });

export const Quote = mongoose.model('Quote', quoteSchema);
