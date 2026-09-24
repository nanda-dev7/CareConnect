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
import {
  ROLES,
  PROVIDER_STATUS,
  REQUEST_STATUS,
  QUOTE_STATUS,
  BOOKING_STATUS
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

test('PHASE 4: Core Booking Workflow & Overlap Prevention Suite', async (t) => {
  const stamp = Date.now();
  let adminToken;
  let customer1Token;
  let customer1Id;
  let customer2Token;
  let customer2Id;
  let verifiedProviderToken;
  let verifiedProviderId;
  let verifiedProviderDocId;
  let unverifiedProviderToken;
  let unverifiedProviderId;
  let unverifiedProviderDocId;
  let secondProviderToken;
  let secondProviderDocId;
  let requestId1;
  let quoteId1;
  let quoteId2;
  let bookingId1;

  // Setup: Admin, Customers, Providers
  await t.test('Setup: Create Admin, Customers, and Providers', async () => {
    // Admin login
    const adminLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@careconnect.com', password: 'Password123!' })
    });
    assert.equal(adminLogin.status, 200);
    adminToken = adminLogin.data.data.token;

    // Customer 1
    const c1Reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rohan Customer 1',
        email: `customer1.p4.${stamp}@test.com`,
        password: 'Password123!',
        phone: '+91 99000 11111',
        role: 'customer',
        address: { city: 'Hyderabad', street: 'Jubilee Hills' }
      })
    });
    assert.equal(c1Reg.status, 201);
    customer1Token = c1Reg.data.data.token;
    customer1Id = c1Reg.data.data.user._id;

    // Customer 2
    const c2Reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sneha Customer 2',
        email: `customer2.p4.${stamp}@test.com`,
        password: 'Password123!',
        phone: '+91 99000 22222',
        role: 'customer',
        address: { city: 'Hyderabad', street: 'Madhapur' }
      })
    });
    assert.equal(c2Reg.status, 201);
    customer2Token = c2Reg.data.data.token;
    customer2Id = c2Reg.data.data.user._id;

    // Verified Provider 1
    const p1Reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Vikram Verified Electrician',
        email: `provider1.p4.${stamp}@test.com`,
        password: 'Password123!',
        phone: '+91 99000 33333',
        role: 'provider',
        skills: ['Wiring Repair', 'Short Circuit Fix', 'Switchboard Installation'],
        categories: ['Electrical'],
        serviceAreas: ['Hyderabad', 'Jubilee Hills', 'Madhapur'],
        experience: 6
      })
    });
    assert.equal(p1Reg.status, 201);
    verifiedProviderToken = p1Reg.data.data.token;
    verifiedProviderId = p1Reg.data.data.user._id;
    verifiedProviderDocId = p1Reg.data.data.provider._id;

    // Admin verifies Provider 1
    const verify1 = await api(`/api/providers/${verifiedProviderDocId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(verify1.status, 200);

    // Provider 1 adds availability for testing date
    const avail1 = await api('/api/availability', {
      method: 'POST',
      headers: { Authorization: `Bearer ${verifiedProviderToken}` },
      body: JSON.stringify({
        dayOfWeek: 'Monday',
        startTime: '08:00',
        endTime: '20:00'
      })
    });
    assert.equal(avail1.status, 201);

    // Second Verified Provider 2 (for comparing quotes)
    const p2Reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Anil Spark Electricals',
        email: `provider2.p4.${stamp}@test.com`,
        password: 'Password123!',
        phone: '+91 99000 44444',
        role: 'provider',
        skills: ['Wiring Repair', 'Fuse Replacement'],
        categories: ['Electrical'],
        serviceAreas: ['Hyderabad', 'Jubilee Hills'],
        experience: 4
      })
    });
    assert.equal(p2Reg.status, 201);
    secondProviderToken = p2Reg.data.data.token;
    secondProviderDocId = p2Reg.data.data.provider._id;

    await api(`/api/providers/${secondProviderDocId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Unverified Provider 3
    const p3Reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Pending New Electrician',
        email: `provider3.p4.${stamp}@test.com`,
        password: 'Password123!',
        phone: '+91 99000 55555',
        role: 'provider',
        skills: ['Wiring Repair'],
        categories: ['Electrical'],
        serviceAreas: ['Hyderabad']
      })
    });
    assert.equal(p3Reg.status, 201);
    unverifiedProviderToken = p3Reg.data.data.token;
    unverifiedProviderId = p3Reg.data.data.user._id;
    unverifiedProviderDocId = p3Reg.data.data.provider._id;
  });

  // 1. Complete Workflow: Request -> AI Classification -> Matching
  await t.test('1. Customer creates request -> AI classifies -> Matching returns verified providers with match details', async () => {
    const res = await api('/api/service-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        description: 'Main electric switchboard tripped with sparks and burning smell, urgent wiring repair needed',
        preferredDate: '2026-10-19', // Monday
        preferredTime: '10:00',
        location: { city: 'Hyderabad', street: 'Jubilee Hills' }
      })
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    requestId1 = res.data.data.serviceRequest._id;
    assert.equal(res.data.data.aiClassification.category, 'Electrical');

    // Matching results verification
    const matchedProviders = res.data.data.recommendedProviders;
    assert.ok(Array.isArray(matchedProviders));
    assert.ok(matchedProviders.length > 0);

    const topMatch = matchedProviders[0];
    assert.ok(topMatch.name);
    assert.ok(Array.isArray(topMatch.skills));
    assert.ok(topMatch.experience >= 0);
    assert.ok(topMatch.rating >= 0);
    assert.ok(topMatch.serviceArea || topMatch.serviceAreas);
    assert.ok(topMatch.matchScore >= 0);

    // Matching endpoint query test
    const matchQueryRes = await api(`/api/providers/match?requestId=${requestId1}`, {
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert.equal(matchQueryRes.status, 200);
    assert.ok(matchQueryRes.data.data.providers.length > 0);
  });

  // 2. Unverified provider cannot submit quote
  await t.test('2. Unverified provider cannot submit quote (403)', async () => {
    const quoteRes = await api('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${unverifiedProviderToken}` },
      body: JSON.stringify({
        requestId: requestId1,
        price: 350,
        estimatedDuration: '1 hour',
        availableDate: '2026-10-19',
        availableTime: '10:00',
        message: 'I can fix it today.'
      })
    });
    assert.equal(quoteRes.status, 403, 'Unverified provider must be rejected from submitting quotes');
  });

  // 3. Provider views open requests and submits quote
  await t.test('3. Verified Provider views open requests and submits quote', async () => {
    // Provider views requests feed
    const feedRes = await api('/api/service-requests', {
      headers: { Authorization: `Bearer ${verifiedProviderToken}` }
    });
    assert.equal(feedRes.status, 200);
    const hasRequest = feedRes.data.data.some(r => r._id === requestId1);
    assert.ok(hasRequest, 'Open matching request must appear in provider feed');

    // Provider 1 submits quote
    const quote1Res = await api('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${verifiedProviderToken}` },
      body: JSON.stringify({
        requestId: requestId1,
        amount: 500,
        estimatedDuration: '2 hours',
        availableDate: '2026-10-19',
        availableTime: '10:00',
        message: 'I will bring voltage tester and industrial circuit breakers.'
      })
    });
    assert.equal(quote1Res.status, 201);
    assert.equal(quote1Res.data.data.status, QUOTE_STATUS.PENDING);
    quoteId1 = quote1Res.data.data._id;

    // Provider 2 submits a second quote (for comparison)
    const quote2Res = await api('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secondProviderToken}` },
      body: JSON.stringify({
        requestId: requestId1,
        amount: 450,
        estimatedDuration: '1.5 hours',
        availableDate: '2026-10-19',
        availableTime: '11:00',
        message: 'Available to inspect wiring.'
      })
    });
    assert.equal(quote2Res.status, 201);
    quoteId2 = quote2Res.data.data._id;
  });

  // 4. Duplicate quote prevention
  await t.test('4. Provider cannot submit duplicate quote for same request (409)', async () => {
    const dupRes = await api('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${verifiedProviderToken}` },
      body: JSON.stringify({
        requestId: requestId1,
        price: 480,
        estimatedDuration: '1 hour',
        availableDate: '2026-10-19',
        availableTime: '10:00'
      })
    });
    assert.equal(dupRes.status, 409, 'Duplicate active quote on same request must be rejected');
  });

  // 5. Customer views & compares quotes
  await t.test('5. Customer views and compares quotes for the request', async () => {
    const quotesRes = await api(`/api/quotes/request/${requestId1}`, {
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert.equal(quotesRes.status, 200);
    assert.equal(quotesRes.data.data.length, 2, 'Customer should see 2 received quotes');

    // Customer 2 cannot access Customer 1 quotes
    const unauthorizedQuotesRes = await api(`/api/quotes/request/${requestId1}`, {
      headers: { Authorization: `Bearer ${customer2Token}` }
    });
    assert.equal(unauthorizedQuotesRes.status, 403, 'Customer 2 must not view Customer 1 request quotes');
  });

  // 6. Unauthorized Customer cannot accept quote
  await t.test('6. Unauthorized customer cannot accept another customer\'s quote (403)', async () => {
    const unauthorizedAccept = await api(`/api/quotes/${quoteId1}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` }
    });
    assert.equal(unauthorizedAccept.status, 403);
  });

  // 7. Customer accepts quote -> Quote accepted, others rejected, Booking created
  await t.test('7. Customer accepts quote -> Creates booking, rejects other quotes, updates request to booked', async () => {
    const acceptRes = await api(`/api/quotes/${quoteId1}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });

    assert.equal(acceptRes.status, 201);
    assert.equal(acceptRes.data.data.quote.status, QUOTE_STATUS.ACCEPTED);
    assert.ok(acceptRes.data.data.booking._id);
    bookingId1 = acceptRes.data.data.booking._id;

    // Check request status updated to booked
    const reqDoc = await ServiceRequest.findById(requestId1);
    assert.equal(reqDoc.status, REQUEST_STATUS.BOOKED);

    // Check second quote was rejected
    const rejectedQuote = await Quote.findById(quoteId2);
    assert.equal(rejectedQuote.status, QUOTE_STATUS.REJECTED);

    // Booking model fields verification
    const bookingDoc = await Booking.findById(bookingId1);
    assert.ok(bookingDoc);
    assert.equal(bookingDoc.customerId.toString(), customer1Id.toString());
    assert.equal(bookingDoc.providerId.toString(), verifiedProviderDocId.toString());
    assert.equal(bookingDoc.price, 500);
    assert.equal(bookingDoc.status, BOOKING_STATUS.SCHEDULED);
  });

  // 8. Server-side overlap check prevents overlapping booking
  await t.test('8. Server-side overlap check prevents provider having two bookings at the same time (409)', async () => {
    // Customer 2 creates a new request for the same date & overlapping time (10:00 - 12:00)
    const req2Res = await api('/api/service-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: JSON.stringify({
        description: 'Need electrical repair for switchboard in Madhapur',
        preferredDate: '2026-10-19',
        preferredTime: '10:30',
        location: { city: 'Hyderabad', street: 'Madhapur' }
      })
    });
    assert.equal(req2Res.status, 201);
    const requestId2 = req2Res.data.data.serviceRequest._id;

    // Provider 1 submits quote for request 2
    const qRes = await api('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${verifiedProviderToken}` },
      body: JSON.stringify({
        requestId: requestId2,
        price: 600,
        estimatedDuration: '2 hours',
        availableDate: '2026-10-19',
        availableTime: '10:30',
        message: 'Available in Madhapur area.'
      })
    });
    assert.equal(qRes.status, 201);
    const overlappingQuoteId = qRes.data.data._id;

    // Customer 2 tries to accept quote -> should fail with 409 conflict
    const overlapAcceptRes = await api(`/api/quotes/${overlappingQuoteId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` }
    });
    assert.equal(overlapAcceptRes.status, 409, 'Must prevent overlapping booking for same provider and time slot');
    assert.equal(overlapAcceptRes.data.code, 'BOOKING_CONFLICT');
  });

  // 9. Unauthorized provider cannot update another provider's booking
  await t.test('9. Unauthorized provider cannot update another provider\'s booking (403)', async () => {
    const unauthStatusRes = await api(`/api/bookings/${bookingId1}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${secondProviderToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.EN_ROUTE })
    });
    assert.equal(unauthStatusRes.status, 403, 'Provider 2 cannot update Provider 1 booking');
  });

  // 10. Invalid status transitions rejected
  await t.test('10. Invalid status transitions rejected by state machine (422)', async () => {
    // Cannot skip directly from scheduled to completed
    const invalidJumpRes = await api(`/api/bookings/${bookingId1}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${verifiedProviderToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.COMPLETED })
    });
    assert.equal(invalidJumpRes.status, 422, 'Cannot jump directly from scheduled to completed');
  });

  // 11. Complete status progression: scheduled -> en_route -> in_progress -> completed -> customer_confirmed
  await t.test('11. Provider progresses job status and Customer tracks & confirms completion', async () => {
    // Provider marks en_route
    const enRoute = await api(`/api/bookings/${bookingId1}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${verifiedProviderToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.EN_ROUTE })
    });
    assert.equal(enRoute.status, 200);
    assert.equal(enRoute.data.data.status, BOOKING_STATUS.EN_ROUTE);

    // Provider marks in_progress
    const inProgress = await api(`/api/bookings/${bookingId1}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${verifiedProviderToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.IN_PROGRESS })
    });
    assert.equal(inProgress.status, 200);
    assert.equal(inProgress.data.data.status, BOOKING_STATUS.IN_PROGRESS);

    // Provider marks completed
    const completed = await api(`/api/bookings/${bookingId1}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${verifiedProviderToken}` },
      body: JSON.stringify({ status: BOOKING_STATUS.COMPLETED })
    });
    assert.equal(completed.status, 200);
    assert.equal(completed.data.data.status, BOOKING_STATUS.COMPLETED);

    // Customer views booking status
    const customerView = await api(`/api/bookings/${bookingId1}`, {
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert.equal(customerView.status, 200);
    assert.equal(customerView.data.data.booking.status, BOOKING_STATUS.COMPLETED);

    // Customer confirms completion
    const confirmed = await api(`/api/bookings/${bookingId1}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert.equal(confirmed.status, 200);
    assert.equal(confirmed.data.data.booking.status, BOOKING_STATUS.CUSTOMER_CONFIRMED);
  });
});
