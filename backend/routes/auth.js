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
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND status = $2',
      [username.toLowerCase(), 'active']
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Username or password incorrect' 
      });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Username or password incorrect' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 
    await pool.query(
      'INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [user.id, token, req.ip || req.connection.remoteAddress, req.headers['user-agent'] || 'Unknown', expiresAt]
    );

    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

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

// ==================== LOGOUT (REVISED) ====================
// === PERBAIKAN ===
// Kita HAPUS 'authenticateToken' middleware di sini.
// Tujuan: Mengizinkan logout meskipun token sudah expired.
// Mencegah server merespon 401 yang memicu infinite loop di frontend.
router.post('/logout', asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  try {
    // Coba verifikasi token untuk mendapatkan userId (Best Effort)
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Hapus session dari database jika token valid
        await pool.query('DELETE FROM sessions WHERE user_id = $1 OR token = $2', [decoded.userId, token]);
      } catch (jwtError) {
        // Token invalid/expired. 
        // Kita tidak bisa menghapus session spesifik di DB tanpa user ID yang valid,
        // tapi tidak apa-apa. Kita anggap user ingin keluar.
        console.log('Logout request dengan token invalid/expired.');
      }
    }
    
    // SELALU kirim sukses agar frontend tidak crash/loop
    res.json({ 
      success: true,
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Tetap kirim 200 OK meskipun error DB, agar frontend tetap menganggap logout sukses
    res.json({ 
      success: true, // Paksa sukses agar frontend tidak retry
      message: 'Logout successful (session cleared locally)' 
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: userResult.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
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
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;
  const pool = req.app.locals.pool;

  try {
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, req.user.id]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [req.user.id]);

    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}));

// ==================== VERIFY TOKEN ====================
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ success: true, valid: true, user: req.user });
});

module.exports = router;
