import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Provider } from '../src/models/Provider.js';
import { ServiceRequest } from '../src/models/ServiceRequest.js';
import { Quote } from '../src/models/Quote.js';
import { Booking } from '../src/models/Booking.js';
import { ClassificationService } from '../src/services/ai/classificationService.js';
import { AvailabilityService } from '../src/services/availabilityService.js';
import { BookingService } from '../src/services/bookingService.js';
import { ROLES, BOOKING_STATUS } from '../src/utils/constants.js';

let app;
let server;
let baseUrl;

// Helper fetch wrapper
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

test('1. Health Check Endpoint', async () => {
  const { status, data } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.status, 'healthy');
});

test('2. Authentication Flow (Register, Login, Duplicates, Invalid Credentials)', async (t) => {
  const testEmail = `test.user.${Date.now()}@example.com`;

  await t.test('Register new customer', async () => {
    const { status, data } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Customer',
        email: testEmail,
        password: 'Password123!',
        phone: '+91 99999 88888',
        role: 'customer'
      })
    });

    assert.equal(status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.token);
    assert.equal(data.data.user.email, testEmail);
    assert.equal(data.data.user.password, undefined); // password omitted
  });

  await t.test('Prevent duplicate email registration', async () => {
    const { status, data } = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Another User',
        email: testEmail,
        password: 'Password123!',
        phone: '+91 99999 77777',
        role: 'customer'
      })
    });

    assert.equal(status, 409);
    assert.equal(data.success, false);
  });

  await t.test('Login with valid credentials', async () => {
    const { status, data } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });

    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.token);
  });

  await t.test('Login with invalid password', async () => {
    const { status, data } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!'
      })
    });

    assert.equal(status, 401);
    assert.equal(data.success, false);
  });
});

test('3. RBAC Authorization Enforcements', async () => {
  // Login as Customer
  const custRes = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'customer1@gmail.com', password: 'Password123!' })
  });
  const customerToken = custRes.data.data.token;

  // Login as Admin
  const adminRes = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@careconnect.com', password: 'Password123!' })
  });
  const adminToken = adminRes.data.data.token;

  // Customer should NOT be able to access Admin dashboard
  const forbiddenRes = await api('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert.equal(forbiddenRes.status, 403);
  assert.equal(forbiddenRes.data.success, false);

  // Admin CAN access Admin dashboard
  const allowedRes = await api('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(allowedRes.status, 200);
  assert.equal(allowedRes.data.success, true);
});

test('4. AI Classification and Fallback Resiliency', async () => {
  const result = await ClassificationService.classifyRequest(
    'My kitchen sink pipe has a water leakage and tap is dripping constantly'
  );

  assert.equal(result.category, 'Plumbing');
  assert.ok(result.skills.length > 0);
  assert.ok(['low', 'medium', 'high', 'emergency'].includes(result.urgency));
  assert.equal(result.status, 'completed');
});

test('5. Availability & Booking Conflict Detection', async () => {
  const provider = await Provider.findOne();
  assert.ok(provider);

  const testDate = new Date('2026-10-15');

  // No conflict initially
  const check1 = await AvailabilityService.checkAvailability({
    providerId: provider._id,
    date: testDate,
    startTime: '10:00',
    endTime: '12:00'
  });
  assert.equal(check1.available, true);

  // Create mock booking
  const mockBooking = await Booking.create({
    requestId: new mongoose.Types.ObjectId(),
    customerId: new mongoose.Types.ObjectId(),
    providerId: provider._id,
    quoteId: new mongoose.Types.ObjectId(),
    date: testDate,
    startTime: '10:00',
    endTime: '12:00',
    price: 450,
    status: BOOKING_STATUS.SCHEDULED
  });

  // Overlapping request: 11:00 - 13:00 -> should conflict!
  const checkOverlap = await AvailabilityService.checkAvailability({
    providerId: provider._id,
    date: testDate,
    startTime: '11:00',
    endTime: '13:00'
  });
  assert.equal(checkOverlap.available, false);
  assert.ok(checkOverlap.reason.includes('existing booking'));

  // Clean up mock
  await Booking.findByIdAndDelete(mockBooking._id);
});

test('6. Booking State Machine Validation', async () => {
  // Legal transition: scheduled -> en_route by provider
  const legal = BookingService.validateStatusTransition(
    BOOKING_STATUS.SCHEDULED,
    BOOKING_STATUS.EN_ROUTE,
    ROLES.PROVIDER
  );
  assert.equal(legal.allowed, true);

  // Illegal transition: customer_confirmed -> in_progress (backwards forbidden)
  const illegal = BookingService.validateStatusTransition(
    BOOKING_STATUS.CUSTOMER_CONFIRMED,
    BOOKING_STATUS.IN_PROGRESS,
    ROLES.PROVIDER
  );
  assert.equal(illegal.allowed, false);

  // Unauthorized role: Customer cannot change status to in_progress
  const roleForbidden = BookingService.validateStatusTransition(
    BOOKING_STATUS.EN_ROUTE,
    BOOKING_STATUS.IN_PROGRESS,
    ROLES.CUSTOMER
  );
  assert.equal(roleForbidden.allowed, false);
});
