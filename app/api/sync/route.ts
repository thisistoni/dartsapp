/**
 * API Endpoint to sync (scrape and save) league data to Supabase
 * 
 * POST /api/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SEASON = '2025/26';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to convert DD.MM.YYYY to YYYY-MM-DD
function convertDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
    try {
        console.log('🔄 Starting data sync...');
        
        // 1. Scrape fresh data
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/leagueOverview`);
        const leagueData = response.data;
        
        let recordsUpdated = 0;
        const teamMap = new Map<string, string>();

        // 2. Save Teams
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
                .upsert({ name: teamName, division: '5', season: SEASON }, { onConflict: 'name' })
                .select()
                .single();
            
            if (error) throw error;
            teamMap.set(teamName, data.id);
            recordsUpdated++;
        }

        // 3. Save Team Averages
        for (const [teamName, stats] of Object.entries(leagueData.teamAverages || {})) {
            const teamId = teamMap.get(teamName);
            if (!teamId) continue;
            
            const teamStats = stats as any;
            const [singlesWon, singlesLost] = teamStats.singles?.split('-').map(Number) || [0, 0];
            const [doublesWon, doublesLost] = teamStats.doubles?.split('-').map(Number) || [0, 0];
            
            await supabase
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
            
            recordsUpdated++;
        }

        // 4. Save Matchdays and Matches
        for (const matchday of leagueData.results.matchdays) {
            const isoDate = convertDate(matchday.date);
            const { data: md } = await supabase
                .from('matchdays')
                .upsert({ round: matchday.round, date: isoDate, season: SEASON }, { onConflict: 'round,season' })
                .select()
                .single();
            
            if (!md) continue;

            for (const match of matchday.matches) {
                const homeTeamId = teamMap.get(match.homeTeam);
                const awayTeamId = teamMap.get(match.awayTeam);
                if (!homeTeamId || !awayTeamId) continue;

                await supabase
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
                
                recordsUpdated++;
            }
        }

        // 5. Save Player Statistics
        for (const player of leagueData.playerStats || []) {
            const teamId = teamMap.get(player.team);
            if (!teamId) continue;

            const { data: playerData } = await supabase
                .from('players')
                .upsert(
                    { name: player.name, team_id: teamId, season: SEASON },
                    { onConflict: 'name,team_id,season' }
                )
                .select()
                .single();
            
            if (!playerData) continue;
            
            await supabase
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
            
            recordsUpdated++;
        }

        // 5.5. Scrape and Save 180s, High Finishes, and Club Venues for each team
        console.log('🎯 Scraping 180s, High Finishes, and Club Venues for each team...');
        
        // Import scraper functions dynamically
        const { fetch180sAndHighFinishes, fetchClubVenue } = await import('@/lib/scraper');
        
        for (const teamName of teamNames) {
            const teamId = teamMap.get(teamName);
            if (!teamId) continue;

            console.log(`  📍 Processing ${teamName}...`);

            try {
                // Fetch 180s and High Finishes for this team
                const { oneEightys, highFinishes } = await fetch180sAndHighFinishes(teamName);

                // Save 180s
                for (const oneEighty of oneEightys) {
                    const { data: playerData } = await supabase
                        .from('players')
                        .select('id')
                        .eq('name', oneEighty.playerName)
                        .eq('team_id', teamId)
                        .eq('season', SEASON)
                        .maybeSingle();
                    
                    if (!playerData) continue;

                    await supabase
                        .from('one_eighties')
                        .upsert({
                            player_id: playerData.id,
                            team_id: teamId,
                            season: SEASON,
                            count: oneEighty.count
                        }, { onConflict: 'player_id,season' });
                    
                    recordsUpdated++;
                }

                // Save High Finishes
                for (const hf of highFinishes) {
                    const { data: playerData } = await supabase
                        .from('players')
                        .select('id')
                        .eq('name', hf.playerName)
                        .eq('team_id', teamId)
                        .eq('season', SEASON)
                        .maybeSingle();
                    
                    if (!playerData) continue;

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
                        await supabase
                            .from('high_finishes')
                            .insert({
                                player_id: playerData.id,
                                team_id: teamId,
                                season: SEASON,
                                finish: finish,
                                count: count
                            });
                        
                        recordsUpdated++;
                    }
                }
            } catch (error) {
                console.error(`    ⚠️ Error processing ${teamName}:`, error);
            }
        }

        // 6. Save Future Schedule
        if (leagueData.futureSchedule) {
            for (const game of leagueData.futureSchedule) {
                const homeTeamId = teamMap.get(game.homeTeam);
                const awayTeamId = teamMap.get(game.awayTeam);
                if (!homeTeamId || !awayTeamId) continue;
                
                const isoDate = convertDate(game.date);
                await supabase
                    .from('future_schedule')
                    .upsert({
                        round: game.round,
                        date: isoDate,
                        home_team_id: homeTeamId,
                        away_team_id: awayTeamId,
                        season: SEASON
                    }, { onConflict: 'round,home_team_id,away_team_id,season' });
                
                recordsUpdated++;
            }
        }

        // 6.5. Save Detailed Match Data (Latest Matches with singles/doubles)
        if (leagueData.latestMatches && leagueData.latestMatches.length > 0) {
            for (const matchDetail of leagueData.latestMatches) {
                const homeTeamId = teamMap.get(matchDetail.homeTeam);
                const awayTeamId = teamMap.get(matchDetail.awayTeam);
                if (!homeTeamId || !awayTeamId) continue;

                // Find the matchday
                const { data: matchdayData } = await supabase
                    .from('matchdays')
                    .select('id')
                    .eq('round', matchDetail.matchday)
                    .eq('season', SEASON)
                    .single();
                
                if (!matchdayData) continue;

                // Find the match
                const { data: matchData } = await supabase
                    .from('matches')
                    .select('id')
                    .eq('matchday_id', matchdayData.id)
                    .eq('home_team_id', homeTeamId)
                    .eq('away_team_id', awayTeamId)
                    .single();
                
                if (!matchData) continue;

                // Delete existing games
                await supabase
                    .from('singles_games')
                    .delete()
                    .eq('match_id', matchData.id);
                
                await supabase
                    .from('doubles_games')
                    .delete()
                    .eq('match_id', matchData.id);

                // Save singles games
                if (matchDetail.singles) {
                    for (let i = 0; i < matchDetail.singles.length; i++) {
                        const single = matchDetail.singles[i];
                        
                        // Get/create players
                        const { data: homePlayer } = await supabase
                            .from('players')
                            .upsert({
                                name: single.homePlayer,
                                team_id: homeTeamId,
                                season: SEASON
                            }, { onConflict: 'name,team_id,season' })
                            .select('id')
                            .single();

                        const { data: awayPlayer } = await supabase
                            .from('players')
                            .upsert({
                                name: single.awayPlayer,
                                team_id: awayTeamId,
                                season: SEASON
                            }, { onConflict: 'name,team_id,season' })
                            .select('id')
                            .single();
                        
                        if (!homePlayer || !awayPlayer) continue;
                        
                        const homeCheckouts = Array.isArray(single.homeCheckouts) 
                            ? single.homeCheckouts.join(', ') 
                            : single.homeCheckouts || null;
                        const awayCheckouts = Array.isArray(single.awayCheckouts) 
                            ? single.awayCheckouts.join(', ') 
                            : single.awayCheckouts || null;
                        
                        await supabase.from('singles_games').insert({
                            match_id: matchData.id,
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
                        
                        recordsUpdated++;
                    }
                }

                // Save doubles games
                if (matchDetail.doubles) {
                    for (let i = 0; i < matchDetail.doubles.length; i++) {
                        const double = matchDetail.doubles[i];
                        
                        const homePlayer1Name = double.homePlayers?.[0];
                        const homePlayer2Name = double.homePlayers?.[1];
                        const awayPlayer1Name = double.awayPlayers?.[0];
                        const awayPlayer2Name = double.awayPlayers?.[1];

                        if (!homePlayer1Name || !homePlayer2Name || !awayPlayer1Name || !awayPlayer2Name) continue;

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

                        if (!hp1 || !hp2 || !ap1 || !ap2) continue;

                        await supabase.from('doubles_games').insert({
                            match_id: matchData.id,
                            home_player1_id: hp1.id,
                            home_player2_id: hp2.id,
                            away_player1_id: ap1.id,
                            away_player2_id: ap2.id,
                            home_score: double.homeScore,
                            away_score: double.awayScore,
                            game_order: i + 1
                        });
                        
                        recordsUpdated++;
                    }
                }
            }
        }

        // 7. Calculate and Save League Standings
        const standings = calculateStandings(leagueData.results.matchdays, teamMap);
        for (const standing of standings) {
            await supabase
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
            
            recordsUpdated++;
        }

        // 8. Log sync
        await supabase.from('scrape_logs').insert({
            scrape_type: 'sync',
            season: SEASON,
            status: 'success',
            records_updated: recordsUpdated
        });

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${recordsUpdated} records`,
            recordsUpdated,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        
        await supabase.from('scrape_logs').insert({
            scrape_type: 'sync',
            season: SEASON,
            status: 'error',
            records_updated: 0,
            error_message: error.message
        });

        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
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
