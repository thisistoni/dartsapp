import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SEASON = '2025/26';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get('team');
    const season = searchParams.get('season') || SEASON;

    if (!teamName) {
        return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    try {
        console.log(`📊 Fetching team data for ${teamName} from Supabase...`);

        // 1. Get team ID
        const { data: team } = await supabase
            .from('teams')
            .select('id, name, division')
            .eq('name', teamName)
            .eq('season', season)
            .single();

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // 2. Get club venue
        const { data: clubVenue } = await supabase
            .from('club_venues')
            .select('*')
            .eq('team_id', team.id)
            .single();

        // 3. Get player statistics for this team
        const { data: playerStats } = await supabase
            .from('player_statistics')
            .select(`
                player_id,
                players!inner(name),
                average,
                singles_won,
                singles_lost,
                doubles_won,
                doubles_lost
            `)
            .eq('season', season)
            .eq('players.team_id', team.id);

        const players = (playerStats || [])
            .map((p: any) => ({
                playerName: p.players.name,  // Match expected structure
                average: p.average,
                adjustedAverage: p.average,  // Same as average for compatibility
                singles: `${p.singles_won}-${p.singles_lost}`,  // W-L format
                singlesWon: p.singles_won,
                singlesLost: p.singles_lost,
                doublesWon: p.doubles_won,
                doublesLost: p.doubles_lost,
                totalGames: p.singles_won + p.singles_lost + p.doubles_won + p.doubles_lost
            }))
            .sort((a, b) => b.average - a.average); // Sort by average descending

        // 4. Get all matches for this team
        const { data: matches } = await supabase
            .from('matches')
            .select(`
                id,
                matchdays!inner(round, date),
                home_team_id,
                away_team_id,
                home_sets,
                away_sets,
                teams_home:teams!matches_home_team_id_fkey(name),
                teams_away:teams!matches_away_team_id_fkey(name),
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
                ),
                doubles_games(
                    home_player1:players!doubles_games_home_player1_id_fkey(name),
                    home_player2:players!doubles_games_home_player2_id_fkey(name),
                    away_player1:players!doubles_games_away_player1_id_fkey(name),
                    away_player2:players!doubles_games_away_player2_id_fkey(name),
                    home_score,
                    away_score,
                    game_order
                )
            `)
            .eq('season', season)
            .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
            .order('date', { foreignTable: 'matchdays', ascending: false })
            .order('round', { foreignTable: 'matchdays', ascending: false })
            .order('game_order', { foreignTable: 'singles_games', ascending: true })
            .order('game_order', { foreignTable: 'doubles_games', ascending: true });

        // 5. Transform matches into match reports
        const matchReports = (matches || [])
            .filter((match: any) => {
                // Skip matches with missing team data
                if (!match.teams_away || !match.teams_home) {
                    console.log(`Skipping match ${match.id} - missing team data`);
                    return false;
                }
                return true;
            })
            .map((match: any) => {
            const isHome = match.home_team_id === team.id;
            const opponent = isHome ? match.teams_away.name : match.teams_home.name;
            const ourScore = isHome ? match.home_sets : match.away_sets;
            const theirScore = isHome ? match.away_sets : match.home_sets;

            // Extract lineup - must match game order: S1, S2, D1, D2, S3, S4
            const lineup: string[] = [];
            const checkouts: Array<{ scores: string }> = [];
            
            // Sort singles and doubles by game_order
            const sortedSingles = (match.singles_games || []).sort((a: any, b: any) => (a.game_order || 0) - (b.game_order || 0));
            const sortedDoubles = (match.doubles_games || []).sort((a: any, b: any) => (a.game_order || 0) - (b.game_order || 0));
            
            // S1, S2
            [0, 1].forEach(i => {
                if (sortedSingles[i]) {
                    const sg = sortedSingles[i];
                    const ourPlayer = isHome ? sg.home_player?.name : sg.away_player?.name;
                    const theirPlayer = isHome ? sg.away_player?.name : sg.home_player?.name;
                    const ourCheckouts = isHome ? sg.home_checkouts : sg.away_checkouts;
                    const theirCheckouts = isHome ? sg.away_checkouts : sg.home_checkouts;
                    
                    if (ourPlayer) lineup.push(ourPlayer);
                    
                    if (ourCheckouts && ourPlayer) {
                        checkouts.push({ scores: `${ourPlayer}: ${ourCheckouts}` });
                    }
                    if (theirCheckouts && theirPlayer) {
                        checkouts.push({ scores: `${theirPlayer}: ${theirCheckouts}` });
                    }
                }
            });
            
            // D1, D2 (placeholder - doubles pairs)
            [0, 1].forEach(i => {
                if (sortedDoubles[i]) {
                    const dg = sortedDoubles[i];
                    const ourPlayers = isHome 
                        ? [dg.home_player1?.name, dg.home_player2?.name].filter(Boolean).join(' / ')
                        : [dg.away_player1?.name, dg.away_player2?.name].filter(Boolean).join(' / ');
                    
                    if (ourPlayers) lineup.push(ourPlayers);
                }
            });
            
            // S3, S4
            [2, 3].forEach(i => {
                if (sortedSingles[i]) {
                    const sg = sortedSingles[i];
                    const ourPlayer = isHome ? sg.home_player?.name : sg.away_player?.name;
                    const theirPlayer = isHome ? sg.away_player?.name : sg.home_player?.name;
                    const ourCheckouts = isHome ? sg.home_checkouts : sg.away_checkouts;
                    const theirCheckouts = isHome ? sg.away_checkouts : sg.home_checkouts;
                    
                    if (ourPlayer) lineup.push(ourPlayer);
                    
                    if (ourCheckouts && ourPlayer) {
                        checkouts.push({ scores: `${ourPlayer}: ${ourCheckouts}` });
                    }
                    if (theirCheckouts && theirPlayer) {
                        checkouts.push({ scores: `${theirPlayer}: ${theirCheckouts}` });
                    }
                }
            });

            // Build match details - sort by game order to maintain sequence
            const singles = (match.singles_games || [])
                .sort((a: any, b: any) => (a.game_order || 0) - (b.game_order || 0))
                .map((sg: any) => ({
                    homePlayer: sg.home_player?.name || '',
                    awayPlayer: sg.away_player?.name || '',
                    homeScore: sg.home_score || 0,
                    awayScore: sg.away_score || 0
                }));

            const doubles = (match.doubles_games || [])
                .sort((a: any, b: any) => (a.game_order || 0) - (b.game_order || 0))
                .map((dg: any) => ({
                    homePlayers: [dg.home_player1?.name || '', dg.home_player2?.name || ''],
                    awayPlayers: [dg.away_player1?.name || '', dg.away_player2?.name || ''],
                    homeScore: dg.home_score || 0,
                    awayScore: dg.away_score || 0
                }));

            const totalLegs = { 
                home: singles.reduce((sum: number, s: any) => sum + s.homeScore, 0) + doubles.reduce((sum: number, d: any) => sum + d.homeScore, 0),
                away: singles.reduce((sum: number, s: any) => sum + s.awayScore, 0) + doubles.reduce((sum: number, d: any) => sum + d.awayScore, 0)
            };

            return {
                lineup,
                checkouts,
                opponent,
                score: `${ourScore}:${theirScore}`,
                isHomeMatch: isHome,
                details: {
                    singles,
                    doubles,
                    totalLegs,
                    totalSets: { home: match.home_sets, away: match.away_sets }
                }
            };
        });

        // 6. Calculate match averages (both our team and opponent)
        const matchAverages = (matches || []).map((match: any, index: number) => {
            const isHome = match.home_team_id === team.id;
            const allSingles = match.singles_games || [];

            // Our team averages
            const teamAvg = allSingles.length > 0
                ? allSingles.reduce((sum: number, sg: any) => 
                    sum + (isHome ? sg.home_average : sg.away_average), 0) / allSingles.length
                : 0;

            const playerAverages = allSingles.map((sg: any) => ({
                playerName: isHome ? sg.home_player?.name : sg.away_player?.name,
                average: isHome ? sg.home_average : sg.away_average
            }));

            // Opponent averages
            const opponentAvg = allSingles.length > 0
                ? allSingles.reduce((sum: number, sg: any) => 
                    sum + (isHome ? sg.away_average : sg.home_average), 0) / allSingles.length
                : 0;

            const opponentPlayerAverages = allSingles.map((sg: any) => ({
                playerName: isHome ? sg.away_player?.name : sg.home_player?.name,
                average: isHome ? sg.away_average : sg.home_average
            }));

            return {
                matchday: index + 1,
                opponent: isHome ? match.teams_away.name : match.teams_home.name,
                teamAverage: teamAvg,
                playerAverages,
                opponentAverage: opponentAvg,
                opponentPlayerAverages
            };
        });

        // 7. Calculate league position and record (from all teams)
        const { data: allMatches } = await supabase
            .from('matches')
            .select(`
                home_team_id,
                away_team_id,
                home_sets,
                away_sets
            `)
            .eq('season', season);

        const standings = calculateStandings(allMatches || []);
        const leaguePosition = standings.findIndex(s => s.teamId === team.id) + 1;
        
        // Calculate W-D-L record for this team
        let wins = 0, draws = 0, losses = 0;
        (allMatches || []).forEach(match => {
            if (match.home_team_id === team.id) {
                if (match.home_sets > match.away_sets) wins++;
                else if (match.home_sets === match.away_sets) draws++;
                else losses++;
            } else if (match.away_team_id === team.id) {
                if (match.away_sets > match.home_sets) wins++;
                else if (match.away_sets === match.home_sets) draws++;
                else losses++;
            }
        });

        // 8. Get comparison data (team averages)
        const { data: teamAverages } = await supabase
            .from('team_averages')
            .select(`
                team_id,
                teams(name),
                singles_average,
                doubles_average
            `)
            .eq('season', season);

        const comparisonData = (teamAverages || []).map((ta: any) => ({
            teamName: ta.teams.name,
            singlesAverage: ta.singles_average,
            doublesAverage: ta.doubles_average
        }));

        // 9. Get 180s
        const { data: oneEightysData } = await supabase
            .from('one_eighties')
            .select(`
                player_id,
                players!inner(name, team_id),
                count
            `)
            .eq('season', season)
            .eq('players.team_id', team.id);

        const oneEightys = (oneEightysData || []).map((o: any) => ({
            playerName: o.players.name,
            count: o.count
        }));

        // 10. Get high finishes
        const { data: highFinishesData } = await supabase
            .from('high_finishes')
            .select(`
                player_id,
                players!inner(name, team_id),
                finish,
                count
            `)
            .eq('season', season)
            .eq('players.team_id', team.id)
            .order('finish', { ascending: false });

        // Group high finishes by player and collect finishes into array
        const highFinishesMap = new Map<string, number[]>();
        (highFinishesData || []).forEach((hf: any) => {
            const playerName = hf.players.name;
            if (!highFinishesMap.has(playerName)) {
                highFinishesMap.set(playerName, []);
            }
            // Add finish 'count' times
            for (let i = 0; i < hf.count; i++) {
                highFinishesMap.get(playerName)!.push(hf.finish);
            }
        });

        const highFinishes = Array.from(highFinishesMap.entries()).map(([playerName, finishes]) => ({
            playerName,
            finishes: finishes.sort((a, b) => b - a) // Sort descending
        }));

        // 11. Fetch schedule (future matches)
        const today = new Date().toISOString().split('T')[0];
        
        const { data: futureMatches } = await supabase
            .from('future_schedule')
            .select(`
                *,
                home_team:teams!future_schedule_home_team_id_fkey(name),
                away_team:teams!future_schedule_away_team_id_fkey(name)
            `)
            .eq('season', season)
            .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
            .gte('date', today)
            .order('date', { ascending: true });
        
        const futureMatchesWithVenues = await Promise.all((futureMatches || []).map(async (match: any) => {
            const { data: venue } = await supabase
                .from('club_venues')
                .select('name, address, zipcode')
                .eq('team_id', match.home_team_id)
                .single();
            
            return { ...match, venue_info: venue };
        }));
        
        const { data: cupMatches } = await supabase
            .from('cup_matches')
            .select('*')
            .eq('season', season)
            .or(`home_team.eq.${teamName},away_team.eq.${teamName}`)
            .gte('date', today)
            .order('date', { ascending: true });
        
        const cupMatchesWithVenues = await Promise.all((cupMatches || []).map(async (match: any) => {
            const { data: venueTeam } = await supabase
                .from('teams')
                .select('id')
                .eq('name', match.home_team)
                .eq('season', season)
                .single();
            
            if (venueTeam) {
                const { data: venue } = await supabase
                    .from('club_venues')
                    .select('name, address, zipcode')
                    .eq('team_id', venueTeam.id)
                    .single();
                
                return { ...match, venue_info: venue };
            }
            
            return { ...match, venue_info: null };
        }));
        
        const scheduleData = [
            ...(futureMatchesWithVenues || []).map((match: any) => {
                const isHome = match.home_team_id === team.id;
                const venueInfo = match.venue_info;
                
                return {
                    round: match.round?.toString() || '-',
                    date: match.date,
                    opponent: isHome ? match.away_team?.name : match.home_team?.name,
                    venue: isHome ? 'Home' : 'Away',
                    address: venueInfo?.address || '',
                    location: venueInfo?.zipcode || '',
                    matchType: 'League'
                };
            }),
            ...(cupMatchesWithVenues || []).map((match: any) => {
                const isHome = match.home_team === teamName;
                const venueInfo = match.venue_info;
                
                return {
                    round: match.round_name || 'Cup',
                    date: match.date,
                    opponent: isHome ? match.away_team : match.home_team,
                    venue: isHome ? 'Home' : 'Away',
                    address: venueInfo?.address || '',
                    location: venueInfo?.zipcode || '',
                    matchType: 'Cup'
                };
            })
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const response = {
            data: {
                teamName: team.name,
                players,
                matchReports,
                leaguePosition,
                clubVenue: clubVenue || null,
                comparisonData,
                teamStandings: { 
                    standings, 
                    position: leaguePosition,
                    wins,
                    draws,
                    losses
                },
                matchAverages,
                oneEightys: oneEightys || [],
                highFinishes: highFinishes || [],
                scheduleData: scheduleData || []
            },
            source: 'database'
        };

        console.log('✅ Team data fetched from Supabase');
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching team data from Supabase:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper to calculate standings from matches
function calculateStandings(matches: any[]) {
    const teamStats: Record<string, { teamId: string; played: number; points: number; legsFor: number; legsAgainst: number }> = {};

    matches.forEach(match => {
        if (!teamStats[match.home_team_id]) {
            teamStats[match.home_team_id] = { teamId: match.home_team_id, played: 0, points: 0, legsFor: 0, legsAgainst: 0 };
        }
        if (!teamStats[match.away_team_id]) {
            teamStats[match.away_team_id] = { teamId: match.away_team_id, played: 0, points: 0, legsFor: 0, legsAgainst: 0 };
        }

        teamStats[match.home_team_id].played++;
        teamStats[match.away_team_id].played++;
        teamStats[match.home_team_id].points += match.home_sets;
        teamStats[match.away_team_id].points += match.away_sets;
    });

    return Object.values(teamStats).sort((a, b) => b.points - a.points || b.legsFor - b.legsAgainst - (a.legsFor - a.legsAgainst));
}
