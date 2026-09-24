import { body, param } from 'express-validator';
import { BOOKING_STATUS } from '../utils/constants.js';

export const createBookingValidator = [
  body('requestId')
    .isMongoId()
    .withMessage('Valid request ID is required'),
  body('quoteId')
    .isMongoId()
    .withMessage('Valid quote ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid booking date is required'),
  body('startTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be HH:MM format'),
  body('endTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be HH:MM format')
];

export const updateBookingStatusValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('status')
    .isIn(Object.values(BOOKING_STATUS))
    .withMessage(`Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`)
];

export const cancelBookingValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Cancellation reason is required')
];
