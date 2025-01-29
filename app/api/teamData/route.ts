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
    const teamData = await TeamData.findOne({ teamName });
    
    // If we have data and not forcing update, return it immediately
    if (teamData && !forceUpdate) {
      const now = new Date();
      const needsUpdate = now.getTime() - new Date(teamData.lastUpdated).getTime() > 3600000;
      
      // Return data immediately and trigger background update if needed
      if (needsUpdate) {
        // Trigger background update without waiting
        updateTeamData(teamName).catch(console.error);
      }
      
      return NextResponse.json({ 
        data: teamData,
        source: 'database'
      });
    }

    // If no data or force update, fetch new data
    const updatedData = await updateTeamData(teamName);
    
    return NextResponse.json({
      data: updatedData,
      source: 'scraped'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Separate function for updating data
async function updateTeamData(teamName: string) {
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

  const updatedData = {
    teamName,
    lastUpdated: new Date(),
    players: teamPlayers,
    matchReports,
    leaguePosition,
    clubVenue,
    comparisonData,
    teamStandings,
    matchAverages,
    oneEightys: specialStats.oneEightys,
    highFinishes: specialStats.highFinishes
  };

  // Update database
  await TeamData.findOneAndUpdate(
    { teamName }, 
    updatedData,
    { upsert: true }
  );

  return updatedData;
} 