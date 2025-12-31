const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { generateMonthlyInvoices } = require('./utils/invoice-generator');

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

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

// CORS configuration
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

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling helper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Import middleware
const { authenticateToken, requireAdmin } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ISP Billing API',
    version: '2.2.0'
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

// ==================== AUTH ROUTES ====================
app.use('/api/auth', authLimiter, authRoutes);

// ==================== SETTINGS ROUTES ====================
app.use('/api/settings', authenticateToken, settingsRoutes);

// ==================== DASHBOARD ====================
app.get('/api/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  const [
    totalCustomers,
    totalRevenue,
    pendingInvoices,
    overdueInvoices,
    totalPackages
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM customers WHERE status = $1', ['active']),
    pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `),
    pool.query('SELECT COUNT(*) FROM invoices WHERE status = $1', ['unpaid']),
    pool.query(`
      SELECT COUNT(*) 
      FROM invoices 
      WHERE status = 'unpaid' AND due_date < CURRENT_DATE
    `),
    pool.query('SELECT COUNT(*) FROM packages WHERE status = $1', ['active'])
  ]);

  res.json({
    totalCustomers: parseInt(totalCustomers.rows[0].count),
    monthlyRevenue: parseFloat(totalRevenue.rows[0].total),
    pendingInvoices: parseInt(pendingInvoices.rows[0].count),
    overdueInvoices: parseInt(overdueInvoices.rows[0].count),
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

// ==================== OVERDUE INVOICES ====================
app.get('/api/invoices/overdue', authenticateToken, asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT 
      i.id,
      i.invoice_number,
      i.amount,
      i.due_date,
      i.status,
      c.id AS customer_id,
      c.name AS customer_name,
      c.email,
      c.phone,
      p.name AS package_name,
      (CURRENT_DATE - i.due_date) AS days_overdue
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    LEFT JOIN subscriptions s ON i.subscription_id = s.id
    LEFT JOIN packages p ON s.package_id = p.id
    WHERE i.status = 'unpaid'
      AND i.due_date < CURRENT_DATE
      AND c.status = 'active'
    ORDER BY i.due_date ASC
  `);

  res.json({
    success: true,
    count: result.rows.length,
    data: result.rows
  });
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
    'INSERT INTO customers (name, email, phone, address, installation_address, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, email, phone, address, installation_address, 'active']
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

// ==================== CREATE CUSTOMER WITH SUBSCRIPTION ====================
app.post('/api/customers/with-subscription', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    name, email, phone, address, installation_address,
    package_id, installation_date, payment_due_day 
  } = req.body;

  if (!name || !email || !package_id) {
    return res.status(400).json({ 
      error: 'Name, email, and package_id are required' 
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Buat customer
    const customerResult = await client.query(
      `INSERT INTO customers (name, email, phone, address, installation_address, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
      [name, email, phone, address || null, installation_address || null]
    );

    const customerId = customerResult.rows[0].id;

    // 2. Buat subscription
    const startDate = installation_date || new Date().toISOString().split('T')[0];
    const dueDay = payment_due_day || 1;

    const subscriptionResult = await client.query(
      `INSERT INTO subscriptions (customer_id, package_id, start_date, payment_due_day, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
      [customerId, package_id, startDate, dueDay]
    );

    const subscriptionId = subscriptionResult.rows[0].id;

    // ===================================================================
    // LOGIKA DUE DATE: Generate invoice untuk bulan SETELAH installation
    // ===================================================================
    // Contoh:
    // - Install 2 Okt 2025, due_day=1 → Invoice jatuh tempo 1 Nov 2025
    // - Install 2 Okt 2025, due_day=15 → Invoice jatuh tempo 15 Nov 2025
    // - Install 15 Des 2025, due_day=1 → Invoice jatuh tempo 1 Jan 2026
    // ===================================================================
    
    const installDate = new Date(startDate);
    const installMonth = installDate.getMonth();
    const installYear = installDate.getFullYear();
    
    // Due date = bulan berikutnya setelah install, di tanggal due_day
    let dueMonth = installMonth + 1;
    let dueYear = installYear;
    
    // Handle year rollover (Dec → Jan)
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear++;
    }
    
    // Set due date
    const dueDate = new Date(dueYear, dueMonth, dueDay);
    
    // Pastikan due_day tidak melebihi akhir bulan (misal Feb hanya 28/29 hari)
    if (dueDate.getMonth() !== dueMonth) {
      // Jika overflow ke bulan berikutnya, set ke hari terakhir bulan sebelumnya
      dueDate.setDate(0); // Mundur ke akhir bulan sebelumnya
    }

    // Update next_due_date di subscription
    await client.query(
      `UPDATE subscriptions SET next_due_date = $1 WHERE id = $2`,
      [dueDate.toISOString().split('T')[0], subscriptionId]
    );

    // 4. Ambil harga paket
    const packageResult = await client.query(
      'SELECT price FROM packages WHERE id = $1 AND status = $2',
      [package_id, 'active']
    );

    if (packageResult.rows.length === 0) {
      throw new Error('Package not found or inactive');
    }

    const amount = packageResult.rows[0].price;

    // 5. Buat invoice pertama
    const invoiceNumber = `INV-${dueYear}${String(dueMonth + 1).padStart(2, '0')}-${String(customerId).padStart(5, '0')}`;

    await client.query(
      `INSERT INTO invoices (customer_id, subscription_id, invoice_number, amount, due_date, status)
       VALUES ($1, $2, $3, $4, $5, 'unpaid')`,
      [customerId, subscriptionId, invoiceNumber, amount, dueDate.toISOString().split('T')[0]]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Customer created with subscription and first invoice',
      data: {
        customer: customerResult.rows[0],
        subscription: subscriptionResult.rows[0]
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating customer with subscription:', error);
    throw error;
  } finally {
    client.release();
  }
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
    'INSERT INTO packages (name, speed, price, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, speed, price, description, 'active']
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

// ================================================
// UPDATE: backend/server.js - Invoice Routes with Discount
// Tambahkan/replace bagian INVOICES ROUTES
// ================================================

// ==================== INVOICES (WITH DISCOUNT SUPPORT) ====================
app.get('/api/invoices', authenticateToken, asyncHandler(async (req, res) => {
  const { status, customer_id, limit = 100, offset = 0 } = req.query;
 
  let query = `
    SELECT i.*,
           c.name as customer_name,
           c.email,
           c.phone as customer_phone,
           c.address as customer_address,
           p.name as package_name,
           p.speed as package_speed
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
  const { 
    customer_id, 
    package_id, 
    invoice_number, 
    amount, 
    due_date,
    discount = 0,
    discount_note = ''
  } = req.body;
 
  if (!customer_id || !package_id || !invoice_number || !amount || !due_date) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Calculate final amount after discount
  const finalAmount = parseFloat(amount) - parseFloat(discount);
  
  if (finalAmount < 0) {
    return res.status(400).json({ error: 'Discount cannot exceed invoice amount' });
  }
  
  const client = await pool.connect();
 
  try {
    await client.query('BEGIN');
   
    // Check/Create subscription
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
   
    // Create invoice with discount
    const invoice = await client.query(
      `INSERT INTO invoices (
        customer_id, 
        subscription_id, 
        invoice_number, 
        amount, 
        discount,
        discount_note,
        final_amount,
        due_date, 
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        customer_id, 
        subscription_id, 
        invoice_number, 
        amount, 
        discount,
        discount_note,
        finalAmount,
        due_date, 
        'unpaid'
      ]
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

// ==================== UPDATE INVOICE (with discount) ====================
app.put('/api/invoices/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    amount, 
    discount = 0, 
    discount_note, 
    due_date,
    status 
  } = req.body;

  // Calculate final amount
  const finalAmount = parseFloat(amount) - parseFloat(discount);
  
  if (finalAmount < 0) {
    return res.status(400).json({ error: 'Discount cannot exceed invoice amount' });
  }

  const result = await pool.query(
    `UPDATE invoices 
     SET amount = $1, 
         discount = $2, 
         discount_note = $3,
         final_amount = $4,
         due_date = $5,
         status = $6
     WHERE id = $7 
     RETURNING *`,
    [amount, discount, discount_note, finalAmount, due_date, status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  res.json({
    message: 'Invoice updated successfully',
    data: result.rows[0]
  });
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
      'INSERT INTO payments (invoice_id, amount, payment_method, notes, payment_date) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *',
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

      const hashedPassword = await bcrypt.hash('daragroup1994', 10);
      console.log('🔐 Generated password hash:', hashedPassword);
      
      await client.query(`
        INSERT INTO users (username, password, email, full_name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin', hashedPassword, 'admin@ispbilling.com', 'Administrator', 'admin', 'active']);
      
      console.log('✅ Database initialized successfully!');
      console.log('👤 Admin user created: Username: admin | Password: daragroup1994');
    } else {
      console.log('✅ Database tables already exist');
     
      const adminCheck = await client.query('SELECT username FROM users WHERE username = $1', ['admin']);
      if (adminCheck.rows.length === 0) {
        console.log('⚠️ Admin user not found, recreating...');
        const hashedPassword = await bcrypt.hash('daragroup1994', 10);
        await client.query(`
          INSERT INTO users (username, password, email, full_name, role, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['admin', hashedPassword, 'admin@ispbilling.com', 'Administrator', 'admin', 'active']);
        console.log('✅ Admin user recreated');
      } else {
        console.log('✅ Admin user verified');
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
║ 🚀 ISP Billing API Server v2.1 (with Overdue & Quick Customer) ║
║ 📡 Running on: http://localhost:${PORT} ║
║ 🌍 Environment: ${process.env.NODE_ENV || 'development'} ║
║ 💾 Database: ${process.env.DB_NAME || 'ispbilling'} ║
║ 🔐 Authentication: Enabled ║
║ ⏰ Started: ${new Date().toISOString()} ║
╚═══════════════════════════════════════════════════════╝
  `);
 
  await initializeDatabase();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end();
  process.exit(0);
});
