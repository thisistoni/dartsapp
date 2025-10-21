/**
 * Manual script to scrape and upload 180s, High Finishes, and Club Venues
 * 
 * Usage: npx tsx scripts/scrape-special-stats.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { fetch180sAndHighFinishes, fetchClubVenue } from '../lib/scraper';

const SEASON = '2025/26';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// All teams in the league
const TEAMS = [
    'DC Patron',
    'PSV Wien Darts 1',
    'Dartclub Twentytwo 4',
    'AS The Dart Side of the Moon II',
    'TC Aspern 1',
    'Temmel Fundraising Darts Lions 2',
    'BSW Zwara Panier'
];

async function scrapeAndUpload() {
    console.log('🚀 Starting manual scrape of 180s, High Finishes, and Club Venues\n');
    
    let total180s = 0;
    let totalHighFinishes = 0;
    let totalVenues = 0;

    for (const teamName of TEAMS) {
        console.log(`📍 Processing ${teamName}...`);

        // Get team ID
        const { data: team } = await supabase
            .from('teams')
            .select('id')
            .eq('name', teamName)
            .eq('season', SEASON)
            .single();

        if (!team) {
            console.log(`  ⚠️  Team not found in database, skipping...`);
            continue;
        }

        try {
            // 1. Fetch 180s and High Finishes
            console.log(`  🎯 Scraping 180s and High Finishes...`);
            const { oneEightys, highFinishes } = await fetch180sAndHighFinishes(teamName);

            // Save 180s
            for (const oneEighty of oneEightys) {
                const { data: playerData } = await supabase
                    .from('players')
                    .select('id')
                    .eq('name', oneEighty.playerName)
                    .eq('team_id', team.id)
                    .eq('season', SEASON)
                    .maybeSingle();
                
                if (!playerData) {
                    console.log(`    ⚠️  Player not found: ${oneEighty.playerName}`);
                    continue;
                }

                const { error: eightiesError } = await supabase
                    .from('one_eighties')
                    .upsert({
                        player_id: playerData.id,
                        team_id: team.id,
                        season: SEASON,
                        count: oneEighty.count
                    }, { onConflict: 'player_id,season' });
                
                if (eightiesError) {
                    console.log(`    ❌ Error saving 180 for ${oneEighty.playerName}:`, eightiesError.message);
                } else {
                    total180s++;
                }
            }

            // Save High Finishes
            for (const hf of highFinishes) {
                const { data: playerData } = await supabase
                    .from('players')
                    .select('id')
                    .eq('name', hf.playerName)
                    .eq('team_id', team.id)
                    .eq('season', SEASON)
                    .maybeSingle();
                
                if (!playerData) {
                    console.log(`    ⚠️  Player not found: ${hf.playerName}`);
                    continue;
                }

                // Delete existing high finishes for this player
                await supabase
                    .from('high_finishes')
                    .delete()
                    .eq('player_id', playerData.id)
                    .eq('season', SEASON);

                // Count occurrences of each finish
                const finishCounts = new Map<number, number>();
                hf.finishes.forEach((finish: number) => {
                    finishCounts.set(finish, (finishCounts.get(finish) || 0) + 1);
                });

                // Insert each unique finish with its count
                for (const [finish, count] of finishCounts.entries()) {
                    const { error: hfError } = await supabase
                        .from('high_finishes')
                        .insert({
                            player_id: playerData.id,
                            team_id: team.id,
                            season: SEASON,
                            finish: finish,
                            count: count
                        });
                    
                    if (hfError) {
                        console.log(`    ❌ Error saving high finish ${finish} for ${hf.playerName}:`, hfError.message);
                    } else {
                        totalHighFinishes++;
                    }
                }
            }

            console.log(`    ✅ Saved ${oneEightys.length} players with 180s, ${highFinishes.length} players with high finishes`);

            // 2. Fetch and save club venue
            console.log(`  🏠 Scraping club venue...`);
            const clubVenue = await fetchClubVenue(teamName);
            if (clubVenue) {
                const { error: venueError } = await supabase
                    .from('club_venues')
                    .upsert({
                        team_id: team.id,
                        name: clubVenue.clubName,
                        address: clubVenue.address,
                        phone: clubVenue.phone,
                        zipcode: clubVenue.city  // City field often contains zipcode
                    }, { onConflict: 'team_id' });
                
                if (venueError) {
                    console.log(`    ❌ Error saving venue:`, venueError.message);
                } else {
                    totalVenues++;
                    console.log(`    ✅ Saved venue: ${clubVenue.clubName}`);
                }
            } else {
                console.log(`    ⚠️  No venue found`);
            }

            console.log('');

        } catch (error: any) {
            console.error(`  ❌ Error processing ${teamName}:`, error.message);
            console.log('');
        }
    }

    console.log('==================================================');
    console.log('🎉 Scraping complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   - 180s saved: ${total180s}`);
    console.log(`   - High finishes saved: ${totalHighFinishes}`);
    console.log(`   - Venues saved: ${totalVenues}`);
    console.log('==================================================\n');
    
    // Verify what's actually in the database
    console.log('🔍 Verifying data in Supabase...\n');
    
    const { data: eighties, error: e1 } = await supabase
        .from('one_eighties')
        .select('count')
        .eq('season', SEASON);
    
    const { data: finishes, error: e2 } = await supabase
        .from('high_finishes')
        .select('count')
        .eq('season', SEASON);
    
    const { data: venues, error: e3 } = await supabase
        .from('club_venues')
        .select('count');
    
    if (!e1 && !e2 && !e3) {
        console.log(`📊 Database contains:`);
        console.log(`   - 180s in DB: ${eighties?.length || 0} rows`);
        console.log(`   - High finishes in DB: ${finishes?.length || 0} rows`);
        console.log(`   - Venues in DB: ${venues?.length || 0} rows`);
    } else {
        console.log('⚠️  Could not verify database contents');
        if (e1) console.log('   Error with 180s:', e1.message);
        if (e2) console.log('   Error with high finishes:', e2.message);
        if (e3) console.log('   Error with venues:', e3.message);
    }
    
    console.log('\n==================================================');
}

scrapeAndUpload().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
