const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Universal fetch wrapper with auto Authorization token injection,
 * standard response parsing, and error normalization.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('careconnect_token');

  const headers = {
    ...options.headers
  };

  // If body is NOT FormData, set JSON content type
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

// Authentication APIs
export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' })
};

// User Management APIs
export const userApi = {
  getAll: (params = '') => apiRequest(`/users${params}`),
  getById: (id) => apiRequest(`/users/${id}`),
  updateStatus: (id, isActive) => apiRequest(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
};

// Categories & Skills APIs
export const categoryApi = {
  getAll: () => apiRequest('/categories'),
  create: (categoryData) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(categoryData) }),
  update: (id, categoryData) => apiRequest(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(categoryData) }),
  delete: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' })
};

// Service Requests & AI Classification APIs
export const serviceRequestApi = {
  create: (requestData) => apiRequest('/service-requests', { method: 'POST', body: JSON.stringify(requestData) }),
  getAll: (params = '') => apiRequest(`/service-requests${params}`),
  getById: (id) => apiRequest(`/service-requests/${id}`),
  cancel: (id, reason) => apiRequest(`/service-requests/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
};

// Providers & AI Matching APIs
export const providerApi = {
  getAll: (queryString = '') => apiRequest(`/providers?${queryString}`),
  getById: (id) => apiRequest(`/providers/${id}`),
  getMe: () => apiRequest('/providers/me'),
  updateMe: (data) => apiRequest('/providers/me', { method: 'PATCH', body: JSON.stringify(data) }),
  match: (requestId) => apiRequest(`/providers/match?requestId=${requestId}`),
  getPending: () => apiRequest('/providers/pending'),
  verify: (id) => apiRequest(`/providers/${id}/verify`, { method: 'PATCH' }),
  reject: (id, reason) => apiRequest(`/providers/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  suspend: (id, reason) => apiRequest(`/providers/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }) })
};

// Availability APIs
export const availabilityApi = {
  getMy: () => apiRequest('/availability'),
  create: (slotData) => apiRequest('/availability', { method: 'POST', body: JSON.stringify(slotData) }),
  delete: (id) => apiRequest(`/availability/${id}`, { method: 'DELETE' })
};

// Quotes APIs
export const quoteApi = {
  create: (quoteData) => apiRequest('/quotes', { method: 'POST', body: JSON.stringify(quoteData) }),
  getMy: () => apiRequest('/quotes/my'),
  getByRequest: (requestId) => apiRequest(`/quotes/request/${requestId}`),
  accept: (id) => apiRequest(`/quotes/${id}/accept`, { method: 'POST' }),
  reject: (id) => apiRequest(`/quotes/${id}/reject`, { method: 'POST' })
};

// Bookings APIs
export const bookingApi = {
  getAll: (params = '') => apiRequest(`/bookings${params}`),
  getById: (id) => apiRequest(`/bookings/${id}`),
  updateStatus: (id, status, notes) => apiRequest(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  confirm: (id) => apiRequest(`/bookings/${id}/confirm`, { method: 'POST' }),
  cancel: (id, reason) => apiRequest(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  addNote: (id, text) => apiRequest(`/bookings/${id}/notes`, { method: 'POST', body: JSON.stringify({ text }) })
};

// Job Management & Evidence APIs
export const jobApi = {
  uploadEvidence: (bookingId, formData) => apiRequest(`/jobs/${bookingId}/evidence`, { method: 'POST', body: formData }),
  getEvidence: (bookingId) => apiRequest(`/jobs/${bookingId}/evidence`)
};

// Invoices & Payments APIs
export const invoiceApi = {
  getAll: () => apiRequest('/invoices'),
  getById: (id) => apiRequest(`/invoices/${id}`),
  updatePayment: (id, paymentStatus, paymentMethod) => apiRequest(`/invoices/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ paymentStatus, paymentMethod }) })
};

// Reviews APIs
export const reviewApi = {
  create: (reviewData) => apiRequest('/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),
  getByProvider: (providerId) => apiRequest(`/reviews/provider/${providerId}`)
};

// Disputes APIs
export const disputeApi = {
  create: (disputeData) => apiRequest('/disputes', { method: 'POST', body: JSON.stringify(disputeData) }),
  getAll: () => apiRequest('/disputes'),
  getById: (id) => apiRequest(`/disputes/${id}`),
  resolve: (id, resolution, refundAmount) => apiRequest(`/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution, refundAmount }) }),
  escalate: (id, reason) => apiRequest(`/disputes/${id}/escalate`, { method: 'POST', body: JSON.stringify({ reason }) })
};

// Notifications APIs
export const notificationApi = {
  getAll: () => apiRequest('/notifications'),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' })
};

// Admin & Operations & Support APIs
export const adminApi = {
  getDashboard: () => apiRequest('/admin/dashboard'),
  getAnalytics: () => apiRequest('/admin/analytics'),
  getAuditLogs: () => apiRequest('/admin/audit-logs'),
  getPricingRules: () => apiRequest('/pricing-rules')
};

export const operationsApi = {
  getDashboard: () => apiRequest('/operations/dashboard'),
  getActiveJobs: () => apiRequest('/operations/active-jobs'),
  assignProvider: (bookingId, providerId) => apiRequest(`/operations/bookings/${bookingId}/assign`, { method: 'PATCH', body: JSON.stringify({ providerId }) })
};

export const supportApi = {
  getDashboard: () => apiRequest('/support/dashboard')
};
