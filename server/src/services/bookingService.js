import { BOOKING_STATUS, ROLES } from '../utils/constants.js';

// Allowed forward transitions
const ALLOWED_TRANSITIONS = {
  [BOOKING_STATUS.REQUESTED]: [BOOKING_STATUS.QUOTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.QUOTED]: [BOOKING_STATUS.PROVIDER_SELECTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.PROVIDER_SELECTED]: [BOOKING_STATUS.SCHEDULED, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.SCHEDULED]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.SCHEDULED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.ASSIGNED]: [BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.EN_ROUTE]: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DISPUTED],
  [BOOKING_STATUS.COMPLETED]: [BOOKING_STATUS.CUSTOMER_CONFIRMED, BOOKING_STATUS.DISPUTED],
  [BOOKING_STATUS.CUSTOMER_CONFIRMED]: [BOOKING_STATUS.DISPUTED],
  [BOOKING_STATUS.DISPUTED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CUSTOMER_CONFIRMED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.CANCELLED]: [] // Terminal
};

export class BookingService {
  /**
   * Validates if a state transition is legal according to the Booking state machine.
   */
  static validateStatusTransition(currentStatus, targetStatus, role) {
    if (currentStatus === targetStatus) {
      return { allowed: true };
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `Illegal state transition from '${currentStatus}' to '${targetStatus}'. Valid next states: [${allowedNextStatuses.join(', ')}]`
      };
    }

    // Role-specific transition permissions
    if ([BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED].includes(targetStatus)) {
      if (role !== ROLES.PROVIDER && role !== ROLES.ADMIN && role !== ROLES.OPERATIONS) {
        return {
          allowed: false,
          reason: `Only the assigned service provider or operations manager can mark a job as '${targetStatus}'`
        };
      }
    }

    if (targetStatus === BOOKING_STATUS.CUSTOMER_CONFIRMED) {
      if (role !== ROLES.CUSTOMER && role !== ROLES.ADMIN) {
        return {
          allowed: false,
          reason: `Only the customer can confirm job completion`
        };
      }
    }

    return { allowed: true };
  }
}
