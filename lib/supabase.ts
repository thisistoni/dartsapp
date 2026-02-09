import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing!');
    console.error('Make sure your .env.local file contains:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=your-url');
    console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key');
    throw new Error('Missing Supabase credentials. Check .env.local file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Team {
    id: string;
    name: string;
    division: string | null;
    season: string;
    created_at: string;
    updated_at: string;
}

export interface Player {
    id: string;
    name: string;
    team_id: string | null;
    season: string;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Match {
    id: string;
    matchday_id: string;
    home_team_id: string;
    away_team_id: string;
    home_sets: number;
    away_sets: number;
    home_legs: number;
    away_legs: number;
    season: string;
    created_at: string;
    updated_at: string;
}

export interface Matchday {
    id: string;
    round: number;
    date: string;
    season: string;
    created_at: string;
    updated_at: string;
}

export interface SinglesGame {
    id: string;
    match_id: string;
    home_player_id: string;
    away_player_id: string;
    home_score: number;
    away_score: number;
    home_average: number | null;
    away_average: number | null;
    home_checkouts: string | null;
    away_checkouts: string | null;
    game_order: number | null;
    created_at: string;
    updated_at: string;
}

export interface PlayerStatistics {
    id: string;
    player_id: string;
    season: string;
    average: number | null;
    singles_won: number;
    singles_lost: number;
    singles_percentage: number | null;
    doubles_won: number;
    doubles_lost: number;
    doubles_percentage: number | null;
    combined_percentage: number | null;
    created_at: string;
    updated_at: string;
}

export interface TeamAverage {
    id: string;
    team_id: string;
    season: string;
    average: number | null;
    singles_won: number;
    singles_lost: number;
    doubles_won: number;
    doubles_lost: number;
    created_at: string;
    updated_at: string;
}

export interface LeagueStanding {
    id: string;
    team_id: string;
    season: string;
    position: number;
    played: number;
    points: number;
    legs_for: number;
    legs_against: number;
    goal_diff: number;
    created_at: string;
    updated_at: string;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get or create a team
 */
export async function upsertTeam(name: string, division: string | null, season: string) {
    const { data, error } = await supabase
        .from('teams')
        .upsert({ name, division, season }, { onConflict: 'name' })
        .select()
        .single();
    
    if (error) throw error;
    return data as Team;
}

/**
 * Get or create a player
 */
export async function upsertPlayer(name: string, teamId: string | null, season: string, imageUrl: string | null = null) {
    const { data, error } = await supabase
        .from('players')
        .upsert(
            { name, team_id: teamId, season, image_url: imageUrl },
            { onConflict: 'name,team_id,season' }
        )
        .select()
        .single();
    
    if (error) throw error;
    return data as Player;
}

/**
 * Create or update a matchday
 */
export async function upsertMatchday(round: number, date: string, season: string) {
    const { data, error } = await supabase
        .from('matchdays')
        .upsert({ round, date, season }, { onConflict: 'round,season' })
        .select()
        .single();
    
    if (error) throw error;
    return data as Matchday;
}

/**
 * Create or update a match
 */
export async function upsertMatch(matchData: {
    matchdayId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeSets: number;
    awaySets: number;
    homeLegs: number;
    awayLegs: number;
    season: string;
}) {
    const { data, error } = await supabase
        .from('matches')
        .upsert({
            matchday_id: matchData.matchdayId,
            home_team_id: matchData.homeTeamId,
            away_team_id: matchData.awayTeamId,
            home_sets: matchData.homeSets,
            away_sets: matchData.awaySets,
            home_legs: matchData.homeLegs,
            away_legs: matchData.awayLegs,
            season: matchData.season
        }, { onConflict: 'matchday_id,home_team_id,away_team_id' })
        .select()
        .single();
    
    if (error) throw error;
    return data as Match;
}

/**
 * Create a singles game
 */
export async function createSinglesGame(gameData: {
    matchId: string;
    homePlayerId: string;
    awayPlayerId: string;
    homeScore: number;
    awayScore: number;
    homeAverage?: number;
    awayAverage?: number;
    homeCheckouts?: string;
    awayCheckouts?: string;
    gameOrder?: number;
}) {
    const { data, error } = await supabase
        .from('singles_games')
        .insert({
            match_id: gameData.matchId,
            home_player_id: gameData.homePlayerId,
            away_player_id: gameData.awayPlayerId,
            home_score: gameData.homeScore,
            away_score: gameData.awayScore,
            home_average: gameData.homeAverage || null,
            away_average: gameData.awayAverage || null,
            home_checkouts: gameData.homeCheckouts || null,
            away_checkouts: gameData.awayCheckouts || null,
            game_order: gameData.gameOrder || null
        })
        .select()
        .single();
    
    if (error) throw error;
    return data as SinglesGame;
}

/**
 * Update player statistics
 */
export async function upsertPlayerStatistics(stats: {
    playerId: string;
    season: string;
    average?: number;
    singlesWon: number;
    singlesLost: number;
    singlesPercentage?: number;
    doublesWon: number;
    doublesLost: number;
    doublesPercentage?: number;
    combinedPercentage?: number;
}) {
    const { data, error } = await supabase
        .from('player_statistics')
        .upsert({
            player_id: stats.playerId,
            season: stats.season,
            average: stats.average || null,
            singles_won: stats.singlesWon,
            singles_lost: stats.singlesLost,
            singles_percentage: stats.singlesPercentage || null,
            doubles_won: stats.doublesWon,
            doubles_lost: stats.doublesLost,
            doubles_percentage: stats.doublesPercentage || null,
            combined_percentage: stats.combinedPercentage || null
        }, { onConflict: 'player_id,season' })
        .select()
        .single();
    
    if (error) throw error;
    return data as PlayerStatistics;
}

/**
 * Update team averages
 */
export async function upsertTeamAverage(teamAvg: {
    teamId: string;
    season: string;
    average?: number;
    singlesWon: number;
    singlesLost: number;
    doublesWon: number;
    doublesLost: number;
}) {
    const { data, error } = await supabase
        .from('team_averages')
        .upsert({
            team_id: teamAvg.teamId,
            season: teamAvg.season,
            average: teamAvg.average || null,
            singles_won: teamAvg.singlesWon,
            singles_lost: teamAvg.singlesLost,
            doubles_won: teamAvg.doublesWon,
            doubles_lost: teamAvg.doublesLost
        }, { onConflict: 'team_id,season' })
        .select()
        .single();
    
    if (error) throw error;
    return data as TeamAverage;
}

/**
 * Update league standings
 */
export async function upsertLeagueStanding(standing: {
    teamId: string;
    season: string;
    position: number;
    played: number;
    points: number;
    legsFor: number;
    legsAgainst: number;
    goalDiff: number;
}) {
    const { data, error } = await supabase
        .from('league_standings')
        .upsert({
            team_id: standing.teamId,
            season: standing.season,
            position: standing.position,
            played: standing.played,
            points: standing.points,
            legs_for: standing.legsFor,
            legs_against: standing.legsAgainst,
            goal_diff: standing.goalDiff
        }, { onConflict: 'team_id,season' })
        .select()
        .single();
    
    if (error) throw error;
    return data as LeagueStanding;
}

/**
 * Log scraping activity
 */
export async function logScrape(
    scrapeType: string,
    season: string,
    status: 'success' | 'error' | 'partial',
    recordsUpdated: number = 0,
    errorMessage: string | null = null
) {
    const { error } = await supabase
        .from('scrape_logs')
        .insert({
            scrape_type: scrapeType,
            season,
            status,
            records_updated: recordsUpdated,
            error_message: errorMessage
        });
    
    if (error) console.error('Error logging scrape:', error);
}

/**
 * Get all teams for a season
 */
export async function getTeamsBySeason(season: string) {
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('season', season)
        .order('name');
    
    if (error) throw error;
    return data as Team[];
}

/**
 * Get league standings for a season
 */
export async function getLeagueStandings(season: string) {
    const { data, error } = await supabase
        .from('v_team_standings')
        .select('*')
        .eq('season', season)
        .order('position');
    
    if (error) throw error;
    return data;
}

/**
 * Get player performance stats for a season
 */
export async function getPlayerPerformance(season: string) {
    const { data, error } = await supabase
        .from('v_player_performance')
        .select('*')
        .eq('season', season)
        .order('combined_percentage', { ascending: false });
    
    if (error) throw error;
    return data;
}

/**
 * Get latest matches for a season
 */
export async function getLatestMatches(season: string, limit: number = 10) {
    const { data, error } = await supabase
        .from('v_latest_matches')
        .select('*')
        .eq('season', season)
        .order('date', { ascending: false })
        .limit(limit);
    
    if (error) throw error;
    return data;
}
