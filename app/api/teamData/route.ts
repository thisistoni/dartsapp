import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { TeamData } from '@/lib/models/types';
import { fetchSpielberichteLink, fetchDartIds, fetchTeamPlayersAverage, fetchMatchReport, fetchLeaguePosition, fetchClubVenue, fetchComparisonData, fetchTeamStandings, fetchMatchAverages, fetch180sAndHighFinishes } from '@/lib/scraper';
import { Schema } from 'mongoose';
import axios from 'axios';

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

// Add schedule to TeamData model if not already there
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
const scheduleSchema = new Schema({
    round: String,
    date: String,
    opponent: String,
    venue: String,
    address: String,
    location: String,
    lastUpdated: Date
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamName = searchParams.get('team');

  if (!teamName) {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    
    // Always fetch new data
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
  try {
    const [
      spielberichteLink,
      leaguePosition,
      teamPlayers,
      comparisonData,
      teamStandings,
      specialStats,
      clubVenue  // Always fetch fresh clubVenue
    ] = await Promise.all([
      fetchSpielberichteLink(),
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
          `https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${dartIds[index]}&saison=2025/26`,
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
  } catch (error) {
    console.error('Error in updateTeamData:', error);
    throw error;
  }
}

// In your fetch function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSchedule(teamName: string) {
    try {
        // Check if we have recent schedule data (less than a month old)
        const existingData = await TeamData.findOne({
            teamName,
            'schedule.lastUpdated': { 
                $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
            }
        });

        if (existingData?.schedule) {
            return existingData.schedule;
        }

        // If not in DB or too old, fetch new data
        const response = await axios.get(`/api/schedule?team=${teamName}`);
        const schedule = response.data;

        // Update DB with new schedule
        await TeamData.findOneAndUpdate(
            { teamName },
            { 
                $set: { 
                    schedule: {
                        ...schedule,
                        lastUpdated: new Date()
                    }
                }
            },
            { upsert: true }
        );

        return schedule;
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return null;
    }
} 