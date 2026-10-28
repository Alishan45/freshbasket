import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { signToken } from '../middleware/auth.js';

export async function register(req, res) {
  try {
    const { full_name, email, password, phone_number, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailNorm);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const userRole = role === 'supplier' ? 'supplier' : 'customer';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insert = db.prepare(`
      INSERT INTO users (full_name, email, password_hash, phone_number, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insert.run(full_name.trim(), emailNorm, passwordHash, phone_number || null, userRole);
    const userId = Number(result.lastInsertRowid);

    const newUser = db.prepare('SELECT id, full_name, email, phone_number, role FROM users WHERE id = ?').get(userId);
    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailNorm);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid email credentials or inactive account.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password credentials.' });
    }

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role
    };

    const token = signToken(safeUser);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

export function getCurrentUser(req, res) {
  const user = db.prepare('SELECT id, full_name, email, phone_number, role, created_at FROM users WHERE id = ?').get(req.user.id);
  const addressesCount = db.prepare('SELECT COUNT(*) as count FROM addresses WHERE user_id = ?').get(req.user.id).count;
  const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(req.user.id).count;

  return res.json({
    success: true,
    user: {
      ...user,
      addressesCount,
      ordersCount
    }
  });
}

export function updateProfile(req, res) {
  try {
    const { full_name, phone_number } = req.body;
    if (!full_name) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    db.prepare(`
      UPDATE users
      SET full_name = ?, phone_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(full_name.trim(), phone_number || null, req.user.id);

    const updatedUser = db.prepare('SELECT id, full_name, email, phone_number, role FROM users WHERE id = ?').get(req.user.id);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

// User Addresses CRUD
export function getAddresses(req, res) {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
  return res.json({ success: true, addresses });
}

export function createAddress(req, res) {
  try {
    const { label, street_address, area, city, phone, is_default } = req.body;

    if (!street_address || !phone) {
      return res.status(400).json({ success: false, message: 'Street address and contact phone are required.' });
    }

    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    const insert = db.prepare(`
      INSERT INTO addresses (user_id, label, street_address, area, city, phone, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      req.user.id,
      label || 'Home',
      street_address.trim(),
      area ? area.trim() : null,
      city || 'Lahore',
      phone.trim(),
      is_default ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM addresses WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ success: true, address: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to save address.' });
  }
}

export function deleteAddress(req, res) {
  try {
    const addressId = req.params.id;
    const addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(addressId, req.user.id);
    if (!addr) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }

    db.prepare('DELETE FROM addresses WHERE id = ?').run(addressId);
    return res.json({ success: true, message: 'Address removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
}

export function setDefaultAddress(req, res) {
  try {
    const addressId = req.params.id;
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?').run(addressId, req.user.id);
    return res.json({ success: true, message: 'Default address updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update default address.' });
  }
}
