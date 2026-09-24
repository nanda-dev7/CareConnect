import mongoose from 'mongoose';
import { REQUEST_STATUS, URGENCY_LEVELS } from '../utils/constants.js';

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, default: 'image' }
}, { _id: false });

const locationSchema = new mongoose.Schema({
  address: { type: String, default: '' },
  city: { type: String, default: 'Hyderabad' },
  state: { type: String, default: 'Telangana' },
  zipCode: { type: String, default: '' },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  }
}, { _id: false });

const aiClassificationSchema = new mongoose.Schema({
  category: { type: String },
  skills: [{ type: String }],
  urgency: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  rawResponse: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const serviceRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  categoryName: {
    type: String,
    trim: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  location: {
    type: locationSchema,
    default: () => ({})
  },
  preferredDate: {
    type: Date
  },
  preferredTime: {
    type: String,
    trim: true
  },
  urgency: {
    type: String,
    enum: Object.values(URGENCY_LEVELS),
    default: URGENCY_LEVELS.MEDIUM
  },
  attachments: [attachmentSchema],
  aiClassification: {
    type: aiClassificationSchema,
    default: () => ({ status: 'pending', skills: [] })
  },
  status: {
    type: String,
    enum: Object.values(REQUEST_STATUS),
    default: REQUEST_STATUS.OPEN
  }
}, {
  timestamps: true
});

serviceRequestSchema.index({ customerId: 1, status: 1 });
serviceRequestSchema.index({ categoryName: 1, status: 1 });

export const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
