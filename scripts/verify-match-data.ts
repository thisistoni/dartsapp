/**
 * Verify match data in Supabase
 * Check singles games, checkouts, and averages
 * 
 * Usage: npx tsx scripts/verify-match-data.ts
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

async function verifyMatchData() {
    console.log('🔍 Verifying match data in Supabase...\n');
    
    // Get a sample match
    const { data: matches } = await supabase
        .from('matches')
        .select(`
            *,
            matchdays(round, date),
            teams_home:teams!matches_home_team_id_fkey(name),
            teams_away:teams!matches_away_team_id_fkey(name),
            singles_games(
                game_order,
                home_player:players!singles_games_home_player_id_fkey(name),
                away_player:players!singles_games_away_player_id_fkey(name),
                home_score,
                away_score,
                home_average,
                away_average,
                home_checkouts,
                away_checkouts
            ),
            doubles_games(
                game_order,
                home_player1:players!doubles_games_home_player1_id_fkey(name),
                home_player2:players!doubles_games_home_player2_id_fkey(name),
                away_player1:players!doubles_games_away_player1_id_fkey(name),
                away_player2:players!doubles_games_away_player2_id_fkey(name),
                home_score,
                away_score
            )
        `)
        .eq('season', SEASON)
        .limit(5);

    if (!matches || matches.length === 0) {
        console.log('❌ No matches found!');
        return;
    }

    console.log(`Found ${matches.length} matches\n`);

    matches.forEach((match: any, idx) => {
        console.log(`\n📊 Match ${idx + 1}: ${match.teams_home.name} vs ${match.teams_away.name}`);
        console.log(`   Score: ${match.home_sets}-${match.away_sets}`);
        console.log(`   Round: ${match.matchdays.round}`);
        
        // Check singles games
        const singlesCount = match.singles_games?.length || 0;
        console.log(`\n   Singles Games: ${singlesCount}/4`);
        
        if (singlesCount < 4) {
            console.log(`   ⚠️  MISSING ${4 - singlesCount} singles games!`);
        }
        
        match.singles_games?.forEach((sg: any, i: number) => {
            console.log(`   S${i + 1} (order ${sg.game_order}): ${sg.home_player?.name} vs ${sg.away_player?.name} | ${sg.home_score}-${sg.away_score}`);
            console.log(`       Averages: ${sg.home_average || 'MISSING'} / ${sg.away_average || 'MISSING'}`);
            console.log(`       Checkouts: ${sg.home_checkouts || 'NONE'} / ${sg.away_checkouts || 'NONE'}`);
            
            if (!sg.home_average || !sg.away_average) {
                console.log(`       ⚠️  Missing averages!`);
            }
        });
        
        // Check doubles games
        const doublesCount = match.doubles_games?.length || 0;
        console.log(`\n   Doubles Games: ${doublesCount}`);
        
        match.doubles_games?.forEach((dg: any, i: number) => {
            console.log(`   D${i + 1} (order ${dg.game_order}): ${dg.home_player1?.name}/${dg.home_player2?.name} vs ${dg.away_player1?.name}/${dg.away_player2?.name} | ${dg.home_score}-${dg.away_score}`);
        });
    });

    console.log('\n\n==================================================');
    console.log('📋 Summary:');
    const totalSingles = matches.reduce((sum, m) => sum + (m.singles_games?.length || 0), 0);
    const expectedSingles = matches.length * 4;
    console.log(`   Singles games: ${totalSingles}/${expectedSingles} (${Math.round(totalSingles/expectedSingles*100)}%)`);
    
    const singlesWithCheckouts = matches.reduce((sum, m) => 
        sum + (m.singles_games?.filter((sg: any) => sg.home_checkouts || sg.away_checkouts).length || 0), 0);
    console.log(`   Singles with checkouts: ${singlesWithCheckouts}/${totalSingles}`);
    
    const singlesWithAverages = matches.reduce((sum, m) => 
        sum + (m.singles_games?.filter((sg: any) => sg.home_average && sg.away_average).length || 0), 0);
    console.log(`   Singles with averages: ${singlesWithAverages}/${totalSingles}`);
    console.log('==================================================');
}

verifyMatchData().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
