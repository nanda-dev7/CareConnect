import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { ServiceRequest } from '../src/models/ServiceRequest.js';
import { ClassificationService } from '../src/services/ai/classificationService.js';
import { fallbackClassify } from '../src/services/ai.service.js';

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

test('PHASE 3: Service Request & AI Classification Suite', async (t) => {
  const stamp = Date.now();
  let customer1Token;
  let customer1Id;
  let customer2Token;
  let requestId;

  // Register Customer 1
  const c1Reg = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Customer One P3',
      email: `customer1.p3.${stamp}@test.com`,
      password: 'Password123!',
      phone: '+91 99999 33331',
      role: 'customer'
    })
  });
  assert.equal(c1Reg.status, 201);
  customer1Token = c1Reg.data.data.token;
  customer1Id = c1Reg.data.data.user._id;

  // Register Customer 2
  const c2Reg = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Customer Two P3',
      email: `customer2.p3.${stamp}@test.com`,
      password: 'Password123!',
      phone: '+91 99999 33332',
      role: 'customer'
    })
  });
  assert.equal(c2Reg.status, 201);
  customer2Token = c2Reg.data.data.token;

  // 1. Customer creates request
  // 2. Request saved in MongoDB
  await t.test('1 & 2. Customer creates request and saves in MongoDB', async () => {
    const res = await api('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        description: 'My washing machine is making a loud noise during spinning and leaking water',
        preferredDate: '2026-10-25',
        preferredTime: '14:00'
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.serviceRequest._id);

    requestId = res.data.data.serviceRequest._id;

    // Verify document exists in MongoDB
    const docInDb = await ServiceRequest.findById(requestId);
    assert.ok(docInDb);
    assert.equal(docInDb.description, 'My washing machine is making a loud noise during spinning and leaking water');
  });

  // 3. AI classification works
  await t.test('3. AI classification extracts category, skills, and urgency', async () => {
    const classification = await ClassificationService.classifyRequest(
      'My washing machine is making a loud noise during spinning'
    );
    assert.ok(classification.category);
    assert.ok(Array.isArray(classification.skills));
    assert.ok(classification.skills.length > 0);
    assert.ok(['low', 'medium', 'high', 'emergency'].includes(classification.urgency));
  });

  // 4. AI failure triggers fallback
  await t.test('4. AI failure triggers deterministic keyword fallback', async () => {
    const fallbackResult = fallbackClassify(
      'My air conditioner compressor is making a burning smell and not cooling'
    );
    assert.equal(fallbackResult.category, 'AC Repair');
    assert.ok(fallbackResult.skills.includes('AC Diagnostics') || fallbackResult.skills.includes('Cooling System Repair'));
    assert.equal(fallbackResult.rawResponse.fallback, true);
  });

  // 5. Customer cannot access another customer's request
  await t.test('5. Customer cannot access another customer\'s request', async () => {
    const res = await api(`/api/requests/${requestId}`, {
      headers: { Authorization: `Bearer ${customer2Token}` }
    });
    assert.equal(res.status, 403, 'Customer 2 must be forbidden from accessing Customer 1\'s private request');
  });

  // 6. Invalid request rejected
  await t.test('6. Invalid request rejected', async () => {
    const shortDescRes = await api('/api/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        description: 'short' // less than 10 chars
      })
    });
    assert.equal(shortDescRes.status, 400, 'Request with short description must be rejected');
  });

  // 7. Customer cancellation works
  await t.test('7. Customer cancellation works', async () => {
    const cancelRes = await api(`/api/requests/${requestId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ reason: 'Issue resolved by myself' })
    });
    assert.equal(cancelRes.status, 200);

    const updatedDoc = await ServiceRequest.findById(requestId);
    assert.equal(updatedDoc.status, 'cancelled');
  });

});
