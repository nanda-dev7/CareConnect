import { Quote } from '../models/Quote.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Provider } from '../models/Provider.js';
import { Booking } from '../models/Booking.js';
import { AvailabilityService } from '../services/availabilityService.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import {
  QUOTE_STATUS,
  REQUEST_STATUS,
  PROVIDER_STATUS,
  BOOKING_STATUS,
  NOTIFICATION_TYPES,
  ROLES
} from '../utils/constants.js';

export const createQuote = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found', 'PROVIDER_NOT_FOUND');
    }

    if (provider.verificationStatus !== PROVIDER_STATUS.VERIFIED) {
      return sendError(res, 403, 'Only verified providers can submit quotes', 'PROVIDER_NOT_VERIFIED');
    }

    const {
      requestId,
      price,
      amount,
      estimatedDuration,
      availableDate,
      availableTime,
      message
    } = req.body;

    const finalPrice = price !== undefined ? Number(price) : (amount !== undefined ? Number(amount) : 0);

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return sendError(res, 404, 'Service request not found', 'REQUEST_NOT_FOUND');
    }

    if ([REQUEST_STATUS.BOOKED, REQUEST_STATUS.CANCELLED, REQUEST_STATUS.COMPLETED].includes(serviceRequest.status)) {
      return sendError(res, 400, `Cannot quote on request with status: ${serviceRequest.status}`, 'INVALID_REQUEST_STATUS');
    }

    // Check for duplicate active quote
    const existingQuote = await Quote.findOne({
      requestId,
      providerId: provider._id,
      status: { $in: [QUOTE_STATUS.PENDING, QUOTE_STATUS.ACCEPTED] }
    });

    if (existingQuote) {
      return sendError(res, 409, 'You have already submitted an active quote for this request', 'DUPLICATE_QUOTE');
    }

    const finalAvailableDate = availableDate
      ? new Date(availableDate)
      : (serviceRequest.preferredDate ? new Date(serviceRequest.preferredDate) : new Date(Date.now() + 86400000));
    const finalAvailableTime = availableTime || serviceRequest.preferredTime || '10:00';

    const quote = await Quote.create({
      requestId,
      providerId: provider._id,
      price: finalPrice,
      estimatedDuration: estimatedDuration || '2 hours',
      availableDate: finalAvailableDate,
      availableTime: finalAvailableTime,
      message: message || '',
      status: QUOTE_STATUS.PENDING
    });

    if (serviceRequest.status === REQUEST_STATUS.OPEN || serviceRequest.status === REQUEST_STATUS.MATCHING) {
      serviceRequest.status = REQUEST_STATUS.QUOTED;
      await serviceRequest.save();
    }

    // Notify customer
    await NotificationService.notifyUser({
      userId: serviceRequest.customerId,
      title: 'New Quote Received',
      message: `A provider has submitted a quote of ₹${price} for your request "${serviceRequest.categoryName}".`,
      type: NOTIFICATION_TYPES.QUOTE,
      relatedEntity: { entityType: 'Quote', entityId: quote._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'QUOTE_SUBMITTED',
      entityType: 'Quote',
      entityId: quote._id,
      metadata: { requestId, price },
      req
    });

    return sendSuccess(res, 201, 'Quote submitted successfully', quote);
  } catch (error) {
    next(error);
  }
};

export const getMyQuotes = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found', 'PROVIDER_NOT_FOUND');
    }

    const quotes = await Quote.find({ providerId: provider._id })
      .populate('requestId', 'categoryName description urgency location status preferredDate preferredTime')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Provider quotes retrieved', quotes);
  } catch (error) {
    next(error);
  }
};

export const getQuotesForRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return sendError(res, 404, 'Service request not found', 'REQUEST_NOT_FOUND');
    }

    // Ownership: Customer must own request, or be Admin/Ops
    if (
      req.user.role === ROLES.CUSTOMER &&
      serviceRequest.customerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'You can only view quotes for your own requests', 'ACCESS_DENIED');
    }

    const quotes = await Quote.find({ requestId })
      .populate({
        path: 'providerId',
        select: 'userId rating totalReviews experience skills serviceAreas',
        populate: { path: 'userId', select: 'name phone' }
      })
      .sort({ price: 1 });

    return sendSuccess(res, 200, 'Quotes for request retrieved', quotes);
  } catch (error) {
    next(error);
  }
};

export const updateQuote = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found', 'PROVIDER_NOT_FOUND');
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return sendError(res, 404, 'Quote not found', 'NOT_FOUND');
    }

    if (quote.providerId.toString() !== provider._id.toString()) {
      return sendError(res, 403, 'You can only edit your own quotes', 'ACCESS_DENIED');
    }

    if (quote.status !== QUOTE_STATUS.PENDING) {
      return sendError(res, 400, `Cannot update quote with status: ${quote.status}`, 'INVALID_QUOTE_STATUS');
    }

    const { price, amount, estimatedDuration, availableDate, availableTime, message } = req.body;
    if (price !== undefined) quote.price = Number(price);
    else if (amount !== undefined) quote.price = Number(amount);
    if (estimatedDuration) quote.estimatedDuration = estimatedDuration;
    if (availableDate) quote.availableDate = new Date(availableDate);
    if (availableTime) quote.availableTime = availableTime;
    if (message !== undefined) quote.message = message;

    await quote.save();
    return sendSuccess(res, 200, 'Quote updated successfully', quote);
  } catch (error) {
    next(error);
  }
};

export const acceptQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('providerId');
    if (!quote) {
      return sendError(res, 404, 'Quote not found', 'NOT_FOUND');
    }

    if (quote.status !== QUOTE_STATUS.PENDING) {
      return sendError(res, 400, `Quote cannot be accepted because it is already '${quote.status}'`, 'INVALID_STATUS');
    }

    const serviceRequest = await ServiceRequest.findById(quote.requestId);
    if (!serviceRequest) {
      return sendError(res, 404, 'Service request not found', 'REQUEST_NOT_FOUND');
    }

    if (serviceRequest.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Only the customer who created the request can accept quotes', 'ACCESS_DENIED');
    }

    if (serviceRequest.status === REQUEST_STATUS.BOOKED) {
      return sendError(res, 400, 'A quote has already been accepted and booked for this request', 'ALREADY_BOOKED');
    }

    // Verify provider status
    if (quote.providerId.verificationStatus !== PROVIDER_STATUS.VERIFIED) {
      return sendError(res, 400, 'Provider is no longer verified', 'PROVIDER_NOT_ELIGIBLE');
    }

    // Compute end time: default 2 hours window from availableTime
    const [startH, startM] = quote.availableTime.split(':').map(Number);
    const endH = (startH + 2) % 24;
    const endTime = `${String(endH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

    // Availability and conflict detection
    const availabilityCheck = await AvailabilityService.checkAvailability({
      providerId: quote.providerId._id,
      date: quote.availableDate,
      startTime: quote.availableTime,
      endTime
    });

    if (!availabilityCheck.available) {
      return sendError(
        res,
        409,
        availabilityCheck.reason || 'Provider is not available for this time slot due to conflict',
        'BOOKING_CONFLICT'
      );
    }

    // Accept quote & reject others
    quote.status = QUOTE_STATUS.ACCEPTED;
    await quote.save();

    await Quote.updateMany(
      { requestId: serviceRequest._id, _id: { $ne: quote._id }, status: QUOTE_STATUS.PENDING },
      { status: QUOTE_STATUS.REJECTED }
    );

    // Update service request
    serviceRequest.status = REQUEST_STATUS.BOOKED;
    await serviceRequest.save();

    // Create Booking
    const booking = await Booking.create({
      requestId: serviceRequest._id,
      customerId: req.user._id,
      providerId: quote.providerId._id,
      quoteId: quote._id,
      date: quote.availableDate,
      startTime: quote.availableTime,
      endTime,
      location: serviceRequest.location,
      price: quote.price,
      status: BOOKING_STATUS.SCHEDULED
    });

    // Notify provider
    if (quote.providerId.userId) {
      await NotificationService.notifyUser({
        userId: quote.providerId.userId,
        title: 'Quote Accepted - Booking Scheduled!',
        message: `Your quote for "${serviceRequest.categoryName}" was accepted! Booking #${booking._id} has been scheduled for ${quote.availableDate.toISOString().split('T')[0]} at ${quote.availableTime}.`,
        type: NOTIFICATION_TYPES.BOOKING,
        relatedEntity: { entityType: 'Booking', entityId: booking._id }
      });
    }

    // Notify customer
    await NotificationService.notifyUser({
      userId: req.user._id,
      title: 'Booking Confirmed!',
      message: `Your booking #${booking._id} with ${quote.providerId.userId?.name || 'the service provider'} is confirmed.`,
      type: NOTIFICATION_TYPES.BOOKING,
      relatedEntity: { entityType: 'Booking', entityId: booking._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'QUOTE_ACCEPTED_BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking._id,
      metadata: { quoteId: quote._id, price: quote.price },
      req
    });

    return sendSuccess(res, 201, 'Quote accepted and booking created successfully', {
      quote,
      booking
    });
  } catch (error) {
    next(error);
  }
};

export const rejectQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return sendError(res, 404, 'Quote not found', 'NOT_FOUND');
    }

    const serviceRequest = await ServiceRequest.findById(quote.requestId);
    if (serviceRequest.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Only the customer can reject quotes', 'ACCESS_DENIED');
    }

    quote.status = QUOTE_STATUS.REJECTED;
    await quote.save();

    return sendSuccess(res, 200, 'Quote rejected successfully', quote);
  } catch (error) {
    next(error);
  }
};
