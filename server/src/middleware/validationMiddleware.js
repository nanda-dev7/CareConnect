import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return sendError(
      res,
      400,
      formattedErrors[0]?.message || 'Input validation failed',
      'VALIDATION_ERROR',
      formattedErrors
    );
  };
};
