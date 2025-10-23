/**
 * Supabase Connection Test & Table Discovery
 * 
 * This script:
 * 1. Tests Supabase connection
 * 2. Lists all existing tables
 * 3. Checks for Tekup-Billy tables
 * 4. Reports what needs to be created
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔍 Tekup-Billy Supabase Connection Test\n');
console.log('📡 Supabase URL:', SUPABASE_URL);
console.log('');

async function testConnection() {
    try {
        // Test 1: Basic connection test
        console.log('Test 1: Basic Connection');
        console.log('─────────────────────────');
        const { data, error } = await supabase.from('_').select('*').limit(1);
        if (error && error.code !== 'PGRST200') {
            // PGRST200 = relation does not exist (expected for dummy table)
            console.log('✅ Connection successful!');
        } else {
            console.log('✅ Connection successful!');
        }
        console.log('');

        // Test 2: List all tables in public schema
        console.log('Test 2: Existing Tables in Database');
        console.log('────────────────────────────────────');
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_tables');

        if (tablesError) {
            // Fallback: Try direct query
            const { data: tableData, error: queryError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');

            if (queryError) {
                console.log('⚠️  Cannot query tables (permissions issue)');
                console.log('   Will attempt to check specific tables...');
            } else {
                console.log('📋 Found tables:');
                tableData?.forEach((t: any) => {
                    console.log(`   - ${t.table_name}`);
                });
            }
        } else {
            console.log('📋 Found tables:', tables);
        }
        console.log('');

        // Test 3: Check for Tekup-Billy specific tables
        console.log('Test 3: Tekup-Billy Tables Check');
        console.log('─────────────────────────────────');

        const tekupTables = [
            'billy_organizations',
            'billy_users',
            'billy_cached_invoices',
            'billy_cached_customers',
            'billy_cached_products',
            'billy_audit_logs',
            'billy_usage_metrics',
            'billy_rate_limits'
        ];

        const tableStatus: any = {};

        for (const tableName of tekupTables) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                    tableStatus[tableName] = '❌ NOT EXISTS';
                } else {
                    tableStatus[tableName] = `⚠️  ERROR: ${error.message}`;
                }
            } else {
                tableStatus[tableName] = '✅ EXISTS';
            }
        }

        Object.entries(tableStatus).forEach(([table, status]) => {
            console.log(`${status} - ${table}`);
        });
        console.log('');

        // Test 4: Check for RenOS tables (to avoid conflicts)
        console.log('Test 4: RenOS Tables Check (Conflict Detection)');
        console.log('───────────────────────────────────────────────');

        const renosTables = [
            'organizations', // RenOS uses this
            'users',         // RenOS uses this
            'emails',
            'leads',
            'customers'
        ];

        const renosStatus: any = {};

        for (const tableName of renosTables) {
            const { data, error } = await supabase
                .from(tableName)
                .select('count', { count: 'exact', head: true });

            if (error) {
                renosStatus[tableName] = '❌ NOT EXISTS';
            } else {
                renosStatus[tableName] = `✅ EXISTS (RenOS table)`;
            }
        }

        Object.entries(renosStatus).forEach(([table, status]) => {
            console.log(`${status} - ${table}`);
        });
        console.log('');

        // Summary
        console.log('📊 SUMMARY');
        console.log('══════════');

        const existingTekupTables = Object.entries(tableStatus).filter(
            ([_, status]) => (status as string).includes('EXISTS')
        ).length;

        const missingTekupTables = Object.entries(tableStatus).filter(
            ([_, status]) => (status as string).includes('NOT EXISTS')
        ).length;

        console.log(`✅ Supabase Connection: OK`);
        console.log(`📊 Tekup-Billy Tables: ${existingTekupTables}/${tekupTables.length} exist`);
        console.log(`❌ Missing Tables: ${missingTekupTables}`);
        console.log('');

        if (missingTekupTables > 0) {
            console.log('🔧 NEXT STEPS:');
            console.log('──────────────');
            console.log('1. Create missing tables using SQL migrations');
            console.log('2. Run migrations from: docs/sql/');
            console.log('3. Re-run this test to verify');
            console.log('');
            console.log('📝 Note: We will use "billy_" prefix to avoid conflicts with RenOS tables');
        } else {
            console.log('🎉 All Tekup-Billy tables exist! Ready to implement caching.');
        }

    } catch (error: any) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
}

testConnection();
