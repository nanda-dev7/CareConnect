import express from 'express';
import {
  createDispute,
  getDisputes,
  getDisputeById,
  updateDispute,
  resolveDispute,
  escalateDispute
} from '../controllers/disputeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizeRoles(ROLES.CUSTOMER), createDispute);
router.get('/', getDisputes);
router.get('/:id', getDisputeById);
router.patch('/:id', authorizeRoles(ROLES.SUPPORT, ROLES.ADMIN), updateDispute);
router.post('/:id/resolve', authorizeRoles(ROLES.SUPPORT, ROLES.ADMIN), resolveDispute);
router.post('/:id/escalate', authorizeRoles(ROLES.SUPPORT, ROLES.OPERATIONS), escalateDispute);

export default router;
