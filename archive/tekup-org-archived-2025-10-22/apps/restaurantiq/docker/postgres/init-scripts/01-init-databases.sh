#!/bin/bash
set -e

# Create additional databases for testing and development
echo "Creating additional databases..."

# Create test database
echo "Creating test database: restaurantiq_test"
createdb -U "$POSTGRES_USER" restaurantiq_test

# Grant privileges
echo "Granting privileges..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create additional schemas if needed
    CREATE SCHEMA IF NOT EXISTS analytics;
    CREATE SCHEMA IF NOT EXISTS inventory;
    CREATE SCHEMA IF NOT EXISTS scheduling;
    CREATE SCHEMA IF NOT EXISTS integrations;
    
    -- Grant usage on schemas
    GRANT USAGE ON SCHEMA public TO $POSTGRES_USER;
    GRANT USAGE ON SCHEMA analytics TO $POSTGRES_USER;
    GRANT USAGE ON SCHEMA inventory TO $POSTGRES_USER;
    GRANT USAGE ON SCHEMA scheduling TO $POSTGRES_USER;
    GRANT USAGE ON SCHEMA integrations TO $POSTGRES_USER;
    
    -- Grant create privileges
    GRANT CREATE ON SCHEMA public TO $POSTGRES_USER;
    GRANT CREATE ON SCHEMA analytics TO $POSTGRES_USER;
    GRANT CREATE ON SCHEMA inventory TO $POSTGRES_USER;
    GRANT CREATE ON SCHEMA scheduling TO $POSTGRES_USER;
    GRANT CREATE ON SCHEMA integrations TO $POSTGRES_USER;
    
    -- Enable extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    
    -- Create indexes for performance
    -- These will be created by migrations, but ensuring extensions are available
EOSQL

# Grant same privileges to test database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "restaurantiq_test" <<-EOSQL
    -- Create schemas in test database
    CREATE SCHEMA IF NOT EXISTS analytics;
    CREATE SCHEMA IF NOT EXISTS inventory;
    CREATE SCHEMA IF NOT EXISTS scheduling;
    CREATE SCHEMA IF NOT EXISTS integrations;
    
    -- Enable extensions for test database
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
EOSQL

echo "Database initialization completed!"
echo "Available databases:"
echo "  - $POSTGRES_DB (main development database)"
echo "  - restaurantiq_test (testing database)"
echo "  - postgres (system database)"

echo "Available schemas:"
echo "  - public (default schema)"
echo "  - analytics (for reporting and analytics)"
echo "  - inventory (for inventory management)"
echo "  - scheduling (for staff scheduling)"
echo "  - integrations (for third-party integrations)"

echo "Installed extensions:"
echo "  - uuid-ossp (UUID generation)"
echo "  - pg_trgm (full-text search)"
echo "  - btree_gin (advanced indexing)"
echo "  - pg_stat_statements (query statistics)"
