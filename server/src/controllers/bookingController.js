import { Booking } from '../models/Booking.js';
import { Provider } from '../models/Provider.js';
import { Quote } from '../models/Quote.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Invoice } from '../models/Invoice.js';
import { JobEvidence } from '../models/JobEvidence.js';
import { BookingService } from '../services/bookingService.js';
import { AvailabilityService } from '../services/availabilityService.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  PROVIDER_STATUS,
  REQUEST_STATUS,
  QUOTE_STATUS,
  ROLES
} from '../utils/constants.js';

export const createBooking = async (req, res, next) => {
  try {
    const { quoteId, requestId, date, startTime, endTime, price, location } = req.body;

    if (!quoteId) {
      return sendError(res, 400, 'Quote ID is required to create a booking', 'MISSING_QUOTE_ID');
    }

    const quote = await Quote.findById(quoteId).populate('providerId');
    if (!quote) {
      return sendError(res, 404, 'Quote not found', 'QUOTE_NOT_FOUND');
    }

    if (quote.status !== QUOTE_STATUS.PENDING && quote.status !== QUOTE_STATUS.ACCEPTED) {
      return sendError(res, 400, `Cannot create booking from quote with status '${quote.status}'`, 'INVALID_QUOTE_STATUS');
    }

    const serviceRequest = await ServiceRequest.findById(quote.requestId || requestId);
    if (!serviceRequest) {
      return sendError(res, 404, 'Service request not found', 'REQUEST_NOT_FOUND');
    }

    if (req.user.role === ROLES.CUSTOMER && serviceRequest.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You can only book requests created by your account', 'ACCESS_DENIED');
    }

    if (quote.providerId.verificationStatus !== PROVIDER_STATUS.VERIFIED) {
      return sendError(res, 400, 'Provider is not verified', 'PROVIDER_NOT_ELIGIBLE');
    }

    const bookingDate = date ? new Date(date) : quote.availableDate;
    const bookingStartTime = startTime || quote.availableTime || '10:00';
    let bookingEndTime = endTime;

    if (!bookingEndTime) {
      const [startH, startM] = bookingStartTime.split(':').map(Number);
      const endH = (startH + 2) % 24;
      bookingEndTime = `${String(endH).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}`;
    }

    // Overlap conflict detection
    const availabilityCheck = await AvailabilityService.checkAvailability({
      providerId: quote.providerId._id,
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime
    });

    if (!availabilityCheck.available) {
      return sendError(
        res,
        409,
        availabilityCheck.reason || 'Provider has an overlapping booking at this time',
        'BOOKING_CONFLICT'
      );
    }

    // Accept quote & reject other quotes
    quote.status = QUOTE_STATUS.ACCEPTED;
    await quote.save();

    await Quote.updateMany(
      { requestId: serviceRequest._id, _id: { $ne: quote._id }, status: QUOTE_STATUS.PENDING },
      { status: QUOTE_STATUS.REJECTED }
    );

    serviceRequest.status = REQUEST_STATUS.BOOKED;
    await serviceRequest.save();

    const booking = await Booking.create({
      requestId: serviceRequest._id,
      customerId: serviceRequest.customerId,
      providerId: quote.providerId._id,
      quoteId: quote._id,
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      location: location || serviceRequest.location,
      price: price !== undefined ? Number(price) : quote.price,
      status: BOOKING_STATUS.SCHEDULED
    });

    // Notify Provider
    if (quote.providerId.userId) {
      await NotificationService.notifyUser({
        userId: quote.providerId.userId,
        title: 'New Booking Scheduled!',
        message: `Your quote for "${serviceRequest.categoryName}" was booked for ${bookingDate.toISOString().split('T')[0]} at ${bookingStartTime}.`,
        type: NOTIFICATION_TYPES.BOOKING,
        relatedEntity: { entityType: 'Booking', entityId: booking._id }
      });
    }

    // Notify Customer
    await NotificationService.notifyUser({
      userId: serviceRequest.customerId,
      title: 'Booking Confirmed!',
      message: `Your booking #${booking._id} is confirmed.`,
      type: NOTIFICATION_TYPES.BOOKING,
      relatedEntity: { entityType: 'Booking', entityId: booking._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { quoteId: quote._id, price: booking.price },
      req
    });

    return sendSuccess(res, 201, 'Booking created successfully', booking);
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { status, date, providerId, customerId, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    if (req.user.role === ROLES.CUSTOMER) {
      filter.customerId = req.user._id;
    } else if (req.user.role === ROLES.PROVIDER) {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (!provider) return sendSuccess(res, 200, 'No bookings found', []);
      filter.providerId = provider._id;
    } else {
      if (providerId) filter.providerId = providerId;
      if (customerId) filter.customerId = customerId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone address')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('requestId', 'categoryName description urgency')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Bookings retrieved', bookings, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email phone address')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('requestId')
      .populate('quoteId')
      .populate('notes.createdBy', 'name role');

    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Role ownership check
    if (req.user.role === ROLES.CUSTOMER && booking.customerId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied', 'FORBIDDEN');
    }

    if (req.user.role === ROLES.PROVIDER) {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (!provider || booking.providerId._id.toString() !== provider._id.toString()) {
        return sendError(res, 403, 'Access denied', 'FORBIDDEN');
      }
    }

    const evidence = await JobEvidence.find({ bookingId: booking._id });
    const invoice = await Invoice.findOne({ bookingId: booking._id });

    return sendSuccess(res, 200, 'Booking details retrieved', {
      booking,
      evidence,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('providerId customerId');
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Validate transition
    const transition = BookingService.validateStatusTransition(booking.status, status, req.user.role);
    if (!transition.allowed) {
      return sendError(res, 422, transition.reason, 'INVALID_TRANSITION');
    }

    // Provider check
    if (req.user.role === ROLES.PROVIDER) {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (!provider || booking.providerId._id.toString() !== provider._id.toString()) {
        return sendError(res, 403, 'Only the assigned provider can update job progress', 'ACCESS_DENIED');
      }
    }

    const prevStatus = booking.status;
    booking.status = status;

    if (status === BOOKING_STATUS.COMPLETED) {
      booking.completedAt = new Date();
    }

    await booking.save();

    // Trigger state-specific notifications
    if (status === BOOKING_STATUS.EN_ROUTE) {
      await NotificationService.notifyUser({
        userId: booking.customerId._id,
        title: 'Provider En Route',
        message: 'Your service provider is on the way to your location.',
        type: NOTIFICATION_TYPES.JOB,
        relatedEntity: { entityType: 'Booking', entityId: booking._id }
      });
    } else if (status === BOOKING_STATUS.IN_PROGRESS) {
      await NotificationService.notifyUser({
        userId: booking.customerId._id,
        title: 'Job Started',
        message: 'Work has begun on your service request.',
        type: NOTIFICATION_TYPES.JOB,
        relatedEntity: { entityType: 'Booking', entityId: booking._id }
      });
    } else if (status === BOOKING_STATUS.COMPLETED) {
      await NotificationService.notifyUser({
        userId: booking.customerId._id,
        title: 'Job Completed - Confirmation Required',
        message: 'The provider has marked your service as complete. Please inspect the work and confirm completion.',
        type: NOTIFICATION_TYPES.JOB,
        relatedEntity: { entityType: 'Booking', entityId: booking._id }
      });
    }

    await AuditService.logAction({
      userId: req.user._id,
      action: 'BOOKING_STATUS_UPDATED',
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { from: prevStatus, to: status },
      req
    });

    return sendSuccess(res, 200, `Booking status successfully changed to ${status}`, booking);
  } catch (error) {
    next(error);
  }
};

export const confirmBookingCompletion = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.CUSTOMER && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 403, 'Only the customer can confirm job completion', 'ACCESS_DENIED');
    }

    const booking = await Booking.findById(req.params.id).populate('providerId');
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    if (booking.customerId.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 403, 'Only the customer can confirm job completion', 'ACCESS_DENIED');
    }

    if (booking.status !== BOOKING_STATUS.COMPLETED) {
      return sendError(res, 400, `Cannot confirm completion when booking status is '${booking.status}'. Must be 'completed'.`, 'INVALID_STATUS');
    }

    booking.status = BOOKING_STATUS.CUSTOMER_CONFIRMED;
    booking.confirmedAt = new Date();
    await booking.save();

    // Increment completed jobs on Provider
    await Provider.findByIdAndUpdate(booking.providerId._id, { $inc: { completedJobs: 1 } });

    // Generate Invoice automatically (Section 35)
    let invoice = await Invoice.findOne({ bookingId: booking._id });
    if (!invoice) {
      const basePrice = booking.price;
      const partsCost = 0;
      const serviceFee = 50;
      const total = basePrice + partsCost + serviceFee;

      invoice = await Invoice.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        providerId: booking.providerId._id,
        basePrice,
        partsCost,
        serviceFee,
        additionalCharges: 0,
        total,
        paymentStatus: PAYMENT_STATUS.PENDING
      });
    }

    // Notify provider
    if (booking.providerId.userId) {
      await NotificationService.notifyUser({
        userId: booking.providerId.userId,
        title: 'Customer Confirmed Completion!',
        message: `Customer confirmed completion for booking #${booking._id}. Invoice #${invoice._id} generated.`,
        type: NOTIFICATION_TYPES.INVOICE,
        relatedEntity: { entityType: 'Invoice', entityId: invoice._id }
      });
    }

    // Notify customer
    await NotificationService.notifyUser({
      userId: booking.customerId,
      title: 'Invoice Ready',
      message: `Your service is confirmed! Invoice of ₹${invoice.total} has been generated.`,
      type: NOTIFICATION_TYPES.INVOICE,
      relatedEntity: { entityType: 'Invoice', entityId: invoice._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'BOOKING_CONFIRMED_INVOICE_GENERATED',
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { invoiceId: invoice._id, total: invoice.total },
      req
    });

    return sendSuccess(res, 200, 'Job completion confirmed and invoice generated successfully', {
      booking,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('providerId customerId');
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Authorization & Ownership
    const isCustomer = req.user.role === ROLES.CUSTOMER && booking.customerId._id.toString() === req.user._id.toString();
    const isProvider = req.user.role === ROLES.PROVIDER && booking.providerId.userId.toString() === req.user._id.toString();
    const isStaff = [ROLES.ADMIN, ROLES.OPERATIONS, ROLES.SUPPORT].includes(req.user.role);

    if (!isCustomer && !isProvider && !isStaff) {
      return sendError(res, 403, 'You do not have permission to cancel this booking', 'ACCESS_DENIED');
    }

    if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CUSTOMER_CONFIRMED].includes(booking.status)) {
      return sendError(res, 400, 'Cannot cancel a booking that is already completed or confirmed', 'ALREADY_COMPLETED');
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledBy = req.user._id;
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    await booking.save();

    // Notify opposite party
    const targetUserId = isCustomer ? booking.providerId.userId : booking.customerId._id;
    await NotificationService.notifyUser({
      userId: targetUserId,
      title: 'Booking Cancelled',
      message: `Booking #${booking._id} was cancelled. Reason: ${booking.cancellationReason}`,
      type: NOTIFICATION_TYPES.BOOKING,
      relatedEntity: { entityType: 'Booking', entityId: booking._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { reason: booking.cancellationReason },
      req
    });

    return sendSuccess(res, 200, 'Booking cancelled successfully', booking);
  } catch (error) {
    next(error);
  }
};

export const addBookingNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return sendError(res, 400, 'Note text is required', 'MISSING_PARAM');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    booking.notes.push({
      text: text.trim(),
      createdBy: req.user._id
    });

    await booking.save();
    return sendSuccess(res, 201, 'Note added to booking', booking);
  } catch (error) {
    next(error);
  }
};
