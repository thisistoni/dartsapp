import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TeamData } from '@/lib/models/types';
import { fetchSpielberichteLink, fetchDartIds, fetchTeamPlayersAverage, fetchMatchReport, fetchLeaguePosition, fetchClubVenue, fetchComparisonData, fetchTeamStandings, fetchMatchAverages, fetch180sAndHighFinishes } from '@/lib/scraper';

// Add these interfaces at the top of the file after the imports
interface SingleMatch {
  homePlayer: string;
  awayPlayer: string;
  homeScore: number;
  awayScore: number;
}

interface DoubleMatch {
  homePlayers: string[];
  awayPlayers: string[];
  homeScore: number;
  awayScore: number;
}

interface MatchDetails {
  singles: SingleMatch[];
  doubles: DoubleMatch[];
  totalLegs: { home: number; away: number };
  totalSets: { home: number; away: number };
}

interface MatchReport {
  lineup: string[];
  checkouts: Array<{ scores: string }>;
  opponent: string;
  score: string;
  details: MatchDetails;
}

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

// Update the validation function with proper types
function isValidMatchReport(report: MatchReport): boolean {
  // Skip if any player is a placeholder
  if (report.lineup.some((player: string) => player.includes('[Name]'))) {
    return false;
  }

  // Check singles matches
  if (report.details?.singles?.some((match: SingleMatch) => 
    match.homePlayer.includes('[Name]') || 
    match.awayPlayer.includes('[Name]') ||
    isNaN(match.homeScore) || 
    isNaN(match.awayScore)
  )) {
    return false;
  }

  // Check doubles matches
  if (report.details?.doubles?.some((match: DoubleMatch) => 
    match.homePlayers.some((p: string) => p.includes('[Name]')) ||
    match.awayPlayers.some((p: string) => p.includes('[Name]')) ||
    isNaN(match.homeScore) || 
    isNaN(match.awayScore)
  )) {
    return false;
  }

  return true;
}

// Update the updateTeamData function
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
  
  // Fetch all match reports
  const allMatchReports = await Promise.all(
    dartIds.map(id => fetchMatchReport(id, teamName))
  );

  // Filter out invalid match reports
  const validMatchReports = allMatchReports.filter(isValidMatchReport);

  // Only fetch averages for valid matches
  const matchAverages = await Promise.all(
    validMatchReports.map((report, index) => 
      fetchMatchAverages(
        `https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${dartIds[index]}&saison=2024/25`,
        teamName
      ).then(avg => ({
        ...avg,
        matchday: index + 1,
        opponent: report.opponent
      }))
    )
  );

  const updatedData = {
    teamName,
    lastUpdated: new Date(),
    players: teamPlayers,
    matchReports: validMatchReports, // Use filtered reports
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