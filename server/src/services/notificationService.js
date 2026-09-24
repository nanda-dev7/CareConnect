import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ROLES, NOTIFICATION_TYPES } from '../utils/constants.js';

export class NotificationService {
  /**
   * Dispatches a persistent notification to a specific user.
   */
  static async notifyUser({ userId, title, message, type = NOTIFICATION_TYPES.SYSTEM, relatedEntity = {} }) {
    try {
      if (!userId) return null;
      return await Notification.create({
        userId,
        title,
        message,
        type,
        relatedEntity
      });
    } catch (err) {
      console.error('[NotificationService Error]', err.message);
      return null;
    }
  }

  /**
   * Broadcasts notification to all users of a specific role (e.g., operations, support, admin).
   */
  static async notifyRole(role, { title, message, type = NOTIFICATION_TYPES.SYSTEM, relatedEntity = {} }) {
    try {
      const users = await User.find({ role, isActive: true }).select('_id');
      if (!users.length) return;

      const notifications = users.map(user => ({
        userId: user._id,
        title,
        message,
        type,
        relatedEntity
      }));

      await Notification.insertMany(notifications);
    } catch (err) {
      console.error('[NotificationService Broadcast Error]', err.message);
    }
  }
}
