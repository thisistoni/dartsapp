import { NextResponse } from 'next/server';
import { fetchSpielberichteLink, fetchDartIds, fetchTeamPlayersAverage, fetchMatchReport, fetchLeaguePosition, fetchClubVenue, fetchComparisonData, fetchTeamStandings, fetchMatchAverages, fetch180sAndHighFinishes } from '@/lib/scraper';

// API-Endpunkte für verschiedene Funktionen
export async function GET(request: Request) {
    console.log("API-Route wurde aufgerufen. Läuft serverseitig.");
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const team = searchParams.get('team');
    const url = searchParams.get('url');
    const id = searchParams.get('id');

    try {
        switch (action) {
            case 'spielberichte':
                const spielberichteLink = await fetchSpielberichteLink();
                return NextResponse.json({ link: spielberichteLink });

            case 'dartIds':
                if (!url || !team) throw new Error('URL oder Team fehlt.');
                const dartIds = await fetchDartIds(url, team);
                return NextResponse.json({ ids: dartIds });

            case 'teamAverage':
                if (!team) throw new Error('Team fehlt.');
                const teamPlayers = await fetchTeamPlayersAverage(team);
                return NextResponse.json({ players: teamPlayers });

            case 'matchReport':
                if (!id || !team) throw new Error('Match-ID oder Team fehlt.');
                const matchReport = await fetchMatchReport(id, team);
                return NextResponse.json({ report: matchReport });

            case 'leaguePosition':
                if (!team) throw new Error('Team fehlt.');
                const leaguePosition = await fetchLeaguePosition(team);
                return NextResponse.json({ position: leaguePosition });

            case 'clubVenue':
                if (!team) throw new Error('Team fehlt.');
                const clubVenue = await fetchClubVenue(team);
                return NextResponse.json({ venue: clubVenue });

            case 'comparison':
                if (!team) throw new Error('Team fehlt.');
                const comparisonData = await fetchComparisonData(team);
                return NextResponse.json({ comparison: comparisonData });

            case 'standings':
                if (!team) throw new Error('Team fehlt.');
                const standings = await fetchTeamStandings(team);
                return NextResponse.json({ standings });

            case 'matchAverages':
                if (url && team) {
                    const averages = await fetchMatchAverages(url, team);
                    return NextResponse.json({ averages });
                }
                return NextResponse.json({ error: 'Missing parameters' });

            case 'specialStats':
                if (!team) throw new Error('Team fehlt.');
                const specialStats = await fetch180sAndHighFinishes(team);
                return NextResponse.json(specialStats);

            default:
                throw new Error('Ungültige Aktion.');
        }
    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}
