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
    // Fetch team averages
    const teamAverages = await fetchTeamAverages();
    
    return NextResponse.json({
      results: leagueResults,
      futureSchedule: leagueSchedule,
      teamAverages,
      source: 'scraped'
    });

  } catch (error) {
    console.error('Error fetching league overview:', error);
    return NextResponse.json({ error: 'Failed to fetch league overview' }, { status: 500 });
  }
}
