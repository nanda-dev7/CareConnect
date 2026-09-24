import { User } from '../models/User.js';
import { Provider } from '../models/Provider.js';
import { Booking } from '../models/Booking.js';
import { Invoice } from '../models/Invoice.js';
import { Dispute } from '../models/Dispute.js';
import { AuditLog } from '../models/AuditLog.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { BOOKING_STATUS, PAYMENT_STATUS, PROVIDER_STATUS, DISPUTE_STATUS } from '../utils/constants.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      verifiedProviders,
      pendingProviders,
      totalRequests,
      totalBookings,
      activeJobs,
      completedBookings,
      cancelledBookings,
      openDisputes,
      paidInvoices
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer', isActive: true }),
      Provider.countDocuments(),
      Provider.countDocuments({ verificationStatus: PROVIDER_STATUS.VERIFIED }),
      Provider.countDocuments({ verificationStatus: PROVIDER_STATUS.PENDING }),
      ServiceRequest.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: [BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.IN_PROGRESS] } }),
      Booking.countDocuments({ status: { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CUSTOMER_CONFIRMED] } }),
      Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED }),
      Dispute.countDocuments({ status: { $in: [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.UNDER_REVIEW, DISPUTE_STATUS.ESCALATED] } }),
      Invoice.find({ paymentStatus: PAYMENT_STATUS.PAID })
    ]);

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    return sendSuccess(res, 200, 'Admin dashboard summary retrieved', {
      metrics: {
        totalUsers,
        totalCustomers,
        totalProviders,
        verifiedProviders,
        pendingProviders,
        totalRequests,
        totalBookings,
        activeBookings: activeJobs,
        activeJobs,
        completedBookings,
        cancelledBookings,
        openDisputes,
        totalRevenue: Number(totalRevenue.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    return sendSuccess(res, 200, 'Audit logs retrieved', logs, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const revenueByMonth = await Invoice.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          totalRevenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topRatedProviders = await Provider.find({ verificationStatus: PROVIDER_STATUS.VERIFIED })
      .populate('userId', 'name email phone')
      .sort({ rating: -1, completedJobs: -1 })
      .limit(5);

    return sendSuccess(res, 200, 'Platform analytics retrieved', {
      bookingsByStatus,
      revenueByMonth,
      topRatedProviders
    });
  } catch (error) {
    next(error);
  }
};
