const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper untuk async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== GET ALL SETTINGS ====================
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  
  try {
    const result = await pool.query(
      'SELECT setting_key, setting_value, setting_type, updated_at FROM settings WHERE user_id = $1',
      [req.user.id]
    );
    
    // Transform array menjadi object untuk kemudahan akses
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        updated_at: row.updated_at
      };
    });
    
    res.json({ 
      success: true, 
      settings 
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ 
      error: 'Failed to get settings',
      message: error.message 
    });
  }
}));

// ==================== GET SPECIFIC SETTING ====================
router.get('/:key', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  const { key } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT setting_key, setting_value, setting_type, updated_at FROM settings WHERE user_id = $1 AND setting_key = $2',
      [req.user.id, key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Setting not found' 
      });
    }
    
    res.json({ 
      success: true, 
      setting: {
        key: result.rows[0].setting_key,
        value: result.rows[0].setting_value,
        type: result.rows[0].setting_type,
        updated_at: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ 
      error: 'Failed to get setting',
      message: error.message 
    });
  }
}));

// ==================== UPDATE/CREATE SETTING ====================
router.put('/:key', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  const { key } = req.params;
  const { value, type } = req.body;
  
  if (!value || !type) {
    return res.status(400).json({ 
      error: 'Value and type are required' 
    });
  }
  
  try {
    // Coba update dulu, kalau tidak ada baru insert (UPSERT)
    const result = await pool.query(
      `INSERT INTO settings (user_id, setting_key, setting_value, setting_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, setting_key) 
       DO UPDATE SET 
         setting_value = EXCLUDED.setting_value,
         setting_type = EXCLUDED.setting_type,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, key, JSON.stringify(value), type]
    );
    
    res.json({ 
      success: true, 
      message: 'Setting saved successfully',
      setting: {
        key: result.rows[0].setting_key,
        value: result.rows[0].setting_value,
        type: result.rows[0].setting_type,
        updated_at: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ 
      error: 'Failed to save setting',
      message: error.message 
    });
  }
}));

// ==================== DELETE SETTING ====================
router.delete('/:key', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  const { key } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM settings WHERE user_id = $1 AND setting_key = $2 RETURNING setting_key',
      [req.user.id, key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Setting not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Setting deleted successfully' 
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ 
      error: 'Failed to delete setting',
      message: error.message 
    });
  }
}));

// ==================== RESET TO DEFAULTS ====================
router.post('/reset', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  
  const defaultSettings = {
    general_settings: {
      companyName: 'ISP Billing Co.',
      companyEmail: 'admin@ispbilling.com',
      companyPhone: '+62 812 3456 7890',
      companyAddress: 'Jl. Teknologi No. 123, Jakarta',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      language: 'id',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    notification_settings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      overdueReminders: true,
      paymentConfirmations: true,
      newCustomerAlerts: true,
      invoiceGeneration: true,
      systemUpdates: false
    },
    backup_settings: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupTime: '02:00',
      dataRetention: 365,
      includeAttachments: true,
      compressBackups: true
    }
  };
  
  try {
    // Hapus semua settings user
    await pool.query('DELETE FROM settings WHERE user_id = $1', [req.user.id]);
    
    // Insert default settings
    for (const [key, value] of Object.entries(defaultSettings)) {
      const type = key.replace('_settings', '');
      await pool.query(
        'INSERT INTO settings (user_id, setting_key, setting_value, setting_type) VALUES ($1, $2, $3, $4)',
        [req.user.id, key, JSON.stringify(value), type]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Settings reset to defaults successfully',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ 
      error: 'Failed to reset settings',
      message: error.message 
    });
  }
}));

// ==================== EXPORT SETTINGS (BACKUP) ====================
router.get('/export/backup', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  
  try {
    const result = await pool.query(
      'SELECT setting_key, setting_value, setting_type FROM settings WHERE user_id = $1',
      [req.user.id]
    );
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      user: {
        username: req.user.username,
        email: req.user.email
      },
      settings: {}
    };
    
    result.rows.forEach(row => {
      backupData.settings[row.setting_key] = row.setting_value;
    });
    
    res.json({ 
      success: true, 
      backup: backupData 
    });
  } catch (error) {
    console.error('Export settings error:', error);
    res.status(500).json({ 
      error: 'Failed to export settings',
      message: error.message 
    });
  }
}));

// ==================== IMPORT SETTINGS (RESTORE) ====================
router.post('/import/restore', authenticateToken, asyncHandler(async (req, res) => {
  const pool = req.app.locals.pool;
  const { backup } = req.body;
  
  if (!backup || !backup.settings) {
    return res.status(400).json({ 
      error: 'Invalid backup data' 
    });
  }
  
  try {
    // Hapus settings lama
    await pool.query('DELETE FROM settings WHERE user_id = $1', [req.user.id]);
    
    // Insert settings dari backup
    for (const [key, value] of Object.entries(backup.settings)) {
      const type = key.replace('_settings', '');
      await pool.query(
        'INSERT INTO settings (user_id, setting_key, setting_value, setting_type) VALUES ($1, $2, $3, $4)',
        [req.user.id, key, JSON.stringify(value), type]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Settings restored successfully' 
    });
  } catch (error) {
    console.error('Import settings error:', error);
    res.status(500).json({ 
      error: 'Failed to restore settings',
      message: error.message 
    });
  }
}));

module.exports = router;
