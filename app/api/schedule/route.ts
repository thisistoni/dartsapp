import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

interface ScheduleMatch {
    round: string;
    date: string;
    opponent: string;
    venue: string;
    address: string;
    location: string;
    matchType?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const teamName = searchParams.get('team');
        const season = searchParams.get('season') || '2025/26';

        if (!teamName) {
            return Response.json({ error: 'Team name is required' }, { status: 400 });
        }

        // Get team ID
        const { data: team } = await supabase
            .from('teams')
            .select('id')
            .eq('name', teamName)
            .eq('season', season)
            .single();

        if (!team) {
            return Response.json({ error: 'Team not found' }, { status: 404 });
        }

        const today = new Date().toISOString().split('T')[0];

        // Get future schedule for this team
        const { data: futureMatches, error: futureError } = await supabase
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
        
        if (futureError) {
            console.error('Error fetching future matches:', futureError);
        }
        
        // Fetch venues for each match - venue is ALWAYS at home team's location
        const futureMatchesWithVenues = await Promise.all((futureMatches || []).map(async (match: any) => {
            // Venue is always at the home team's location
            const { data: venue } = await supabase
                .from('club_venues')
                .select('name, address, zipcode')
                .eq('team_id', match.home_team_id)
                .single();
            
            return {
                ...match,
                venue_info: venue
            };
        }));

        // Get cup matches for this team (stores team names as text, not IDs)
        // Need to get team IDs first to join venues
        const { data: cupMatches } = await supabase
            .from('cup_matches')
            .select('*')
            .eq('season', season)
            .or(`home_team.eq.${teamName},away_team.eq.${teamName}`)
            .gte('date', today)
            .order('date', { ascending: true });
        
        // For cup matches, venue is ALWAYS at home team's location
        const cupMatchesWithVenues = await Promise.all((cupMatches || []).map(async (match: any) => {
            // Venue is always at the home team's location
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
                
                return {
                    ...match,
                    venue_info: venue
                };
            }
            
            return {
                ...match,
                venue_info: null
            };
        }));

        // Transform to schedule format
        const scheduleData: ScheduleMatch[] = [
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

        return Response.json(scheduleData);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return Response.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
} 