import { Dispute } from '../models/Dispute.js';
import { Invoice } from '../models/Invoice.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { DISPUTE_STATUS, PAYMENT_STATUS } from '../utils/constants.js';

export const getSupportDashboard = async (req, res, next) => {
  try {
    const [openDisputes, underReview, refundedInvoices] = await Promise.all([
      Dispute.countDocuments({ status: DISPUTE_STATUS.OPEN }),
      Dispute.countDocuments({ status: DISPUTE_STATUS.UNDER_REVIEW }),
      Invoice.countDocuments({ paymentStatus: { $in: [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED] } })
    ]);

    return sendSuccess(res, 200, 'Support dashboard retrieved', {
      metrics: {
        openDisputes,
        underReview,
        refundedInvoices
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRefunds = async (req, res, next) => {
  try {
    const refunds = await Invoice.find({
      paymentStatus: { $in: [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED] }
    })
      .populate('customerId', 'name email phone')
      .populate({
        path: 'providerId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('bookingId')
      .sort({ updatedAt: -1 });

    return sendSuccess(res, 200, 'Refund records retrieved', refunds);
  } catch (error) {
    next(error);
  }
};
