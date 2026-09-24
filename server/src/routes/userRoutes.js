import express from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Admin-only user management
router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.OPERATIONS), getAllUsers);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.OPERATIONS), getUserById);
router.patch('/:id/status', authorizeRoles(ROLES.ADMIN), updateUserStatus);

export default router;
