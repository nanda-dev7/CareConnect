import { JobEvidence } from '../models/JobEvidence.js';
import { Booking } from '../models/Booking.js';
import { Provider } from '../models/Provider.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { ROLES, EVIDENCE_TYPES } from '../utils/constants.js';

export const uploadJobEvidence = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { type = EVIDENCE_TYPES.AFTER, description } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Provider check
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider || booking.providerId.toString() !== provider._id.toString()) {
      if (![ROLES.ADMIN, ROLES.OPERATIONS].includes(req.user.role)) {
        return sendError(res, 403, 'Only the assigned provider can upload job evidence', 'ACCESS_DENIED');
      }
    }

    if (!req.file && !req.body.fileUrl) {
      return sendError(res, 400, 'Please upload a file or provide a fileUrl', 'MISSING_FILE');
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;

    const evidence = await JobEvidence.create({
      bookingId,
      providerId: provider ? provider._id : booking.providerId,
      type,
      fileUrl,
      description: description || ''
    });

    return sendSuccess(res, 201, 'Job evidence uploaded successfully', evidence);
  } catch (error) {
    next(error);
  }
};

export const getJobEvidence = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Verify access
    if (req.user.role === ROLES.CUSTOMER && booking.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied', 'FORBIDDEN');
    }

    const evidence = await JobEvidence.find({ bookingId }).sort({ uploadedAt: -1 });
    return sendSuccess(res, 200, 'Job evidence retrieved', evidence);
  } catch (error) {
    next(error);
  }
};
