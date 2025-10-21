/**
 * API Endpoint to get league data FROM Supabase (fast!)
 * 
 * GET /api/leagueData
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SEASON = '2025/26';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to convert YYYY-MM-DD to DD.MM.YYYY
function formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
}

export async function GET() {
    try {
        console.log('📊 Fetching league data from Supabase...');
        
        // Always return ALL data from Supabase (no scraping here!)
        // Scraper only runs for initial populate or sync (latest matchday only)

        // 1. Get Teams
        const { data: teams } = await supabase
            .from('teams')
            .select('id, name')
            .eq('season', SEASON);

        if (!teams) throw new Error('No teams found');
        
        // Create team lookup map
        const teamIdToName = new Map(teams.map(t => [t.id, t.name]));

        // 2. Get Matchdays with Matches
        const { data: matchdays } = await supabase
            .from('matchdays')
            .select(`
                id,
                round,
                date,
                matches (
                    id,
                    home_team_id,
                    away_team_id,
                    home_sets,
                    away_sets,
                    home_legs,
                    away_legs
                )
            `)
            .eq('season', SEASON)
            .order('round');

        // Transform matchdays
        const results = {
            matchdays: (matchdays || []).map((md: any) => ({
                round: md.round,
                date: formatDate(md.date),
                matches: md.matches.map((match: any) => ({
                    homeTeam: teamIdToName.get(match.home_team_id) || '',
                    awayTeam: teamIdToName.get(match.away_team_id) || '',
                    homeSets: match.home_sets,
                    awaySets: match.away_sets,
                    homeLegs: match.home_legs,
                    awayLegs: match.away_legs
                }))
            }))
        };

        // 3. Get Team Averages
        const { data: teamAveragesData } = await supabase
            .from('team_averages')
            .select('*, teams(name)')
            .eq('season', SEASON);

        const teamAverages: Record<string, any> = {};
        (teamAveragesData || []).forEach((ta: any) => {
            const teamName = ta.teams?.name;
            if (teamName) {
                teamAverages[teamName] = {
                    average: ta.average,
                    singles: `${ta.singles_won}-${ta.singles_lost}`,
                    doubles: `${ta.doubles_won}-${ta.doubles_lost}`
                };
            }
        });

        // 4. Get Player Statistics
        const { data: playerStatsData } = await supabase
            .from('player_statistics')
            .select('*, players(name, teams(name))')
            .eq('season', SEASON)
            .order('combined_percentage', { ascending: false });

        const playerStats = (playerStatsData || []).map((ps: any) => ({
            name: ps.players?.name || '',
            team: ps.players?.teams?.name || '',
            average: ps.average,
            singlesWon: ps.singles_won,
            singlesLost: ps.singles_lost,
            singlesPercentage: ps.singles_percentage,
            doublesWon: ps.doubles_won,
            doublesLost: ps.doubles_lost,
            doublesPercentage: ps.doubles_percentage,
            combinedPercentage: ps.combined_percentage
        }));

        // 5. Get Future Schedule
        const { data: futureScheduleData } = await supabase
            .from('future_schedule')
            .select(`
                round,
                date,
                home_team:teams!future_schedule_home_team_id_fkey(name),
                away_team:teams!future_schedule_away_team_id_fkey(name)
            `)
            .eq('season', SEASON)
            .order('round');

        const futureSchedule = (futureScheduleData || []).map((fs: any) => ({
            round: fs.round,
            date: formatDate(fs.date),
            homeTeam: fs.home_team?.name || '',
            awayTeam: fs.away_team?.name || ''
        }));

        // 6. Get Cup Matches
        const { data: cupMatchesData } = await supabase
            .from('cup_matches')
            .select('*')
            .eq('season', SEASON)
            .order('date');

        const cupMatches = (cupMatchesData || []).map((cm: any) => ({
            round: cm.round_name,
            date: formatDate(cm.date),
            homeTeam: cm.home_team,
            awayTeam: cm.away_team,
            homeDivision: cm.home_division,
            awayDivision: cm.away_division
        }));

        // 7. Get ALL Match Details with Singles Games from Supabase
        console.log('📋 Fetching all matches with detailed singles games...');
        const { data: allMatchesData } = await supabase
            .from('matches')
            .select(`
                id,
                matchdays!inner(round, date),
                home_team_id,
                away_team_id,
                home_sets,
                away_sets,
                singles_games(
                    home_player:players!singles_games_home_player_id_fkey(name),
                    away_player:players!singles_games_away_player_id_fkey(name),
                    home_score,
                    away_score,
                    home_average,
                    away_average,
                    home_checkouts,
                    away_checkouts,
                    game_order
                )
            `)
            .eq('season', SEASON)
            .order('game_order', { foreignTable: 'singles_games' });

        const latestMatches = (allMatchesData || []).map((match: any) => ({
            matchday: match.matchdays?.round,
            date: match.matchdays?.date ? formatDate(match.matchdays.date) : '',
            homeTeam: teamIdToName.get(match.home_team_id),
            awayTeam: teamIdToName.get(match.away_team_id),
            homeSets: match.home_sets,
            awaySets: match.away_sets,
            singles: match.singles_games?.map((sg: any) => ({
                homePlayer: sg.home_player?.name || '',
                awayPlayer: sg.away_player?.name || '',
                homeScore: sg.home_score,
                awayScore: sg.away_score,
                homeAverage: sg.home_average,
                awayAverage: sg.away_average,
                homeCheckouts: sg.home_checkouts?.split(', ').filter(Boolean) || [],
                awayCheckouts: sg.away_checkouts?.split(', ').filter(Boolean) || []
            })) || []
        }));

        // 8. Calculate Best Legs (lowest checkouts) - USE ALREADY FETCHED DATA
        const bestLegs: any[] = [];
        if (latestMatches.length > 0) {
            const checkoutMap = new Map<string, { player: string, team: string, checkout: number, count: number }>();

            // Process data we already have from latestMatches
            latestMatches.forEach((match: any) => {
                match.singles?.forEach((single: any) => {
                    // Process home checkouts
                    if (single.homeCheckouts && Array.isArray(single.homeCheckouts)) {
                        single.homeCheckouts.forEach((checkoutStr: string) => {
                            const checkout = parseInt(checkoutStr.trim());
                            if (!isNaN(checkout) && checkout > 0) {
                                const key = `${single.homePlayer}-${checkout}`;
                                
                                if (!checkoutMap.has(key)) {
                                    checkoutMap.set(key, { player: single.homePlayer, team: match.homeTeam, checkout, count: 1 });
                                } else {
                                    checkoutMap.get(key)!.count++;
                                }
                            }
                        });
                    }

                    // Process away checkouts
                    if (single.awayCheckouts && Array.isArray(single.awayCheckouts)) {
                        single.awayCheckouts.forEach((checkoutStr: string) => {
                            const checkout = parseInt(checkoutStr.trim());
                            if (!isNaN(checkout) && checkout > 0) {
                                const key = `${single.awayPlayer}-${checkout}`;
                                
                                if (!checkoutMap.has(key)) {
                                    checkoutMap.set(key, { player: single.awayPlayer, team: match.awayTeam, checkout, count: 1 });
                                } else {
                                    checkoutMap.get(key)!.count++;
                                }
                            }
                        });
                    }
                });
            });

            // Convert to array and get top 5 lowest checkouts
            const allCheckouts = Array.from(checkoutMap.values());
            bestLegs.push(...allCheckouts.sort((a, b) => a.checkout - b.checkout).slice(0, 5));
        }

        // 9. Calculate Highest Weekly Average (count per player)
        const weeklyAverageWins: any[] = [];
        const highestGamedayAverages: any[] = [];
        if (latestMatches.length > 0) {
            const weeklyWinsMap = new Map<string, { player: string, team: string, count: number }>();

            // Group matches by matchday
            const matchesByMatchday = new Map<number, any[]>();
            (latestMatches || []).forEach((match: any) => {
                if (!matchesByMatchday.has(match.matchday)) {
                    matchesByMatchday.set(match.matchday, []);
                }
                matchesByMatchday.get(match.matchday)!.push(match);
            });

            const allMatchdayAverages: { player: string, team: string, average: number, matchday: number }[] = [];

            // For each matchday, find the best average and calculate matchday averages
            matchesByMatchday.forEach((matches, matchday) => {
                let bestAvg = { player: '', team: '', average: 0 };
                
                // Track each player's averages for this matchday
                const playerMatchdayAverages = new Map<string, { player: string, team: string, averages: number[], team_name: string }>();
                
                matches.forEach((match: any) => {
                    match.singles?.forEach((single: any) => {
                        // Track best single game average
                        if (single.homeAverage > bestAvg.average) {
                            bestAvg = { 
                                player: single.homePlayer, 
                                team: match.homeTeam, 
                                average: single.homeAverage 
                            };
                        }
                        if (single.awayAverage > bestAvg.average) {
                            bestAvg = { 
                                player: single.awayPlayer, 
                                team: match.awayTeam, 
                                average: single.awayAverage 
                            };
                        }

                        // Track home player matchday average
                        if (single.homeAverage > 0) {
                            if (!playerMatchdayAverages.has(single.homePlayer)) {
                                playerMatchdayAverages.set(single.homePlayer, {
                                    player: single.homePlayer,
                                    team: match.homeTeam,
                                    averages: [],
                                    team_name: match.homeTeam
                                });
                            }
                            playerMatchdayAverages.get(single.homePlayer)!.averages.push(single.homeAverage);
                        }

                        // Track away player matchday average
                        if (single.awayAverage > 0) {
                            if (!playerMatchdayAverages.has(single.awayPlayer)) {
                                playerMatchdayAverages.set(single.awayPlayer, {
                                    player: single.awayPlayer,
                                    team: match.awayTeam,
                                    averages: [],
                                    team_name: match.awayTeam
                                });
                            }
                            playerMatchdayAverages.get(single.awayPlayer)!.averages.push(single.awayAverage);
                        }
                    });
                });

                // Calculate matchday averages for each player on this matchday
                playerMatchdayAverages.forEach((data, playerName) => {
                    if (data.averages.length > 0) {
                        const matchdayAvg = data.averages.reduce((sum, avg) => sum + avg, 0) / data.averages.length;
                        // Add to array (allows same player to appear multiple times for different matchdays)
                        allMatchdayAverages.push({
                            player: playerName,
                            team: data.team_name,
                            average: matchdayAvg,
                            matchday: matchday
                        });
                    }
                });

                // Increment count for weekly winner
                if (bestAvg.player && bestAvg.average > 0) {
                    if (!weeklyWinsMap.has(bestAvg.player)) {
                        weeklyWinsMap.set(bestAvg.player, { 
                            player: bestAvg.player, 
                            team: bestAvg.team, 
                            count: 1 
                        });
                    } else {
                        weeklyWinsMap.get(bestAvg.player)!.count++;
                    }
                }
            });

            // Convert to array and sort by count
            weeklyAverageWins.push(...Array.from(weeklyWinsMap.values()).sort((a, b) => b.count - a.count).slice(0, 5));
            
            // Get top 5 highest matchday averages (players can appear multiple times)
            highestGamedayAverages.push(...allMatchdayAverages.sort((a, b) => b.average - a.average).slice(0, 5));
        }

        // 10. Calculate Highest Single Winning Streak - USE ALREADY FETCHED DATA
        const winningStreaks: any[] = [];
        if (latestMatches.length > 0) {
            const playerStreaks = new Map<string, { player: string, team: string, currentStreak: number, maxStreak: number }>();

            // Sort matches by matchday, then process singles in order
            const sortedMatches = [...latestMatches].sort((a, b) => a.matchday - b.matchday);

            sortedMatches.forEach((match: any) => {
                match.singles?.forEach((single: any) => {
                    // Home player
                    if (single.homePlayer) {
                        if (!playerStreaks.has(single.homePlayer)) {
                            playerStreaks.set(single.homePlayer, { player: single.homePlayer, team: match.homeTeam, currentStreak: 0, maxStreak: 0 });
                        }
                        const homeStats = playerStreaks.get(single.homePlayer)!;
                        
                        if (single.homeScore > single.awayScore) {
                            homeStats.currentStreak++;
                            homeStats.maxStreak = Math.max(homeStats.maxStreak, homeStats.currentStreak);
                        } else {
                            homeStats.currentStreak = 0;
                        }
                    }

                    // Away player
                    if (single.awayPlayer) {
                        if (!playerStreaks.has(single.awayPlayer)) {
                            playerStreaks.set(single.awayPlayer, { player: single.awayPlayer, team: match.awayTeam, currentStreak: 0, maxStreak: 0 });
                        }
                        const awayStats = playerStreaks.get(single.awayPlayer)!;
                        
                        if (single.awayScore > single.homeScore) {
                            awayStats.currentStreak++;
                            awayStats.maxStreak = Math.max(awayStats.maxStreak, awayStats.currentStreak);
                        } else {
                            awayStats.currentStreak = 0;
                        }
                    }
                });
            });

            // Get top 5 streaks
            winningStreaks.push(
                ...Array.from(playerStreaks.values())
                    .filter(p => p.maxStreak > 0)
                    .sort((a, b) => b.maxStreak - a.maxStreak)
                    .slice(0, 5)
                    .map(p => ({ player: p.player, team: p.team, streak: p.maxStreak }))
            );
        }

        // Fetch 180s data
        const { data: oneEightysData } = await supabase
            .from('one_eighties')
            .select('*, players(name), teams(name)')
            .eq('season', SEASON)
            .order('count', { ascending: false });

        const top180s = (oneEightysData || [])
            .filter(o => o.count > 0)
            .slice(0, 5)
            .map((o: any) => ({
                player: o.players?.name || '',
                team: o.teams?.name || '',
                count: o.count
            }));

        // Fetch high finishes data
        const { data: highFinishesData } = await supabase
            .from('high_finishes')
            .select('*, players(name), teams(name)')
            .eq('season', SEASON)
            .order('finish', { ascending: false });

        const topHighFinishes = (highFinishesData || [])
            .slice(0, 5)
            .map((hf: any) => ({
                player: hf.players?.name || '',
                team: hf.teams?.name || '',
                finish: hf.finish,
                count: hf.count
            }));

        const response = {
            results,
            teamAverages,
            playerStats,
            futureSchedule,
            cupMatches,
            latestMatches,
            bestLegs,
            weeklyAverageWins,
            highestGamedayAverages,
            winningStreaks,
            top180s,
            topHighFinishes,
            _meta: {
                source: 'supabase',
                season: SEASON,
                timestamp: new Date().toISOString()
            }
        };

        console.log('✅ Data fetched from Supabase');
        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Error fetching from Supabase:', error);
        return NextResponse.json({
            error: error.message,
            _meta: {
                source: 'supabase',
                status: 'error'
            }
        }, { status: 500 });
    }
}
