import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/app.js';
import { db } from '../src/db/connection.js';

let server;
let baseUrl;
let logisticsToken;
let customerToken;

after(() => {
  if (server) server.close();
});

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  // Login logistics user
  const logRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'logistics@freshbasket.com', password: 'Logistics@123' })
  });
  const logData = await logRes.json();
  logisticsToken = logData.token;

  // Login customer user
  const custRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@freshbasket.com', password: 'Customer@123' })
  });
  const custData = await custRes.json();
  customerToken = custData.token;
});

test('Logistics Supervisor authentication succeeds and assigns logistics role', () => {
  assert.ok(logisticsToken, 'Logistics token should exist');
});

test('Customer cannot access Logistics supervisor endpoints (RBAC 403)', async () => {
  const res = await fetch(`${baseUrl}/logistics/orders`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert.strictEqual(res.status, 403);
});

test('Logistics Supervisor can fetch metrics and active pipeline orders', async () => {
  const res = await fetch(`${baseUrl}/logistics/metrics`, {
    headers: { Authorization: `Bearer ${logisticsToken}` }
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(typeof data.metrics.confirmed === 'number');

  const ordersRes = await fetch(`${baseUrl}/logistics/orders?status=active`, {
    headers: { Authorization: `Bearer ${logisticsToken}` }
  });
  assert.strictEqual(ordersRes.status, 200);
  const ordersData = await ordersRes.json();
  assert.strictEqual(ordersData.success, true);
  assert.ok(Array.isArray(ordersData.orders));
});

test('Logistics Supervisor can update fulfillment stage and assign courier', async () => {
  // Grab first order in DB
  const firstOrder = db.prepare('SELECT id, order_number, order_status FROM orders LIMIT 1').get();
  assert.ok(firstOrder, 'An order should exist in the test DB');

  const updateRes = await fetch(`${baseUrl}/logistics/orders/${firstOrder.id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${logisticsToken}`
    },
    body: JSON.stringify({
      status: 'Out for Delivery',
      note: 'Inspected and loaded onto Van-04 by Logistics Supervisor Tariq Mehmood',
      driver_name: 'Hamza Tariq',
      driver_phone: '+92 300 1234567',
      vehicle_number: 'EV-VAN-04',
      temperature_note: 'Cold-Chain 3.8°C Verified'
    })
  });

  assert.strictEqual(updateRes.status, 200);
  const updateData = await updateRes.json();
  assert.strictEqual(updateData.success, true);
  assert.strictEqual(updateData.order.order_status, 'Out for Delivery');

  // Verify history entry was appended
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id DESC LIMIT 1').get(firstOrder.id);
  assert.strictEqual(history.status, 'Out for Delivery');
  assert.ok(history.note.includes('Tariq Mehmood'));
});
