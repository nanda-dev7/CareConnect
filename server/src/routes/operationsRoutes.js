import express from 'express';
import {
  getOperationsDashboard,
  getActiveJobs,
  getEscalations,
  reassignProvider
} from '../controllers/operationsController.js';
import { getBookings } from '../controllers/bookingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles(ROLES.OPERATIONS, ROLES.ADMIN));

router.get('/dashboard', getOperationsDashboard);
router.get('/bookings', getBookings);
router.get('/active-jobs', getActiveJobs);
router.get('/escalations', getEscalations);
router.patch('/bookings/:id/assign', reassignProvider);
router.patch('/bookings/:id/reassign', reassignProvider);

export default router;
