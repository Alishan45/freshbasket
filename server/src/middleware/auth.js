import jwt from 'jsonwebtoken';
import { db } from '../db/connection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'freshbasket_super_secure_jwt_secret_2026';

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }

  // Fetch fresh user from DB
  const user = db.prepare('SELECT id, full_name, email, phone_number, role, is_active FROM users WHERE id = ?').get(decoded.id);
  if (!user || !user.is_active) {
    return res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const user = db.prepare('SELECT id, full_name, email, phone_number, role, is_active FROM users WHERE id = ?').get(decoded.id);
      if (user && user.is_active) {
        req.user = user;
      }
    }
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires ${roles.join(' or ')} privileges.`
      });
    }
    next();
  };
}
