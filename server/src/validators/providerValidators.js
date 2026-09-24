import { body, param } from 'express-validator';
import { PROVIDER_STATUS } from '../utils/constants.js';

export const updateProviderProfileValidator = [
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of strings'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array of category names'),
  body('serviceAreas')
    .optional()
    .isArray()
    .withMessage('Service areas must be an array of locations/cities'),
  body('experience')
    .optional()
    .isNumeric({ min: 0 })
    .withMessage('Experience must be a positive number of years'),
  body('pricing.hourlyRate')
    .optional()
    .isNumeric({ min: 0 })
    .withMessage('Hourly rate must be a valid number'),
  body('pricing.calloutFee')
    .optional()
    .isNumeric({ min: 0 })
    .withMessage('Callout fee must be a valid number')
];

export const providerStatusValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid provider ID is required')
];
