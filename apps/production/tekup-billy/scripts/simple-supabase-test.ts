/**
 * Simple Supabase Connection & Discovery Test
 * Uses raw SQL queries via service role key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

console.log('🔍 Supabase Connection Test for Tekup-Billy\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function discoverDatabase() {
    try {
        console.log('📊 Discovering existing tables...\n');

        // Query information_schema using raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
        });

        if (error) {
            // Fallback: Try common RenOS tables
            console.log('⚠️  RPC not available, trying direct table checks...\n');

            const tablesToCheck = [
                'organizations',
                'users',
                'emails',
                'leads',
                'customers',
                'tasks',
                'billy_organizations',
                'billy_cached_invoices'
            ];

            console.log('Checking common tables:');
            for (const table of tablesToCheck) {
                const { error: checkError } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true })
                    .limit(0);

                if (checkError) {
                    console.log(`  ❌ ${table} - Not found`);
                } else {
                    console.log(`  ✅ ${table} - Exists`);
                }
            }
        } else {
            console.log('✅ Found tables:', data);
        }

        console.log('\n✅ Connection works!');
        console.log('\n📝 RECOMMENDATION:');
        console.log('   Use Supabase SQL Editor to:');
        console.log('   1. View all existing tables');
        console.log('   2. Run Billy.dk migrations');
        console.log('   3. Create billy_* prefixed tables\n');

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    }
}

discoverDatabase();
