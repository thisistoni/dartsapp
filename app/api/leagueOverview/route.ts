import { NextResponse } from 'next/server';
import { fetchLeagueResults } from '@/lib/scraper';
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
    
    console.log('Scraper result:', {
      hasTeamStats: !!scraperResult.teamStats,
      hasPlayerStats: !!scraperResult.playerStats,
      playerStatsCount: scraperResult.playerStats?.length || 0
    });
    
    const response = {
      results: leagueResults,
      futureSchedule: leagueSchedule,
      teamAverages: scraperResult.teamStats,
      playerStats: scraperResult.playerStats,
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
