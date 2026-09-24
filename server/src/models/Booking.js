import mongoose from 'mongoose';
import { BOOKING_STATUS } from '../utils/constants.js';

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
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
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:MM format (24h)']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:MM format (24h)']
  },
  location: {
    address: { type: String, default: '' },
    city: { type: String, default: 'Hyderabad' },
    state: { type: String, default: 'Telangana' },
    zipCode: { type: String, default: '' }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.SCHEDULED
  },
  notes: [noteSchema],
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookingSchema.virtual('scheduledDate')
  .get(function() { return this.date; })
  .set(function(v) { this.date = v; });

bookingSchema.virtual('scheduledTime')
  .get(function() { return this.startTime; })
  .set(function(v) { this.startTime = v; });

bookingSchema.virtual('amount')
  .get(function() { return this.price; })
  .set(function(v) { this.price = v; });

bookingSchema.virtual('request')
  .get(function() { return this.requestId; });

bookingSchema.virtual('quote')
  .get(function() { return this.quoteId; });

bookingSchema.virtual('customer')
  .get(function() { return this.customerId; });

bookingSchema.virtual('provider')
  .get(function() { return this.providerId; });

bookingSchema.index({ providerId: 1, date: 1, status: 1 });
bookingSchema.index({ customerId: 1, status: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
