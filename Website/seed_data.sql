-- 1. Create the products table
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category
    ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_price
    ON products(price);

CREATE INDEX IF NOT EXISTS idx_products_category_price
    ON products(category, price);

CREATE INDEX IF NOT EXISTS idx_products_title_search
    ON products USING GIN (to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_products_category_title_search
    ON products USING GIN (to_tsvector('english', category || ' ' || title));

-- 2. Reset and insert 1,000,000 unique e-commerce records
TRUNCATE TABLE products RESTART IDENTITY;

INSERT INTO products (title, sku, category, price, stock_quantity)
SELECT 
    -- Generates unique names by combining a prefix, a product type, and the row number
    (ARRAY['Premium', 'Eco-Friendly', 'Deluxe', 'Minimalist', 'Smart'])[((i - 1) % 5) + 1] || ' ' ||
    (ARRAY['Tech', 'Home', 'Apparel', 'Fitness', 'Kitchen'])[((i + 2) % 5) + 1] || ' ' ||
    (ARRAY['Widget', 'Gadget', 'Gear', 'Apparatus', 'Device'])[((i + 4) % 5) + 1] || ' #' || i AS title,
    
    -- Generates unique SKUs using the row number so every record is distinct
    'SKU-' || LPAD(i::text, 7, '0') AS sku,
    
    -- Assigns a repeating category pattern across the 1,000,000 rows
    (ARRAY['Electronics', 'Home & Living', 'Clothing', 'Sports', 'Kitchenware'])[((i - 1) % 5) + 1] AS category,
    
    -- Price remains within a realistic range while staying deterministic
    ROUND((((i * 37) % 991) + 10)::numeric, 2) AS price,
    
    -- Inventory stock remains realistic and varied
    ((i * 13) % 501)::int AS stock_quantity
FROM generate_series(1, 1000000) AS i;