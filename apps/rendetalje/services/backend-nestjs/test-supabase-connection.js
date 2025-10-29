// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://oaevagdgrasfppbrxbey.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo';

console.log('🔍 Testing Supabase Connection...\n');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Using service role key\n');

async function testConnection() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('✅ Supabase client created successfully\n');
    
    // Test 1: Check if we can query schemas
    console.log('📊 Test 1: Checking available schemas...');
    const { data: schemas, error: schemaError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('vault', 'billy', 'renos', 'crm', 'flow', 'shared')" 
      })
      .catch(() => {
        // If RPC doesn't exist, try direct query
        return supabase
          .from('information_schema.schemata')
          .select('schema_name');
      });
    
    if (schemaError) {
      console.log('⚠️  Schema check failed (this is okay):', schemaError.message);
    } else {
      console.log('✅ Schemas found:', schemas);
    }
    
    // Test 2: Check renos schema tables
    console.log('\n📊 Test 2: Checking renos schema tables...');
    const { data: users, error: userError } = await supabase
      .from('renos.users')
      .select('id, email, name')
      .limit(5);
    
    if (userError) {
      console.log('❌ Error querying renos.users:', userError.message);
      console.log('   This might mean the table doesn\'t exist yet or RLS is blocking');
    } else {
      console.log('✅ Users table accessible!');
      console.log('   Found', users?.length || 0, 'users');
      if (users && users.length > 0) {
        console.log('   Sample user:', users[0]);
      }
    }
    
    // Test 3: Check customers table
    console.log('\n📊 Test 3: Checking customers table...');
    const { data: customers, error: customerError } = await supabase
      .from('renos.customers')
      .select('id, name, email')
      .limit(5);
    
    if (customerError) {
      console.log('❌ Error querying renos.customers:', customerError.message);
    } else {
      console.log('✅ Customers table accessible!');
      console.log('   Found', customers?.length || 0, 'customers');
      if (customers && customers.length > 0) {
        console.log('   Sample customer:', customers[0]);
      }
    }
    
    // Test 4: Check leads table
    console.log('\n📊 Test 4: Checking leads table...');
    const { data: leads, error: leadError } = await supabase
      .from('renos.leads')
      .select('id, name, email, status')
      .limit(5);
    
    if (leadError) {
      console.log('❌ Error querying renos.leads:', leadError.message);
    } else {
      console.log('✅ Leads table accessible!');
      console.log('   Found', leads?.length || 0, 'leads');
      if (leads && leads.length > 0) {
        console.log('   Sample lead:', leads[0]);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Connection test complete!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection();
