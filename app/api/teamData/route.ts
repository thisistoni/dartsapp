import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TeamData from '@/lib/models/TeamData';
import { fetchSpielberichteLink, fetchDartIds, fetchTeamPlayersAverage, fetchMatchReport, fetchLeaguePosition, fetchClubVenue, fetchComparisonData, fetchTeamStandings, fetchMatchAverages, fetch180sAndHighFinishes } from '@/lib/scraper';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const team = searchParams.get('team');
        const matchId = searchParams.get('matchId');

        await dbConnect();

        if (matchId) {
            // Get specific match
            const data = await TeamData.findOne(
                { 
                    teamName: team,
                    'matchReports.matchId': matchId 
                },
                { 'matchReports.$': 1 }
            );
            return NextResponse.json({ data });
        } else {
            // Get all team data
            const data = await TeamData.findOne({ teamName: team });
            return NextResponse.json({ data });
        }
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { teamName, data } = body;

        if (!teamName || !data) {
            return NextResponse.json({ error: 'Required data missing' }, { status: 400 });
        }

        await dbConnect();

        // Update or create team document
        const updatedTeamData = await TeamData.findOneAndUpdate(
            { teamName },
            {
                teamName,
                lastUpdated: new Date(),
                players: data.players,
                matchReports: data.matchReports,
                leaguePosition: data.leaguePosition,
                clubVenue: data.clubVenue,
                comparisonData: data.comparisonData,
                teamStandings: data.teamStandings,
                matchAverages: data.matchAverages,
                oneEightys: data.oneEightys,
                highFinishes: data.highFinishes
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, data: updatedTeamData });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to save team data' }, { status: 500 });
    }
}

// Add logging function
const logMatchUpdate = (matchId: string, matchday: number, score: string, success: boolean) => {
  const status = success ? '✅' : '❌';
  const color = success ? '\x1b[32m' : '\x1b[31m';
  console.log(
    `${color}${status} Match ID: ${matchId} | Matchday: ${matchday} | Score: ${score}\x1b[0m`
  );
};

// Update the fetch and save process
async function updateTeamData(teamName: string) {
  try {
    // Fetch match reports one by one
    const matchReports = [];
    const spielberichteLink = await fetchSpielberichteLink();
    const matchIds = await fetchDartIds(spielberichteLink!, teamName);

    for (const matchId of matchIds) {
      try {
        const matchReport = await fetchMatchReport(matchId, teamName);
        
        // Update database for this specific match
        await TeamData.findOneAndUpdate(
          { 
            teamName,
            'matchReports.matchId': matchId 
          },
          { 
            $set: { 
              'matchReports.$': matchReport 
            } 
          },
          { upsert: true }
        );

        matchReports.push(matchReport);
        logMatchUpdate(
          matchId,
          matchReport.matchday,
          matchReport.score,
          true
        );
      } catch (error) {
        logMatchUpdate(
          matchId,
          0, // Unknown matchday
          'N/A',
          false
        );
        console.error(`Failed to process match ${matchId}:`, error);
      }
    }

    return matchReports;
  } catch (error) {
    console.error('Error updating team data:', error);
    throw error;
  }
} 