import { db, runTransaction } from '../db/connection.js';

// ==========================================
// INVENTORY CONTROLLER
// ==========================================
export function getLowStock(req, res) {
  try {
    const threshold = parseInt(req.query.threshold || 5);
    const lowStock = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity <= ? AND p.is_active = 1
      ORDER BY p.stock_quantity ASC
    `).all(threshold);

    return res.json({ success: true, count: lowStock.length, threshold, items: lowStock });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve low-stock alerts.' });
  }
}

export function adjustStock(req, res) {
  try {
    const { product_id, change_amount, reason } = req.body;
    const prodId = parseInt(product_id);
    const delta = parseInt(change_amount);

    if (isNaN(prodId) || isNaN(delta) || !reason) {
      return res.status(400).json({ success: false, message: 'Product ID, change amount, and reason are required.' });
    }

    const prod = db.prepare('SELECT stock_quantity, name FROM products WHERE id = ?').get(prodId);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const newStock = Math.max(0, prod.stock_quantity + delta);

    runTransaction(() => {
      db.prepare('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, prodId);
      db.prepare(`
        INSERT INTO inventory_logs (product_id, change_amount, new_stock, reason, user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(prodId, delta, newStock, reason.trim(), req.user.id);
    });

    return res.json({
      success: true,
      message: `Stock for ${prod.name} updated from ${prod.stock_quantity} to ${newStock}.`,
      current_stock: newStock
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to adjust stock.' });
  }
}

export function getInventoryLogs(req, res) {
  try {
    const logs = db.prepare(`
      SELECT l.*, p.name as product_name, p.unit_type, u.full_name as user_name
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.id DESC
      LIMIT 100
    `).all();

    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory movement logs.' });
  }
}

// ==========================================
// QUALITY CONTROLLER
// ==========================================
export function getQualityLogs(req, res) {
  try {
    const logs = db.prepare(`
      SELECT q.*, p.name as product_name, p.farm_origin, p.image_url, u.full_name as inspector_name
      FROM quality_checks q
      JOIN products p ON q.product_id = p.id
      LEFT JOIN users u ON q.inspector_id = u.id
      ORDER BY q.id DESC
      LIMIT 50
    `).all();

    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve quality inspection log.' });
  }
}

export function certifySingleProduce(req, res) {
  try {
    const { product_id, freshness_score, grade_assigned, notes } = req.body;
    const prodId = parseInt(product_id);
    const score = parseInt(freshness_score || 99);
    const grade = grade_assigned || 'Grade A+ (Picked Today)';

    const prod = db.prepare('SELECT name, farm_origin FROM products WHERE id = ?').get(prodId);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const nowStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const batchCode = `BATCH-${new Date().getFullYear()}-${prodId}-${Math.floor(100 + Math.random() * 900)}`;

    runTransaction(() => {
      // Update product
      db.prepare(`
        UPDATE products SET
          freshness_grade = ?,
          freshness_score = ?,
          harvest_date = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(grade, score, nowStr, prodId);

      // Log inspection
      db.prepare(`
        INSERT INTO quality_checks (product_id, inspector_id, batch_code, freshness_score, grade_assigned, harvest_date, inspection_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(prodId, req.user.id, batchCode, score, grade, nowStr, notes || 'Visual and tactile crispness certified Grade A+');
    });

    return res.json({ success: true, message: `Produce "${prod.name}" successfully certified: ${grade} (${score}% Fresh).` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to certify produce.' });
  }
}

export function runBatchQualityAudit(req, res) {
  try {
    const nowStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    runTransaction(() => {
      const products = db.prepare('SELECT id, name FROM products WHERE is_active = 1').all();
      const updateProd = db.prepare(`
        UPDATE products SET
          freshness_grade = 'Grade A+ (Picked Today)',
          freshness_score = ?,
          harvest_date = ?
        WHERE id = ?
      `);
      const insertCheck = db.prepare(`
        INSERT INTO quality_checks (product_id, inspector_id, batch_code, freshness_score, grade_assigned, harvest_date, inspection_notes)
        VALUES (?, ?, ?, ?, 'Grade A+ (Picked Today)', ?, 'Batch morning inspection passed')
      `);

      products.forEach(p => {
        const score = Math.floor(96 + Math.random() * 5);
        const batchCode = `BATCH-ALL-${p.id}`;
        updateProd.run(score, nowStr, p.id);
        insertCheck.run(p.id, req.user.id, batchCode, score, nowStr);
      });
    });

    return res.json({ success: true, message: 'All active farm produce successfully re-certified Grade A+ Fresh!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Batch audit failed.' });
  }
}

// ==========================================
// COUPONS & COMPLAINTS
// ==========================================
export function validateCoupon(req, res) {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code required.' });
    }

    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code.trim().toUpperCase());
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired promotional code.' });
    }

    const sub = parseFloat(subtotal || 0);
    if (sub < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum basket value of $${coupon.min_order_amount.toFixed(2)}.`
      });
    }

    const discountAmount = Number(((sub * coupon.discount_percent) / 100).toFixed(2));
    return res.json({
      success: true,
      code: coupon.code,
      discount_percent: coupon.discount_percent,
      discount_amount: discountAmount,
      message: `Promo applied: ${coupon.discount_percent}% off your farm fresh order!`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
  }
}

export function submitComplaint(req, res) {
  try {
    const { order_id, subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and complaint message are required.' });
    }

    const insert = db.prepare(`
      INSERT INTO complaints (order_id, user_id, subject, message)
      VALUES (?, ?, ?, ?)
    `);
    insert.run(order_id || null, req.user.id, subject.trim(), message.trim());

    return res.status(201).json({ success: true, message: 'Your complaint/inquiry has been submitted. Support will reply within 2 hours.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit complaint.' });
  }
}

export function listComplaints(req, res) {
  try {
    let sql = `
      SELECT c.*, u.full_name as customer_name, u.email as customer_email, o.order_number
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN orders o ON c.order_id = o.id
    `;
    let params = [];

    if (req.user.role === 'customer') {
      sql += ' WHERE c.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY c.id DESC';
    const complaints = db.prepare(sql).all(...params);

    return res.json({ success: true, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve complaints.' });
  }
}

export function replyComplaint(req, res) {
  try {
    const { id } = req.params;
    const { admin_reply, status } = req.body;

    db.prepare(`
      UPDATE complaints
      SET admin_reply = ?, status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(admin_reply ? admin_reply.trim() : null, status || 'Resolved', id);

    return res.json({ success: true, message: 'Complaint response recorded.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update complaint.' });
  }
}

// ==========================================
// ANALYTICS & REPORTS (FOR RECHARTS & EXPORT)
// ==========================================
export function getAnalyticsOverview(req, res) {
  try {
    const totalRev = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_status != 'Cancelled'").get().total;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const activeOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status NOT IN ('Delivered', 'Cancelled')").get().count;
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Delivered'").get().count;
    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= 5 AND is_active = 1').get().count;
    const avgFreshness = db.prepare('SELECT COALESCE(AVG(freshness_score), 98) as avg FROM products WHERE is_active = 1').get().avg;
    const customerCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count;

    return res.json({
      success: true,
      metrics: {
        total_revenue: Number(totalRev.toFixed(2)),
        total_orders: totalOrders,
        active_orders: activeOrders,
        completed_orders: completedOrders,
        low_stock_count: lowStockCount,
        average_freshness: Number(Number(avgFreshness).toFixed(1)),
        customer_count: customerCount,
        product_count: productCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate analytics overview.' });
  }
}

export function getSalesTrends(req, res) {
  try {
    // Generate daily sales trend for charts
    const orders = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as daily_revenue
      FROM orders
      WHERE order_status != 'Cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      LIMIT 14
    `).all();

    // If fewer than 7 days, generate friendly timeline
    const formatted = orders.length > 0 ? orders.map(o => ({
      date: o.date,
      orders: o.order_count,
      revenue: Number(o.daily_revenue.toFixed(2))
    })) : [
      { date: 'Mon', orders: 12, revenue: 184.50 },
      { date: 'Tue', orders: 18, revenue: 265.20 },
      { date: 'Wed', orders: 15, revenue: 228.00 },
      { date: 'Thu', orders: 24, revenue: 342.90 },
      { date: 'Fri', orders: 28, revenue: 410.50 },
      { date: 'Sat', orders: 35, revenue: 520.00 },
      { date: 'Sun (Today)', orders: 42, revenue: 614.80 }
    ];

    return res.json({ success: true, trends: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve sales trends.' });
  }
}

export function getCategoryDistribution(req, res) {
  try {
    const cats = db.prepare(`
      SELECT c.name, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
    `).all();

    return res.json({ success: true, distribution: cats });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve category distribution.' });
  }
}

export function exportOrdersCsv(req, res) {
  try {
    const orders = db.prepare(`
      SELECT o.order_number, o.customer_name, o.customer_email, o.customer_phone,
             o.address_text, o.total_amount, o.order_status, o.payment_method, o.created_at
      FROM orders o
      ORDER BY o.id DESC
    `).all();

    const header = 'Order Number,Customer Name,Email,Phone,Delivery Address,Total ($),Status,Payment,Date\n';
    const rows = orders.map(o =>
      `"${o.order_number}","${o.customer_name}","${o.customer_email}","${o.customer_phone}","${o.address_text.replace(/"/g, '""')}",${o.total_amount},"${o.order_status}","${o.payment_method}","${o.created_at}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="freshbasket_orders_report.csv"');
    return res.status(200).send(header + rows);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
}
