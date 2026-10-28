import { db, runTransaction } from '../db/connection.js';

// Get all products owned by this supplier
export function getSupplierProducts(req, res) {
  try {
    const supplierId = req.user.id;
    const isSupplier = req.user.role === 'supplier';

    let sql = `
      SELECT
        p.*,
        c.name as category_name,
        COALESCE(AVG(r.rating_stars), 5.0) as average_rating,
        COUNT(r.id) as reviews_count,
        COALESCE(SUM(oi.quantity), 0) as total_sold_units
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
    `;

    const params = [];
    if (isSupplier) {
      sql += ' WHERE p.supplier_id = ? OR p.supplier_id IS NULL';
      // If none explicitly matched, allow supplier to view and manage all seeded harvest listings
    }
    sql += ' GROUP BY p.id ORDER BY p.id DESC';

    const products = db.prepare(sql).all(...params);

    const getUnits = db.prepare('SELECT id, unit_name, multiplier, is_default FROM product_units WHERE product_id = ? ORDER BY is_default DESC');
    const enriched = products.map(prod => ({
      ...prod,
      available_units: getUnits.all(prod.id),
      average_rating: Number(Number(prod.average_rating).toFixed(1)),
      reviews_count: Number(prod.reviews_count),
      total_sold_units: Number(prod.total_sold_units)
    }));

    return res.json({ success: true, products: enriched });
  } catch (error) {
    console.error('Supplier products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch supplier produce catalog.' });
  }
}

// Get overview stats for supplier dashboard
export function getSupplierStats(req, res) {
  try {
    const totalListings = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count;
    const totalStock = db.prepare('SELECT COALESCE(SUM(stock_quantity), 0) as total FROM products WHERE is_active = 1').get().total;
    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= 10 AND is_active = 1').get().count;
    const totalOrdersFulfilled = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Delivered'").get().count;

    return res.json({
      success: true,
      stats: {
        totalListings,
        totalStock,
        lowStockCount,
        totalOrdersFulfilled,
        farmName: req.user.full_name || 'Makhdoom Agro Farms',
        originRegion: 'Bedian Road & Thatta Green Valley',
        organicCertified: true
      }
    });
  } catch (error) {
    console.error('Supplier stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch supplier metrics.' });
  }
}

// Get supply orders involving the supplier's produce
export function getSupplierOrders(req, res) {
  try {
    const orders = db.prepare(`
      SELECT
        o.id,
        o.order_number,
        o.created_at,
        o.order_status,
        o.delivery_slot,
        COUNT(oi.id) as items_count,
        COALESCE(SUM(oi.subtotal), 0) as supply_value
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.id DESC
      LIMIT 20
    `).all();

    return res.json({ success: true, orders });
  } catch (error) {
    console.error('Supplier orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch supply dispatch records.' });
  }
}

// Log a fresh morning harvest batch for produce items
export function submitHarvestBatch(req, res) {
  try {
    const { product_id, harvest_time, batch_code, notes, quantity_harvested } = req.body;

    if (!product_id || !harvest_time) {
      return res.status(400).json({ success: false, message: 'Product and harvest timestamp are required.' });
    }

    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const qty = parseInt(quantity_harvested || 0);
    const code = batch_code || `BATCH-HARVEST-${Date.now().toString().slice(-6)}`;
    const formattedDate = `Harvested ${harvest_time} (${code})`;

    runTransaction(() => {
      // Update harvest date and freshness grade on the product
      db.prepare(`
        UPDATE products
        SET harvest_date = ?,
            freshness_grade = 'Grade A+ (Picked Today)',
            freshness_score = 99,
            stock_quantity = stock_quantity + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(formattedDate, qty, product_id);

      // Record in inventory logs
      db.prepare(`
        INSERT INTO inventory_logs (product_id, change_amount, new_stock, reason, batch_number, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        product_id,
        qty,
        prod.stock_quantity + qty,
        `Morning Harvest Inbound: ${notes || 'Fresh field picking'}`,
        code,
        req.user.id
      );
    });

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    return res.json({
      success: true,
      message: `Fresh harvest batch ${code} recorded successfully.`,
      product: updated
    });
  } catch (error) {
    console.error('Submit harvest batch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit harvest batch.' });
  }
}
