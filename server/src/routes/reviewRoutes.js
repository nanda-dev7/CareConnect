import express from 'express';
import {
  createReview,
  getReviewsForProvider,
  updateReview
} from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { createReviewValidator } from '../validators/reviewValidators.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.get('/provider/:providerId', getReviewsForProvider);

router.use(authMiddleware);

router.post('/', authorizeRoles(ROLES.CUSTOMER), validate(createReviewValidator), createReview);
router.patch('/:id', authorizeRoles(ROLES.CUSTOMER), updateReview);

export default router;
