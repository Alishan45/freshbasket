import { db } from '../db/connection.js';

export function checkReviewEligibility(req, res) {
  try {
    const { productId } = req.params;

    // Check if user has an order with status 'Delivered' containing this product
    const eligibleOrder = db.prepare(`
      SELECT o.id as order_id, o.order_number
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'Delivered'
      ORDER BY o.id DESC
      LIMIT 1
    `).get(req.user.id, productId);

    const alreadyReviewed = db.prepare(`
      SELECT id FROM reviews WHERE user_id = ? AND product_id = ?
    `).get(req.user.id, productId);

    return res.json({
      success: true,
      eligible: !alreadyReviewed,
      hasDeliveredOrder: !!eligibleOrder,
      isVerifiedBuyer: !!eligibleOrder,
      alreadyReviewed: !!alreadyReviewed,
      order_id: eligibleOrder?.order_id || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to verify review eligibility.' });
  }
}

export function createReview(req, res) {
  try {
    const { product_id, rating_stars, freshness_stars, comment_text, photo_url } = req.body;

    if (!product_id || !rating_stars || !comment_text) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
    }

    const rating = parseInt(rating_stars);
    const freshRating = parseInt(freshness_stars || rating_stars || 5);
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Ratings must be between 1 and 5 stars.' });
    }

    // Check if user has an eligible delivered order for verification badge
    const eligibleOrder = db.prepare(`
      SELECT o.id as order_id
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'Delivered'
      LIMIT 1
    `).get(req.user.id, product_id);

    // Check duplicate
    const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this produce item.' });
    }

    const insert = db.prepare(`
      INSERT INTO reviews (
        product_id, user_id, order_id, author_name, rating_stars, freshness_stars,
        comment_text, photo_url, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = insert.run(
      product_id,
      req.user.id,
      eligibleOrder?.order_id || null,
      req.user.full_name,
      rating,
      freshRating,
      comment_text.trim(),
      photo_url || null
    );

    const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({
      success: true,
      message: 'Thank you! Your doorstep review has been published.',
      review: created
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ success: false, message: 'Failed to publish review.' });
  }
}

export function adminListReviews(req, res) {
  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.image_url as product_image
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.id DESC
    `).all();

    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews.' });
  }
}

export function adminModerateReview(req, res) {
  try {
    const { id } = req.params;
    const { is_approved, seller_response } = req.body;

    if (seller_response !== undefined) {
      db.prepare('UPDATE reviews SET seller_response = ? WHERE id = ?').run(seller_response ? seller_response.trim() : null, id);
    }

    if (is_approved !== undefined) {
      db.prepare('UPDATE reviews SET is_approved = ? WHERE id = ?').run(is_approved ? 1 : 0, id);
    }

    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Review updated successfully.', review: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to moderate review.' });
  }
}
