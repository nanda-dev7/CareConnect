import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Provider } from '../src/models/Provider.js';
import { Category } from '../src/models/Category.js';
import { ServiceRequest } from '../src/models/ServiceRequest.js';
import { ROLES, PROVIDER_STATUS } from '../src/utils/constants.js';

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

test('PHASE 2: Services, Providers and Admin Verification Suite', async (t) => {
  const timestamp = Date.now();
  let adminToken;
  let customerToken;
  let provider1Token;
  let provider1UserId;
  let provider1DocId;
  let provider2Token;
  let provider2DocId;
  let testCategoryId;

  // Login Admin
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@careconnect.com', password: 'Password123!' })
  });
  assert.equal(adminLogin.status, 200);
  adminToken = adminLogin.data.data.token;

  // Register Customer
  const custReg = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Phase2 Customer',
      email: `customer.p2.${timestamp}@test.com`,
      password: 'Password123!',
      phone: '+91 99999 00001',
      role: 'customer'
    })
  });
  assert.equal(custReg.status, 201);
  customerToken = custReg.data.data.token;

  // 1. Admin creates category
  await t.test('1. Admin creates category', async () => {
    const res = await api('/api/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Carpentry & Woodwork ${timestamp}`,
        description: 'Custom woodworking, cabinet repair, and door fixing',
        basePrice: 450,
        requiredSkills: ['Furniture Repair', 'Door & Lock Repair']
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.basePrice, 450);
    testCategoryId = res.data.data._id;
  });

  // 2. Admin edits category
  await t.test('2. Admin edits category', async () => {
    const res = await api(`/api/categories/${testCategoryId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        basePrice: 500,
        description: 'Updated premium carpentry services',
        isActive: true
      })
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.basePrice, 500);
  });

  // 3. Provider creates profile
  await t.test('3. Provider creates profile', async () => {
    // Register provider user
    const provReg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Master Carpenter Pro',
        email: `provider1.p2.${timestamp}@test.com`,
        password: 'Password123!',
        phone: '+91 98888 11111',
        role: 'provider',
        businessName: 'Woodcraft Experts',
        bio: 'Professional carpenter with 8 years of experience',
        skills: ['Furniture Repair'],
        categories: ['Carpentry'],
        serviceAreas: ['Hyderabad'],
        experienceYears: 8
      })
    });
    assert.equal(provReg.status, 201);
    provider1Token = provReg.data.data.token;
    provider1UserId = provReg.data.data.user._id;
    provider1DocId = provReg.data.data.provider._id;

    // Check verification status is initially PENDING
    assert.equal(provReg.data.data.provider.verificationStatus, 'pending');
  });

  // 4. Provider updates skills
  await t.test('4. Provider updates skills', async () => {
    const res = await api('/api/providers/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${provider1Token}` },
      body: JSON.stringify({
        skills: ['Furniture Repair', 'Door & Lock Repair', 'Cabinet Work'],
        serviceAreas: ['Hyderabad', 'Banjara Hills'],
        experienceYears: 9
      })
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.data.skills.includes('Door & Lock Repair'));
    assert.equal(res.data.data.experienceYears, 9);
  });

  // 6. Unverified provider cannot be listed in verified providers query
  await t.test('6. Unverified provider cannot receive customer recommendations/search', async () => {
    // Query public verified providers
    const searchRes = await api('/api/providers?verificationStatus=verified');
    assert.equal(searchRes.status, 200);

    const isListed = searchRes.data.data.some(p => p._id === provider1DocId);
    assert.equal(isListed, false, 'Unverified provider must not be visible in public verified provider list');

    // Unverified provider attempting to submit a quote should be rejected with 403 Forbidden
    // First create a service request as customer
    const reqRes = await api('/api/service-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        description: 'Need door hinge and cabinet repair urgently in my kitchen',
        categoryId: testCategoryId,
        preferredDate: '2026-10-20',
        preferredTime: '10:00'
      })
    });
    assert.equal(reqRes.status, 201);
    const serviceReqId = reqRes.data.data.serviceRequest._id;

    // Unverified provider tries to submit quote
    const quoteRes = await api('/api/quotes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${provider1Token}` },
      body: JSON.stringify({
        requestId: serviceReqId,
        price: 480,
        estimatedDuration: '2 hours',
        availableDate: '2026-10-20',
        availableTime: '10:00',
        message: 'I can fix the door hinges'
      })
    });
    assert.equal(quoteRes.status, 403, 'Unverified provider cannot submit quotes');
  });

  // 5. Admin verifies provider
  await t.test('5. Admin verifies provider', async () => {
    const verifyRes = await api(`/api/providers/${provider1DocId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.data.data.verificationStatus, 'verified');

    // Now provider CAN submit quotes
    const requestDoc = await ServiceRequest.findOne({ status: 'open' });
    if (requestDoc) {
      const quoteRes = await api('/api/quotes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${provider1Token}` },
        body: JSON.stringify({
          requestId: requestDoc._id,
          price: 480,
          estimatedDuration: '2 hours',
          availableDate: '2026-10-20',
          availableTime: '10:00',
          message: 'I can fix the door hinges'
        })
      });
      assert.equal(quoteRes.status, 201);
    }
  });

  // 7. Customer cannot modify provider
  await t.test('7. Customer cannot modify provider', async () => {
    const res = await api('/api/providers/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ skills: ['Fake Skill'] })
    });
    assert.equal(res.status, 403, 'Customer role cannot access provider profile update endpoint');

    // Customer trying to verify a provider
    const verifyAttempt = await api(`/api/providers/${provider1DocId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.equal(verifyAttempt.status, 403, 'Customer role cannot verify providers');
  });

  // 8. Provider cannot modify another provider
  await t.test('8. Provider cannot modify another provider', async () => {
    // Register second provider
    const prov2Reg = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Second Provider',
        email: `provider2.p2.${timestamp}@test.com`,
        password: 'Password123!',
        phone: '+91 97777 22222',
        role: 'provider'
      })
    });
    assert.equal(prov2Reg.status, 201);
    provider2Token = prov2Reg.data.data.token;
    provider2DocId = prov2Reg.data.data.provider._id;

    // Provider 2 tries to verify Provider 1
    const verifyAttempt = await api(`/api/providers/${provider1DocId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${provider2Token}` }
    });
    assert.equal(verifyAttempt.status, 403, 'Provider cannot verify another provider');
  });

});
