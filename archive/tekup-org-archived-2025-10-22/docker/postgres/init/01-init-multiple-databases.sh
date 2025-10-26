#!/bin/bash
set -e

# Create multiple databases for Tekup development
# This script runs during PostgreSQL container initialization

echo "Creating multiple databases for Tekup development..."

# Function to create database if it doesn't exist
create_database() {
    local database=$1
    echo "Creating database '$database'..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        SELECT 'CREATE DATABASE $database'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$database')\gexec
EOSQL
}

# Create databases
create_database "tekup_unified"
create_database "tekup_crm"  
create_database "tekup_flow"
create_database "tekup_leads"
create_database "tekup_test"

echo "Multiple databases created successfully!"

# Create development user with appropriate permissions
echo "Creating development user..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_roles
            WHERE rolname = 'tekup_dev'
        ) THEN
            CREATE ROLE tekup_dev WITH 
                LOGIN 
                PASSWORD 'tekup_dev_password_2024'
                CREATEDB
                CREATEROLE;
        END IF;
    END
    \$\$;

    -- Grant permissions to all databases
    GRANT ALL PRIVILEGES ON DATABASE tekup_unified TO tekup_dev;
    GRANT ALL PRIVILEGES ON DATABASE tekup_crm TO tekup_dev;
    GRANT ALL PRIVILEGES ON DATABASE tekup_flow TO tekup_dev;
    GRANT ALL PRIVILEGES ON DATABASE tekup_leads TO tekup_dev;
    GRANT ALL PRIVILEGES ON DATABASE tekup_test TO tekup_dev;
EOSQL

echo "Development user created with permissions!"

# Enable required extensions
echo "Enabling required PostgreSQL extensions..."
for db in tekup_unified tekup_crm tekup_flow tekup_leads tekup_test; do
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" <<-EOSQL
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "citext";
        CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
        CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOSQL
done

echo "PostgreSQL initialization completed successfully!"
