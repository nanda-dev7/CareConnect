import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  createPrivilegedUser
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import {
  registerValidator,
  loginValidator,
  createPrivilegedUserValidator
} from '../validators/authValidators.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

// Admin-only route for creating operations/support/admin users
router.post(
  '/create-privileged-user',
  authMiddleware,
  authorizeRoles(ROLES.ADMIN),
  validate(createPrivilegedUserValidator),
  createPrivilegedUser
);

export default router;
