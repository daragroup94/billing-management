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

-- Insert Sample Data
INSERT INTO packages (name, speed, price, description) VALUES
('Basic', '10 Mbps', 150000, 'Paket internet dasar untuk browsing'),
('Standard', '20 Mbps', 250000, 'Paket standar untuk streaming'),
('Premium', '50 Mbps', 450000, 'Paket premium untuk gaming'),
('Ultimate', '100 Mbps', 750000, 'Paket ultimate untuk bisnis');

INSERT INTO customers (name, email, phone, address, status) VALUES
('Ahmad Wijaya', 'ahmad@email.com', '081234567890', 'Jl. Merdeka No. 123', 'active'),
('Siti Rahayu', 'siti@email.com', '081234567891', 'Jl. Sudirman No. 456', 'active'),
('Budi Santoso', 'budi@email.com', '081234567892', 'Jl. Gatot Subroto No. 789', 'active'),
('Dewi Lestari', 'dewi@email.com', '081234567893', 'Jl. Ahmad Yani No. 321', 'active'),
('Eko Prasetyo', 'eko@email.com', '081234567894', 'Jl. Diponegoro No. 654', 'inactive');
