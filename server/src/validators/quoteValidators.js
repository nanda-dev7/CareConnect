import { body, param } from 'express-validator';

export const createQuoteValidator = [
  body('requestId')
    .isMongoId()
    .withMessage('Valid service request ID is required'),
  body('price')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Quote price must be greater than 0'),
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Quote amount must be greater than 0'),
  body().custom((value, { req }) => {
    const priceVal = req.body.price !== undefined ? req.body.price : req.body.amount;
    if (priceVal === undefined || Number(priceVal) <= 0 || isNaN(Number(priceVal))) {
      throw new Error('Quote price or amount must be greater than 0');
    }
    return true;
  }),
  body('estimatedDuration')
    .trim()
    .notEmpty()
    .withMessage('Estimated duration (e.g. "2 hours") is required'),
  body('availableDate')
    .optional()
    .isISO8601()
    .withMessage('Available date must be a valid date'),
  body('availableTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Available time must be in HH:MM format'),
  body('message')
    .optional()
    .trim()
];

export const quoteIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid quote ID format is required')
];
