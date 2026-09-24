import mongoose from 'mongoose';
import { PROVIDER_STATUS } from '../utils/constants.js';

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, default: 'identity' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const pricingSchema = new mongoose.Schema({
  hourlyRate: { type: Number, default: 0 },
  calloutFee: { type: Number, default: 0 },
  emergencyRate: { type: Number, default: 0 }
}, { _id: false });

const providerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    default: '',
    trim: true
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  categories: [{
    type: String,
    trim: true
  }],
  serviceAreas: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: 1,
    min: 0
  },
  experienceYears: {
    type: Number,
    default: 1,
    min: 0
  },
  pricing: {
    type: pricingSchema,
    default: () => ({ hourlyRate: 300, calloutFee: 100, emergencyRate: 450 })
  },
  documents: [documentSchema],
  verificationStatus: {
    type: String,
    enum: Object.values(PROVIDER_STATUS),
    default: PROVIDER_STATUS.PENDING
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Provider = mongoose.model('Provider', providerSchema);
