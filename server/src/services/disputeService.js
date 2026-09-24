import { Dispute } from '../models/Dispute.js';
import { Booking } from '../models/Booking.js';
import { DISPUTE_STATUS, BOOKING_STATUS, NOTIFICATION_TYPES, ROLES } from '../utils/constants.js';
import { NotificationService } from './notificationService.js';
import { AuditService } from './auditService.js';

export class DisputeService {
  /**
   * Creates a dispute for an existing booking and sets booking status to disputed.
   */
  static async createDispute({ bookingId, customerId, reason, description, evidence = [], req = null }) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.customerId.toString() !== customerId.toString()) {
      throw new Error('You can only raise disputes for your own bookings');
    }

    const dispute = await Dispute.create({
      bookingId,
      customerId,
      providerId: booking.providerId,
      reason,
      description,
      evidence,
      status: DISPUTE_STATUS.OPEN
    });

    booking.status = BOOKING_STATUS.DISPUTED;
    await booking.save();

    // Notify provider
    const providerUser = await booking.populate({ path: 'providerId', select: 'userId' });
    if (providerUser?.providerId?.userId) {
      await NotificationService.notifyUser({
        userId: providerUser.providerId.userId,
        title: 'Customer Raised Dispute',
        message: `A dispute has been raised for booking #${booking._id}: "${reason}"`,
        type: NOTIFICATION_TYPES.DISPUTE,
        relatedEntity: { entityType: 'Dispute', entityId: dispute._id }
      });
    }

    // Notify Support team
    await NotificationService.notifyRole(ROLES.SUPPORT, {
      title: 'New Dispute Escalated',
      message: `New dispute raised on booking #${booking._id}`,
      type: NOTIFICATION_TYPES.DISPUTE,
      relatedEntity: { entityType: 'Dispute', entityId: dispute._id }
    });

    await AuditService.logAction({
      userId: customerId,
      action: 'DISPUTE_RAISED',
      entityType: 'Dispute',
      entityId: dispute._id,
      metadata: { bookingId, reason },
      req
    });

    return dispute;
  }
}
