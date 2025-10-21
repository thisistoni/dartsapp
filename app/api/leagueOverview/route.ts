/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { fetchLeagueResults, fetchAllMatchdaysDetails, fetchCupMatches } from '@/lib/scraper';
import { fetchLeagueSchedule } from '@/lib/scheduleScraper';
import { fetchTeamAverages } from '@/lib/teamAveragesScraper';

export async function GET() {
  try {
    console.log('📊 Fetching league overview data...');
    
    // Fetch league results
    const leagueResults = await fetchLeagueResults();
    // Fetch league future schedule
    const leagueSchedule = await fetchLeagueSchedule();
    // Fetch team averages and player stats
    const scraperResult = await fetchTeamAverages();
    // Fetch ALL matchday details with singles/doubles
    console.log('🔄 Fetching detailed data for ALL matchdays (this may take a while)...');
    const latestMatches = await fetchAllMatchdaysDetails();
    
    // Get list of league teams from matchdays
    const leagueTeams = new Set<string>();
    leagueResults.matchdays.forEach((matchday: any) => {
      matchday.matches.forEach((match: any) => {
        leagueTeams.add(match.homeTeam);
        leagueTeams.add(match.awayTeam);
      });
    });
    // Fetch Cup Round 2 matches for our league teams
    const cupMatches = await fetchCupMatches(Array.from(leagueTeams));
    
    console.log('Scraper result:', {
      hasTeamStats: !!scraperResult.teamStats,
      hasPlayerStats: !!scraperResult.playerStats,
      playerStatsCount: scraperResult.playerStats?.length || 0,
      latestMatchesCount: latestMatches.length,
      cupMatchesCount: cupMatches.length
    });
    
    const response = {
      results: leagueResults,
      futureSchedule: leagueSchedule,
      cupMatches: cupMatches,
      teamAverages: scraperResult.teamStats,
      playerStats: scraperResult.playerStats,
      latestMatches: latestMatches,
      source: 'scraped'
    };
    
    console.log('API Response has playerStats:', !!response.playerStats, 'Count:', response.playerStats?.length);
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error('Error fetching league overview:', error);
    return NextResponse.json({ error: 'Failed to fetch league overview' }, { status: 500 });
  }
}
