/**
 * Populate Supabase with data from your API
 * 
 * Usage: Make sure dev server is running (npm run dev), then:
 *   npx tsx scripts/populate-from-api.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SEASON = '2025/26';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to convert DD.MM.YYYY to YYYY-MM-DD
function convertDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveLeagueOverview() {
    console.log('📊 Fetching league overview data from API...');
    console.log(`   URL: ${API_BASE_URL}/api/leagueOverview\n`);
    
    try {
        const response = await axios.get(`${API_BASE_URL}/api/leagueOverview`);
        const leagueData = response.data;
        
        console.log('✅ Data fetched successfully!\n');
        
        let recordsUpdated = 0;
        const teamMap = new Map<string, string>();

        // 1. Save Teams
        console.log('🏢 Saving teams...');
        const teamNames = new Set<string>();
        
        leagueData.results.matchdays.forEach((md: any) => {
            md.matches.forEach((match: any) => {
                teamNames.add(match.homeTeam);
                teamNames.add(match.awayTeam);
            });
        });

        for (const teamName of teamNames) {
            const { data, error } = await supabase
                .from('teams')
                .upsert({ name: teamName, division: '5', season: SEASON }, { onConflict: 'name,season' })
                .select()
                .single();
            
            if (error) throw error;
            teamMap.set(teamName, data.id);
            console.log(`  ✅ ${teamName}`);
            recordsUpdated++;
        }

        // 2. Save Team Averages
        console.log('\n📈 Saving team averages...');
        for (const [teamName, stats] of Object.entries(leagueData.teamAverages || {})) {
            const teamId = teamMap.get(teamName);
            if (!teamId) continue;
            
            const teamStats = stats as any;
            const [singlesWon, singlesLost] = teamStats.singles?.split('-').map(Number) || [0, 0];
            const [doublesWon, doublesLost] = teamStats.doubles?.split('-').map(Number) || [0, 0];
            
            const { error } = await supabase
                .from('team_averages')
                .upsert({
                    team_id: teamId,
                    season: SEASON,
                    average: teamStats.average,
                    singles_won: singlesWon,
                    singles_lost: singlesLost,
                    doubles_won: doublesWon,
                    doubles_lost: doublesLost
                }, { onConflict: 'team_id,season' });
            
            if (error) throw error;
            console.log(`  ✅ ${teamName}: ${teamStats.average?.toFixed(2)} avg`);
            recordsUpdated++;
        }

        // 3. Save Matchdays and Matches
        console.log('\n⚽ Saving matches...');
        for (const matchday of leagueData.results.matchdays) {
            const isoDate = convertDate(matchday.date);
            const { data: md, error: mdError } = await supabase
                .from('matchdays')
                .upsert({ round: matchday.round, date: isoDate, season: SEASON }, { onConflict: 'round,season' })
                .select()
                .single();
            
            if (mdError) throw mdError;
            console.log(`\n  📅 Matchday ${md.round} (${matchday.date})`);

            for (const match of matchday.matches) {
                const homeTeamId = teamMap.get(match.homeTeam);
                const awayTeamId = teamMap.get(match.awayTeam);
                
                if (!homeTeamId || !awayTeamId) continue;

                const { error } = await supabase
                    .from('matches')
                    .upsert({
                        matchday_id: md.id,
                        home_team_id: homeTeamId,
                        away_team_id: awayTeamId,
                        home_sets: match.homeSets,
                        away_sets: match.awaySets,
                        home_legs: match.homeLegs,
                        away_legs: match.awayLegs,
                        season: SEASON
                    }, { onConflict: 'matchday_id,home_team_id,away_team_id' });
                
                if (error) throw error;
                console.log(`    ✅ ${match.homeTeam} ${match.homeSets}-${match.awaySets} ${match.awayTeam}`);
                recordsUpdated++;
            }
        }

        // 4. Save Player Statistics
        console.log('\n👥 Saving player statistics...');
        const playerMap = new Map<string, string>();
        
        for (const player of leagueData.playerStats || []) {
            const teamId = teamMap.get(player.team);
            if (!teamId) continue;

            // Create/get player
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .upsert(
                    { name: player.name, team_id: teamId, season: SEASON },
                    { onConflict: 'name,team_id,season' }
                )
                .select()
                .single();
            
            if (playerError) throw playerError;
            playerMap.set(player.name, playerData.id);
            
            // Save statistics
            const { error: statsError } = await supabase
                .from('player_statistics')
                .upsert({
                    player_id: playerData.id,
                    season: SEASON,
                    average: player.average,
                    singles_won: player.singlesWon || 0,
                    singles_lost: player.singlesLost || 0,
                    singles_percentage: player.singlesPercentage,
                    doubles_won: player.doublesWon || 0,
                    doubles_lost: player.doublesLost || 0,
                    doubles_percentage: player.doublesPercentage,
                    combined_percentage: player.combinedPercentage
                }, { onConflict: 'player_id,season' });
            
            if (statsError) throw statsError;
            recordsUpdated++;
        }
        console.log(`  ✅ Saved ${leagueData.playerStats?.length || 0} player records`);

        // 5. Save Future Schedule
        console.log('\n📅 Saving future schedule...');
        if (leagueData.futureSchedule && leagueData.futureSchedule.length > 0) {
            for (const game of leagueData.futureSchedule) {
                const homeTeamId = teamMap.get(game.homeTeam);
                const awayTeamId = teamMap.get(game.awayTeam);
                
                if (!homeTeamId || !awayTeamId) continue;
                
                const isoDate = convertDate(game.date);
                const { error } = await supabase
                    .from('future_schedule')
                    .upsert({
                        round: game.round,
                        date: isoDate,
                        home_team_id: homeTeamId,
                        away_team_id: awayTeamId,
                        season: SEASON
                    }, { onConflict: 'round,home_team_id,away_team_id,season' });
                
                if (error) throw error;
                recordsUpdated++;
            }
            console.log(`  ✅ Saved ${leagueData.futureSchedule.length} future matches`);
        }

        // 7. Save Detailed Match Data (Latest Matches with singles/doubles)
        console.log('\n🎯 Saving detailed match data...');
        let singlesGamesSaved = 0;
        let doublesGamesSaved = 0;
        
        if (leagueData.latestMatches && leagueData.latestMatches.length > 0) {
            for (const matchDetail of leagueData.latestMatches) {
                // Find the match in database by team names and matchday
                const homeTeamId = teamMap.get(matchDetail.homeTeam);
                const awayTeamId = teamMap.get(matchDetail.awayTeam);
                
                if (!homeTeamId || !awayTeamId) {
                    console.log(`  ⚠️ Skipping match: ${matchDetail.homeTeam} vs ${matchDetail.awayTeam} - teams not found`);
                    continue;
                }

                // Find the matchday
                const { data: matchdayData } = await supabase
                    .from('matchdays')
                    .select('id')
                    .eq('round', matchDetail.matchday)
                    .eq('season', SEASON)
                    .single();
                
                if (!matchdayData) {
                    console.log(`  ⚠️ Skipping: matchday ${matchDetail.matchday} not found`);
                    continue;
                }

                // Find the specific match
                const { data: matchData } = await supabase
                    .from('matches')
                    .select('id')
                    .eq('matchday_id', matchdayData.id)
                    .eq('home_team_id', homeTeamId)
                    .eq('away_team_id', awayTeamId)
                    .single();
                
                if (!matchData) {
                    console.log(`  ⚠️ Skipping: match not found for ${matchDetail.homeTeam} vs ${matchDetail.awayTeam}`);
                    continue;
                }

                const matchId = matchData.id;
                console.log(`  📍 Processing match: ${matchDetail.homeTeam} vs ${matchDetail.awayTeam} (MD ${matchDetail.matchday})`);

                // Delete existing games for this match (to avoid duplicates)
                await supabase
                    .from('singles_games')
                    .delete()
                    .eq('match_id', matchId);
                
                await supabase
                    .from('doubles_games')
                    .delete()
                    .eq('match_id', matchId);

                // Save singles games
                if (matchDetail.singles && matchDetail.singles.length > 0) {
                    for (let i = 0; i < matchDetail.singles.length; i++) {
                        const single = matchDetail.singles[i];
                        
                        // Get or create home player
                        const { data: homePlayerData, error: homePlayerError } = await supabase
                            .from('players')
                            .upsert({
                                name: single.homePlayer,
                                team_id: homeTeamId,
                                season: SEASON
                            }, { onConflict: 'name,team_id,season' })
                            .select('id')
                            .single();
                        
                        if (homePlayerError || !homePlayerData) {
                            console.log(`    ⚠️ Could not create/find player: ${single.homePlayer}`);
                            continue;
                        }

                        // Get or create away player
                        const { data: awayPlayerData, error: awayPlayerError } = await supabase
                            .from('players')
                            .upsert({
                                name: single.awayPlayer,
                                team_id: awayTeamId,
                                season: SEASON
                            }, { onConflict: 'name,team_id,season' })
                            .select('id')
                            .single();
                        
                        if (awayPlayerError || !awayPlayerData) {
                            console.log(`    ⚠️ Could not create/find player: ${single.awayPlayer}`);
                            continue;
                        }
                        
                        // Insert singles game
                        const homeCheckouts = Array.isArray(single.homeCheckouts) 
                            ? single.homeCheckouts.join(', ') 
                            : single.homeCheckouts || null;
                        const awayCheckouts = Array.isArray(single.awayCheckouts) 
                            ? single.awayCheckouts.join(', ') 
                            : single.awayCheckouts || null;
                        
                        const { error: singlesError } = await supabase
                            .from('singles_games')
                            .insert({
                                match_id: matchId,
                                home_player_id: homePlayerData.id,
                                away_player_id: awayPlayerData.id,
                                home_score: single.homeScore,
                                away_score: single.awayScore,
                                home_average: single.homeAverage,
                                away_average: single.awayAverage,
                                home_checkouts: homeCheckouts,
                                away_checkouts: awayCheckouts,
                                game_order: i + 1
                            });
                        
                        if (singlesError) {
                            console.log(`    ⚠️ Error saving singles game: ${singlesError.message}`);
                        } else {
                            singlesGamesSaved++;
                        }
                    }
                    console.log(`    ✅ Saved ${matchDetail.singles.length} singles games`);
                }

                // Save doubles games
                if (matchDetail.doubles && matchDetail.doubles.length > 0) {
                    for (let i = 0; i < matchDetail.doubles.length; i++) {
                        const double = matchDetail.doubles[i];
                        
                        // Get or create home players
                        const homePlayer1Name = double.homePlayers?.[0];
                        const homePlayer2Name = double.homePlayers?.[1];
                        const awayPlayer1Name = double.awayPlayers?.[0];
                        const awayPlayer2Name = double.awayPlayers?.[1];

                        if (!homePlayer1Name || !homePlayer2Name || !awayPlayer1Name || !awayPlayer2Name) {
                            console.log(`    ⚠️ Skipping doubles game ${i + 1}: missing player names`);
                            continue;
                        }

                        // Get/create all 4 players
                        const { data: hp1 } = await supabase
                            .from('players')
                            .upsert({ name: homePlayer1Name, team_id: homeTeamId, season: SEASON }, { onConflict: 'name,team_id,season' })
                            .select('id')
                            .single();
                        
                        const { data: hp2 } = await supabase
                            .from('players')
                            .upsert({ name: homePlayer2Name, team_id: homeTeamId, season: SEASON }, { onConflict: 'name,team_id,season' })
                            .select('id')
                            .single();
                        
                        const { data: ap1 } = await supabase
                            .from('players')
                            .upsert({ name: awayPlayer1Name, team_id: awayTeamId, season: SEASON }, { onConflict: 'name,team_id,season' })
                            .select('id')
                            .single();
                        
                        const { data: ap2 } = await supabase
                            .from('players')
                            .upsert({ name: awayPlayer2Name, team_id: awayTeamId, season: SEASON }, { onConflict: 'name,team_id,season' })
                            .select('id')
                            .single();

                        if (!hp1 || !hp2 || !ap1 || !ap2) {
                            console.log(`    ⚠️ Could not create/find all doubles players`);
                            continue;
                        }

                        // Insert doubles game
                        const { error: doublesError } = await supabase
                            .from('doubles_games')
                            .insert({
                                match_id: matchId,
                                home_player1_id: hp1.id,
                                home_player2_id: hp2.id,
                                away_player1_id: ap1.id,
                                away_player2_id: ap2.id,
                                home_score: double.homeScore,
                                away_score: double.awayScore,
                                game_order: i + 1
                            });
                        
                        if (doublesError) {
                            console.log(`    ⚠️ Error saving doubles game: ${doublesError.message}`);
                        } else {
                            doublesGamesSaved++;
                        }
                    }
                    console.log(`    ✅ Saved ${matchDetail.doubles.length} doubles games`);
                }
            }
            console.log(`  ✅ Total: Saved ${singlesGamesSaved} singles games and ${doublesGamesSaved} doubles games for ${leagueData.latestMatches.length} matches`);
        }

        // 8. Calculate and Save League Standings
        console.log('\n🏆 Calculating league standings...');
        const standings = calculateStandings(leagueData.results.matchdays, teamMap);
        
        for (const standing of standings) {
            const { error } = await supabase
                .from('league_standings')
                .upsert({
                    team_id: standing.teamId,
                    season: SEASON,
                    position: standing.position,
                    played: standing.played,
                    points: standing.points,
                    legs_for: standing.legsFor,
                    legs_against: standing.legsAgainst,
                    goal_diff: standing.goalDiff
                }, { onConflict: 'team_id,season' });
            
            if (error) throw error;
            console.log(`  ${standing.position}. ${standing.teamName} - ${standing.points} pts`);
            recordsUpdated++;
        }

        // 9. Log scrape
        await supabase.from('scrape_logs').insert({
            scrape_type: 'league_overview',
            season: SEASON,
            status: 'success',
            records_updated: recordsUpdated
        });
        
        console.log(`\n✅ Successfully saved ${recordsUpdated} records to Supabase!`);
        console.log('\n📊 Summary:');
        console.log(`   - Teams: ${teamNames.size}`);
        console.log(`   - Players: ${playerMap.size}`);
        console.log(`   - Matches: ${leagueData.results.matchdays.flatMap((md: any) => md.matches).length}`);
        console.log(`   - Player Stats: ${leagueData.playerStats?.length || 0}`);
        
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        
        await supabase.from('scrape_logs').insert({
            scrape_type: 'league_overview',
            season: SEASON,
            status: 'error',
            records_updated: 0,
            error_message: error.message
        });
        
        throw error;
    }
}

function calculateStandings(matchdays: any[], teamMap: Map<string, string>) {
    const teamStats: Record<string, any> = {};
    
    matchdays.forEach(matchday => {
        matchday.matches.forEach((match: any) => {
            const homeTeamId = teamMap.get(match.homeTeam);
            const awayTeamId = teamMap.get(match.awayTeam);
            
            if (!homeTeamId || !awayTeamId) return;

            if (!teamStats[match.homeTeam]) {
                teamStats[match.homeTeam] = {
                    teamId: homeTeamId,
                    teamName: match.homeTeam,
                    played: 0,
                    points: 0,
                    legsFor: 0,
                    legsAgainst: 0
                };
            }
            if (!teamStats[match.awayTeam]) {
                teamStats[match.awayTeam] = {
                    teamId: awayTeamId,
                    teamName: match.awayTeam,
                    played: 0,
                    points: 0,
                    legsFor: 0,
                    legsAgainst: 0
                };
            }

            teamStats[match.homeTeam].played++;
            teamStats[match.awayTeam].played++;
            teamStats[match.homeTeam].legsFor += match.homeLegs;
            teamStats[match.homeTeam].legsAgainst += match.awayLegs;
            teamStats[match.awayTeam].legsFor += match.awayLegs;
            teamStats[match.awayTeam].legsAgainst += match.homeLegs;
            teamStats[match.homeTeam].points += match.homeSets;
            teamStats[match.awayTeam].points += match.awaySets;
        });
    });

    return Object.values(teamStats)
        .map(team => ({
            ...team,
            goalDiff: team.legsFor - team.legsAgainst
        }))
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.goalDiff - a.goalDiff;
        })
        .map((team, index) => ({ ...team, position: index + 1 }));
}

async function main() {
    console.log('🚀 Populating Supabase from API\n');
    console.log('='.repeat(50) + '\n');
    
    try {
        // Test connection
        console.log('🔌 Testing connection...');
        const { error } = await supabase.from('teams').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Connected to Supabase!\n');
        
        // Save data
        await saveLeagueOverview();
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 Population complete!');
        console.log('\n💡 Next steps:');
        console.log('   1. Check your Supabase dashboard to see the data');
        console.log('   2. Update API routes to read from Supabase');
        console.log('   3. Enjoy instant data loading! 🚀\n');
        
    } catch (error: any) {
        console.error('\n❌ Population failed:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Your dev server is running (npm run dev)');
        console.log('   2. The schema.sql was run in Supabase');
        console.log('   3. .env.local has correct credentials\n');
        process.exit(1);
    }
}

main();
