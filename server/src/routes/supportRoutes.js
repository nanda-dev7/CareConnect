import express from 'express';
import {
  getSupportDashboard,
  getRefunds
} from '../controllers/supportController.js';
import {
  getDisputes,
  getDisputeById,
  updateDispute,
  resolveDispute
} from '../controllers/disputeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles(ROLES.SUPPORT, ROLES.ADMIN));

router.get('/dashboard', getSupportDashboard);
router.get('/disputes', getDisputes);
router.get('/complaints', getDisputes);
router.get('/refunds', getRefunds);
router.patch('/disputes/:id', updateDispute);
router.post('/disputes/:id/resolve', resolveDispute);

export default router;
