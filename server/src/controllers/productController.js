import { db, runTransaction } from '../db/connection.js';

export function listProducts(req, res) {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      organic,
      seasonal,
      freshness,
      inStock,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    let whereClauses = ['p.is_active = 1'];
    let params = [];

    // Search query
    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.farm_origin) LIKE ?)');
      params.push(q, q, q);
    }

    // Category filter (slug or id)
    if (category && category !== 'all') {
      if (category === 'organic') {
        whereClauses.push('p.is_organic = 1');
      } else if (category === 'seasonal') {
        whereClauses.push('p.is_seasonal = 1');
      } else {
        const cat = db.prepare('SELECT id FROM categories WHERE slug = ? OR id = ?').get(category, category);
        if (cat) {
          whereClauses.push('p.category_id = ?');
          params.push(cat.id);
        }
      }
    }

    // Price range
    if (minPrice) {
      whereClauses.push('p.base_price >= ?');
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereClauses.push('p.base_price <= ?');
      params.push(parseFloat(maxPrice));
    }

    // Toggles
    if (organic === 'true' || organic === '1') {
      whereClauses.push('p.is_organic = 1');
    }
    if (seasonal === 'true' || seasonal === '1') {
      whereClauses.push('p.is_seasonal = 1');
    }
    if (inStock === 'true' || inStock === '1') {
      whereClauses.push('p.stock_quantity > 0');
    }
    if (freshness && freshness !== 'all') {
      whereClauses.push('p.freshness_grade LIKE ?');
      params.push(`%${freshness}%`);
    }

    // Sorting
    let orderBy = 'p.freshness_score DESC, p.id DESC';
    if (sort === 'price-asc') orderBy = 'p.base_price ASC';
    if (sort === 'price-desc') orderBy = 'p.base_price DESC';
    if (sort === 'newest') orderBy = 'p.id DESC';
    if (sort === 'name') orderBy = 'p.name ASC';

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) as count FROM products p ${whereSql}`;
    const totalCount = db.prepare(countQuery).get(...params).count;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit)));
    const offset = (pageNum - 1) * pageLimit;

    const sql = `
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(AVG(r.rating_stars), 5.0) as average_rating,
        COUNT(r.id) as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      ${whereSql}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const products = db.prepare(sql).all(...params, pageLimit, offset);

    // Fetch units for each product
    const getUnits = db.prepare('SELECT id, unit_name, multiplier, is_default FROM product_units WHERE product_id = ? ORDER BY is_default DESC');
    const enriched = products.map(prod => ({
      ...prod,
      available_units: getUnits.all(prod.id),
      average_rating: Number(Number(prod.average_rating).toFixed(1)),
      reviews_count: Number(prod.reviews_count)
    }));

    return res.json({
      success: true,
      products: enriched,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(totalCount / pageLimit)
      }
    });
  } catch (error) {
    console.error('List products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
}

export function getProductByIdOrSlug(req, res) {
  try {
    const { identifier } = req.params;

    const prod = db.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(AVG(r.rating_stars), 5.0) as average_rating,
        COUNT(r.id) as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE (p.id = ? OR p.slug = ?) AND p.is_active = 1
      GROUP BY p.id
    `).get(identifier, identifier);

    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Units
    const units = db.prepare('SELECT id, unit_name, multiplier, is_default FROM product_units WHERE product_id = ? ORDER BY is_default DESC').all(prod.id);

    // Reviews
    const reviews = db.prepare(`
      SELECT id, author_name, rating_stars, freshness_stars, comment_text, photo_url, seller_response, created_at
      FROM reviews
      WHERE product_id = ? AND is_approved = 1
      ORDER BY id DESC
    `).all(prod.id);

    // Related products in same category
    const related = db.prepare(`
      SELECT id, name, slug, base_price, unit_type, image_url, freshness_grade, freshness_score, is_organic
      FROM products
      WHERE category_id = ? AND id != ? AND is_active = 1
      LIMIT 4
    `).all(prod.category_id, prod.id);

    return res.json({
      success: true,
      product: {
        ...prod,
        available_units: units,
        reviews,
        related_products: related,
        average_rating: Number(Number(prod.average_rating).toFixed(1)),
        reviews_count: Number(prod.reviews_count)
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve product details.' });
  }
}

export function createProduct(req, res) {
  try {
    const {
      name, category_id, description, unit_type, base_price,
      stock_quantity, freshness_grade, freshness_score, is_organic,
      is_seasonal, farm_origin, farmer_name, image_url, storage_tips,
      harvest_date, nutrition_calories, nutrition_carbs, nutrition_fiber,
      nutrition_vitC, units
    } = req.body;

    if (!name || !base_price || !unit_type || !farm_origin) {
      return res.status(400).json({ success: false, message: 'Name, price, unit type, and farm origin are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const result = runTransaction(() => {
      const insert = db.prepare(`
        INSERT INTO products (
          category_id, supplier_id, name, slug, description, unit_type,
          base_price, stock_quantity, freshness_grade, freshness_score,
          is_organic, is_seasonal, farm_origin, farmer_name, image_url,
          storage_tips, harvest_date, nutrition_calories, nutrition_carbs,
          nutrition_fiber, nutrition_vitC
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const res = insert.run(
        category_id || null,
        req.user.role === 'supplier' ? req.user.id : null,
        name.trim(),
        slug,
        description || 'Farm-fresh daily harvest.',
        unit_type.trim(),
        parseFloat(base_price),
        parseInt(stock_quantity || 0),
        freshness_grade || 'Grade A+ (Picked Today)',
        parseInt(freshness_score || 98),
        is_organic ? 1 : 0,
        is_seasonal ? 1 : 0,
        farm_origin.trim(),
        farmer_name ? farmer_name.trim() : null,
        image_url || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
        storage_tips || null,
        harvest_date || 'Today, 6:00 AM',
        nutrition_calories || null,
        nutrition_carbs || null,
        nutrition_fiber || null,
        nutrition_vitC || null
      );

      const prodId = Number(res.lastInsertRowid);

      // Add default unit
      const insertUnit = db.prepare('INSERT INTO product_units (product_id, unit_name, multiplier, is_default) VALUES (?, ?, ?, ?)');
      insertUnit.run(prodId, unit_type.trim(), 1.0, 1);

      if (Array.isArray(units)) {
        units.forEach(u => {
          if (u.name && u.name !== unit_type) {
            insertUnit.run(prodId, u.name, parseFloat(u.multiplier || 1.0), 0);
          }
        });
      }

      // Initial inventory log
      db.prepare(`
        INSERT INTO inventory_logs (product_id, change_amount, new_stock, reason, user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(prodId, parseInt(stock_quantity || 0), parseInt(stock_quantity || 0), 'Product Creation Initial Stock', req.user.id);

      return prodId;
    });

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result);
    return res.status(201).json({ success: true, message: 'Product created successfully.', product: created });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
}

export function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name, category_id, description, unit_type, base_price,
      stock_quantity, freshness_grade, freshness_score, is_organic,
      is_seasonal, farm_origin, farmer_name, image_url, storage_tips
    } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Role ownership check if supplier
    if (req.user.role === 'supplier' && existing.supplier_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only edit your own supplier listings.' });
    }

    const newStock = parseInt(stock_quantity !== undefined ? stock_quantity : existing.stock_quantity);

    runTransaction(() => {
      db.prepare(`
        UPDATE products SET
          name = COALESCE(?, name),
          category_id = COALESCE(?, category_id),
          description = COALESCE(?, description),
          unit_type = COALESCE(?, unit_type),
          base_price = COALESCE(?, base_price),
          stock_quantity = ?,
          freshness_grade = COALESCE(?, freshness_grade),
          freshness_score = COALESCE(?, freshness_score),
          is_organic = COALESCE(?, is_organic),
          is_seasonal = COALESCE(?, is_seasonal),
          farm_origin = COALESCE(?, farm_origin),
          farmer_name = COALESCE(?, farmer_name),
          image_url = COALESCE(?, image_url),
          storage_tips = COALESCE(?, storage_tips),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name ? name.trim() : null,
        category_id || null,
        description || null,
        unit_type ? unit_type.trim() : null,
        base_price ? parseFloat(base_price) : null,
        newStock,
        freshness_grade || null,
        freshness_score ? parseInt(freshness_score) : null,
        is_organic !== undefined ? (is_organic ? 1 : 0) : null,
        is_seasonal !== undefined ? (is_seasonal ? 1 : 0) : null,
        farm_origin ? farm_origin.trim() : null,
        farmer_name ? farmer_name.trim() : null,
        image_url || null,
        storage_tips || null,
        id
      );

      // If stock changed, log it
      if (newStock !== existing.stock_quantity) {
        const delta = newStock - existing.stock_quantity;
        db.prepare(`
          INSERT INTO inventory_logs (product_id, change_amount, new_stock, reason, user_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, delta, newStock, 'Admin/Supplier Manual Adjustment', req.user.id);
      }
    });

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Product updated successfully.', product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
}

export function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Product archived successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
}

export function listCategories(req, res) {
  try {
    const cats = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.id ASC
    `).all();
    return res.json({ success: true, categories: cats });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
}
