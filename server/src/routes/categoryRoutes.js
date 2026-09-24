import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getSkills,
  createSkill
} from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/skills', getSkills);
router.get('/:id', getCategoryById);

// Admin-only category & skill mutations
router.post('/', authMiddleware, authorizeRoles(ROLES.ADMIN), createCategory);
router.patch('/:id', authMiddleware, authorizeRoles(ROLES.ADMIN), updateCategory);
router.delete('/:id', authMiddleware, authorizeRoles(ROLES.ADMIN), deleteCategory);
router.post('/skills', authMiddleware, authorizeRoles(ROLES.ADMIN), createSkill);

export default router;
