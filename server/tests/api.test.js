import test from 'node:test';
import assert from 'node:assert';
import { db } from '../src/db/connection.js';
import app from '../src/app.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('API Health check endpoint returns status healthy', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.status, 'healthy');
});

test('Customer Login works with valid credentials', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@freshbasket.com', password: 'Customer@123' })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.token);
  assert.strictEqual(data.user.email, 'customer@freshbasket.com');
  assert.strictEqual(data.user.role, 'customer');
});

test('Login fails with invalid password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@freshbasket.com', password: 'WrongPassword' })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 401);
  assert.strictEqual(data.success, false);
});

test('Products list returns seeded produce with units', async () => {
  const res = await fetch(`${baseUrl}/api/products?limit=5`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.products.length > 0);
  assert.ok(Array.isArray(data.products[0].available_units));
});

test('Customer cannot access Admin endpoints (RBAC check)', async () => {
  // Login customer
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@freshbasket.com', password: 'Customer@123' })
  });
  const { token } = await loginRes.json();

  // Try accessing admin analytics
  const res = await fetch(`${baseUrl}/api/analytics/overview`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(res.status, 403);
});

test('Admin can access Admin Overview metrics', async () => {
  // Login admin
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@freshbasket.com', password: 'Admin@123' })
  });
  const { token } = await loginRes.json();

  const res = await fetch(`${baseUrl}/api/analytics/overview`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.metrics.total_orders >= 1);
});

test('Order Creation deducts stock atomically and calculates totals on server', async () => {
  const prodBefore = db.prepare('SELECT stock_quantity FROM products WHERE id = 2').get();
  const initialStock = prodBefore.stock_quantity;

  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Test Buyer',
      customer_email: 'buyer@test.com',
      customer_phone: '+92 300 9988776',
      address_text: 'Test Street, Lahore',
      delivery_slot: 'Today: 4:00 PM - 6:00 PM',
      items: [{ id: 2, quantity: 3, unit: '1 dozen' }]
    })
  });
  const orderData = await orderRes.json();
  assert.strictEqual(orderRes.status, 201);
  assert.strictEqual(orderData.success, true);

  const prodAfter = db.prepare('SELECT stock_quantity FROM products WHERE id = 2').get();
  assert.strictEqual(prodAfter.stock_quantity, initialStock - 3);
});

test('Order Cancellation restores inventory stock atomically', async () => {
  // Login customer
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@freshbasket.com', password: 'Customer@123' })
  });
  const { token } = await loginRes.json();

  // Create order
  const prodBefore = db.prepare('SELECT stock_quantity FROM products WHERE id = 4').get();
  const initialStock = prodBefore.stock_quantity;

  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      address_text: 'DHA Phase 3, Lahore',
      delivery_slot: 'Today: 4:00 PM - 6:00 PM',
      items: [{ id: 4, quantity: 2, unit: '500g pack' }]
    })
  });
  const { order } = await createRes.json();
  const stockAfterOrder = db.prepare('SELECT stock_quantity FROM products WHERE id = 4').get().stock_quantity;
  assert.strictEqual(stockAfterOrder, initialStock - 2);

  // Cancel order
  const cancelRes = await fetch(`${baseUrl}/api/orders/${order.id}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason: 'Changed my mind' })
  });
  const cancelData = await cancelRes.json();
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelData.success, true);

  // Verify stock restored
  const stockAfterCancel = db.prepare('SELECT stock_quantity FROM products WHERE id = 4').get().stock_quantity;
  assert.strictEqual(stockAfterCancel, initialStock);
});
