import { Availability } from '../models/Availability.js';
import { Booking } from '../models/Booking.js';
import { BOOKING_STATUS } from '../utils/constants.js';

export class AvailabilityService {
  /**
   * Checks whether a provider is available and has no overlapping active bookings for the specified date and time window.
   */
  static async checkAvailability({ providerId, date, startTime, endTime }) {
    const targetDate = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[targetDate.getDay()];

    // 1. Check provider recurring working hours for the day
    const schedule = await Availability.findOne({
      providerId,
      dayOfWeek,
      isAvailable: true
    });

    if (schedule) {
      if (startTime < schedule.startTime || endTime > schedule.endTime) {
        return {
          available: false,
          reason: `Provider working hours on ${dayOfWeek} are ${schedule.startTime} - ${schedule.endTime}. Requested: ${startTime} - ${endTime}`
        };
      }
    }

    // 2. Conflict detection: find overlapping bookings
    // Two intervals [A_start, A_end] and [B_start, B_end] overlap if A_start < B_end && B_start < A_end
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const activeBookings = await Booking.find({
      providerId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: {
        $nin: [
          BOOKING_STATUS.CANCELLED,
          BOOKING_STATUS.COMPLETED,
          BOOKING_STATUS.CUSTOMER_CONFIRMED
        ]
      }
    });

    for (const booking of activeBookings) {
      const bStart = booking.startTime;
      const bEnd = booking.endTime;

      // Overlap condition
      if (startTime < bEnd && bStart < endTime) {
        return {
          available: false,
          conflictBookingId: booking._id,
          reason: `Provider has an existing booking on this date from ${bStart} to ${bEnd}`
        };
      }
    }

    return {
      available: true
    };
  }
}
