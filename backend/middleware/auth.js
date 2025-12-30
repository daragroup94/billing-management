const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'ispuser',
  password: process.env.DB_PASSWORD || 'isppass123',
  database: process.env.DB_NAME || 'ispbilling',
});

const JWT_SECRET = process.env.JWT_SECRET || 'daragroup1994_secret_key_change_in_production';

// Middleware untuk verifikasi token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No token provided' 
      });
    }

    // Verifikasi token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Cek apakah session masih valid di database
    const sessionCheck = await pool.query(
      'SELECT s.*, u.username, u.email, u.role, u.status FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > NOW() AND u.status = $2',
      [token, 'active']
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'Session expired or invalid' 
      });
    }

    // Attach user info ke request
    req.user = {
      id: decoded.userId,
      username: sessionCheck.rows[0].username,
      email: sessionCheck.rows[0].email,
      role: sessionCheck.rows[0].role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Token is not valid' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Token expired',
        message: 'Please login again' 
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error' 
    });
  }
};

// Middleware untuk cek role admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      error: 'Access forbidden',
      message: 'Admin access required' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET
};
