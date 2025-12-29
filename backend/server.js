const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'ispuser',
  password: process.env.DB_PASSWORD || 'isppass123',
  database: process.env.DB_NAME || 'ispbilling'
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Dashboard Statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalCustomers = await pool.query('SELECT COUNT(*) FROM customers WHERE status = $1', ['active']);
    const totalRevenue = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)');
    const pendingInvoices = await pool.query('SELECT COUNT(*) FROM invoices WHERE status = $1', ['unpaid']);
    const totalPackages = await pool.query('SELECT COUNT(*) FROM packages WHERE status = $1', ['active']);

    res.json({
      totalCustomers: parseInt(totalCustomers.rows[0].count),
      monthlyRevenue: parseFloat(totalRevenue.rows[0].total),
      pendingInvoices: parseInt(pendingInvoices.rows[0].count),
      totalPackages: parseInt(totalPackages.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revenue Chart Data (Last 6 months)
app.get('/api/dashboard/revenue-chart', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(payment_date, 'Month YYYY') as month,
        SUM(amount) as revenue
      FROM payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(payment_date, 'Month YYYY'), DATE_TRUNC('month', payment_date)
      ORDER BY DATE_TRUNC('month', payment_date)
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer Growth Chart
app.get('/api/dashboard/customer-growth', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Package Distribution
app.get('/api/dashboard/package-distribution', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.name,
        COUNT(s.id) as count
      FROM packages p
      LEFT JOIN subscriptions s ON p.id = s.package_id AND s.status = 'active'
      GROUP BY p.name
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customers CRUD
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, email, phone, address, installation_address } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (name, email, phone, address, installation_address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, address, installation_address]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE customers SET name=$1, email=$2, phone=$3, address=$4, status=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *',
      [name, email, phone, address, status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM customers WHERE id=$1', [id]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Packages CRUD
app.get('/api/packages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM packages ORDER BY price');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/packages', async (req, res) => {
  const { name, speed, price, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO packages (name, speed, price, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, speed, price, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, c.name as customer_name, c.email
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payments
app.get('/api/payments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, i.invoice_number, c.name as customer_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      ORDER BY p.payment_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  const { invoice_id, amount, payment_method, notes } = req.body;
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
    res.status(201).json(payment.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
