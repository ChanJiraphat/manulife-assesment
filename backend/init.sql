-- Create database schema for Investment Portfolio Application

-- Create custom types
CREATE TYPE AssetType AS ENUM ('STOCK', 'ETF', 'BOND', 'MUTUAL_FUND', 'CRYPTO', 'REAL_ESTATE', 'COMMODITY');
CREATE TYPE TransactionType AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'MERGER');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    asset_type AssetType NOT NULL,
    quantity DECIMAL(15, 4) DEFAULT 0,
    purchase_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    investment_id INTEGER REFERENCES investments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    transaction_type TransactionType NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_investment_id ON transactions(investment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO users (username, email, hashed_password) VALUES 
('testuser', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeqGFfCh0/vYKvwCe') -- password: secret
ON CONFLICT (username) DO NOTHING;

-- Get the test user ID for sample investments
DO $$
DECLARE
    test_user_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE username = 'testuser';
    
    IF test_user_id IS NOT NULL THEN
        -- Insert sample investments
        INSERT INTO investments (user_id, symbol, name, asset_type, quantity, purchase_price) VALUES 
        (test_user_id, 'AAPL', 'Apple Inc.', 'STOCK', 10, 150.00),
        (test_user_id, 'MSFT', 'Microsoft Corporation', 'STOCK', 5, 300.00),
        (test_user_id, 'SPY', 'SPDR S&P 500 ETF Trust', 'ETF', 20, 400.00)
        ON CONFLICT (user_id, symbol) DO NOTHING;
    END IF;
END $$;
