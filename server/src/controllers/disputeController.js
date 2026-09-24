import { Dispute } from '../models/Dispute.js';
import { Provider } from '../models/Provider.js';
import { DisputeService } from '../services/disputeService.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { ROLES, DISPUTE_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';

export const createDispute = async (req, res, next) => {
  try {
    const { bookingId, reason, description, evidence } = req.body;

    const dispute = await DisputeService.createDispute({
      bookingId,
      customerId: req.user._id,
      reason,
      description,
      evidence: evidence || [],
      req
    });

    return sendSuccess(res, 201, 'Dispute raised successfully. Support team has been notified.', dispute);
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message, 'NOT_FOUND');
    }
    if (error.message.includes('own bookings')) {
      return sendError(res, 403, error.message, 'FORBIDDEN');
    }
    next(error);
  }
};

export const getDisputes = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    if (req.user.role === ROLES.CUSTOMER) {
      filter.customerId = req.user._id;
    } else if (req.user.role === ROLES.PROVIDER) {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (!provider) return sendSuccess(res, 200, 'No disputes', []);
      filter.providerId = provider._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Dispute.countDocuments(filter);
    const disputes = await Dispute.find(filter)
      .populate('customerId', 'name email phone')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('bookingId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Disputes retrieved', disputes, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('bookingId')
      .populate('resolvedBy', 'name role');

    if (!dispute) {
      return sendError(res, 404, 'Dispute not found', 'NOT_FOUND');
    }

    return sendSuccess(res, 200, 'Dispute details retrieved', dispute);
  } catch (error) {
    next(error);
  }
};

export const updateDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return sendError(res, 404, 'Dispute not found', 'NOT_FOUND');
    }

    const { status, resolution } = req.body;
    if (status) dispute.status = status;
    if (resolution) dispute.resolution = resolution;

    await dispute.save();

    return sendSuccess(res, 200, 'Dispute updated successfully', dispute);
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req, res, next) => {
  try {
    const { resolution, status = DISPUTE_STATUS.RESOLVED } = req.body;
    if (!resolution) {
      return sendError(res, 400, 'Resolution details are required to resolve a dispute', 'MISSING_PARAM');
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return sendError(res, 404, 'Dispute not found', 'NOT_FOUND');
    }

    dispute.status = status;
    dispute.resolution = resolution;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Notify customer
    await NotificationService.notifyUser({
      userId: dispute.customerId,
      title: 'Dispute Resolved',
      message: `Your dispute for booking #${dispute.bookingId} has been resolved: ${resolution}`,
      type: NOTIFICATION_TYPES.DISPUTE,
      relatedEntity: { entityType: 'Dispute', entityId: dispute._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'DISPUTE_RESOLVED',
      entityType: 'Dispute',
      entityId: dispute._id,
      metadata: { resolution },
      req
    });

    return sendSuccess(res, 200, 'Dispute resolved successfully', dispute);
  } catch (error) {
    next(error);
  }
};

export const escalateDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return sendError(res, 404, 'Dispute not found', 'NOT_FOUND');
    }

    dispute.status = DISPUTE_STATUS.ESCALATED;
    await dispute.save();

    // Notify Admin team
    await NotificationService.notifyRole(ROLES.ADMIN, {
      title: 'Dispute Escalated to Admin',
      message: `Dispute #${dispute._id} on booking #${dispute.bookingId} requires Admin review.`,
      type: NOTIFICATION_TYPES.DISPUTE,
      relatedEntity: { entityType: 'Dispute', entityId: dispute._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'DISPUTE_ESCALATED',
      entityType: 'Dispute',
      entityId: dispute._id,
      req
    });

    return sendSuccess(res, 200, 'Dispute escalated to Admin successfully', dispute);
  } catch (error) {
    next(error);
  }
};
