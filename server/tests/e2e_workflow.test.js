import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Provider } from '../src/models/Provider.js';
import { Category } from '../src/models/Category.js';
import { ServiceRequest } from '../src/models/ServiceRequest.js';
import { Quote } from '../src/models/Quote.js';
import { Booking } from '../src/models/Booking.js';
import { Invoice } from '../src/models/Invoice.js';
import { Dispute } from '../src/models/Dispute.js';
import { Review } from '../src/models/Review.js';
import { AuditLog } from '../src/models/AuditLog.js';
import {
  ROLES,
  PROVIDER_STATUS,
  REQUEST_STATUS,
  QUOTE_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  DISPUTE_STATUS
} from '../src/utils/constants.js';

let app;
let server;
let baseUrl;

const api = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
};

test.before(async () => {
  await mongoose.connect(ENV.MONGO_URI);
  app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) server.close();
  await mongoose.disconnect();
});

test('72. Complete End-to-End CareConnect Workflow', async (t) => {
  const stamp = Date.now();
  let customerToken;
  let customerId;
  let providerToken;
  let providerUserId;
  let providerDocId;
  let adminToken;
  let supportToken;
  let opsToken;
  let requestId;
  let quoteId;
  let bookingId;
  let invoiceId;
  let disputeId;

  // 1. Customer registers
  await t.test('Step 1-2: Customer registers and logs in', async () => {
    const email = `customer.e2e.${stamp}@test.com`;
    const regRes = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Arun Verma',
        email,
        password: 'Password123!',
        phone: '+91 98888 77777',
        role: 'customer',
        address: { city: 'Hyderabad', street: 'Banjara Hills Road 12' }
      })
    });
    assert.equal(regRes.status, 201);
    customerToken = regRes.data.data.token;
    customerId = regRes.data.data.user._id;

    // Login check
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'Password123!' })
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.data.data.token);
  });

  // 2. Provider registers
  await t.test('Step 3-4: Provider registers and Admin verifies provider', async () => {
    const email = `provider.e2e.${stamp}@test.com`;
    const regRes = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Gaurav Sharma (Pro Tech)',
        email,
        password: 'Password123!',
        phone: '+91 97777 66666',
        role: 'provider',
        skills: ['Pipe Repair', 'Leak Detection'],
        categories: ['Plumbing'],
        serviceAreas: ['Hyderabad', 'Banjara Hills']
      })
    });
    assert.equal(regRes.status, 201);
    providerToken = regRes.data.data.token;
    providerUserId = regRes.data.data.user._id;
    providerDocId = regRes.data.data.provider._id;

    // Admin login
    const adminLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@careconnect.com', password: 'Password123!' })
    });
    adminToken = adminLogin.data.data.token;

    // Admin verifies provider
    const verifyRes = await api(`/api/providers/${providerDocId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.data.data.verificationStatus, 'verified');
  });

  // 3. Provider adds availability
  await t.test('Step 5-7: Provider adds availability schedule', async () => {
    const availRes = await api('/api/availability', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({
        dayOfWeek: 'Friday',
        startTime: '08:00',
        endTime: '20:00'
      })
    });
    assert.equal(availRes.status, 201);
  });

  // 4. Customer creates service request with AI classification & matching
  await t.test('Step 8-11: Customer creates service request -> AI classifies -> finds suitable providers', async () => {
    const reqRes = await api('/api/service-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        description: 'Urgent: kitchen sink water pipe has a major leak flooding under the sink',
        location: { city: 'Hyderabad', street: 'Banjara Hills Road 12' },
        preferredDate: '2026-10-16',
        preferredTime: '10:00'
      })
    });

    assert.equal(reqRes.status, 201);
    assert.equal(reqRes.data.success, true);
    requestId = reqRes.data.data.serviceRequest._id;

    // AI Classification check
    assert.equal(reqRes.data.data.aiClassification.category, 'Plumbing');
    const classifiedSkills = reqRes.data.data.aiClassification.skills.map(s => s.toLowerCase());
    assert.ok(classifiedSkills.some(s => s.includes('pipe') || s.includes('leak') || s.includes('sink')));
    assert.equal(reqRes.data.data.aiClassification.status, 'completed');

    // Recommendations check
    const recommendations = reqRes.data.data.recommendedProviders;
    assert.ok(Array.isArray(recommendations));
    assert.ok(recommendations.length > 0);
  });

  // 5. Provider submits quote
  await t.test('Step 12-13: Provider submits quote', async () => {
    const quoteRes = await api('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({
        requestId,
        price: 450,
        estimatedDuration: '1.5 hours',
        availableDate: '2026-10-16',
        availableTime: '10:00',
        message: 'Will arrive with replacement pipe fittings and seal.'
      })
    });

    assert.equal(quoteRes.status, 201);
    quoteId = quoteRes.data.data._id;
  });

  // 6. Customer accepts quote -> creates booking
  await t.test('Step 14-16: Customer accepts quote -> Booking created', async () => {
    const acceptRes = await api(`/api/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    assert.equal(acceptRes.status, 201);
    assert.equal(acceptRes.data.data.quote.status, 'accepted');
    assert.ok(acceptRes.data.data.booking._id);
    bookingId = acceptRes.data.data.booking._id;
    assert.equal(acceptRes.data.data.booking.status, 'scheduled');
  });

  // 7. Provider performs job (en_route -> in_progress -> evidence -> complete)
  await t.test('Step 17-20: Provider updates job status, uploads evidence, marks completed', async () => {
    // en_route
    const enRouteRes = await api(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.EN_ROUTE })
    });
    assert.equal(enRouteRes.status, 200);

    // in_progress
    const inProgRes = await api(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.IN_PROGRESS })
    });
    assert.equal(inProgRes.status, 200);

    // Upload job evidence
    const evidenceRes = await api(`/api/jobs/${bookingId}/evidence`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({
        type: 'after',
        fileUrl: 'https://storage.careconnect.com/evidence/sink-fixed.jpg',
        description: 'Installed new heavy-duty PVC pipe and silicone seal.'
      })
    });
    assert.equal(evidenceRes.status, 201);

    // complete
    const compRes = await api(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.COMPLETED })
    });
    assert.equal(compRes.status, 200);
    assert.equal(compRes.data.data.status, BOOKING_STATUS.COMPLETED);
  });

  // 8. Customer confirms completion -> Invoice generated
  await t.test('Step 21-23: Customer confirms completion -> Invoice generated & payment recorded', async () => {
    const confirmRes = await api(`/api/bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    assert.equal(confirmRes.status, 200);
    assert.equal(confirmRes.data.data.booking.status, BOOKING_STATUS.CUSTOMER_CONFIRMED);
    assert.ok(confirmRes.data.data.invoice._id);
    invoiceId = confirmRes.data.data.invoice._id;
    assert.equal(confirmRes.data.data.invoice.paymentStatus, 'pending');

    // Customer marks invoice payment as paid
    const payRes = await api(`/api/invoices/${invoiceId}/payment`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ paymentStatus: PAYMENT_STATUS.PAID })
    });
    assert.equal(payRes.status, 200);
    assert.equal(payRes.data.data.paymentStatus, PAYMENT_STATUS.PAID);
  });

  // 9. Customer submits review -> Provider rating recalculates
  await t.test('Step 24-25: Customer submits review -> Provider rating updated', async () => {
    const reviewRes = await api('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        bookingId,
        rating: 5,
        comment: 'Super fast response! Leak is completely fixed.'
      })
    });

    assert.equal(reviewRes.status, 201);
    assert.equal(reviewRes.data.data.rating, 5);

    // Verify provider rating updated
    const pProfile = await api(`/api/providers/${providerDocId}`);
    assert.equal(pProfile.status, 200);
    assert.equal(pProfile.data.data.rating, 5);
    assert.equal(pProfile.data.data.totalReviews, 1);
  });

  // 10. Dispute management & Support Resolution
  await t.test('Step 26-27: Customer raises dispute & Support resolves it', async () => {
    // Support login
    const supportLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'support@careconnect.com', password: 'Password123!' })
    });
    supportToken = supportLogin.data.data.token;

    // Customer raises dispute
    const disputeRes = await api('/api/disputes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        bookingId,
        reason: 'Minor water spot on cabinet floor',
        description: 'A few drops remaining on the cabinet floor.',
        evidence: ['https://storage.careconnect.com/disputes/spot.jpg']
      })
    });

    assert.equal(disputeRes.status, 201);
    disputeId = disputeRes.data.data._id;

    // Support resolves dispute
    const resolveRes = await api(`/api/disputes/${disputeId}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supportToken}` },
      body: JSON.stringify({
        resolution: 'Provider provided courtesy drying cloth and customer accepted resolution.'
      })
    });

    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.data.data.status, DISPUTE_STATUS.RESOLVED);
  });

  // 11. Operations Monitoring
  await t.test('Step 28: Operations monitors platform', async () => {
    const opsLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'operations@careconnect.com', password: 'Password123!' })
    });
    opsToken = opsLogin.data.data.token;

    const opsDash = await api('/api/operations/dashboard', {
      headers: { Authorization: `Bearer ${opsToken}` }
    });
    assert.equal(opsDash.status, 200);
    assert.ok(opsDash.data.data.metrics);
  });

  // 12. Admin Governance & Audit Logs
  await t.test('Step 29-30: Admin checks analytics & immutable audit logs', async () => {
    const dashRes = await api('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(dashRes.status, 200);
    assert.ok(dashRes.data.data.metrics.totalRevenue > 0);

    const auditRes = await api('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(auditRes.status, 200);
    assert.ok(auditRes.data.data.length > 0);
  });
});
