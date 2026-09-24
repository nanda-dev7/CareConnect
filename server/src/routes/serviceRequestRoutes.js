import express from 'express';
import {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  cancelServiceRequest
} from '../controllers/serviceRequestController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { createRequestValidator, requestIdValidator } from '../validators/requestValidators.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizeRoles(ROLES.CUSTOMER), validate(createRequestValidator), createServiceRequest);
router.get('/', getServiceRequests);
router.get('/:id', validate(requestIdValidator), getServiceRequestById);
router.patch('/:id', validate(requestIdValidator), updateServiceRequest);
router.post('/:id/cancel', validate(requestIdValidator), cancelServiceRequest);

export default router;
