import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication token missing or invalid format', 'UNAUTHENTICATED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Token has expired. Please log in again', 'TOKEN_EXPIRED');
      }
      return sendError(res, 401, 'Invalid authentication token', 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, 401, 'User account no longer exists', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Account is deactivated. Please contact support', 'ACCOUNT_DEACTIVATED');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 500, 'Authentication error', 'AUTH_ERROR', error.message);
  }
};
