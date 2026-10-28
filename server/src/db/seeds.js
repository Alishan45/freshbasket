// Database Seeding Script for FreshBasket
import bcrypt from 'bcryptjs';
import { db, runTransaction } from './connection.js';
import { initializeSchema } from './schema.js';

export async function runSeeds() {
  initializeSchema();

  console.log('🌱 Seeding FreshBasket Relational Database...');

  // 1. Seed Users (with secure bcrypt hash)
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('Admin@123', salt);
  const supplierPass = await bcrypt.hash('Supplier@123', salt);
  const customerPass = await bcrypt.hash('Customer@123', salt);

  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (full_name, email, password_hash, phone_number, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('Ali Hassan (Store Admin)', 'admin@freshbasket.com', adminPass, '+92 300 1122334', 'admin');
    insertUser.run('Makhdoom Agro Farms', 'supplier@freshbasket.com', supplierPass, '+92 321 4455667', 'supplier');
    insertUser.run('Ali Shan (Customer)', 'customer@freshbasket.com', customerPass, '+92 300 8472910', 'customer');
    console.log('✓ Users seeded (admin, supplier, customer).');
  }

  // 2. Seed Addresses for Customer
  const customer = db.prepare('SELECT id FROM users WHERE email = ?').get('customer@freshbasket.com');
  const existingAddresses = db.prepare('SELECT COUNT(*) as count FROM addresses').get();
  if (existingAddresses.count === 0 && customer) {
    const insertAddr = db.prepare(`
      INSERT INTO addresses (user_id, label, street_address, area, city, phone, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertAddr.run(
      customer.id,
      'Home',
      'House 42, Street 8, Sector Y, Phase 3, DHA',
      'DHA Phase 3',
      'Lahore',
      '+92 300 8472910',
      1
    );

    insertAddr.run(
      customer.id,
      'Office',
      'Level 4, Arfa Software Technology Park, Ferozepur Road',
      'Nishtar Town',
      'Lahore',
      '+92 321 9876543',
      0
    );
    console.log('✓ Delivery addresses seeded.');
  }

  // 3. Seed Categories
  const existingCats = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (existingCats.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url)
      VALUES (?, ?, ?, ?)
    `);

    insertCat.run(
      'Fresh Fruits',
      'fruits',
      'Orchard-fresh seasonal and exotic fruits packed with natural vitamins.',
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80'
    );
    insertCat.run(
      'Farm Vegetables',
      'vegetables',
      'Crisp, nutrient-dense culinary staples harvested daily from local farms.',
      'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=600&q=80'
    );
    insertCat.run(
      'Leafy Greens',
      'leafy-greens',
      'Hydroponic and garden-fresh greens rich in essential iron, folate, and chlorophyl.',
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'
    );
    insertCat.run(
      '100% Organic Certified',
      'organic',
      'Zero synthetic pesticides or chemicals, certified bio-organic agriculture.',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
    );
    insertCat.run(
      'Seasonal Specials',
      'seasonal',
      'Peak season produce at maximum natural sweetness, crunch, and vitality.',
      'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80'
    );
    console.log('✓ Categories seeded.');
  }

  // 4. Seed Products
  const supplier = db.prepare('SELECT id FROM users WHERE role = ?').get('supplier');
  const catFruits = db.prepare('SELECT id FROM categories WHERE slug = ?').get('fruits');
  const catVeg = db.prepare('SELECT id FROM categories WHERE slug = ?').get('vegetables');
  const catGreens = db.prepare('SELECT id FROM categories WHERE slug = ?').get('leafy-greens');

  const existingProds = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (existingProds.count === 0) {
    const productsData = [
      {
        catId: catFruits.id,
        name: 'Honeycrisp Mountain Apples',
        slug: 'honeycrisp-mountain-apples',
        desc: 'Crisp, hand-harvested sweet Honeycrisp apples grown at high altitudes with glacial meltwater. Exceptionally juicy with a honey-sweet finish.',
        unitType: '1 kg',
        price: 3.99,
        stock: 45,
        grade: 'Grade A+ (Picked Today)',
        score: 99,
        organic: 1,
        seasonal: 1,
        origin: 'Valley Green Orchards, Swat',
        farmer: 'Haji Gulzar Swati',
        img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
        storage: 'Store in refrigerator crisper drawer at 2°C - 4°C. Best consumed within 10 days.',
        harvest: 'Today, 5:30 AM',
        cal: '52 kcal', carbs: '14g', fiber: '2.4g', vitC: '14%',
        units: [
          { name: '1 kg', mult: 1.0, isDefault: 1 },
          { name: '500g', mult: 0.55, isDefault: 0 },
          { name: '2 kg Pack', mult: 1.9, isDefault: 0 }
        ]
      },
      {
        catId: catFruits.id,
        name: 'Organic Cavendish Bananas',
        slug: 'organic-cavendish-bananas',
        desc: 'Naturally ripened on the tree without artificial carbide ripening agents. Rich in potassium and natural electrolytes.',
        unitType: '1 dozen',
        price: 2.20,
        stock: 60,
        grade: 'Grade A (Crisp & Fresh)',
        score: 96,
        organic: 1,
        seasonal: 0,
        origin: 'Sindh Coastal Plantations, Thatta',
        farmer: 'Rasheed Ahmed',
        img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
        storage: 'Store at room temperature in a well-ventilated area away from direct sunlight.',
        harvest: 'Yesterday Evening',
        cal: '89 kcal', carbs: '23g', fiber: '2.6g', vitC: '12%',
        units: [
          { name: '1 dozen', mult: 1.0, isDefault: 1 },
          { name: 'Half dozen', mult: 0.55, isDefault: 0 },
          { name: '2 dozen', mult: 1.9, isDefault: 0 }
        ]
      },
      {
        catId: catFruits.id,
        name: 'Royal Multani Chaunsa Mangoes',
        slug: 'royal-multani-chaunsa-mangoes',
        desc: 'The indisputable king of mangoes. Unmatched floral aroma, fiberless melt-in-mouth golden pulp, and extraordinary natural brix sweetness.',
        unitType: '1 kg',
        price: 5.80,
        stock: 18,
        grade: 'Grade A+ (Peak Sweetness)',
        score: 100,
        organic: 1,
        seasonal: 1,
        origin: 'Multan Sun-Kissed Groves',
        farmer: 'Makhdoom Fruit Farms',
        img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
        storage: 'Keep at room temperature until fragrant, then chill 1 hour prior to serving.',
        harvest: 'Today, 6:00 AM',
        cal: '60 kcal', carbs: '15g', fiber: '1.6g', vitC: '60%',
        units: [
          { name: '1 kg', mult: 1.0, isDefault: 1 },
          { name: '2.5 kg Crate', mult: 2.35, isDefault: 0 },
          { name: '5 kg Master Box', mult: 4.5, isDefault: 0 }
        ]
      },
      {
        catId: catFruits.id,
        name: 'Fresh Alpine Strawberries',
        slug: 'fresh-alpine-strawberries',
        desc: 'Ruby-red, intensely aromatic wild alpine strawberries hand-picked into cushioned punnets to avoid bruising.',
        unitType: '500g pack',
        price: 4.50,
        stock: 12,
        grade: 'Grade A+ (Picked Today)',
        score: 98,
        organic: 1,
        seasonal: 1,
        origin: 'Kaghan Highland Agro Farm',
        farmer: 'Taimur Khan',
        img: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80',
        storage: 'Keep refrigerated in ventilated punnet. Do not wash until immediate consumption.',
        harvest: 'Today, 4:45 AM',
        cal: '32 kcal', carbs: '7.7g', fiber: '2.0g', vitC: '98%',
        units: [
          { name: '500g pack', mult: 1.0, isDefault: 1 },
          { name: '250g pack', mult: 0.55, isDefault: 0 },
          { name: '1 kg crate', mult: 1.85, isDefault: 0 }
        ]
      },
      {
        catId: catFruits.id,
        name: 'Hass Creamy Avocados',
        slug: 'hass-creamy-avocados',
        desc: 'Buttery Hass avocados with dark pebbled skin. Perfect for fresh guacamole, salads, and morning toast.',
        unitType: '1 piece',
        price: 3.20,
        stock: 22,
        grade: 'Grade A (Crisp & Fresh)',
        score: 95,
        organic: 1,
        seasonal: 0,
        origin: 'Sub-Tropical Nursery, Islamabad',
        farmer: 'Nadeem Farooq',
        img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80',
        storage: 'If firm, store at room temperature. Once yielding to gentle pressure, refrigerate.',
        harvest: '2 Days Ago',
        cal: '160 kcal', carbs: '8.5g', fiber: '6.7g', vitC: '15%',
        units: [
          { name: '1 piece', mult: 1.0, isDefault: 1 },
          { name: 'Pack of 3', mult: 2.8, isDefault: 0 },
          { name: 'Pack of 6', mult: 5.2, isDefault: 0 }
        ]
      },
      {
        catId: catFruits.id,
        name: 'Valencia Sweet Oranges',
        slug: 'valencia-sweet-oranges',
        desc: 'Sun-drenched juicing oranges bursting with tangy sweetness. High juice yield with thin aromatic peel.',
        unitType: '1 dozen',
        price: 2.80,
        stock: 35,
        grade: 'Grade A (Crisp & Fresh)',
        score: 96,
        organic: 0,
        seasonal: 1,
        origin: 'Sargodha Citrus Belt',
        farmer: 'Chaudhry Riaz',
        img: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80',
        storage: 'Store in a cool dry fruit bowl or in crisper drawer for up to 3 weeks.',
        harvest: 'Yesterday Morning',
        cal: '47 kcal', carbs: '11.8g', fiber: '2.4g', vitC: '88%',
        units: [
          { name: '1 dozen', mult: 1.0, isDefault: 1 },
          { name: '2 dozen', mult: 1.9, isDefault: 0 }
        ]
      },
      {
        catId: catVeg.id,
        name: 'Vine-Ripened Roma Tomatoes',
        slug: 'vine-ripened-roma-tomatoes',
        desc: 'Plump, firm, and deeply red Roma tomatoes ripened on the vine under natural sunlight. Superb for salads, sauces, and curries.',
        unitType: '1 kg',
        price: 1.80,
        stock: 55,
        grade: 'Grade A+ (Picked Today)',
        score: 99,
        organic: 1,
        seasonal: 0,
        origin: 'Sunrise Hydroponics, Sheikhupura',
        farmer: 'Bilal Warraich',
        img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
        storage: 'Store stem-side down at room temperature for peak aromatic flavor.',
        harvest: 'Today, 6:15 AM',
        cal: '18 kcal', carbs: '3.9g', fiber: '1.2g', vitC: '28%',
        units: [
          { name: '1 kg', mult: 1.0, isDefault: 1 },
          { name: '500g', mult: 0.55, isDefault: 0 },
          { name: '3 kg Box', mult: 2.7, isDefault: 0 }
        ]
      },
      {
        catId: catVeg.id,
        name: 'Crunchy Organic Carrots',
        slug: 'crunchy-organic-carrots',
        desc: 'Sweet, soil-washed organic carrots packed with natural beta-carotene. Crisp crunch with deep orange core.',
        unitType: '1 kg',
        price: 1.50,
        stock: 40,
        grade: 'Grade A (Crisp & Fresh)',
        score: 97,
        organic: 1,
        seasonal: 1,
        origin: 'Green Earth Farms, Okara',
        farmer: 'Malik Jahangir',
        img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
        storage: 'Trim tops and store in sealed crisper bag with minimal moisture.',
        harvest: 'Yesterday Afternoon',
        cal: '41 kcal', carbs: '9.6g', fiber: '2.8g', vitC: '10%',
        units: [
          { name: '1 kg', mult: 1.0, isDefault: 1 },
          { name: '500g', mult: 0.55, isDefault: 0 },
          { name: '2 kg Bag', mult: 1.9, isDefault: 0 }
        ]
      },
      {
        catId: catVeg.id,
        name: 'Crown Broccoli Florets',
        slug: 'crown-broccoli-florets',
        desc: 'Dense, dark green broccoli crowns harvested in morning mist. Firm stalks and tightly packed bud clusters.',
        unitType: '1 piece',
        price: 2.40,
        stock: 15,
        grade: 'Grade A+ (Picked Today)',
        score: 98,
        organic: 1,
        seasonal: 1,
        origin: 'Highland Cool-Crops Farm, Abbottabad',
        farmer: 'Sohail Anwar',
        img: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=800&q=80',
        storage: 'Mist lightly and keep refrigerated in perforated plastic bag.',
        harvest: 'Today, 5:00 AM',
        cal: '34 kcal', carbs: '6.6g', fiber: '2.6g', vitC: '135%',
        units: [
          { name: '1 piece (approx 450g)', mult: 1.0, isDefault: 1 },
          { name: '2 pieces', mult: 1.9, isDefault: 0 }
        ]
      },
      {
        catId: catVeg.id,
        name: 'Farm Fresh Red Onions',
        slug: 'farm-fresh-red-onions',
        desc: 'Pungent, paper-skinned red onions with crisp concentric layers. Sun-cured for prolonged kitchen shelf-life.',
        unitType: '1 kg',
        price: 1.20,
        stock: 75,
        grade: 'Grade A (Crisp & Fresh)',
        score: 96,
        organic: 0,
        seasonal: 0,
        origin: 'Sindh Agri Cooperative, Mirpurkhas',
        farmer: 'Ghulam Qadir',
        img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
        storage: 'Store in cool, dry, dark pantry with open air flow.',
        harvest: '3 Days Ago (Cured)',
        cal: '40 kcal', carbs: '9.3g', fiber: '1.7g', vitC: '8%',
        units: [
          { name: '1 kg', mult: 1.0, isDefault: 1 },
          { name: '2 kg Net Bag', mult: 1.9, isDefault: 0 },
          { name: '5 kg Sack', mult: 4.5, isDefault: 0 }
        ]
      },
      {
        catId: catVeg.id,
        name: 'Crisp English Cucumbers',
        slug: 'crisp-english-cucumbers',
        desc: 'Seedless, ultra-crisp cucumbers with thin tender skins that never require peeling. 96% pure hydration.',
        unitType: '1 kg',
        price: 1.40,
        stock: 32,
        grade: 'Grade A+ (Picked Today)',
        score: 99,
        organic: 1,
        seasonal: 0,
        origin: 'Crystal Greenhouses, Lahore Peri-Urban',
        farmer: 'Zahid Mahmood',
        img: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=800&q=80',
        storage: 'Keep wrapped at 10°C - 12°C to prevent chilling injury.',
        harvest: 'Today, 7:00 AM',
        cal: '15 kcal', carbs: '3.6g', fiber: '0.5g', vitC: '5%',
        units: [
          { name: '1 kg', mult: 1.0, isDefault: 1 },
          { name: '500g', mult: 0.55, isDefault: 0 },
          { name: 'Pack of 3', mult: 1.1, isDefault: 0 }
        ]
      },
      {
        catId: catGreens.id,
        name: 'Hydroponic Baby Spinach',
        slug: 'hydroponic-baby-spinach',
        desc: 'Tender baby spinach leaves grown in purified water without chemical pesticides. Washed in ozone water and ready for crisp salads or sautéing.',
        unitType: '1 bunch',
        price: 1.95,
        stock: 20,
        grade: 'Grade A+ (Picked Today)',
        score: 99,
        organic: 1,
        seasonal: 0,
        origin: 'PureLeaf Hydroponics, Bedian Road',
        farmer: 'Dr. Salman Baig',
        img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
        storage: 'Refrigerate in sealed container with a dry paper towel to absorb condensation.',
        harvest: 'Today, 6:30 AM',
        cal: '23 kcal', carbs: '3.6g', fiber: '2.2g', vitC: '47%',
        units: [
          { name: '1 bunch (250g)', mult: 1.0, isDefault: 1 },
          { name: '500g Pack', mult: 1.9, isDefault: 0 },
          { name: '1 kg Bulk', mult: 3.6, isDefault: 0 }
        ]
      },
      {
        catId: catGreens.id,
        name: 'Tender Green Kale Leaves',
        slug: 'tender-green-kale-leaves',
        desc: 'Nutrient-powerhouse Tuscan kale. Dark crinkled leaves bursting with antioxidants, lutein, and calcium.',
        unitType: '1 bunch',
        price: 2.30,
        stock: 4, // low stock alert!
        grade: 'Grade A+ (Picked Today)',
        score: 97,
        organic: 1,
        seasonal: 1,
        origin: 'PureLeaf Hydroponics, Bedian Road',
        farmer: 'Dr. Salman Baig',
        img: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&w=800&q=80',
        storage: 'Store unwashed stems in a glass of water or crisper drawer.',
        harvest: 'Today, 5:45 AM',
        cal: '35 kcal', carbs: '4.4g', fiber: '4.1g', vitC: '120%',
        units: [
          { name: '1 bunch', mult: 1.0, isDefault: 1 },
          { name: '500g Bag', mult: 1.9, isDefault: 0 }
        ]
      },
      {
        catId: catGreens.id,
        name: 'Fresh Coriander & Mint Trio',
        slug: 'fresh-coriander-mint-trio',
        desc: 'Fragrant garden-fresh green coriander and peppermint leaves. Adds instant vibrancy to salads, chutneys, and garnishes.',
        unitType: '1 bundle',
        price: 0.99,
        stock: 38,
        grade: 'Grade A+ (Picked Today)',
        score: 99,
        organic: 1,
        seasonal: 0,
        origin: 'Local Peri-Urban Farms, Kasur',
        farmer: 'Bashir Ahmed',
        img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
        storage: 'Place stems in a cup with 1 inch of water and cover loosely with bag.',
        harvest: 'Today, 6:00 AM',
        cal: '12 kcal', carbs: '2g', fiber: '1g', vitC: '27%',
        units: [
          { name: '1 bundle', mult: 1.0, isDefault: 1 },
          { name: '3 bundles', mult: 2.7, isDefault: 0 }
        ]
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (
        category_id, supplier_id, name, slug, description, unit_type,
        base_price, stock_quantity, freshness_grade, freshness_score,
        is_organic, is_seasonal, farm_origin, farmer_name, image_url,
        storage_tips, harvest_date, nutrition_calories, nutrition_carbs,
        nutrition_fiber, nutrition_vitC
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertUnit = db.prepare(`
      INSERT INTO product_units (product_id, unit_name, multiplier, is_default)
      VALUES (?, ?, ?, ?)
    `);

    const insertLog = db.prepare(`
      INSERT INTO inventory_logs (product_id, change_amount, new_stock, reason, reference_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    productsData.forEach(p => {
      const res = insertProd.run(
        p.catId, supplier?.id || null, p.name, p.slug, p.desc, p.unitType,
        p.price, p.stock, p.grade, p.score, p.organic, p.seasonal,
        p.origin, p.farmer, p.img, p.storage, p.harvest,
        p.cal, p.carbs, p.fiber, p.vitC
      );
      const prodId = Number(res.lastInsertRowid);

      // Insert units
      p.units.forEach(u => {
        insertUnit.run(prodId, u.name, u.mult, u.isDefault);
      });

      // Initial inventory log
      insertLog.run(prodId, p.stock, p.stock, 'Initial Morning Harvest Inbound', 'BATCH-INIT-2026', supplier?.id || null);
    });

    console.log(`✓ Products (${productsData.length}) and units seeded.`);
  }

  // 5. Seed Promotional Coupons
  const existingCoupons = db.prepare('SELECT COUNT(*) as count FROM coupons').get();
  if (existingCoupons.count === 0) {
    const insertCoupon = db.prepare(`
      INSERT INTO coupons (code, discount_percent, min_order_amount)
      VALUES (?, ?, ?)
    `);
    insertCoupon.run('FRESH20', 20.0, 10.0);
    insertCoupon.run('WELCOME10', 10.0, 5.0);
    console.log('✓ Coupons seeded (FRESH20, WELCOME10).');
  }

  // 6. Seed Sample Initial Orders & History for Analytics Demonstration
  const existingOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  if (existingOrders.count === 0 && customer) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        address_text, subtotal, discount, delivery_fee, total_amount,
        payment_method, payment_status, order_status, delivery_slot, special_instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, unit_name, unit_price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHistory = db.prepare(`
      INSERT INTO order_status_history (order_id, status, note, updated_by)
      VALUES (?, ?, ?, ?)
    `);

    // Order 1 (Out for delivery)
    const order1Res = insertOrder.run(
      'FB-88219',
      customer.id,
      'Ali Shan',
      'customer@freshbasket.com',
      '+92 300 8472910',
      'House 42, Street 8, Sector Y, Phase 3, DHA, Lahore',
      14.28,
      0.0,
      2.50,
      16.78,
      'COD',
      'Pending Doorstep Payment',
      'Out for Delivery',
      'Today: 4:00 PM - 6:00 PM',
      'Please ring bell twice and leave in cool shade on door table.'
    );
    const order1Id = Number(order1Res.lastInsertRowid);

    insertItem.run(order1Id, 1, 'Honeycrisp Mountain Apples', '1 kg', 3.99, 2, 7.98);
    insertItem.run(order1Id, 7, 'Vine-Ripened Roma Tomatoes', '1 kg', 1.80, 1, 1.80);
    insertItem.run(order1Id, 12, 'Hydroponic Baby Spinach', '1 bunch', 1.95, 2, 3.90);

    insertHistory.run(order1Id, 'Confirmed', 'Order placed by customer via Cash on Delivery', customer.id);
    insertHistory.run(order1Id, 'Packing', 'Quality inspection completed, packed in insulated crate', 1);
    insertHistory.run(order1Id, 'Out for Delivery', 'Dispatched with rider Hamza Tariq', 1);

    // Order 2 (Delivered yesterday for review eligibility demonstration)
    const order2Res = insertOrder.run(
      'FB-77104',
      customer.id,
      'Ali Shan',
      'customer@freshbasket.com',
      '+92 300 8472910',
      'House 42, Street 8, Sector Y, Phase 3, DHA, Lahore',
      17.40,
      3.48, // 20% discount
      0.00, // free delivery over $15
      13.92,
      'COD',
      'Paid in Cash at Door',
      'Delivered',
      'Yesterday: 5:00 PM - 7:00 PM',
      'Call upon arrival.'
    );
    const order2Id = Number(order2Res.lastInsertRowid);

    insertItem.run(order2Id, 3, 'Royal Multani Chaunsa Mangoes', '1 kg', 5.80, 2, 11.60);
    insertItem.run(order2Id, 8, 'Crunchy Organic Carrots', '1 kg', 1.50, 2, 3.00);
    insertItem.run(order2Id, 11, 'Crisp English Cucumbers', '1 kg', 1.40, 2, 2.80);

    insertHistory.run(order2Id, 'Confirmed', 'Order placed', customer.id);
    insertHistory.run(order2Id, 'Delivered', 'Delivered safely and cash collected at door', 1);

    console.log('✓ Initial orders & fulfillment history seeded.');

    // 7. Seed Reviews for delivered products
    const insertReview = db.prepare(`
      INSERT INTO reviews (
        product_id, user_id, order_id, author_name, rating_stars, freshness_stars,
        comment_text, photo_url, seller_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertReview.run(
      1,
      customer.id,
      order1Id,
      'Ayesha Khan',
      5,
      5,
      'The crispness is out of this world! You can immediately tell they were harvested just this morning. Will never buy grocery store apples again.',
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80',
      'Thank you Ayesha! Haji Gulzar from Swat is thrilled with your feedback!'
    );

    insertReview.run(
      3,
      customer.id,
      order2Id,
      'Ali Shan (Verified)',
      5,
      5,
      'Real Multani Chaunsa without any carbide aftertaste. Delivery rider let me inspect every single mango before paying COD. Outstanding service!',
      'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80',
      'FreshBasket is proud to partner directly with Multan orchards. Glad you loved it!'
    );

    console.log('✓ Verified customer reviews seeded.');
  }

  // 8. Seed Quality Checks Log
  const existingQC = db.prepare('SELECT COUNT(*) as count FROM quality_checks').get();
  if (existingQC.count === 0) {
    const insertQC = db.prepare(`
      INSERT INTO quality_checks (product_id, inspector_id, batch_code, freshness_score, grade_assigned, harvest_date, inspection_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertQC.run(1, 1, 'BATCH-2026-APL-01', 99, 'Grade A+ (Picked Today)', 'Today, 5:30 AM', 'Skin turgidity 100%, crispness test passed, brix 14.5%');
    insertQC.run(3, 1, 'BATCH-2026-MNG-04', 100, 'Grade A+ (Peak Sweetness)', 'Today, 6:00 AM', 'Natural tree-ripened, 0% artificial carbide detected');
    insertQC.run(7, 1, 'BATCH-2026-TOM-02', 99, 'Grade A+ (Picked Today)', 'Today, 6:15 AM', 'Firm roma fruit, vibrant deep red coloration, high lycopene');
    insertQC.run(12, 1, 'BATCH-2026-SPN-01', 99, 'Grade A+ (Picked Today)', 'Today, 6:30 AM', 'Dew-fresh hydroponic leaves, ozone washed and insulated');

    console.log('✓ Farm-to-Fork Quality Checks seeded.');
  }

  console.log('🎉 Seeding completed successfully!');
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('seeds.js')) {
  runSeeds();
}
