import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  confirmBookingCompletion,
  cancelBooking,
  addBookingNote
} from '../controllers/bookingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { updateBookingStatusValidator, cancelBookingValidator } from '../validators/bookingValidators.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.patch('/:id/status', validate(updateBookingStatusValidator), updateBookingStatus);
router.post('/:id/confirm', confirmBookingCompletion);
router.post('/:id/cancel', validate(cancelBookingValidator), cancelBooking);
router.post('/:id/notes', addBookingNote);

export default router;
