-- RestaurantIQ Database Schema Migration
-- Created: 2025-01-13
-- Description: Initial schema creation for RestaurantIQ platform

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Authentication & Authorization)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('admin', 'owner', 'manager', 'staff')) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. Restaurants Table (Business Profiles)
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'Denmark',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    opening_hours JSONB, -- {"monday": {"open": "10:00", "close": "22:00"}, ...}
    capacity INTEGER DEFAULT 0,
    price_range VARCHAR(10) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')) DEFAULT '$$',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(20) CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for restaurants table
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_type);
CREATE INDEX idx_restaurants_active ON restaurants(is_active);

-- 3. Menus Table (Menu Management)
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL, -- "Lunch Menu", "Dinner Menu", "Wine List"
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    available_from TIME,
    available_to TIME,
    available_days JSONB, -- ["monday", "tuesday", ...]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes for menus table
CREATE INDEX idx_menus_restaurant ON menus(restaurant_id);
CREATE INDEX idx_menus_active ON menus(is_active);

-- 4. Menu Items Table (Individual Items)
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    menu_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2), -- Cost to make (for profit analysis)
    category VARCHAR(100), -- "Appetizers", "Main Courses", "Desserts"
    dietary_info JSONB, -- ["vegetarian", "gluten-free", "vegan"]
    allergens JSONB, -- ["nuts", "dairy", "shellfish"]
    calories INTEGER,
    preparation_time INTEGER, -- minutes
    popularity_score DECIMAL(5,2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    image_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

-- Create indexes for menu_items table
CREATE INDEX idx_menu_items_menu ON menu_items(menu_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_price ON menu_items(price);

-- 5. Customers Table (Customer Profiles)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    preferences JSONB, -- Dietary preferences, favorite dishes
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    last_visit TIMESTAMP,
    customer_segment VARCHAR(20) CHECK (customer_segment IN ('new', 'regular', 'vip', 'at_risk')) DEFAULT 'new',
    marketing_consent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes for customers table
CREATE INDEX idx_customers_restaurant ON customers(restaurant_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_segment ON customers(customer_segment);

-- 6. Orders Table (Transaction History)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    customer_id INTEGER,
    table_number INTEGER,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')) DEFAULT 'pending',
    order_type VARCHAR(20) CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'mobile_pay', 'other')),
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    special_instructions TEXT,
    estimated_ready_time TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Create indexes for orders table
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_date ON orders(DATE(created_at));
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- 7. Order Items Table (Order Line Items)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
);

-- Create indexes for order_items table
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- 8. Analytics Metrics Table (KPI Tracking)
CREATE TABLE analytics_metrics (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    metric_type VARCHAR(100) NOT NULL, -- "daily_revenue", "customer_count", "avg_order_value"
    metric_value DECIMAL(15,4) NOT NULL,
    metric_date DATE NOT NULL,
    metric_hour INTEGER, -- For hourly metrics (0-23)
    dimensions JSONB, -- Additional context {"table_section": "outdoor", "staff_member": "john"}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes for analytics_metrics table
CREATE INDEX idx_analytics_restaurant_type_date ON analytics_metrics(restaurant_id, metric_type, metric_date);
CREATE INDEX idx_analytics_metric_date ON analytics_metrics(metric_date);
CREATE UNIQUE INDEX idx_analytics_unique_metric ON analytics_metrics(restaurant_id, metric_type, metric_date, COALESCE(metric_hour, -1), md5(COALESCE(dimensions::text, '')));

-- 9. AI Insights Table (Generated Insights)
CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    insight_type VARCHAR(20) CHECK (insight_type IN ('recommendation', 'alert', 'prediction', 'optimization')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    impact_level VARCHAR(20) CHECK (impact_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    category VARCHAR(100), -- "menu", "pricing", "staffing", "marketing"
    action_required BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    metadata JSONB, -- Additional context and data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes for ai_insights table
CREATE INDEX idx_ai_insights_restaurant ON ai_insights(restaurant_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_impact ON ai_insights(impact_level);
CREATE INDEX idx_ai_insights_unread ON ai_insights(is_read, is_dismissed);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES
('admin@restaurantiq.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPyS8/Gy', 'Admin', 'User', '+45 12 34 56 78', 'admin'),
('owner@noma.dk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPyS8/Gy', 'René', 'Redzepi', '+45 32 96 32 97', 'owner');

INSERT INTO restaurants (owner_id, name, description, cuisine_type, address, city, postal_code, phone, email, website, capacity, price_range, subscription_tier) VALUES
(2, 'Noma', 'New Nordic cuisine restaurant', 'Nordic', 'Refshalevej 96', 'Copenhagen', '1432', '+45 32 96 32 97', 'info@noma.dk', 'https://noma.dk', 40, '$$$$', 'enterprise');

-- Create views for common queries
CREATE VIEW restaurant_summary AS
SELECT 
    r.id,
    r.name,
    r.city,
    r.cuisine_type,
    r.rating,
    r.total_reviews,
    r.subscription_tier,
    u.first_name || ' ' || u.last_name as owner_name,
    u.email as owner_email
FROM restaurants r
JOIN users u ON r.owner_id = u.id
WHERE r.is_active = true;

CREATE VIEW daily_restaurant_metrics AS
SELECT 
    restaurant_id,
    metric_date,
    SUM(CASE WHEN metric_type = 'daily_revenue' THEN metric_value ELSE 0 END) as revenue,
    SUM(CASE WHEN metric_type = 'customer_count' THEN metric_value ELSE 0 END) as customers,
    AVG(CASE WHEN metric_type = 'avg_order_value' THEN metric_value ELSE NULL END) as avg_order_value
FROM analytics_metrics
GROUP BY restaurant_id, metric_date;

-- Grant permissions (adjust as needed for your application user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO restaurantiq_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO restaurantiq_app;

COMMIT;