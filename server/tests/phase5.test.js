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
import { Review } from '../src/models/Review.js';
import { Dispute } from '../src/models/Dispute.js';
import {
  ROLES,
  PROVIDER_STATUS,
  REQUEST_STATUS,
  QUOTE_STATUS,
  BOOKING_STATUS,
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

test('PHASE 5: Business Features, Reviews, Admin Dashboard & Dispute Resolution Suite', async (t) => {
  const stamp = Date.now();
  let adminToken;
  let customerToken;
  let customerId;
  let providerToken;
  let providerUserId;
  let providerDocId;
  let pendingProviderToken;
  let pendingProviderDocId;
  let requestId;
  let quoteId;
  let bookingId;
  let disputeId;

  // Setup accounts
  await t.test('Setup: Admin, Verified Provider, Pending Provider, and Customer', async () => {
    // Admin
    const adminLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@careconnect.com', password: 'Password123!' })
    });
    assert.equal(adminLogin.status, 200);
    adminToken = adminLogin.data.data.token;

    // Customer
    const cReg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Phase 5 Customer',
        email: `customer.p5.${stamp}@test.com`,
        password: 'Password123!',
        phone: '+91 98888 55551',
        role: 'customer',
        address: { city: 'Hyderabad', street: 'Hitech City' }
      })
    });
    assert.equal(cReg.status, 201);
    customerToken = cReg.data.data.token;
    customerId = cReg.data.data.user._id;

    // Verified Provider
    const p1Reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'P5 Super Tech',
        email: `provider1.p5.${stamp}@test.com`,
        password: 'Password123!',
        phone: '+91 98888 55552',
        role: 'provider',
        skills: ['Pipe Repair', 'Drain Cleaning'],
        categories: ['Plumbing'],
        serviceAreas: ['Hyderabad', 'Hitech City']
      })
    });
    assert.equal(p1Reg.status, 201);
    providerToken = p1Reg.data.data.token;
    providerUserId = p1Reg.data.data.user._id;
    providerDocId = p1Reg.data.data.provider._id;

    await api(`/api/providers/${providerDocId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Pending Provider
    const p2Reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'P5 Pending Pro',
        email: `provider2.p5.${stamp}@test.com`,
        password: 'Password123!',
        phone: '+91 98888 55553',
        role: 'provider',
        skills: ['Deep Cleaning'],
        categories: ['Cleaning'],
        serviceAreas: ['Hyderabad']
      })
    });
    assert.equal(p2Reg.status, 201);
    pendingProviderToken = p2Reg.data.data.token;
    pendingProviderDocId = p2Reg.data.data.provider._id;
  });

  // 1. Complete Workflow: Request -> AI -> Match -> Quote -> Booking -> Job -> Complete
  await t.test('1. Complete full workflow from Request to Job Completion', async () => {
    // 1. Request
    const reqRes = await api('/api/service-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        description: 'Bathroom pipe is leaking heavily and clogged drain needs immediate repair',
        preferredDate: '2026-11-05',
        preferredTime: '10:00'
      })
    });
    assert.equal(reqRes.status, 201);
    requestId = reqRes.data.data.serviceRequest._id;

    // 2. Quote
    const quoteRes = await api('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({
        requestId,
        price: 450,
        estimatedDuration: '1 hour',
        availableDate: '2026-11-05',
        availableTime: '10:00',
        message: 'I have the replacement pipes.'
      })
    });
    assert.equal(quoteRes.status, 201);
    quoteId = quoteRes.data.data._id;

    // 3. Accept Quote -> Booking
    const acceptRes = await api(`/api/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.equal(acceptRes.status, 201);
    bookingId = acceptRes.data.data.booking._id;

    // 4. Provider job status updates
    await api(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.IN_PROGRESS })
    });

    const compRes = await api(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.COMPLETED })
    });
    assert.equal(compRes.status, 200);
    assert.equal(compRes.data.data.status, BOOKING_STATUS.COMPLETED);

    // 5. Customer confirms completion
    const confRes = await api(`/api/bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.equal(confRes.status, 200);
    assert.equal(confRes.data.data.booking.status, BOOKING_STATUS.CUSTOMER_CONFIRMED);
  });

  // 2. Review: Customer reviews completed booking & provider rating updates
  await t.test('2. Customer submits review -> Updates provider average rating and review count', async () => {
    const revRes = await api('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        bookingId,
        rating: 5,
        comment: 'Outstanding and prompt repair work!'
      })
    });

    assert.equal(revRes.status, 201);
    assert.equal(revRes.data.data.rating, 5);

    // Check provider rating updated
    const pDoc = await Provider.findById(providerDocId);
    assert.equal(pDoc.rating, 5);
    assert.equal(pDoc.totalReviews, 1);
  });

  // 3. Only one review per booking
  await t.test('3. Prevent duplicate reviews on same booking (409)', async () => {
    const dupRev = await api('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        bookingId,
        rating: 4,
        comment: 'Second review attempt'
      })
    });
    assert.equal(dupRev.status, 409, 'Must prevent duplicate review on same booking');
  });

  // 4. Admin Dashboard Metrics
  await t.test('4. Admin Dashboard returns complete metrics', async () => {
    const dashRes = await api('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(dashRes.status, 200);
    const metrics = dashRes.data.data.metrics;
    assert.ok(metrics.totalUsers >= 1);
    assert.ok(metrics.totalCustomers >= 1);
    assert.ok(metrics.totalProviders >= 1);
    assert.ok(metrics.verifiedProviders >= 1);
    assert.ok(metrics.pendingProviders >= 1);
    assert.ok(metrics.totalRequests >= 1);
    assert.ok(metrics.completedBookings >= 1);
  });

  // 5. Admin Provider Verification
  await t.test('5. Admin verifies pending provider and creates new Category', async () => {
    // Verify provider
    const verifyRes = await api(`/api/providers/${pendingProviderDocId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.data.data.verificationStatus, 'verified');

    // Create Category
    const catRes = await api('/api/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Smart Home Setup ${stamp}`,
        description: 'Smart switches, voice assistant setup, IoT sensors',
        basePrice: 650,
        requiredSkills: ['Smart Lighting', 'IoT Setup']
      })
    });
    assert.equal(catRes.status, 201);
  });

  // 6. Dispute functionality: Customer creates dispute, Admin resolves it
  await t.test('6. Customer creates dispute -> Admin views and resolves dispute', async () => {
    // Customer creates dispute
    const dispRes = await api('/api/disputes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        bookingId,
        reason: 'Minor cleanup needed',
        description: 'Small water droplet remaining under cabinet floor.'
      })
    });
    assert.equal(dispRes.status, 201);
    disputeId = dispRes.data.data._id;
    assert.equal(dispRes.data.data.status, DISPUTE_STATUS.OPEN);

    // Admin resolves dispute
    const resolveRes = await api(`/api/disputes/${disputeId}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        resolution: 'Admin reviewed details and confirmed provider provided cleanup wipe.'
      })
    });
    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.data.data.status, DISPUTE_STATUS.RESOLVED);
  });

  // 7. Security and RBAC enforcement
  await t.test('7. Security: Role restrictions and cross-resource access prevention', async () => {
    // Customer cannot access admin dashboard
    const unauthDash = await api('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.equal(unauthDash.status, 403);

    // Provider cannot resolve disputes
    const unauthDispute = await api(`/api/disputes/${disputeId}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({ resolution: 'Attempt by provider' })
    });
    assert.equal(unauthDispute.status, 403);

    // Customer cannot create categories
    const unauthCat = await api('/api/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ name: 'Illegal Category', basePrice: 100 })
    });
    assert.equal(unauthCat.status, 403);
  });
});
