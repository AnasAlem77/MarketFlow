-- ============================================
-- MARKET FLOW - DATABASE SCHEMA
-- SQLite Database
-- ============================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en VARCHAR(100) NOT NULL,
    name_id VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT '📦',
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,  -- Price in IDR
    category_id INTEGER,
    image VARCHAR(500),
    shopee_link VARCHAR(500) NOT NULL,
    description TEXT,
    is_featured BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    type VARCHAR(20) NOT NULL,  -- 'view' or 'click'
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    product_name VARCHAR(255),
    type VARCHAR(20) NOT NULL,  -- 'view' or 'click'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);

-- ============================================
-- DEFAULT ADMIN USER
-- Username: admin
-- Password: admin123 (CHANGE THIS!)
-- ============================================
-- Password hash for 'admin123' using bcrypt
INSERT OR IGNORE INTO admin_users (username, password_hash, email) 
VALUES ('admin', '$2y$10$YourHashHere', 'admin@marketflow.com');

-- ============================================
-- SAMPLE CATEGORIES
-- ============================================
INSERT OR IGNORE INTO categories (id, name_en, name_id, icon, is_active, sort_order) VALUES
(1, 'Gadgets', 'Gadget', '📱', 1, 1),
(2, 'Fashion', 'Fashion', '👕', 1, 2),
(3, 'Home & Living', 'Rumah & Living', '🏠', 1, 3),
(4, 'Beauty', 'Kecantikan', '💄', 1, 4),
(5, 'Gaming', 'Gaming', '🎮', 1, 5),
(6, 'Sports', 'Olahraga', '⚽', 1, 6),
(7, 'Automotive', 'Otomotif', '🚗', 1, 7);

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================
INSERT OR IGNORE INTO products (id, name, price, category_id, image, shopee_link, description, is_featured, is_active) VALUES
(1, 'Wireless Earbuds Pro', 150000, 1, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', 'https://shopee.co.id/product/1', 'High quality wireless earbuds with noise cancellation and long battery life. Perfect for music lovers and gamers.', 1, 1),
(2, 'Smart Watch Series 5', 350000, 1, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400', 'https://shopee.co.id/product/2', 'Feature-rich smartwatch with health tracking, notifications, and more. Stay connected on the go.', 1, 1),
(3, 'Gaming Mechanical Keyboard RGB', 450000, 5, 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400', 'https://shopee.co.id/product/3', 'Premium mechanical keyboard with RGB lighting and hot-swappable switches. Built for gamers.', 1, 1),
(4, 'Minimalist Cotton T-Shirt', 85000, 2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'https://shopee.co.id/product/4', 'Comfortable 100% cotton t-shirt with minimalist design. Available in multiple colors.', 0, 1),
(5, 'LED Strip Lights 5m', 120000, 3, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'https://shopee.co.id/product/5', 'Colorful LED strip lights with remote control. Perfect for room decoration and gaming setup.', 0, 1),
(6, 'Skincare Set Premium', 275000, 4, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 'https://shopee.co.id/product/6', 'Complete skincare set with cleanser, toner, serum, and moisturizer. For all skin types.', 0, 1),
(7, 'Gaming Mouse Pro', 185000, 5, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', 'https://shopee.co.id/product/7', 'High-precision gaming mouse with customizable DPI and RGB lighting.', 0, 1),
(8, 'Wireless Charger Pad', 95000, 1, 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=400', 'https://shopee.co.id/product/8', 'Fast wireless charger compatible with all Qi-enabled devices. Sleek and compact design.', 0, 1);

-- ============================================
-- DEFAULT SETTINGS
-- ============================================
INSERT OR IGNORE INTO settings (key, value) VALUES
('site_name', 'Market Flow'),
('site_tagline', 'FIND • CHOOSE • BUY'),
('site_description', 'Discover amazing products from Shopee'),
('default_language', 'id'),
('currency', 'IDR'),
('contact_email', 'contact@marketflow.com'),
('contact_whatsapp', '+6281234567890'),
('tiktok_url', 'https://tiktok.com/@marketflow'),
('instagram_url', 'https://instagram.com/marketflow'),
('developer_name', 'Anas Alem'),
('developer_url', 'https://github.com/anasalem');

-- ============================================
-- VIEWS FOR EASY QUERIES
-- ============================================

-- Products with category names
CREATE VIEW IF NOT EXISTS v_products AS
SELECT 
    p.*,
    c.name_en as category_name_en,
    c.name_id as category_name_id,
    c.icon as category_icon
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Product stats
CREATE VIEW IF NOT EXISTS v_product_stats AS
SELECT 
    p.id,
    p.name,
    p.views,
    p.clicks,
    CASE 
        WHEN p.views > 0 THEN ROUND((p.clicks * 100.0 / p.views), 2)
        ELSE 0 
    END as ctr
FROM products p;

-- Daily analytics
CREATE VIEW IF NOT EXISTS v_daily_analytics AS
SELECT 
    DATE(created_at) as date,
    type,
    COUNT(*) as count
FROM analytics
GROUP BY DATE(created_at), type
ORDER BY date DESC;