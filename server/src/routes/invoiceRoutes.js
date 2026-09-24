import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  updatePaymentStatus
} from '../controllers/invoiceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.patch('/:id/payment', authorizeRoles(ROLES.ADMIN, ROLES.OPERATIONS, ROLES.SUPPORT, ROLES.CUSTOMER), updatePaymentStatus);

export default router;
