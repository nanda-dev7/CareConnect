import express from 'express';
import { uploadJobEvidence, getJobEvidence } from '../controllers/jobController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/:bookingId/evidence', upload.single('file'), uploadJobEvidence);
router.get('/:bookingId/evidence', getJobEvidence);

export default router;
