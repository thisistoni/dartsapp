/**
 * API Endpoint to sync (scrape and save) league data to Supabase
 * 
 * POST /api/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SEASON = '2025/26';
export const maxDuration = 300;

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function resolveApiBaseUrl(request: NextRequest): string {
    const envBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
    if (envBaseUrl) {
        return envBaseUrl.replace(/\/$/, '');
    }

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedHost = request.headers.get('x-forwarded-host');
    if (forwardedProto && forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
    }

    return request.nextUrl.origin;
}

// Helper function to convert DD.MM.YYYY to YYYY-MM-DD
function convertDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function isOnConflictConstraintError(error: any): boolean {
    const message = error?.message || '';
    const code = error?.code || '';
    return code === '42P10' || /no unique or exclusion constraint matching the ON CONFLICT specification/i.test(message);
}

async function saveTeamWithFallback(teamName: string, division: string, season: string): Promise<{ id: string }> {
    const payload = { name: teamName, division, season };

    const upsertResult = await supabase
        .from('teams')
        .upsert(payload, { onConflict: 'name,season' })
        .select('id')
        .single();

    if (!upsertResult.error && upsertResult.data) {
        return upsertResult.data;
    }

    if (upsertResult.error && !isOnConflictConstraintError(upsertResult.error)) {
        throw upsertResult.error;
    }

    // Fallback for databases where ON CONFLICT target is missing/mismatched.
    const { data: existingForSeason, error: existingForSeasonError } = await supabase
        .from('teams')
        .select('id')
        .eq('name', teamName)
        .eq('season', season)
        .maybeSingle();

    if (existingForSeasonError) {
        throw existingForSeasonError;
    }

    let existingTeamId = existingForSeason?.id;
    if (!existingTeamId) {
        const { data: existingAnySeason, error: existingAnySeasonError } = await supabase
            .from('teams')
            .select('id')
            .eq('name', teamName)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingAnySeasonError) {
            throw existingAnySeasonError;
        }

        existingTeamId = existingAnySeason?.id;
    }

    if (existingTeamId) {
        const { data: updatedTeam, error: updateError } = await supabase
            .from('teams')
            .update({ division, season })
            .eq('id', existingTeamId)
            .select('id')
            .single();

        if (updateError) {
            throw updateError;
        }

        if (!updatedTeam) {
            throw new Error(`Failed to update existing team "${teamName}"`);
        }

        return updatedTeam;
    }

    const { data: insertedTeam, error: insertError } = await supabase
        .from('teams')
        .insert(payload)
        .select('id')
        .single();

    if (insertError) {
        throw insertError;
    }

    if (!insertedTeam) {
        throw new Error(`Failed to insert team "${teamName}"`);
    }

    return insertedTeam;
}

export async function POST(request: NextRequest) {
    try {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials on server (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
        }

        const { searchParams } = new URL(request.url);
        const fullSync = searchParams.get('full') === 'true';
        
        console.log(`🔄 Starting data sync... ${fullSync ? '(FULL SYNC)' : '(INCREMENTAL)'}`);
        
        // 1. Check latest matchday in database
        const { data: latestMatchday } = await supabase
            .from('matchdays')
            .select('round')
            .eq('season', SEASON)
            .order('round', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        const latestRoundInDb = latestMatchday?.round || 0;
        console.log(`📊 Latest matchday in DB: Round ${latestRoundInDb}`);
        
        if (!fullSync && latestRoundInDb > 0) {
            console.log(`⚡ Will only scrape rounds after ${latestRoundInDb}`);
        }
        
        // 2. Scrape fresh data (with optional minRound filter)
        const apiBaseUrl = resolveApiBaseUrl(request);
        const url = fullSync
            ? `${apiBaseUrl}/api/leagueOverview`
            : `${apiBaseUrl}/api/leagueOverview?minRound=${latestRoundInDb}`;
        
        let leagueData;
        try {
            console.log(`🌐 Fetching data from: ${url}`);
            const response = await axios.get(url, { timeout: 240000 });
            leagueData = response.data;
            console.log(`✅ Data fetched successfully`);
        } catch (err: any) {
            const status = err?.response?.status;
            const statusSuffix = status ? ` (status ${status})` : '';
            console.error('❌ Error fetching league data:', err.message, statusSuffix);
            throw new Error(`Failed to fetch league data from API: ${err.message}${statusSuffix}`);
        }
        
        let recordsUpdated = 0;
        const teamMap = new Map<string, string>();

        // 3. Safety filter: only sync new rounds on incremental mode
        const allMatchdays = leagueData?.results?.matchdays || [];
        const matchdaysToSync = fullSync
            ? allMatchdays
            : allMatchdays.filter((md: any) => md.round > latestRoundInDb);
        console.log(`📦 Syncing ${matchdaysToSync.length} matchday(s)`);
        
        // 4. Save Teams
        const teamNames = new Set<string>();
        matchdaysToSync.forEach((md: any) => {
            md.matches.forEach((match: any) => {
                teamNames.add(match.homeTeam);
                teamNames.add(match.awayTeam);
            });
        });

        for (const teamName of teamNames) {
            try {
                const savedTeam = await saveTeamWithFallback(teamName, '5', SEASON);
                teamMap.set(teamName, savedTeam.id);
                recordsUpdated++;
            } catch (err: any) {
                console.error(`❌ Error saving team "${teamName}":`, err.message);
                throw new Error(`Failed to save team "${teamName}": ${err.message}`);
            }
        }

        // 5. Save Team Averages
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

        // 6. Save Matchdays and Matches (filtered)
        for (const matchday of matchdaysToSync) {
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

        // 7. Save Player Statistics
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

        // 7.5. Scrape and Save 180s, High Finishes, and Club Venues for each team
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

        // 8. Save Future Schedule
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

        // 8.5. Save Detailed Match Data (Latest Matches with singles/doubles)
        // Latest matches are already filtered by the API based on minRound
        const latestMatchesToSync = leagueData.latestMatches || [];
        
        console.log(`📋 Syncing ${latestMatchesToSync.length} detailed matches`);
        
        if (latestMatchesToSync && latestMatchesToSync.length > 0) {
            for (const matchDetail of latestMatchesToSync) {
                try {
                    const homeTeamId = teamMap.get(matchDetail.homeTeam);
                    const awayTeamId = teamMap.get(matchDetail.awayTeam);
                    if (!homeTeamId || !awayTeamId) {
                        console.log(`⚠️ Skipping match: ${matchDetail.homeTeam} vs ${matchDetail.awayTeam} - missing team IDs`);
                        continue;
                    }

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
                } catch (matchErr: any) {
                    console.error(`❌ Error processing match ${matchDetail.homeTeam} vs ${matchDetail.awayTeam}:`, matchErr.message);
                    // Continue with next match instead of failing entire sync
                }
            }
        }

        // 9. Calculate and Save League Standings (always calculate from ALL matchdays for accuracy)
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

        // 10. Log sync
        await supabase.from('scrape_logs').insert({
            scrape_type: 'sync',
            season: SEASON,
            status: 'success',
            records_updated: recordsUpdated
        });

        const syncMode = fullSync ? 'full' : 'incremental';
        const message = fullSync 
            ? `Successfully synced ${recordsUpdated} records (FULL SYNC)`
            : `Successfully synced ${recordsUpdated} records (incremental - ${matchdaysToSync.length} matchdays)`;
        
        console.log(`✅ ${message}`);
        
        return NextResponse.json({
            success: true,
            message,
            syncMode,
            matchdaysSynced: matchdaysToSync.length,
            recordsUpdated,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ SYNC ERROR:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        
        await supabase.from('scrape_logs').insert({
            scrape_type: 'sync',
            season: SEASON,
            status: 'error',
            records_updated: 0,
            error_message: errorMessage
        });

        return NextResponse.json({
            success: false,
            error: errorMessage,
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
