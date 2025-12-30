const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper untuk async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== LOGIN ====================
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
  // Validasi input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }

  const { username, password } = req.body;
  const pool = req.app.locals.pool;

  try {
    // Cari user berdasarkan username
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND status = $2',
      [username.toLowerCase(), 'active']
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Username or password is incorrect' 
      });
    }

    const user = userResult.rows[0];

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Username or password is incorrect' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Simpan session ke database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam
    await pool.query(
      'INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [
        user.id, 
        token, 
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || 'Unknown',
        expiresAt
      ]
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Return user data dan token
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: 'Internal server error' 
    });
  }
}));

// ==================== LOGOUT ====================
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  try {
    // Hapus session dari database
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    
    res.json({ 
      success: true,
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      message: 'Internal server error' 
    });
  }
}));

// ==================== GET CURRENT USER ====================
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    const userResult = await pool.query(
      'SELECT id, username, email, full_name, role, status, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: userResult.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user data',
      message: 'Internal server error' 
    });
  }
}));

// ==================== CHANGE PASSWORD ====================
router.post('/change-password', [
  authenticateToken,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }

  const { currentPassword, newPassword } = req.body;
  const pool = req.app.locals.pool;

  try {
    // Get current user
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid current password' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    // Delete all sessions (force re-login)
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [req.user.id]);

    res.json({ 
      success: true,
      message: 'Password changed successfully. Please login again.' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      message: 'Internal server error' 
    });
  }
}));

// ==================== VERIFY TOKEN ====================
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true,
    valid: true,
    user: req.user 
  });
});

module.exports = router;
