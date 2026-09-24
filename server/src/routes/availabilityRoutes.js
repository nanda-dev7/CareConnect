import express from 'express';
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability
} from '../controllers/availabilityController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAvailability);
router.post('/', authorizeRoles(ROLES.PROVIDER), createAvailability);
router.patch('/:id', authorizeRoles(ROLES.PROVIDER), updateAvailability);
router.delete('/:id', authorizeRoles(ROLES.PROVIDER), deleteAvailability);

export default router;
