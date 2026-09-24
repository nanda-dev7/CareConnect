import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { Provider } from '../models/Provider.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { BOOKING_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';

export const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId).populate('providerId');
    if (!booking) {
      return sendError(res, 404, 'Booking not found', 'BOOKING_NOT_FOUND');
    }

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You can only review your own bookings', 'ACCESS_DENIED');
    }

    if (![BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CUSTOMER_CONFIRMED].includes(booking.status)) {
      return sendError(res, 400, 'Reviews can only be submitted for completed or confirmed bookings', 'BOOKING_NOT_COMPLETED');
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return sendError(res, 409, 'You have already submitted a review for this booking', 'DUPLICATE_REVIEW');
    }

    const review = await Review.create({
      bookingId,
      customerId: req.user._id,
      providerId: booking.providerId._id,
      rating: Number(rating),
      comment: comment || ''
    });

    // Recalculate provider average rating
    const providerReviews = await Review.find({ providerId: booking.providerId._id });
    const totalReviews = providerReviews.length;
    const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await Provider.findByIdAndUpdate(booking.providerId._id, {
      rating: Number(avgRating.toFixed(1)),
      totalReviews
    });

    // Notify provider
    if (booking.providerId.userId) {
      await NotificationService.notifyUser({
        userId: booking.providerId.userId,
        title: 'New Customer Review Received',
        message: `A customer gave you a ${rating}-star rating: "${comment || 'Great service!'}"`,
        type: NOTIFICATION_TYPES.SYSTEM,
        relatedEntity: { entityType: 'Review', entityId: review._id }
      });
    }

    await AuditService.logAction({
      userId: req.user._id,
      action: 'REVIEW_CREATED',
      entityType: 'Review',
      entityId: review._id,
      metadata: { rating, providerId: booking.providerId._id },
      req
    });

    return sendSuccess(res, 201, 'Review submitted successfully', review);
  } catch (error) {
    next(error);
  }
};

export const getReviewsForProvider = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Review.countDocuments({ providerId });
    const reviews = await Review.find({ providerId })
      .populate('customerId', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Provider reviews retrieved', reviews, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return sendError(res, 404, 'Review not found', 'NOT_FOUND');
    }

    if (review.customerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You can only edit your own reviews', 'ACCESS_DENIED');
    }

    const { rating, comment } = req.body;
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Recalculate provider rating
    const providerReviews = await Review.find({ providerId: review.providerId });
    const totalReviews = providerReviews.length;
    const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await Provider.findByIdAndUpdate(review.providerId, {
      rating: Number(avgRating.toFixed(1)),
      totalReviews
    });

    return sendSuccess(res, 200, 'Review updated successfully', review);
  } catch (error) {
    next(error);
  }
};
