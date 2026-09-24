import express from 'express';
import {
  getAdminDashboard,
  getAuditLogs,
  getAdminAnalytics
} from '../controllers/adminController.js';
import { getAllUsers, updateUserStatus } from '../controllers/userController.js';
import { getProviders, updateProviderStatus } from '../controllers/providerController.js';
import { getBookings } from '../controllers/bookingController.js';
import { getServiceRequests } from '../controllers/serviceRequestController.js';
import { getDisputes } from '../controllers/disputeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES, PROVIDER_STATUS } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminAnalytics);
router.get('/audit-logs', getAuditLogs);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/providers', getProviders);
router.patch('/providers/:id/verify', updateProviderStatus(PROVIDER_STATUS.VERIFIED));
router.patch('/providers/:id/suspend', updateProviderStatus(PROVIDER_STATUS.SUSPENDED));
router.get('/bookings', getBookings);
router.get('/requests', getServiceRequests);
router.get('/disputes', getDisputes);

export default router;
