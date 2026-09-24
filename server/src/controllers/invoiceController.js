import { Invoice } from '../models/Invoice.js';
import { Provider } from '../models/Provider.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { ROLES, PAYMENT_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';

export const getInvoices = async (req, res, next) => {
  try {
    const { paymentStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (req.user.role === ROLES.CUSTOMER) {
      filter.customerId = req.user._id;
    } else if (req.user.role === ROLES.PROVIDER) {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (!provider) return sendSuccess(res, 200, 'No invoices', []);
      filter.providerId = provider._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name email phone')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('bookingId', 'date startTime endTime location status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Invoices retrieved', invoices, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email phone address')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('bookingId');

    if (!invoice) {
      return sendError(res, 404, 'Invoice not found', 'INVOICE_NOT_FOUND');
    }

    // Role ownership check
    if (req.user.role === ROLES.CUSTOMER && invoice.customerId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied', 'FORBIDDEN');
    }

    if (req.user.role === ROLES.PROVIDER) {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (!provider || invoice.providerId._id.toString() !== provider._id.toString()) {
        return sendError(res, 403, 'Access denied', 'FORBIDDEN');
      }
    }

    return sendSuccess(res, 200, 'Invoice details retrieved', invoice);
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
      return sendError(res, 400, `Invalid payment status. Valid statuses: ${Object.values(PAYMENT_STATUS).join(', ')}`, 'INVALID_PAYMENT_STATUS');
    }

    const invoice = await Invoice.findById(req.params.id).populate('customerId providerId');
    if (!invoice) {
      return sendError(res, 404, 'Invoice not found', 'INVOICE_NOT_FOUND');
    }

    invoice.paymentStatus = paymentStatus;
    if (paymentStatus === PAYMENT_STATUS.PAID) {
      invoice.paidAt = new Date();
    }
    await invoice.save();

    // Notify customer
    await NotificationService.notifyUser({
      userId: invoice.customerId._id,
      title: `Payment ${paymentStatus.toUpperCase()}`,
      message: `Your payment of ₹${invoice.total} status has been updated to: ${paymentStatus}.`,
      type: NOTIFICATION_TYPES.INVOICE,
      relatedEntity: { entityType: 'Invoice', entityId: invoice._id }
    });

    // Notify provider
    if (invoice.providerId?.userId) {
      await NotificationService.notifyUser({
        userId: invoice.providerId.userId,
        title: `Payment ${paymentStatus.toUpperCase()}`,
        message: `Payment of ₹${invoice.total} for booking #${invoice.bookingId} is now marked as ${paymentStatus}.`,
        type: NOTIFICATION_TYPES.INVOICE,
        relatedEntity: { entityType: 'Invoice', entityId: invoice._id }
      });
    }

    await AuditService.logAction({
      userId: req.user._id,
      action: 'PAYMENT_STATUS_UPDATED',
      entityType: 'Invoice',
      entityId: invoice._id,
      metadata: { paymentStatus, total: invoice.total },
      req
    });

    return sendSuccess(res, 200, `Payment status updated to ${paymentStatus}`, invoice);
  } catch (error) {
    next(error);
  }
};
