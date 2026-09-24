import mongoose from 'mongoose';
import { EVIDENCE_TYPES } from '../utils/constants.js';

const jobEvidenceSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(EVIDENCE_TYPES),
    default: EVIDENCE_TYPES.AFTER
  },
  fileUrl: {
    type: String,
    required: [true, 'Evidence file URL is required']
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

jobEvidenceSchema.index({ bookingId: 1, providerId: 1 });

export const JobEvidence = mongoose.model('JobEvidence', jobEvidenceSchema);
