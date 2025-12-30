const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'ispuser',
  password: process.env.DB_PASSWORD || 'isppass123',
  database: process.env.DB_NAME || 'ispbilling',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Make pool available to routes
app.locals.pool = pool;

// Security middleware
app.use(helmet());

// Rate limiting - RELAXED untuk development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 untuk dev
  message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

// Auth rate limit - LEBIH RELAXED
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 100 untuk dev
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true // Skip counting untuk login sukses
});

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // For development
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Import middleware
const { authenticateToken, requireAdmin } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ISP Billing API',
    version: '2.0.0'
  });
});

// Database health check
app.get('/health/db', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.json({ 
    status: 'OK', 
    timestamp: result.rows[0].now,
    database: 'Connected'
  });
}));

// ==================== AUTH ROUTES (PUBLIC) ====================
app.use('/api/auth', authLimiter, authRoutes);

// ==================== PROTECTED ROUTES ====================

// ==================== DASHBOARD ====================
app.get('/api/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  const [totalCustomers, totalRevenue, pendingInvoices, totalPackages] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM customers WHERE status = $1', ['active']),
    pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)'),
    pool.query('SELECT COUNT(*) FROM invoices WHERE status = $1', ['unpaid']),
    pool.query('SELECT COUNT(*) FROM packages WHERE status = $1', ['active'])
  ]);

  res.json({
    totalCustomers: parseInt(totalCustomers.rows[0].count),
    monthlyRevenue: parseFloat(totalRevenue.rows[0].total),
    pendingInvoices: parseInt(pendingInvoices.rows[0].count),
    totalPackages: parseInt(totalPackages.rows[0].count)
  });
}));

app.get('/api/dashboard/revenue-chart', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(payment_date, 'Mon YYYY') as month,
      SUM(amount) as revenue,
      COUNT(*) as count
    FROM payments
    WHERE payment_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(payment_date, 'Mon YYYY'), DATE_TRUNC('month', payment_date)
    ORDER BY DATE_TRUNC('month', payment_date)
  `);
  res.json(result.rows);
}));

app.get('/api/dashboard/customer-growth', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(created_at, 'Mon YY') as month,
      COUNT(*) as customers
    FROM customers
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(created_at, 'Mon YY'), DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at)
  `);
  res.json(result.rows);
}));

app.get('/api/dashboard/package-distribution', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      p.name,
      p.speed,
      COUNT(s.id) as count,
      COALESCE(SUM(p.price), 0) as total_value
    FROM packages p
    LEFT JOIN subscriptions s ON p.id = s.package_id AND s.status = 'active'
    GROUP BY p.id, p.name, p.speed
    ORDER BY count DESC
  `);
  res.json(result.rows);
}));

app.get('/api/dashboard/recent-activity', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    (SELECT 
      'payment' as type,
      c.name as customer_name,
      p.amount,
      p.payment_date as date,
      pm.payment_method
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    JOIN customers c ON i.customer_id = c.id
    LEFT JOIN (
      SELECT invoice_id, payment_method FROM payments
    ) pm ON p.invoice_id = pm.invoice_id
    ORDER BY p.payment_date DESC
    LIMIT 5)
    UNION ALL
    (SELECT 
      'customer' as type,
      name as customer_name,
      0 as amount,
      created_at as date,
      status as payment_method
    FROM customers
    ORDER BY created_at DESC
    LIMIT 5)
    ORDER BY date DESC
    LIMIT 10
  `);
  res.json(result.rows);
}));

// ==================== CUSTOMERS CRUD ====================
app.get('/api/customers', authenticateToken, asyncHandler(async (req, res) => {
  const { search, status, limit = 100, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM customers WHERE 1=1';
  let params = [];
  let paramCount = 1;

  if (search) {
    query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  if (status) {
    query += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  const countResult = await pool.query('SELECT COUNT(*) FROM customers WHERE 1=1');
  
  res.json({
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
}));

app.post('/api/customers', authenticateToken, asyncHandler(async (req, res) => {
  const { name, email, phone, address, installation_address } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const result = await pool.query(
    'INSERT INTO customers (name, email, phone, address, installation_address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, email, phone, address, installation_address]
  );
  
  res.status(201).json({ 
    message: 'Customer created successfully',
    data: result.rows[0] 
  });
}));

app.put('/api/customers/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, installation_address, status } = req.body;
  
  const result = await pool.query(
    `UPDATE customers 
     SET name=$1, email=$2, phone=$3, address=$4, installation_address=$5, status=$6, updated_at=CURRENT_TIMESTAMP 
     WHERE id=$7 
     RETURNING *`,
    [name, email, phone, address, installation_address, status, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  res.json({ 
    message: 'Customer updated successfully',
    data: result.rows[0] 
  });
}));

app.delete('/api/customers/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query('DELETE FROM customers WHERE id=$1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  res.json({ 
    message: 'Customer deleted successfully',
    id: result.rows[0].id 
  });
}));

// ==================== PACKAGES CRUD ====================
app.get('/api/packages', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, 
           COUNT(s.id) as subscriber_count
    FROM packages p
    LEFT JOIN subscriptions s ON p.id = s.package_id AND s.status = 'active'
    GROUP BY p.id
    ORDER BY p.price
  `);
  res.json(result.rows);
}));

app.post('/api/packages', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { name, speed, price, description } = req.body;
  
  if (!name || !speed || !price) {
    return res.status(400).json({ error: 'Name, speed, and price are required' });
  }
  
  const result = await pool.query(
    'INSERT INTO packages (name, speed, price, description) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, speed, price, description]
  );
  
  res.status(201).json({ 
    message: 'Package created successfully',
    data: result.rows[0] 
  });
}));

app.put('/api/packages/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, speed, price, description, status } = req.body;
  
  const result = await pool.query(
    'UPDATE packages SET name=$1, speed=$2, price=$3, description=$4, status=$5 WHERE id=$6 RETURNING *',
    [name, speed, price, description, status, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Package not found' });
  }
  
  res.json({ 
    message: 'Package updated successfully',
    data: result.rows[0] 
  });
}));

app.delete('/api/packages/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query('DELETE FROM packages WHERE id=$1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Package not found' });
  }
  
  res.json({ 
    message: 'Package deleted successfully',
    id: result.rows[0].id 
  });
}));

// ==================== INVOICES ====================
app.get('/api/invoices', authenticateToken, asyncHandler(async (req, res) => {
  const { status, customer_id, limit = 100, offset = 0 } = req.query;
  
  let query = `
    SELECT i.*, 
           c.name as customer_name, 
           c.email,
           p.name as package_name
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    LEFT JOIN subscriptions s ON i.subscription_id = s.id
    LEFT JOIN packages p ON s.package_id = p.id
    WHERE 1=1
  `;
  
  let params = [];
  let paramCount = 1;

  if (status) {
    query += ` AND i.status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (customer_id) {
    query += ` AND i.customer_id = $${paramCount}`;
    params.push(customer_id);
    paramCount++;
  }

  query += ` ORDER BY i.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  res.json(result.rows);
}));

app.post('/api/invoices/create', authenticateToken, asyncHandler(async (req, res) => {
  const { customer_id, package_id, invoice_number, amount, due_date } = req.body;
  
  if (!customer_id || !package_id || !invoice_number || !amount || !due_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let subscription = await client.query(
      'SELECT id FROM subscriptions WHERE customer_id = $1 AND package_id = $2 AND status = $3',
      [customer_id, package_id, 'active']
    );
    
    let subscription_id;
    if (subscription.rows.length === 0) {
      const newSub = await client.query(
        'INSERT INTO subscriptions (customer_id, package_id, start_date, status) VALUES ($1, $2, CURRENT_DATE, $3) RETURNING id',
        [customer_id, package_id, 'active']
      );
      subscription_id = newSub.rows[0].id;
    } else {
      subscription_id = subscription.rows[0].id;
    }
    
    const invoice = await client.query(
      'INSERT INTO invoices (customer_id, subscription_id, invoice_number, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [customer_id, subscription_id, invoice_number, amount, due_date, 'unpaid']
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Invoice created successfully',
      data: invoice.rows[0] 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.put('/api/invoices/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const result = await pool.query(
    'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  res.json({ 
    message: 'Invoice status updated successfully',
    data: result.rows[0] 
  });
}));

app.delete('/api/invoices/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query('DELETE FROM invoices WHERE id=$1 RETURNING id', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  res.json({ 
    message: 'Invoice deleted successfully',
    id: result.rows[0].id 
  });
}));

// ==================== PAYMENTS ====================
app.get('/api/payments', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, 
           i.invoice_number, 
           c.name as customer_name,
           c.email as customer_email
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    JOIN customers c ON i.customer_id = c.id
    ORDER BY p.payment_date DESC
  `);
  res.json(result.rows);
}));

app.post('/api/payments', authenticateToken, asyncHandler(async (req, res) => {
  const { invoice_id, amount, payment_method, notes } = req.body;
  
  if (!invoice_id || !amount || !payment_method) {
    return res.status(400).json({ error: 'Invoice ID, amount, and payment method are required' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const payment = await client.query(
      'INSERT INTO payments (invoice_id, amount, payment_method, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [invoice_id, amount, payment_method, notes]
    );
    
    await client.query(
      'UPDATE invoices SET status = $1 WHERE id = $2',
      ['paid', invoice_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Payment recorded successfully',
      data: payment.rows[0] 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== INITIALIZE DATABASE ====================
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('🔧 Creating users table...');
      
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user',
          status VARCHAR(50) DEFAULT 'active',
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(500) UNIQUE NOT NULL,
          ip_address VARCHAR(50),
          user_agent TEXT,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query('CREATE INDEX idx_sessions_token ON sessions(token);');
      await client.query('CREATE INDEX idx_sessions_user_id ON sessions(user_id);');
      await client.query('CREATE INDEX idx_users_username ON users(username);');
      await client.query('CREATE INDEX idx_users_email ON users(email);');

      // Hash password: daragroup1994
      const hashedPassword = await bcrypt.hash('daragroup1994', 10);
      console.log('🔐 Generated password hash:', hashedPassword);

      await client.query(`
        INSERT INTO users (username, password, email, full_name, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin', hashedPassword, 'admin@ispbilling.com', 'Administrator', 'admin', 'active']);

      console.log('✅ Database initialized successfully!');
      console.log('👤 Admin user created:');
      console.log('   Username: admin');
      console.log('   Password: daragroup1994');
    } else {
      console.log('✅ Database tables already exist');
      
      // Verify admin user exists
      const adminCheck = await client.query('SELECT username FROM users WHERE username = $1', ['admin']);
      if (adminCheck.rows.length > 0) {
        console.log('✅ Admin user verified');
      } else {
        console.log('⚠️  Admin user not found, recreating...');
        const hashedPassword = await bcrypt.hash('daragroup1994', 10);
        await client.query(`
          INSERT INTO users (username, password, email, full_name, role, status) 
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password
        `, ['admin', hashedPassword, 'admin@ispbilling.com', 'Administrator', 'admin', 'active']);
        console.log('✅ Admin user recreated');
      }
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  } finally {
    client.release();
  }
}

// ==================== START SERVER ====================
app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  🚀 ISP Billing API Server v2.0 with Auth           ║
║  📡 Running on: http://localhost:${PORT}                ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}              ║
║  💾 Database: ${process.env.DB_NAME || 'ispbilling'}                  ║
║  🔐 Authentication: Enabled                          ║
║  ⏰ Started: ${new Date().toISOString()}              ║
╚═══════════════════════════════════════════════════════╝
  `);
  
  await initializeDatabase();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end();
  process.exit(0);
});
