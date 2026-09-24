import express from 'express';
import {
  createQuote,
  getMyQuotes,
  getQuotesForRequest,
  updateQuote,
  acceptQuote,
  rejectQuote
} from '../controllers/quoteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { createQuoteValidator, quoteIdValidator } from '../validators/quoteValidators.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);

// Provider quote routes
router.post('/', authorizeRoles(ROLES.PROVIDER), validate(createQuoteValidator), createQuote);
router.get('/my', authorizeRoles(ROLES.PROVIDER), getMyQuotes);
router.patch('/:id', authorizeRoles(ROLES.PROVIDER), validate(quoteIdValidator), updateQuote);

// Customer quote routes
router.get('/request/:requestId', getQuotesForRequest);
router.post('/:id/accept', authorizeRoles(ROLES.CUSTOMER), validate(quoteIdValidator), acceptQuote);
router.post('/:id/reject', authorizeRoles(ROLES.CUSTOMER), validate(quoteIdValidator), rejectQuote);

export default router;
