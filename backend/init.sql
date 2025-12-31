-- ================================================
-- ISP BILLING DATABASE SCHEMA - COMPLETE WITH DISCOUNT SUPPORT
-- Version: 2.1.0
-- Date: 2025-01-02
-- ================================================

-- ================================================
-- CUSTOMERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    installation_address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PACKAGES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    speed VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- SUBSCRIPTIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    package_id INTEGER REFERENCES packages(id),
    start_date DATE NOT NULL,
    end_date DATE,
    payment_due_day INTEGER DEFAULT 1 CHECK (payment_due_day >= 1 AND payment_due_day <= 31),
    next_due_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- INVOICES TABLE (WITH DISCOUNT SUPPORT)
-- ================================================
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0 NOT NULL CHECK (discount >= 0),
    discount_note VARCHAR(255),
    final_amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comment to discount columns
COMMENT ON COLUMN invoices.discount IS 'Discount amount in IDR (e.g., fee sales, promo)';
COMMENT ON COLUMN invoices.discount_note IS 'Reason for discount (e.g., Fee Sales, Promo Ramadan)';
COMMENT ON COLUMN invoices.final_amount IS 'Final amount after discount = amount - discount';

-- ================================================
-- PAYMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- ================================================
-- USERS TABLE (Authentication)
-- ================================================
CREATE TABLE IF NOT EXISTS users (
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

-- ================================================
-- SESSIONS TABLE (Login Tracking)
-- ================================================
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- SETTINGS TABLE (System Configuration)
-- ================================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_type ON settings(setting_type);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_discount ON invoices(discount);
CREATE INDEX IF NOT EXISTS idx_invoices_final_amount ON invoices(final_amount);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date ON subscriptions(next_due_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- ================================================
-- TRIGGERS FOR AUTO-UPDATE updated_at
-- ================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for settings
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TRIGGER TO AUTO-CALCULATE final_amount
-- ================================================

-- Function to calculate final_amount before insert/update
CREATE OR REPLACE FUNCTION calculate_final_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.final_amount = NEW.amount - COALESCE(NEW.discount, 0);
    
    -- Ensure final_amount is not negative
    IF NEW.final_amount < 0 THEN
        RAISE EXCEPTION 'Final amount cannot be negative. Discount (%) cannot exceed amount (%)', 
            NEW.discount, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate final_amount automatically
DROP TRIGGER IF EXISTS calculate_invoice_final_amount ON invoices;
CREATE TRIGGER calculate_invoice_final_amount
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_final_amount();

-- ================================================
-- DEFAULT DATA
-- ================================================

-- Insert default admin user (password: daragroup1994)
INSERT INTO users (username, password, email, full_name, role, status) 
VALUES (
    'admin', 
    '$2b$10$9SPmuQ2hcYfSePxIjJT/J.0lJXrQmrwRGufWTscS0/eaKfUDx8GmC', 
    'admin@ispbilling.com', 
    'Administrator', 
    'admin', 
    'active'
) ON CONFLICT (username) DO NOTHING;

-- Insert default settings for admin user
INSERT INTO settings (user_id, setting_key, setting_value, setting_type)
SELECT 
    id,
    'general_settings',
    '{"companyName":"Daranett ISP","companyEmail":"info@daranett.id","companyPhone":"+62 812 3456 7890","companyAddress":"Desa Bacin, Ngempik, Kec. Bae, Kab. Kudus, Jawa Tengah","currency":"IDR","timezone":"Asia/Jakarta","language":"id","dateFormat":"DD/MM/YYYY","timeFormat":"24h"}'::jsonb,
    'general'
FROM users WHERE username = 'admin'
ON CONFLICT (user_id, setting_key) DO NOTHING;

INSERT INTO settings (user_id, setting_key, setting_value, setting_type)
SELECT 
    id,
    'notification_settings',
    '{"emailNotifications":true,"smsNotifications":false,"pushNotifications":true,"overdueReminders":true,"paymentConfirmations":true,"newCustomerAlerts":true,"invoiceGeneration":true,"systemUpdates":false}'::jsonb,
    'notifications'
FROM users WHERE username = 'admin'
ON CONFLICT (user_id, setting_key) DO NOTHING;

INSERT INTO settings (user_id, setting_key, setting_value, setting_type)
SELECT 
    id,
    'backup_settings',
    '{"autoBackup":true,"backupFrequency":"daily","backupTime":"02:00","dataRetention":365,"includeAttachments":true,"compressBackups":true}'::jsonb,
    'backup'
FROM users WHERE username = 'admin'
ON CONFLICT (user_id, setting_key) DO NOTHING;

-- ================================================
-- MIGRATION NOTES
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ ISP Billing Database Schema Initialized';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Version: 2.1.0';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✓ Customers Management';
    RAISE NOTICE '  ✓ Packages Management';
    RAISE NOTICE '  ✓ Subscriptions with Due Dates';
    RAISE NOTICE '  ✓ Invoices with DISCOUNT SUPPORT';
    RAISE NOTICE '  ✓ Payments Tracking';
    RAISE NOTICE '  ✓ User Authentication';
    RAISE NOTICE '  ✓ Settings Management';
    RAISE NOTICE '  ✓ Auto-calculate Final Amount';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Default Credentials:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: daragroup1994';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Company Info (in settings):';
    RAISE NOTICE '  Name: Daranett ISP';
    RAISE NOTICE '  Address: Desa Bacin, Ngempik';
    RAISE NOTICE '           Kec. Bae, Kab. Kudus';
    RAISE NOTICE '================================================';
END $$;
