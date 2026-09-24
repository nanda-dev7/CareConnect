import { sendError } from '../utils/apiResponse.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'User context missing. Authentication required', 'UNAUTHENTICATED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
        'FORBIDDEN_ROLE'
      );
    }

    next();
  };
};
