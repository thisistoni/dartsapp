import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TeamData } from '@/lib/models/types';
import { fetchSpielberichteLink, fetchDartIds, fetchTeamPlayersAverage, fetchMatchReport, fetchLeaguePosition, fetchClubVenue, fetchComparisonData, fetchTeamStandings, fetchMatchAverages, fetch180sAndHighFinishes } from '@/lib/scraper';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamName = searchParams.get('team');
  const forceUpdate = searchParams.get('forceUpdate') === 'true';

  if (!teamName) {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // Try to get data from database first
    let teamData = await TeamData.findOne({ teamName });
    const now = new Date();
    let needsUpdate = !teamData || forceUpdate || 
      (now.getTime() - new Date(teamData.lastUpdated).getTime() > 3600000); // 1 hour

    if (!needsUpdate && teamData) {
      // Validate the data structure before returning
      if (teamData.matchReports?.length > 0 && 
          teamData.players?.length > 0 && 
          teamData.matchAverages?.length > 0) {
        return NextResponse.json({ 
          data: teamData,
          source: 'database'
        });
      }
      // If validation fails, force an update
      needsUpdate = true;
    }

    // If data needs update, fetch new data
    const [
      spielberichteLink,
      clubVenue,
      leaguePosition,
      teamPlayers,
      comparisonData,
      teamStandings,
      specialStats
    ] = await Promise.all([
      fetchSpielberichteLink(),
      fetchClubVenue(teamName),
      fetchLeaguePosition(teamName),
      fetchTeamPlayersAverage(teamName),
      fetchComparisonData(teamName),
      fetchTeamStandings(teamName),
      fetch180sAndHighFinishes(teamName)
    ]);

    // Fetch match reports and averages
    const dartIds = await fetchDartIds(spielberichteLink!, teamName);
    const matchReports = await Promise.all(
      dartIds.map(id => fetchMatchReport(id, teamName))
    );

    const matchAverages = await Promise.all(
      dartIds.map((id, index) => 
        fetchMatchAverages(
          `https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${id}&saison=2024/25`,
          teamName
        ).then(avg => ({
          ...avg,
          matchday: index + 1,
          opponent: matchReports[index].opponent
        }))
      )
    );

    // Update or create team data in database
    const updatedData = {
      teamName,
      lastUpdated: now,
      players: teamPlayers,
      matchReports,
      leaguePosition,
      clubVenue,
      comparisonData,
      teamStandings,
      matchAverages: matchAverages.map((avg, index) => ({
        ...avg,
        matchday: index + 1,
        opponent: matchReports[index].opponent,
        teamAverage: avg.teamAverage,
        playerAverages: avg.playerAverages.map(p => ({
          playerName: p.playerName,
          average: p.average
        }))
      })),
      oneEightys: specialStats.oneEightys,
      highFinishes: specialStats.highFinishes
    };

    if (teamData) {
      await TeamData.findOneAndUpdate({ teamName }, updatedData);
    } else {
      teamData = await TeamData.create(updatedData);
    }

    return NextResponse.json({
      data: updatedData,
      source: 'scraped'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 