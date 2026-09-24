import { body } from 'express-validator';
import { ROLES } from '../utils/constants.js';

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn([ROLES.CUSTOMER, ROLES.PROVIDER])
    .withMessage('Self-registration is only permitted for customer or provider roles')
];

export const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const createPrivilegedUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('role')
    .isIn([ROLES.ADMIN, ROLES.OPERATIONS, ROLES.SUPPORT])
    .withMessage('Role must be admin, operations, or support')
];
