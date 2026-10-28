import { test, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/app.js';
import { db } from '../src/db/connection.js';

let server;
let baseUrl;
let adminToken;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  const adminRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@freshbasket.com', password: 'Admin@123' })
  });
  const adminData = await adminRes.json();
  adminToken = adminData.token;
});

after(() => {
  if (server) server.close();
});

test('Customer can file a complaint with ticket generation', async () => {
  const res = await fetch(`${baseUrl}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Automated Test User',
      email: 'muzammilshabbircs01@gmail.com',
      phone: '+92 300 9988776',
      order_number: 'FB-88219',
      category: 'Produce Freshness & Quality',
      subject: 'Test complaint regarding fruit freshness',
      message: 'Produce arrived with minor bruising.'
    })
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.ticket_number.startsWith('FB-TKT-'));

  // Lookup by ticket
  const trackRes = await fetch(`${baseUrl}/complaints/track/${data.ticket_number}`);
  assert.strictEqual(trackRes.status, 200);
  const trackData = await trackRes.json();
  assert.strictEqual(trackData.complaint.ticket_number, data.ticket_number);
  assert.strictEqual(trackData.complaint.status, 'Open');
});

test('Admin can list complaints and send resolution reply', async () => {
  const listRes = await fetch(`${baseUrl}/admin/complaints`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(listRes.status, 200);
  const listData = await listRes.json();
  assert.strictEqual(listData.success, true);
  assert.ok(Array.isArray(listData.complaints));
  assert.ok(listData.complaints.length > 0);

  const targetComplaint = listData.complaints[0];

  // Resolve complaint
  const replyRes = await fetch(`${baseUrl}/admin/complaints/${targetComplaint.id}/reply`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      admin_reply: 'Official test resolution: Replacement fruit voucher has been issued.',
      status: 'Resolved'
    })
  });

  assert.strictEqual(replyRes.status, 200);
  const replyData = await replyRes.json();
  assert.strictEqual(replyData.success, true);
  assert.strictEqual(replyData.complaint.status, 'Resolved');
});
