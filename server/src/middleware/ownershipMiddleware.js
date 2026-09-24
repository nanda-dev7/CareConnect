import { Provider } from '../models/Provider.js';
import { ROLES } from '../utils/constants.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Ensures that if a provider user is logged in, their Provider document is attached to req.provider
 */
export const attachProviderContext = async (req, res, next) => {
  if (req.user && req.user.role === ROLES.PROVIDER) {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found for this account', 'PROVIDER_PROFILE_NOT_FOUND');
    }
    req.provider = provider;
  }
  next();
};

/**
 * Checks that the authenticated user owns the resource or is privileged (admin/operations/support)
 */
export const checkCustomerOwnership = (field = 'customerId') => {
  return (req, res, next) => {
    if ([ROLES.ADMIN, ROLES.OPERATIONS, ROLES.SUPPORT].includes(req.user.role)) {
      return next();
    }

    const resource = req.resource;
    if (!resource) return next();

    const ownerId = resource[field] ? resource[field].toString() : null;
    if (ownerId !== req.user._id.toString()) {
      return sendError(res, 403, 'You do not have permission to access or modify this resource', 'ACCESS_DENIED');
    }
    next();
  };
};

/**
 * Checks that the authenticated provider owns the resource
 */
export const checkProviderOwnership = (field = 'providerId') => {
  return async (req, res, next) => {
    if ([ROLES.ADMIN, ROLES.OPERATIONS, ROLES.SUPPORT].includes(req.user.role)) {
      return next();
    }

    if (!req.provider) {
      req.provider = await Provider.findOne({ userId: req.user._id });
    }

    if (!req.provider) {
      return sendError(res, 403, 'Provider profile not found', 'FORBIDDEN');
    }

    const resource = req.resource;
    if (!resource) return next();

    const providerId = resource[field] ? resource[field].toString() : null;
    if (providerId !== req.provider._id.toString()) {
      return sendError(res, 403, 'You do not have permission to manage this provider resource', 'ACCESS_DENIED');
    }
    next();
  };
};
