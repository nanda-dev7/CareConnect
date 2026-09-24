import { Booking } from '../models/Booking.js';
import { Provider } from '../models/Provider.js';
import { Dispute } from '../models/Dispute.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { BOOKING_STATUS, DISPUTE_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';

export const getOperationsDashboard = async (req, res, next) => {
  try {
    const [activeJobs, scheduledBookings, escalations] = await Promise.all([
      Booking.countDocuments({ status: { $in: [BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.IN_PROGRESS] } }),
      Booking.countDocuments({ status: BOOKING_STATUS.SCHEDULED }),
      Dispute.countDocuments({ status: DISPUTE_STATUS.ESCALATED })
    ]);

    return sendSuccess(res, 200, 'Operations dashboard retrieved', {
      metrics: {
        activeJobs,
        scheduledBookings,
        escalations
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveJobs = async (req, res, next) => {
  try {
    const activeJobs = await Booking.find({
      status: { $in: [BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.IN_PROGRESS] }
    })
      .populate('customerId', 'name email phone address')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('requestId', 'categoryName description urgency')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, 200, 'Active jobs retrieved', activeJobs);
  } catch (error) {
    next(error);
  }
};

export const getEscalations = async (req, res, next) => {
  try {
    const escalations = await Dispute.find({ status: DISPUTE_STATUS.ESCALATED })
      .populate('customerId', 'name email phone')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('bookingId')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, 200, 'Escalations retrieved', escalations);
  } catch (error) {
    next(error);
  }
};

export const reassignProvider = async (req, res, next) => {
  try {
    const { newProviderId, reason } = req.body;
    if (!newProviderId) {
      return sendError(res, 400, 'newProviderId is required', 'MISSING_PARAM');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    const newProvider = await Provider.findById(newProviderId).populate('userId');
    if (!newProvider) {
      return sendError(res, 404, 'New provider profile not found', 'PROVIDER_NOT_FOUND');
    }

    const oldProviderId = booking.providerId;
    booking.providerId = newProvider._id;
    booking.status = BOOKING_STATUS.ASSIGNED;
    booking.notes.push({
      text: `Provider reassigned by Operations: ${reason || 'Operational reassignment'}`,
      createdBy: req.user._id
    });

    await booking.save();

    // Notify old provider
    const oldProvider = await Provider.findById(oldProviderId);
    if (oldProvider?.userId) {
      await NotificationService.notifyUser({
        userId: oldProvider.userId,
        title: 'Booking Reassigned',
        message: `Booking #${booking._id} was reassigned to another provider.`,
        type: NOTIFICATION_TYPES.BOOKING,
        relatedEntity: { entityType: 'Booking', entityId: booking._id }
      });
    }

    // Notify new provider
    if (newProvider.userId?._id) {
      await NotificationService.notifyUser({
        userId: newProvider.userId._id,
        title: 'Booking Assigned to You',
        message: `You have been assigned to booking #${booking._id} on ${booking.date.toISOString().split('T')[0]} at ${booking.startTime}.`,
        type: NOTIFICATION_TYPES.BOOKING,
        relatedEntity: { entityType: 'Booking', entityId: booking._id }
      });
    }

    // Notify customer
    await NotificationService.notifyUser({
      userId: booking.customerId,
      title: 'Provider Updated for Your Booking',
      message: `Your booking #${booking._id} has been reassigned to ${newProvider.userId?.name || 'a new provider'}.`,
      type: NOTIFICATION_TYPES.BOOKING,
      relatedEntity: { entityType: 'Booking', entityId: booking._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'BOOKING_PROVIDER_REASSIGNED',
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { fromProvider: oldProviderId, toProvider: newProvider._id, reason },
      req
    });

    return sendSuccess(res, 200, 'Provider successfully reassigned', booking);
  } catch (error) {
    next(error);
  }
};
