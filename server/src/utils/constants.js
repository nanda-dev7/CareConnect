export const ROLES = {
  ADMIN: 'admin',
  OPERATIONS: 'operations',
  PROVIDER: 'provider',
  CUSTOMER: 'customer',
  SUPPORT: 'support'
};

export const PROVIDER_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

export const REQUEST_STATUS = {
  OPEN: 'open',
  MATCHING: 'matching',
  QUOTED: 'quoted',
  PROVIDER_SELECTED: 'provider_selected',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  DISPUTED: 'disputed'
};

export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EMERGENCY: 'emergency'
};

export const QUOTE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  WITHDRAWN: 'withdrawn'
};

export const BOOKING_STATUS = {
  REQUESTED: 'requested',
  QUOTED: 'quoted',
  PROVIDER_SELECTED: 'provider_selected',
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  ASSIGNED: 'assigned',
  EN_ROUTE: 'en_route',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CUSTOMER_CONFIRMED: 'customer_confirmed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
};

export const EVIDENCE_TYPES = {
  BEFORE: 'before',
  DURING: 'during',
  AFTER: 'after',
  DOCUMENT: 'document',
  OTHER: 'other'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

export const DISPUTE_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  WAITING_CUSTOMER: 'waiting_customer',
  WAITING_PROVIDER: 'waiting_provider',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated'
};

export const NOTIFICATION_TYPES = {
  REQUEST: 'request',
  QUOTE: 'quote',
  BOOKING: 'booking',
  JOB: 'job',
  INVOICE: 'invoice',
  DISPUTE: 'dispute',
  SYSTEM: 'system'
};

export const MATCH_WEIGHTS = {
  SKILL_MATCH: 0.40,
  AREA_MATCH: 0.20,
  AVAILABILITY: 0.20,
  RATING: 0.10,
  EXPERIENCE: 0.10
};
