/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
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

interface TeamDataResponse {
  teamName: string;
  lastUpdated: Date;
  players: any[];
  matchReports: MatchReport[];
  leaguePosition: number | null;
  clubVenue: any;
  comparisonData: any[];
  teamStandings: any;
  matchAverages: any[];
  oneEightys: any[];
  highFinishes: any[];
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamName = searchParams.get('team');
  const season = searchParams.get('season') || '2025/26'; // Default to current season

  if (!teamName) {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
  }

  try {
    // Fetch fresh data directly
    const updatedData = await updateTeamData(teamName, season);
    
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
async function updateTeamData(teamName: string, season: string = '2025/26'): Promise<TeamDataResponse> {
  try {
    // Handle "all seasons" - fetch both seasons and combine
    if (season === 'all') {
      const [data2025, data2024]: [TeamDataResponse, TeamDataResponse] = await Promise.all([
        updateTeamData(teamName, '2025/26'),
        updateTeamData(teamName, '2024/25')
      ]);
      
      // Combine data from both seasons - 2024/25 first, then 2025/26
      // Add season prefix to match reports and averages
      const matchReports2024 = data2024.matchReports.map((report: any, index: number) => ({
        ...report,
        seasonPrefix: '1',
        originalMatchday: index + 1
      }));
      const matchReports2025 = data2025.matchReports.map((report: any, index: number) => ({
        ...report,
        seasonPrefix: '2',
        originalMatchday: index + 1
      }));
      
      const matchAverages2024 = data2024.matchAverages.map((avg: any, index: number) => ({
        ...avg,
        seasonPrefix: '1',
        originalMatchday: index + 1,
        matchday: index + 1 // Keep original matchday for compatibility
      }));
      const matchAverages2025 = data2025.matchAverages.map((avg: any, index: number) => ({
        ...avg,
        seasonPrefix: '2',
        originalMatchday: index + 1,
        matchday: data2024.matchAverages.length + index + 1 // Offset for display
      }));
      
      return {
        teamName,
        lastUpdated: new Date(),
        players: data2025.players, // Use current season players
        matchReports: [...matchReports2024, ...matchReports2025], // 2024/25 first
        leaguePosition: data2025.leaguePosition, // Use current season position
        clubVenue: data2025.clubVenue,
        comparisonData: data2025.comparisonData, // Use current season
        teamStandings: data2025.teamStandings, // Use current season
        matchAverages: [...matchAverages2024, ...matchAverages2025], // 2024/25 first
        oneEightys: [...data2024.oneEightys, ...data2025.oneEightys], // 2024/25 first
        highFinishes: [...data2024.highFinishes, ...data2025.highFinishes] // 2024/25 first
      };
    }
    
    // Determine the base URL based on season
    const baseUrl = season === '2024/25' 
      ? 'https://www.wdv-dart.at/_landesliga/_statistik/index.php?saison=2024/25&div=all'
      : undefined; // Use default for 2025/26
    
    const [
      spielberichteLink,
      leaguePosition,
      teamPlayers,
      comparisonData,
      teamStandings,
      specialStats,
      clubVenue  // Always fetch fresh clubVenue
    ] = await Promise.all([
      fetchSpielberichteLink(baseUrl),
      fetchLeaguePosition(teamName),
      fetchTeamPlayersAverage(teamName),
      fetchComparisonData(teamName),
      fetchTeamStandings(teamName),
      fetch180sAndHighFinishes(teamName),
      fetchClubVenue(teamName)
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
          `https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${dartIds[index]}&saison=${season}`,
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

    return updatedData;
  } catch (error) {
    console.error('Error in updateTeamData:', error);
    throw error;
  }
}

 