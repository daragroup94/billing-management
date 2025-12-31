-- Customers Table
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

-- Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    speed VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    package_id INTEGER REFERENCES packages(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Users Table untuk Authentication
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

-- Insert default admin user
-- Password: daragroup1994 (akan di-hash di aplikasi)
INSERT INTO users (username, password, email, full_name, role, status) 
VALUES (
    'admin', 
    '$2b$10$9SPmuQ2hcYfSePxIjJT/J.0lJXrQmrwRGufWTscS0/eaKfUDx8GmC', 
    'admin@ispbilling.com', 
    'Administrator', 
    'admin', 
    'active'
) ON CONFLICT (username) DO NOTHING;

-- Sessions Table untuk tracking login
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table untuk menyimpan konfigurasi sistem
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

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_type ON settings(setting_type);

-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update updated_at pada settings
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings untuk admin user
INSERT INTO settings (user_id, setting_key, setting_value, setting_type)
SELECT 
    id,
    'general_settings',
    '{"companyName":"ISP Billing Co.","companyEmail":"admin@ispbilling.com","companyPhone":"+62 812 3456 7890","companyAddress":"Jl. Teknologi No. 123, Jakarta","currency":"IDR","timezone":"Asia/Jakarta","language":"id","dateFormat":"DD/MM/YYYY","timeFormat":"24h"}'::jsonb,
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
