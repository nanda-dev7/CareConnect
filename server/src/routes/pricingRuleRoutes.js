import express from 'express';
import {
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule
} from '../controllers/pricingRuleController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.get('/', getPricingRules);

router.use(authMiddleware);

router.post('/', authorizeRoles(ROLES.ADMIN), createPricingRule);
router.patch('/:id', authorizeRoles(ROLES.ADMIN), updatePricingRule);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), deletePricingRule);

export default router;
