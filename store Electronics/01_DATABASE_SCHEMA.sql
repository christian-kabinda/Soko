-- ============================================
-- ELECTRONICS STORE POS SYSTEM - DATABASE SCHEMA
-- Supabase PostgreSQL Database
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'store_manager', 'cashier')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CATEGORIES & PRODUCTS
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  supplier_name VARCHAR(255),
  supplier_sku VARCHAR(100),
  barcode VARCHAR(100) UNIQUE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);

-- ============================================
-- 3. INVENTORY MANAGEMENT
-- ============================================
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('purchase', 'return', 'adjustment', 'restock')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);

-- ============================================
-- 4. CUSTOMERS & LOYALTY PROGRAM
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  total_purchases DECIMAL(12, 2) DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  total_discount_given DECIMAL(10, 2) DEFAULT 0,
  is_eligible_for_discount BOOLEAN DEFAULT FALSE,
  discount_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- 5. TRANSACTIONS & SALES
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'check')),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- 6. TRANSACTION ITEMS
-- ============================================
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);

-- ============================================
-- 7. RECEIPTS
-- ============================================
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  customer_receipt_data JSONB NOT NULL,
  merchant_receipt_data JSONB NOT NULL,
  printed BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipts_transaction ON receipts(transaction_id);
CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);

-- ============================================
-- 8. DAILY REPORTS
-- ============================================
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE UNIQUE NOT NULL,
  total_sales DECIMAL(12, 2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_discount_given DECIMAL(10, 2) DEFAULT 0,
  total_tax DECIMAL(10, 2) DEFAULT 0,
  cash_sales DECIMAL(12, 2) DEFAULT 0,
  card_sales DECIMAL(12, 2) DEFAULT 0,
  check_sales DECIMAL(12, 2) DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  top_products JSONB,
  report_summary JSONB,
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- ============================================
-- 9. EXTERNAL SUPPLIER INTEGRATIONS
-- ============================================
CREATE TABLE supplier_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  api_secret VARCHAR(500),
  endpoint_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE imported_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES supplier_integrations(id) ON DELETE CASCADE,
  external_product_id VARCHAR(255),
  external_product_url TEXT,
  import_status VARCHAR(50) DEFAULT 'pending',
  imported_at TIMESTAMP,
  imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies (full access)
CREATE POLICY admin_all_access ON users
  USING ((SELECT role FROM users WHERE id = auth.uid())::TEXT = 'admin');

CREATE POLICY admin_products_access ON products
  USING ((SELECT role FROM users WHERE id = auth.uid())::TEXT = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid())::TEXT = 'admin');

CREATE POLICY admin_transactions_access ON transactions
  USING ((SELECT role FROM users WHERE id = auth.uid())::TEXT = 'admin');

-- Cashier policies (limited access)
CREATE POLICY cashier_read_products ON products
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid())::TEXT IN ('admin', 'cashier', 'store_manager'));

CREATE POLICY cashier_create_transactions ON transactions
  FOR INSERT WITH CHECK (cashier_id = auth.uid());

CREATE POLICY cashier_update_own_transactions ON transactions
  FOR UPDATE USING (cashier_id = auth.uid())
  WITH CHECK (cashier_id = auth.uid());

-- Store Manager policies
CREATE POLICY store_manager_products ON products
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid())::TEXT IN ('admin', 'store_manager'))
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid())::TEXT = 'admin');

-- ============================================
-- 12. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to calculate customer loyalty status
CREATE OR REPLACE FUNCTION check_customer_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purchase_count >= 10 OR NEW.total_purchases >= 1000 THEN
    NEW.is_eligible_for_discount := TRUE;
    NEW.discount_percentage := 5;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_eligibility_trigger
AFTER UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION check_customer_eligibility();

-- Function to update product quantity after transaction
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_quantity INTEGER;
BEGIN
  SELECT product_id, quantity INTO v_product_id, v_quantity
  FROM transaction_items WHERE id = NEW.id;
  
  UPDATE products SET quantity_in_stock = quantity_in_stock - v_quantity
  WHERE id = v_product_id;
  
  INSERT INTO inventory_logs (product_id, action, quantity_change, created_by)
  VALUES (v_product_id, 'purchase', -v_quantity, 
    (SELECT cashier_id FROM transactions WHERE id = NEW.transaction_id));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_quantity_trigger
AFTER INSERT ON transaction_items
FOR EACH ROW
EXECUTE FUNCTION update_product_quantity();

-- Function to update customer totals
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET 
    total_purchases = total_purchases + NEW.total_amount,
    purchase_count = purchase_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_totals_trigger
AFTER INSERT ON transactions
FOR EACH ROW
WHEN (NEW.customer_id IS NOT NULL AND NEW.status = 'completed')
EXECUTE FUNCTION update_customer_totals();

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'TXN-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || 
    LPAD((SELECT COUNT(*) + 1 FROM transactions 
      WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'RCP-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || 
    LPAD((SELECT COUNT(*) + 1 FROM receipts 
      WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. VIEWS FOR ANALYTICS
-- ============================================

CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
  DATE(t.created_at) as sale_date,
  COUNT(DISTINCT t.id) as total_transactions,
  SUM(t.total_amount) as total_sales,
  SUM(t.discount_amount) as total_discount,
  SUM(t.tax) as total_tax,
  COUNT(DISTINCT t.cashier_id) as num_cashiers,
  COUNT(DISTINCT CASE WHEN t.customer_id IS NOT NULL THEN t.customer_id END) as customer_count
FROM transactions t
WHERE t.status = 'completed'
GROUP BY DATE(t.created_at);

CREATE OR REPLACE VIEW top_products_by_sales AS
SELECT 
  p.id,
  p.name,
  p.sku,
  COUNT(ti.id) as units_sold,
  SUM(ti.line_total) as total_sales,
  AVG(ti.unit_price) as avg_price
FROM products p
JOIN transaction_items ti ON p.id = ti.product_id
GROUP BY p.id, p.name, p.sku
ORDER BY total_sales DESC;

CREATE OR REPLACE VIEW customer_lifetime_value AS
SELECT 
  c.id,
  c.full_name,
  c.phone,
  c.purchase_count,
  c.total_purchases,
  c.is_eligible_for_discount,
  c.discount_percentage,
  ROUND(c.total_purchases / NULLIF(c.purchase_count, 0), 2) as avg_transaction_value
FROM customers c
ORDER BY c.total_purchases DESC;

-- ============================================
-- 14. SAMPLE DATA INSERTION
-- ============================================

-- Insert admin user (password: Admin@123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@store.com', '$2b$10$YourHashedPasswordHere', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert categories
INSERT INTO categories (name, description) VALUES
  ('Laptops', 'Desktop computers and portable laptops'),
  ('Mobile Phones', 'Smartphones and mobile devices'),
  ('Accessories', 'Phone chargers, cables, and accessories'),
  ('Audio', 'Headphones, speakers, and audio equipment'),
  ('Storage', 'Hard drives, SSDs, and storage solutions')
ON CONFLICT (name) DO NOTHING;
