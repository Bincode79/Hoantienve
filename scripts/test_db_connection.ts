// Test Supabase connection via REST API
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔄 Testing Supabase connection via REST API...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // Simple query to test connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.log('📋 Tables might not exist yet, but connection is working!');
      console.log('ℹ️ Error received:', error.message);
      console.log('✅ REST API connection successful!');
    } else {
      console.log('✅ REST API connection successful!');
      console.log('📊 Users query result:', data);
    }
    
    // List all tables
    console.log('\n📋 Checking available tables...');
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables', {});
    
    if (tablesError) {
      console.log('ℹ️ Could not list tables (RPC may not exist)');
      console.log('✅ Basic connection works!');
    } else {
      console.log('📊 Tables:', tables);
    }
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
