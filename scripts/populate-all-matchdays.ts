/**
 * Populate matchdays with detailed singles games data from leagueOverview API
 * 
 * This script fetches detailed match data from the leagueOverview API
 * and saves singles games, averages, and checkouts to Supabase.
 * 
 * NOTE: Currently, the leagueOverview API only provides detailed data for
 * the LATEST matchday. To get historical data for all matchdays, you would
 * need to modify the scraper to fetch all matchday details.
 * 
 * Usage: Make sure dev server is running (npm run dev), then:
 *   npx tsx scripts/populate-all-matchdays.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SEASON = '2025/26';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('\n🚀 Populating Matchdays with Detailed Data from API\n');
    console.log('==================================================\n');

    try {
        // Test connection
        console.log('🔌 Testing Supabase connection...');
        const { error: connectionError } = await supabase.from('teams').select('count').single();
        if (connectionError && connectionError.code !== 'PGRST116') {
            throw new Error(`Connection failed: ${connectionError.message}`);
        }
        console.log('✅ Connected to Supabase!\n');

        // Get all matchdays from Supabase
        console.log('📅 Fetching all matchdays from database...');
        const { data: matchdays, error: matchdaysError } = await supabase
            .from('matchdays')
            .select('id, round, date')
            .eq('season', SEASON)
            .order('round');

        if (matchdaysError) throw matchdaysError;
        if (!matchdays || matchdays.length === 0) {
            console.log('⚠️  No matchdays found. Run populate-from-api.ts first!');
            process.exit(0);
        }

        console.log(`✅ Found ${matchdays.length} matchdays to process\n`);

        // Get team mapping
        const { data: teams } = await supabase
            .from('teams')
            .select('id, name')
            .eq('season', SEASON);

        const teamMap = new Map(teams?.map(t => [t.name, t.id]) || []);

        let totalSinglesGames = 0;
        let totalMatchesProcessed = 0;

        // Fetch ALL detailed match data from leagueOverview API
        console.log('📊 Fetching all match details from leagueOverview API...');
        const response = await axios.get(`${API_BASE_URL}/api/leagueOverview`);
        const leagueData = response.data;

        if (!leagueData.latestMatches || leagueData.latestMatches.length === 0) {
            console.log('⚠️  No detailed match data found in leagueOverview API');
            console.log('ℹ️  The API might only have data for the latest matchday');
            process.exit(0);
        }

        console.log(`✅ Found detailed data for ${leagueData.latestMatches.length} matches\n`);

        // Group matches by matchday
        const matchesByMatchday = new Map<number, any[]>();
        leagueData.latestMatches.forEach((match: any) => {
            if (!matchesByMatchday.has(match.matchday)) {
                matchesByMatchday.set(match.matchday, []);
            }
            matchesByMatchday.get(match.matchday)!.push(match);
        });

        // Process each matchday
        for (const matchday of matchdays) {
            console.log(`\n🎯 Processing Matchday ${matchday.round}...`);

            const matchdayMatches = matchesByMatchday.get(matchday.round);
            
            if (!matchdayMatches || matchdayMatches.length === 0) {
                console.log(`  ⚠️  No detailed data available for matchday ${matchday.round}`);
                console.log(`  ℹ️  Only basic match scores exist for this matchday`);
                continue;
            }

            console.log(`  Found ${matchdayMatches.length} matches with detailed data`);

            // Process each match
            for (const matchDetail of matchdayMatches) {
                console.log(`\n  📍 ${matchDetail.homeTeam} vs ${matchDetail.awayTeam}`);

                try {
                    // Find the match in database
                    const homeTeamId = teamMap.get(matchDetail.homeTeam);
                    const awayTeamId = teamMap.get(matchDetail.awayTeam);

                    if (!homeTeamId || !awayTeamId) {
                        console.log(`    ⚠️  Teams not found in database`);
                        continue;
                    }

                    const { data: matchData } = await supabase
                        .from('matches')
                        .select('id')
                        .eq('matchday_id', matchday.id)
                        .eq('home_team_id', homeTeamId)
                        .eq('away_team_id', awayTeamId)
                        .single();

                    if (!matchData) {
                        console.log(`    ⚠️  Match not found in database`);
                        continue;
                    }

                    const matchId = matchData.id;

                    // Delete existing singles games for this match
                    await supabase
                        .from('singles_games')
                        .delete()
                        .eq('match_id', matchId);

                    let singlesCount = 0;

                    // Save singles games
                    if (matchDetail.singles && matchDetail.singles.length > 0) {
                        for (let i = 0; i < matchDetail.singles.length; i++) {
                            const single = matchDetail.singles[i];

                            // Get or create home player
                            const { data: homePlayer } = await supabase
                                .from('players')
                                .upsert({
                                    name: single.homePlayer,
                                    team_id: homeTeamId,
                                    season: SEASON
                                }, { onConflict: 'name,team_id,season' })
                                .select('id')
                                .single();

                            // Get or create away player
                            const { data: awayPlayer } = await supabase
                                .from('players')
                                .upsert({
                                    name: single.awayPlayer,
                                    team_id: awayTeamId,
                                    season: SEASON
                                }, { onConflict: 'name,team_id,season' })
                                .select('id')
                                .single();

                            if (!homePlayer || !awayPlayer) {
                                console.log(`      ⚠️  Could not find/create players`);
                                continue;
                            }

                            // Handle checkouts (might be array or string)
                            const homeCheckouts = Array.isArray(single.homeCheckouts)
                                ? single.homeCheckouts.join(', ')
                                : single.homeCheckouts || null;
                            const awayCheckouts = Array.isArray(single.awayCheckouts)
                                ? single.awayCheckouts.join(', ')
                                : single.awayCheckouts || null;

                            // Insert singles game
                            const { error: singlesError } = await supabase
                                .from('singles_games')
                                .insert({
                                    match_id: matchId,
                                    home_player_id: homePlayer.id,
                                    away_player_id: awayPlayer.id,
                                    home_score: single.homeScore,
                                    away_score: single.awayScore,
                                    home_average: single.homeAverage,
                                    away_average: single.awayAverage,
                                    home_checkouts: homeCheckouts,
                                    away_checkouts: awayCheckouts,
                                    game_order: i + 1
                                });

                            if (singlesError) {
                                console.log(`      ⚠️  Error saving singles game: ${singlesError.message}`);
                            } else {
                                singlesCount++;
                                totalSinglesGames++;
                            }
                        }

                        console.log(`    ✅ Saved ${singlesCount} singles games`);
                        totalMatchesProcessed++;
                    } else {
                        console.log(`    ⚠️  No singles data found for this match`);
                    }

                } catch (error: any) {
                    console.log(`    ⚠️  Error processing match: ${error.message}`);
                }
            }
        }

        console.log('\n==================================================');
        console.log('🎉 Population Complete!\n');
        console.log(`📊 Summary:`);
        console.log(`   - Matchdays checked: ${matchdays.length}`);
        console.log(`   - Matches with detailed data: ${totalMatchesProcessed}`);
        console.log(`   - Total singles games saved: ${totalSinglesGames}`);
        
        if (totalMatchesProcessed === 0) {
            console.log('\n⚠️  No detailed match data was found!');
            console.log('ℹ️  The leagueOverview API currently only provides detailed');
            console.log('   data for the LATEST matchday. Other matchdays only have');
            console.log('   basic match scores (already saved by populate-from-api.ts).');
        }
        
        console.log('\n==================================================\n');

        // Log the backfill
        await supabase.from('scrape_logs').insert({
            scrape_type: 'backfill_all_matchdays',
            season: SEASON,
            status: 'success',
            records_updated: totalSinglesGames
        });

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error(error);

        await supabase.from('scrape_logs').insert({
            scrape_type: 'backfill_all_matchdays',
            season: SEASON,
            status: 'error',
            records_updated: 0,
            error_message: error.message
        });

        process.exit(1);
    }
}

main();
