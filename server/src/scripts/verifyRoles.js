import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { ENV } from '../config/env.js';
import jwt from 'jsonwebtoken';

const runVerification = async () => {
  await mongoose.connect(ENV.MONGO_URI);
  const app = createApp();

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const testAccounts = [
    { role: 'admin', email: 'admin@careconnect.com', password: 'Password123!' },
    { role: 'operations', email: 'operations@careconnect.com', password: 'Password123!' },
    { role: 'support', email: 'support@careconnect.com', password: 'Password123!' },
    { role: 'customer', email: 'customer1@gmail.com', password: 'Password123!' },
    { role: 'provider', email: 'provider.plumbing@careconnect.com', password: 'Password123!' }
  ];

  const results = {
    loginTests: [],
    profileTests: [],
    rbacAccessTests: [],
    rbacBlockedTests: []
  };

  const tokens = {};

  // 1. Test Login for each role
  for (const acc of testAccounts) {
    const start = performance.now();
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.email, password: acc.password })
    });
    const durationMs = Math.round(performance.now() - start);
    const body = await res.json();

    let decoded = null;
    if (body.data?.token) {
      decoded = jwt.verify(body.data.token, ENV.JWT_SECRET);
      tokens[acc.role] = body.data.token;
    }

    results.loginTests.push({
      role: acc.role,
      email: acc.email,
      status: res.status,
      success: body.success,
      hasToken: Boolean(body.data?.token),
      tokenRoleMatch: decoded?.role === acc.role,
      userReturned: body.data?.user?.name,
      passwordExposed: body.data?.user?.password !== undefined,
      durationMs
    });
  }

  // 2. Test /api/auth/me for each role
  for (const role of Object.keys(tokens)) {
    const token = tokens[role];
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json();
    results.profileTests.push({
      role,
      status: res.status,
      success: body.success,
      email: body.data?.user?.email,
      providerProfileAttached: role === 'provider' ? Boolean(body.data?.provider) : undefined
    });
  }

  // 3. Test Positive RBAC (Role accessing authorized route)
  const positiveChecks = [
    { role: 'admin', endpoint: '/api/admin/dashboard', expected: 200 },
    { role: 'operations', endpoint: '/api/operations/dashboard', expected: 200 },
    { role: 'support', endpoint: '/api/support/dashboard', expected: 200 },
    { role: 'customer', endpoint: '/api/service-requests', expected: 200 },
    { role: 'provider', endpoint: '/api/providers/me', expected: 200 }
  ];

  for (const check of positiveChecks) {
    const res = await fetch(`${baseUrl}${check.endpoint}`, {
      headers: { Authorization: `Bearer ${tokens[check.role]}` }
    });
    const body = await res.json();
    results.rbacAccessTests.push({
      role: check.role,
      endpoint: check.endpoint,
      status: res.status,
      success: body.success,
      expected: check.expected,
      passed: res.status === check.expected
    });
  }

  // 4. Test Negative RBAC (Customer blocked from Admin/Ops, Provider blocked from Admin, etc.)
  const negativeChecks = [
    { role: 'customer', endpoint: '/api/admin/dashboard', expected: 403, reason: 'Customer accessing Admin dashboard' },
    { role: 'customer', endpoint: '/api/operations/dashboard', expected: 403, reason: 'Customer accessing Operations dashboard' },
    { role: 'customer', endpoint: '/api/support/dashboard', expected: 403, reason: 'Customer accessing Support dashboard' },
    { role: 'provider', endpoint: '/api/admin/dashboard', expected: 403, reason: 'Provider accessing Admin dashboard' },
    { role: 'support', endpoint: '/api/admin/dashboard', expected: 403, reason: 'Support accessing Admin dashboard' },
    { role: 'operations', endpoint: '/api/admin/audit-logs', expected: 403, reason: 'Operations accessing Admin audit logs' }
  ];

  for (const check of negativeChecks) {
    const res = await fetch(`${baseUrl}${check.endpoint}`, {
      headers: { Authorization: `Bearer ${tokens[check.role]}` }
    });
    const body = await res.json();
    results.rbacBlockedTests.push({
      role: check.role,
      endpoint: check.endpoint,
      reason: check.reason,
      status: res.status,
      blocked: res.status === 403,
      errorCode: body.error
    });
  }

  server.close();
  await mongoose.disconnect();

  console.log(JSON.stringify(results, null, 2));
};

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
