import { sendError } from '../utils/apiResponse.js';
import { ENV } from '../config/env.js';

export const notFoundHandler = (req, res) => {
  return sendError(
    res,
    404,
    `Endpoint not found: [${req.method}] ${req.originalUrl}`,
    'ENDPOINT_NOT_FOUND'
  );
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'SERVER_ERROR';
  let details = null;

  // Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': ${err.value}`;
    errorCode = 'INVALID_ID_FORMAT';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    message = `An entry with ${duplicatedField} '${duplicatedValue}' already exists.`;
    errorCode = 'DUPLICATE_KEY_ERROR';
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error occurred';
    errorCode = 'MONGOOSE_VALIDATION_ERROR';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum limit of 10MB';
    } else {
      message = err.message;
    }
  }

  if (ENV.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('[Error Stack Trace]:', err);
  }

  return sendError(res, statusCode, message, errorCode, details);
};
