import { body, param } from 'express-validator';
import { URGENCY_LEVELS } from '../utils/constants.js';

export const createRequestValidator = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Service problem description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long to allow proper AI classification'),
  body('categoryName')
    .optional()
    .trim(),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Category ID must be a valid Mongo ID'),
  body('urgency')
    .optional()
    .isIn(Object.values(URGENCY_LEVELS))
    .withMessage(`Urgency must be one of: ${Object.values(URGENCY_LEVELS).join(', ')}`),
  body('location.city')
    .optional()
    .trim(),
  body('preferredDate')
    .optional()
    .isISO8601()
    .withMessage('Preferred date must be a valid ISO8601 date (YYYY-MM-DD)'),
  body('preferredTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Preferred time must be in HH:MM format')
];

export const requestIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid service request ID format')
];
