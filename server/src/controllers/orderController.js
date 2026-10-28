import { db, runTransaction } from '../db/connection.js';
import { broadcastFulfillmentEvent } from '../utils/eventBus.js';

export function createOrder(req, res) {
  try {
    const {
      items,
      address_id,
      address_text,
      delivery_slot,
      special_instructions,
      coupon_code,
      customer_name,
      customer_email,
      customer_phone
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your shopping basket is empty. Please add items.' });
    }

    if (!delivery_slot) {
      return res.status(400).json({ success: false, message: 'Please select an express delivery slot.' });
    }

    // Determine contact and address details
    let name = customer_name;
    let email = customer_email;
    let phone = customer_phone;
    let finalAddressText = address_text;

    if (req.user) {
      name = name || req.user.full_name;
      email = email || req.user.email;
      phone = phone || req.user.phone_number;

      if (address_id) {
        const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(address_id, req.user.id);
        if (addr) {
          finalAddressText = `${addr.street_address}, ${addr.area ? addr.area + ', ' : ''}${addr.city} (Phone: ${addr.phone})`;
          phone = phone || addr.phone;
        }
      }
    }

    if (!finalAddressText) {
      return res.status(400).json({ success: false, message: 'Please provide a valid delivery address.' });
    }
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Customer name and contact telephone are required.' });
    }

    // Execute atomic transaction for stock validation, price recalculation, and stock deduction
    const orderRecord = runTransaction(() => {
      let serverSubtotal = 0;
      const validatedItems = [];

      const getProd = db.prepare('SELECT id, name, base_price, stock_quantity, is_active FROM products WHERE id = ?');
      const getUnit = db.prepare('SELECT unit_name, multiplier FROM product_units WHERE product_id = ? AND unit_name = ?');
      const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?');
      const logInv = db.prepare(`
        INSERT INTO inventory_logs (product_id, change_amount, new_stock, reason, reference_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const prodId = parseInt(item.id || item.product_id);
        const qty = parseInt(item.quantity || 1);

        if (isNaN(prodId) || isNaN(qty) || qty <= 0) {
          throw new Error('Invalid item quantity or product identifier.');
        }

        const product = getProd.get(prodId);
        if (!product || !product.is_active) {
          throw new Error(`Product "${item.name || prodId}" is currently unavailable.`);
        }

        if (product.stock_quantity < qty) {
          throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock_quantity} available in morning harvest.`);
        }

        // Determine multiplier for unit
        let multiplier = 1.0;
        let chosenUnitName = item.unit || product.unit_type || '1 kg';
        const unitRecord = getUnit.get(prodId, chosenUnitName);
        if (unitRecord) {
          multiplier = unitRecord.multiplier;
        }

        // Calculate unit price strictly on the server!
        const effectiveUnitPrice = Number((product.base_price * multiplier).toFixed(2));
        const lineSubtotal = Number((effectiveUnitPrice * qty).toFixed(2));

        serverSubtotal += lineSubtotal;

        // Deduct inventory atomically
        const newStock = product.stock_quantity - qty;
        updateStock.run(qty, prodId);

        // Record audit inventory log
        logInv.run(prodId, -qty, newStock, 'Customer Order Checkout', null, req.user?.id || null);

        validatedItems.push({
          product_id: product.id,
          product_name: product.name,
          unit_name: chosenUnitName,
          unit_price: effectiveUnitPrice,
          quantity: qty,
          subtotal: lineSubtotal
        });
      }

      // Calculate server discount via coupon
      let serverDiscount = 0;
      if (coupon_code) {
        const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(coupon_code.trim().toUpperCase());
        if (coupon && serverSubtotal >= coupon.min_order_amount) {
          serverDiscount = Number(((serverSubtotal * coupon.discount_percent) / 100).toFixed(2));
        }
      }

      // Calculate server delivery fee (free over $20)
      const serverDeliveryFee = serverSubtotal >= 20 ? 0.00 : 2.50;
      const serverTotal = Number(Math.max(0, serverSubtotal - serverDiscount + serverDeliveryFee).toFixed(2));

      // Generate unique order number FB-XXXXX
      const orderNumber = `FB-${Math.floor(10000 + Math.random() * 90000)}`;

      const insertOrder = db.prepare(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          address_text, subtotal, discount, delivery_fee, total_amount,
          payment_method, payment_status, order_status, delivery_slot, special_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const orderRes = insertOrder.run(
        orderNumber,
        req.user?.id || null,
        name.trim(),
        email.trim(),
        phone.trim(),
        finalAddressText.trim(),
        serverSubtotal,
        serverDiscount,
        serverDeliveryFee,
        serverTotal,
        'COD',
        'Pending Doorstep Payment',
        'Confirmed',
        delivery_slot.trim(),
        special_instructions ? special_instructions.trim() : 'Please handle fresh produce with care.'
      );

      const orderId = Number(orderRes.lastInsertRowid);

      // Insert Order Items
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, unit_name, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const vItem of validatedItems) {
        insertItem.run(
          orderId,
          vItem.product_id,
          vItem.product_name,
          vItem.unit_name,
          vItem.unit_price,
          vItem.quantity,
          vItem.subtotal
        );
      }

      // Record initial history
      db.prepare(`
        INSERT INTO order_status_history (order_id, status, note, updated_by)
        VALUES (?, ?, ?, ?)
      `).run(orderId, 'Confirmed', 'Order placed successfully via Cash on Delivery (COD)', req.user?.id || null);

      return {
        id: orderId,
        order_number: orderNumber,
        total_amount: serverTotal,
        subtotal: serverSubtotal,
        discount: serverDiscount,
        delivery_fee: serverDeliveryFee,
        items: validatedItems,
        delivery_slot,
        address_text: finalAddressText,
        customer_name: name,
        customer_phone: phone
      };
    });

    // Broadcast new order creation to logistics & admin stream
    broadcastFulfillmentEvent({
      type: 'order_created',
      order_id: orderRecord.id,
      order_number: orderRecord.order_number,
      new_status: 'Confirmed',
      customer_name: orderRecord.customer_name,
      total_amount: orderRecord.total_amount,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Cash on Delivery confirmed.',
      order: orderRecord
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to place order.' });
  }
}

export function getUserOrders(req, res) {
  try {
    const orders = db.prepare(`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.id DESC
    `).all(req.user.id);

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve order history.' });
  }
}

export function getOrderDetails(req, res) {
  try {
    const { identifier } = req.params;
    const cleanId = String(identifier || '').trim();
    const withHash = cleanId.startsWith('#') ? cleanId : `#${cleanId}`;
    const withoutHash = cleanId.replace(/^#+/, '');

    const order = db.prepare(`
      SELECT * FROM orders
      WHERE id = ? OR order_number = ? OR order_number = ? OR order_number = ?
    `).get(cleanId, cleanId, withHash, withoutHash);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order record not found.' });
    }

    // Authorization check: if authenticated user is customer, ensure ownership
    if (req.user && req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
    }

    const items = db.prepare(`
      SELECT oi.*, p.image_url, p.farm_origin, p.freshness_grade
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);

    const history = db.prepare(`
      SELECT status, note, created_at
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY id ASC
    `).all(order.id);

    return res.json({
      success: true,
      order: {
        ...order,
        items,
        history
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
}

export function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Role check
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only cancel your own orders.' });
    }

    // State machine check: only 'Confirmed' or 'Packing' orders can be cancelled
    if (order.order_status !== 'Confirmed' && order.order_status !== 'Packing') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in '${order.order_status}' status. Produce is already dispatched.`
      });
    }

    // Execute atomic cancellation and stock restoration
    runTransaction(() => {
      // 1. Update order status
      db.prepare(`
        UPDATE orders SET order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(order.id);

      // 2. Restore inventory stock for each item
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
      const restoreStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
      const logInv = db.prepare(`
        INSERT INTO inventory_logs (product_id, change_amount, new_stock, reason, reference_id, user_id)
        VALUES (?, ?, (SELECT stock_quantity FROM products WHERE id = ?), ?, ?, ?)
      `);

      for (const item of items) {
        if (item.product_id) {
          restoreStock.run(item.quantity, item.product_id);
          logInv.run(item.product_id, item.quantity, item.product_id, 'Order Cancellation Restock', order.order_number, req.user.id);
        }
      }

      // 3. Record history log
      db.prepare(`
        INSERT INTO order_status_history (order_id, status, note, updated_by)
        VALUES (?, ?, ?, ?)
      `).run(order.id, 'Cancelled', reason ? `Cancelled: ${reason}` : 'Cancelled by user; stock restored to inventory', req.user.id);
    });

    // Broadcast cancellation to logistics and admin streams
    broadcastFulfillmentEvent({
      type: 'order_cancelled',
      order_id: order.id,
      order_number: order.order_number,
      new_status: 'Cancelled',
      reason: reason || 'Cancelled by user; stock restored to inventory',
      updated_by: req.user.full_name || 'Customer',
      timestamp: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Order cancelled successfully and produce stock restored to inventory.' });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
}

export function updateOrderStatusAdmin(req, res) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['Confirmed', 'Packing', 'Quality Check', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    runTransaction(() => {
      let paymentStatus = order.payment_status;
      if (status === 'Delivered') {
        paymentStatus = 'Paid in Cash at Door';
      }

      db.prepare(`
        UPDATE orders SET order_status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(status, paymentStatus, order.id);

      db.prepare(`
        INSERT INTO order_status_history (order_id, status, note, updated_by)
        VALUES (?, ?, ?, ?)
      `).run(order.id, status, note || `Status transitioned to ${status} by admin`, req.user.id);
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id DESC').all(order.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    const fullPayload = {
      ...updated,
      items,
      history
    };

    // Broadcast update across real-time fulfillment stream
    broadcastFulfillmentEvent({
      type: 'order_status_updated',
      order_id: order.id,
      order_number: order.order_number,
      previous_status: order.order_status,
      new_status: status,
      payment_status: updated.payment_status,
      driver_name: updated.driver_name,
      driver_phone: updated.driver_phone,
      vehicle_number: updated.vehicle_number,
      temperature_note: updated.temperature_note,
      note: note || `Status transitioned to ${status} by admin`,
      updated_by: req.user.full_name || 'Admin',
      order: fullPayload,
      timestamp: new Date().toISOString()
    });

    return res.json({ success: true, message: `Order status updated to ${status}.`, order: fullPayload });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
}

export function adminListOrders(req, res) {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;

    let whereClauses = [];
    let params = [];

    if (status && status !== 'all') {
      whereClauses.push('o.order_status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(o.order_number) LIKE ? OR LOWER(o.customer_name) LIKE ? OR LOWER(o.customer_phone) LIKE ?)');
      params.push(q, q, q);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as count FROM orders o ${whereSql}`;
    const totalCount = db.prepare(countQuery).get(...params).count;

    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.max(1, parseInt(limit));
    const offset = (pageNum - 1) * pageLimit;

    const sql = `
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereSql}
      GROUP BY o.id
      ORDER BY o.id DESC
      LIMIT ? OFFSET ?
    `;

    const orders = db.prepare(sql).all(...params, pageLimit, offset);

    return res.json({
      success: true,
      orders,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(totalCount / pageLimit)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin orders.' });
  }
}
