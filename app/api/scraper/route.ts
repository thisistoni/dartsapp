import { NextResponse } from 'next/server';
import { fetchSpielberichteLink, fetchDartIds, fetchTeamPlayersAverage, fetchMatchReport, fetchLeaguePosition, fetchClubVenue } from '@/lib/scraper';

// API-Endpunkte für verschiedene Funktionen
export async function GET(request: Request) {
    console.log("API-Route wurde aufgerufen. Läuft serverseitig.");
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const teamName = searchParams.get('team');

    try {
        switch (action) {
            case 'spielberichte':
                const spielberichteLink = await fetchSpielberichteLink();
                return NextResponse.json({ link: spielberichteLink });

            case 'dartIds':
                const url = searchParams.get('url');
                if (!url || !teamName) throw new Error('URL oder Team fehlt.');
                const dartIds = await fetchDartIds(url, teamName);
                return NextResponse.json({ ids: dartIds });

            case 'teamAverage':
                if (!teamName) throw new Error('Team fehlt.');
                const teamPlayers = await fetchTeamPlayersAverage(teamName);
                return NextResponse.json({ players: teamPlayers });

            case 'matchReport':
                const id = searchParams.get('id');
                if (!id || !teamName) throw new Error('Match-ID oder Team fehlt.');
                const matchReport = await fetchMatchReport(id, teamName);
                return NextResponse.json({ report: matchReport });

            case 'leaguePosition':
                if (!teamName) throw new Error('Team fehlt.');
                const leaguePosition = await fetchLeaguePosition(teamName);
                return NextResponse.json({ position: leaguePosition });

            case 'clubVenue':
                if (!teamName) throw new Error('Team fehlt.');
                const clubVenue = await fetchClubVenue(teamName);
                return NextResponse.json({ venue: clubVenue });

            default:
                throw new Error('Ungültige Aktion.');
        }
    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}
