/**
 * Verify what data is actually in Supabase
 * 
 * Usage: npx tsx scripts/verify-db-data.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const SEASON = '2025/26';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
    console.log('🔍 Checking Supabase tables...\n');
    
    // Check 180s
    console.log('📊 Checking one_eighties table...');
    const { data: eighties, error: e1, count: count1 } = await supabase
        .from('one_eighties')
        .select('*', { count: 'exact' })
        .eq('season', SEASON);
    
    if (e1) {
        console.log('  ❌ Error:', e1.message);
        console.log('  ❌ Details:', e1);
    } else if (!eighties || eighties.length === 0) {
        console.log('  ⚠️  Table is EMPTY!');
    } else {
        console.log(`  ✅ Found ${count1 || eighties.length} rows`);
        eighties.slice(0, 5).forEach((row: any) => {
            console.log(`     - Player ID: ${row.player_id}, Count: ${row.count}`);
        });
    }
    
    // Check high finishes
    console.log('\n🔥 Checking high_finishes table...');
    const { data: finishes, error: e2, count: count2 } = await supabase
        .from('high_finishes')
        .select('*', { count: 'exact' })
        .eq('season', SEASON);
    
    if (e2) {
        console.log('  ❌ Error:', e2.message);
        console.log('  ❌ Details:', e2);
    } else if (!finishes || finishes.length === 0) {
        console.log('  ⚠️  Table is EMPTY!');
    } else {
        console.log(`  ✅ Found ${count2 || finishes.length} rows`);
        finishes.slice(0, 5).forEach((row: any) => {
            console.log(`     - Player ID: ${row.player_id}, Finish: ${row.finish}, Count: ${row.count}`);
        });
    }
    
    // Check venues
    console.log('\n🏠 Checking club_venues table...');
    const { data: venues, error: e3, count: count3 } = await supabase
        .from('club_venues')
        .select('*', { count: 'exact' });
    
    if (e3) {
        console.log('  ❌ Error:', e3.message);
        console.log('  ❌ Details:', e3);
    } else if (!venues || venues.length === 0) {
        console.log('  ⚠️  Table is EMPTY!');
    } else {
        console.log(`  ✅ Found ${count3 || venues.length} rows`);
        venues.forEach((row: any) => {
            console.log(`     - Team ID: ${row.team_id}, Name: ${row.name}`);
        });
    }
    
    console.log('\n==================================================');
    console.log('Summary:');
    console.log(`  - 180s: ${eighties?.length || 0} rows`);
    console.log(`  - High finishes: ${finishes?.length || 0} rows`);
    console.log(`  - Venues: ${venues?.length || 0} rows`);
    console.log('==================================================');
}

verifyData().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
