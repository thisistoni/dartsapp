import { NextResponse } from 'next/server';
import { fetchLeagueResults } from '@/lib/scraper';

export async function GET() {
  try {
    console.log('📊 Fetching league overview data...');
    
    // Fetch league results
    const leagueResults = await fetchLeagueResults();
    
    return NextResponse.json({
      results: leagueResults,
      source: 'scraped'
    });

  } catch (error) {
    console.error('Error fetching league overview:', error);
    return NextResponse.json({ error: 'Failed to fetch league overview' }, { status: 500 });
  }
}
