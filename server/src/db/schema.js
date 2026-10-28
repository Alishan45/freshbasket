// FreshBasket Normalized Relational Database Schema (3NF)
import { db } from './connection.js';

export function initializeSchema() {
  db.exec(`
    -- 1. Users Table (Customer, Admin, Supplier)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone_number TEXT,
      role TEXT CHECK(role IN ('customer', 'admin', 'supplier', 'logistics')) NOT NULL DEFAULT 'customer',
      avatar_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    -- 2. Delivery Addresses Table
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT 'Home',
      street_address TEXT NOT NULL,
      area TEXT,
      city TEXT NOT NULL DEFAULT 'Lahore',
      phone TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

    -- 3. Produce Categories Table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Products Table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      supplier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      unit_type TEXT NOT NULL DEFAULT '1 kg',
      base_price REAL NOT NULL CHECK(base_price >= 0),
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
      freshness_grade TEXT NOT NULL DEFAULT 'Grade A',
      freshness_score INTEGER NOT NULL DEFAULT 95 CHECK(freshness_score BETWEEN 0 AND 100),
      is_organic INTEGER NOT NULL DEFAULT 0,
      is_seasonal INTEGER NOT NULL DEFAULT 0,
      farm_origin TEXT NOT NULL,
      farmer_name TEXT,
      image_url TEXT NOT NULL,
      storage_tips TEXT,
      harvest_date TEXT,
      nutrition_calories TEXT,
      nutrition_carbs TEXT,
      nutrition_fiber TEXT,
      nutrition_vitC TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(base_price);
    CREATE INDEX IF NOT EXISTS idx_products_organic ON products(is_organic);
    CREATE INDEX IF NOT EXISTS idx_products_seasonal ON products(is_seasonal);

    -- 5. Product Units Table (fractional units: 500g, 250g, dozen, pack)
    CREATE TABLE IF NOT EXISTS product_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      unit_name TEXT NOT NULL,
      multiplier REAL NOT NULL DEFAULT 1.0,
      is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_product_units_prod ON product_units(product_id);

    -- 6. Inventory Logs Table (Audit trail for stock deductions and adjustments)
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      change_amount INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id TEXT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_inv_logs_prod ON inventory_logs(product_id);

    -- 7. Orders Table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      address_text TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0.0,
      delivery_fee REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'COD',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      order_status TEXT CHECK(order_status IN ('Confirmed', 'Packing', 'Quality Check', 'Out for Delivery', 'Delivered', 'Cancelled')) NOT NULL DEFAULT 'Confirmed',
      delivery_slot TEXT NOT NULL,
      special_instructions TEXT,
      driver_name TEXT DEFAULT 'Hamza Tariq',
      driver_phone TEXT DEFAULT '+92 300 1234567',
      vehicle_number TEXT DEFAULT 'EV-VAN-04',
      temperature_note TEXT DEFAULT 'Cold-Chain 3.8°C Verified',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

    -- 8. Order Items Table
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      unit_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      subtotal REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

    -- 9. Order Status History Table (Fulfillment Timeline log)
    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_status_history_order ON order_status_history(order_id);

    -- 10. Quality Checks Table (Farm-to-Fork Inspections)
    CREATE TABLE IF NOT EXISTS quality_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      inspector_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      batch_code TEXT NOT NULL,
      freshness_score INTEGER NOT NULL CHECK(freshness_score BETWEEN 0 AND 100),
      grade_assigned TEXT NOT NULL,
      harvest_date TEXT,
      inspection_notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_quality_checks_prod ON quality_checks(product_id);

    -- 11. Customer Reviews Table
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      rating_stars INTEGER NOT NULL CHECK(rating_stars BETWEEN 1 AND 5),
      freshness_stars INTEGER NOT NULL CHECK(freshness_stars BETWEEN 1 AND 5),
      comment_text TEXT NOT NULL,
      photo_url TEXT,
      seller_response TEXT,
      is_approved INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_prod ON reviews(product_id);

    -- 12. Promotional Coupons Table
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL NOT NULL CHECK(discount_percent > 0 AND discount_percent <= 100),
      min_order_amount REAL NOT NULL DEFAULT 0.0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Customer Support Complaints Table
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      category TEXT DEFAULT 'Freshness & Quality',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_url TEXT,
      status TEXT CHECK(status IN ('Open', 'In Review', 'Resolved', 'Closed')) NOT NULL DEFAULT 'Open',
      admin_reply TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 14. Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ SQLite Relational Schema initialized successfully.');
}
