import { AuditLog } from '../models/AuditLog.js';

export class AuditService {
  /**
   * Logs administrative, security, and lifecycle events for compliance.
   */
  static async logAction({ userId, action, entityType, entityId, metadata = {}, req = null }) {
    try {
      const ipAddress = req
        ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1')
        : '127.0.0.1';

      return await AuditLog.create({
        userId,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress
      });
    } catch (err) {
      console.error('[AuditService Error]', err.message);
      return null;
    }
  }
}
