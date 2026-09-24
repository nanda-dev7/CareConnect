import express from 'express';
import {
  createProviderProfile,
  getProviders,
  matchProvidersForRequest,
  getMyProviderProfile,
  updateMyProviderProfile,
  getPendingProviders,
  getProviderById,
  updateProviderStatus
} from '../controllers/providerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { updateProviderProfileValidator, providerStatusValidator } from '../validators/providerValidators.js';
import { ROLES, PROVIDER_STATUS } from '../utils/constants.js';

const router = express.Router();

router.get('/', getProviders);
router.get('/match', authMiddleware, matchProvidersForRequest);

// Provider authenticated routes
router.post('/', authMiddleware, authorizeRoles(ROLES.PROVIDER), createProviderProfile);
router.get('/me', authMiddleware, authorizeRoles(ROLES.PROVIDER), getMyProviderProfile);
router.patch('/me', authMiddleware, authorizeRoles(ROLES.PROVIDER), validate(updateProviderProfileValidator), updateMyProviderProfile);

// Admin-specific routes
router.get('/pending', authMiddleware, authorizeRoles(ROLES.ADMIN, ROLES.OPERATIONS), getPendingProviders);
router.patch('/:id/verify', authMiddleware, authorizeRoles(ROLES.ADMIN), validate(providerStatusValidator), updateProviderStatus(PROVIDER_STATUS.VERIFIED));
router.patch('/:id/reject', authMiddleware, authorizeRoles(ROLES.ADMIN), validate(providerStatusValidator), updateProviderStatus(PROVIDER_STATUS.REJECTED));
router.patch('/:id/suspend', authMiddleware, authorizeRoles(ROLES.ADMIN), validate(providerStatusValidator), updateProviderStatus(PROVIDER_STATUS.SUSPENDED));

router.get('/:id', getProviderById);

export default router;
