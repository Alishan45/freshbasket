import { db, runTransaction } from '../db/connection.js';
import { addSSEClient, removeSSEClient, getActiveListenerCount, broadcastFulfillmentEvent } from '../utils/eventBus.js';

/**
 * Real-Time Server-Sent Events (SSE) Stream Endpoint
 * GET /api/fulfillment/stream
 * Publicly subscribable by customer tracking screens, logistics supervisors, and store admins.
 */
export function fulfillmentStream(req, res) {
  // Set SSE streaming headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  res.flushHeaders?.();

  const client = { id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, res };
  addSSEClient(client);

  // Send immediate welcome handshake
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Connected to FreshBasket Real-Time Fulfillment Stream',
    active_listeners: getActiveListenerCount(),
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Heartbeat comment every 15 seconds to keep HTTP pipe open across proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (err) {
      clearInterval(heartbeat);
      removeSSEClient(client);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSSEClient(client);
  });
}

/**
 * Retrieve Orders for Logistics Supervisor Pipeline
 * GET /api/logistics/orders
 */
export function getLogisticsOrders(req, res) {
  try {
    const { status, search, stage } = req.query;
    let whereClauses = [];
    let params = [];

    const filterStage = status || stage;
    if (filterStage && filterStage !== 'all') {
      if (filterStage === 'active') {
        whereClauses.push("o.order_status IN ('Confirmed', 'Packing', 'Quality Check', 'Out for Delivery')");
      } else {
        whereClauses.push('o.order_status = ?');
        params.push(filterStage);
      }
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(o.order_number) LIKE ? OR LOWER(o.customer_name) LIKE ? OR LOWER(o.customer_phone) LIKE ? OR LOWER(o.address_text) LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT o.*, 
             COUNT(oi.id) as item_count,
             COALESCE(SUM(oi.quantity), 0) as total_produce_qty
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereSql}
      GROUP BY o.id
      ORDER BY 
        CASE o.order_status
          WHEN 'Quality Check' THEN 1
          WHEN 'Packing' THEN 2
          WHEN 'Confirmed' THEN 3
          WHEN 'Out for Delivery' THEN 4
          WHEN 'Delivered' THEN 5
          ELSE 6
        END,
        o.id DESC
      LIMIT 100
    `;

    const rawOrders = db.prepare(sql).all(...params);

    // Fetch items and history for active shipment inspection
    const getItems = db.prepare(`
      SELECT oi.*, p.image_url, p.freshness_grade, p.farm_origin
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `);

    const getHistory = db.prepare(`
      SELECT osh.status, osh.note, osh.created_at, u.full_name as updater_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.updated_by = u.id
      WHERE osh.order_id = ?
      ORDER BY osh.id DESC
    `);

    const orders = rawOrders.map(ord => ({
      ...ord,
      items: getItems.all(ord.id),
      history: getHistory.all(ord.id)
    }));

    return res.json({
      success: true,
      orders,
      active_listeners: getActiveListenerCount()
    });
  } catch (error) {
    console.error('getLogisticsOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve logistics orders.' });
  }
}

/**
 * Advance or Update Fulfillment Stage by Logistics Supervisor
 * PUT /api/logistics/orders/:id/status
 */
export function updateLogisticsOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const {
      status,
      note,
      driver_name,
      driver_phone,
      vehicle_number,
      temperature_note
    } = req.body;

    const validStatuses = ['Confirmed', 'Packing', 'Quality Check', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid fulfillment status. Allowed: ${validStatuses.join(', ')}`
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order record not found.' });
    }

    const previousStatus = order.order_status;
    const supervisorName = req.user?.full_name || 'Tariq Mehmood (Logistics Supervisor)';

    let finalPaymentStatus = order.payment_status;
    if (status === 'Delivered') {
      finalPaymentStatus = 'Paid in Cash at Door';
    }

    const updatedDriver = driver_name || order.driver_name || 'Hamza Tariq';
    const updatedPhone = driver_phone || order.driver_phone || '+92 300 1234567';
    const updatedVehicle = vehicle_number || order.vehicle_number || 'EV-VAN-04';
    const updatedTemp = temperature_note || order.temperature_note || 'Cold-Chain 3.8°C Verified';

    let defaultNote = `Stage progressed to "${status}" by ${supervisorName}`;
    if (status === 'Packing') defaultNote = `Morning harvest selected & packed into insulated crate by ${supervisorName}`;
    if (status === 'Quality Check') defaultNote = `Brix score & freshness certified Grade A+ by ${supervisorName}`;
    if (status === 'Out for Delivery') defaultNote = `Dispatched with courier ${updatedDriver} via ${updatedVehicle} (${updatedTemp})`;
    if (status === 'Delivered') defaultNote = `Doorstep delivery completed & cash collected by ${updatedDriver}`;

    const finalNote = note ? note.trim() : defaultNote;

    runTransaction(() => {
      // 1. Update order record
      db.prepare(`
        UPDATE orders 
        SET order_status = ?,
            payment_status = ?,
            driver_name = ?,
            driver_phone = ?,
            vehicle_number = ?,
            temperature_note = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        status,
        finalPaymentStatus,
        updatedDriver,
        updatedPhone,
        updatedVehicle,
        updatedTemp,
        order.id
      );

      // 2. Append to fulfillment history
      db.prepare(`
        INSERT INTO order_status_history (order_id, status, note, updated_by)
        VALUES (?, ?, ?, ?)
      `).run(order.id, status, finalNote, req.user?.id || null);
    });

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id DESC').all(order.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    const fullOrderPayload = {
      ...updatedOrder,
      items,
      history
    };

    // Broadcast in real-time to all connected SSE clients (Customer, Admin, Supervisors)
    broadcastFulfillmentEvent({
      type: 'order_status_updated',
      order_id: order.id,
      order_number: order.order_number,
      previous_status: previousStatus,
      new_status: status,
      payment_status: finalPaymentStatus,
      driver_name: updatedDriver,
      driver_phone: updatedPhone,
      vehicle_number: updatedVehicle,
      temperature_note: updatedTemp,
      note: finalNote,
      updated_by: supervisorName,
      order: fullOrderPayload,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Order ${order.order_number} successfully progressed to "${status}".`,
      order: fullOrderPayload
    });
  } catch (error) {
    console.error('updateLogisticsOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update logistics fulfillment stage.' });
  }
}

/**
 * Assign or Update Dispatch Courier and Vehicle
 * POST /api/logistics/orders/:id/courier
 */
export function assignCourier(req, res) {
  try {
    const { id } = req.params;
    const { driver_name, driver_phone, vehicle_number, temperature_note, note } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order record not found.' });
    }

    const supervisorName = req.user?.full_name || 'Tariq Mehmood (Logistics Supervisor)';
    const logNote = note || `Courier assigned: ${driver_name} (${vehicle_number}) by ${supervisorName}`;

    runTransaction(() => {
      db.prepare(`
        UPDATE orders 
        SET driver_name = ?,
            driver_phone = ?,
            vehicle_number = ?,
            temperature_note = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        driver_name || order.driver_name,
        driver_phone || order.driver_phone,
        vehicle_number || order.vehicle_number,
        temperature_note || order.temperature_note,
        order.id
      );

      db.prepare(`
        INSERT INTO order_status_history (order_id, status, note, updated_by)
        VALUES (?, ?, ?, ?)
      `).run(order.id, order.order_status, logNote, req.user?.id || null);
    });

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id DESC').all(order.id);

    // Broadcast courier assignment
    broadcastFulfillmentEvent({
      type: 'courier_assigned',
      order_id: order.id,
      order_number: order.order_number,
      new_status: order.order_status,
      driver_name: updatedOrder.driver_name,
      driver_phone: updatedOrder.driver_phone,
      vehicle_number: updatedOrder.vehicle_number,
      temperature_note: updatedOrder.temperature_note,
      note: logNote,
      updated_by: supervisorName,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Assigned courier ${driver_name} to shipment ${order.order_number}.`,
      order: { ...updatedOrder, history }
    });
  } catch (error) {
    console.error('assignCourier error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign courier.' });
  }
}

/**
 * Logistics Hub Metrics Summary
 * GET /api/logistics/metrics
 */
export function getLogisticsMetrics(req, res) {
  try {
    const counts = db.prepare(`
      SELECT 
        SUM(CASE WHEN order_status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN order_status = 'Packing' THEN 1 ELSE 0 END) as packing,
        SUM(CASE WHEN order_status = 'Quality Check' THEN 1 ELSE 0 END) as quality_check,
        SUM(CASE WHEN order_status = 'Out for Delivery' THEN 1 ELSE 0 END) as out_for_delivery,
        SUM(CASE WHEN order_status = 'Delivered' THEN 1 ELSE 0 END) as delivered_total,
        SUM(CASE WHEN order_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
        COUNT(id) as total_orders
      FROM orders
    `).get();

    const activeTotal = (counts.confirmed || 0) + (counts.packing || 0) + (counts.quality_check || 0) + (counts.out_for_delivery || 0);

    return res.json({
      success: true,
      metrics: {
        confirmed: counts.confirmed || 0,
        packing: counts.packing || 0,
        quality_check: counts.quality_check || 0,
        out_for_delivery: counts.out_for_delivery || 0,
        delivered: counts.delivered_total || 0,
        cancelled: counts.cancelled || 0,
        active_total: activeTotal,
        total_orders: counts.total_orders || 0,
        active_listeners: getActiveListenerCount()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to compute logistics metrics.' });
  }
}
