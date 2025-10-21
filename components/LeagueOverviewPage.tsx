import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader";
import { Section } from '@/types/navigation';
import { playerImages, leagueNavigationItems } from '@/constants';
import GenericSidebar from '@/components/GenericSidebar';
import GenericMobileNavbar from '@/components/GenericMobileNavbar';
import LeagueTable from '@/components/LeagueTable';
import LatestResults from '@/components/LatestResults';
import LatestMatchDetails from '@/components/LatestMatchDetails';
import MatchResults from '@/components/MatchResults';
import UpcomingSchedule from '@/components/UpcomingSchedule';
import LeagueStatistics from '@/components/LeagueStatistics';

interface LeagueOverviewPageProps {
    onTeamSelect: (team: string) => void;
    refreshTrigger?: number;
}

/**
 * League Overview Page Component
 * Main page for displaying league standings, statistics, results, and schedule
 * Now powered by Supabase for instant loading!
 */
export default function LeagueOverviewPage({ onTeamSelect, refreshTrigger }: LeagueOverviewPageProps) {
    const [loading, setLoading] = useState(true);
    const [leagueData, setLeagueData] = useState<any>(null);
    const [activeSection, setActiveSection] = useState<Section>('table');
    
    const fetchLeagueData = async () => {
        try {
            setLoading(true);
            // Fetch from Supabase - ALL data already in DB!
            const response = await axios.get('/api/leagueData');
            const { results, futureSchedule, cupMatches, teamAverages, playerStats, latestMatches, bestLegs, weeklyAverageWins, highestGamedayAverages, winningStreaks, top180s, topHighFinishes } = response.data;
            console.log('✅ Data loaded from Supabase (source:', response.data._meta?.source || 'unknown', ')');
            console.log('API response playerStats:', playerStats?.length);
            console.log('API response latestMatches:', latestMatches);
            console.log('latestMatches length:', latestMatches?.length);
            console.log('latestMatches data:', JSON.stringify(latestMatches, null, 2));
            console.log('cupMatches:', cupMatches);
            console.log('bestLegs:', bestLegs);
            console.log('weeklyAverageWins:', weeklyAverageWins);
            console.log('highestGamedayAverages:', highestGamedayAverages);
            console.log('winningStreaks:', winningStreaks);
            // Calculate standings from results
            const standings = calculateStandings(results.matchdays);
            setLeagueData({ results, standings, futureSchedule, cupMatches, teamAverages, playerStats, latestMatches, bestLegs, weeklyAverageWins, highestGamedayAverages, winningStreaks, top180s, topHighFinishes });
        } catch (error) {
            console.error('Error fetching league overview:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchLeagueData();
    }, [refreshTrigger]); // Re-fetch when sync button is clicked

    // Calculate standings from match results
    const calculateStandings = (matchdays: any[]) => {
        const teamStats: Record<string, { played: number; points: number; legsFor: number; legsAgainst: number }> = {};
        
        matchdays.forEach(matchday => {
            matchday.matches.forEach((match: any) => {
                // Initialize teams if not exists
                if (!teamStats[match.homeTeam]) {
                    teamStats[match.homeTeam] = { played: 0, points: 0, legsFor: 0, legsAgainst: 0 };
                }
                if (!teamStats[match.awayTeam]) {
                    teamStats[match.awayTeam] = { played: 0, points: 0, legsFor: 0, legsAgainst: 0 };
                }

                // Update played
                teamStats[match.homeTeam].played++;
                teamStats[match.awayTeam].played++;

                // Update legs (for goal difference)
                teamStats[match.homeTeam].legsFor += match.homeLegs;
                teamStats[match.homeTeam].legsAgainst += match.awayLegs;
                teamStats[match.awayTeam].legsFor += match.awayLegs;
                teamStats[match.awayTeam].legsAgainst += match.homeLegs;

                // Update points - sum of all SETS collected
                teamStats[match.homeTeam].points += match.homeSets;
                teamStats[match.awayTeam].points += match.awaySets;
            });
        });

        // Sample averages for teams (will be replaced with real data later)
        const sampleAverages: Record<string, number> = {
            'Dartclub Twentytwo 4': 99.0,
            'PSV Wien Darts 1': 99.0,
            'TC Aspern 1': 99.0,
            'DC Patron': 99.0,
            'AS The Dart Side of the Moon II': 99.0,
            'BSW Zwara Panier': 99.0,
            'Temmel Fundraising Darts Lions 2': 99.0
        };

        // Convert to array and sort
        return Object.entries(teamStats)
            .map(([team, stats]) => ({
                team,
                played: stats.played,
                points: stats.points,
                goalDiff: stats.legsFor - stats.legsAgainst,
                average: sampleAverages[team] || 35.0
            }))
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return b.goalDiff - a.goalDiff;
            })
            .map((team, index) => ({ ...team, position: index + 1 }));
    };

    if (loading || !leagueData) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <ClipLoader color="#3B82F6" size={50} />
                    <p className="text-gray-600">Loading league data...</p>
                </div>
            </div>
        );
    }

    const leagueStandings = leagueData.standings;
    const teamAverages: Record<string, { average: number; singles: string; doubles: string }> = leagueData.teamAverages || {};
    const playerStats: any[] = leagueData.playerStats || [];
    const finishedGames = leagueData.results.matchdays.flatMap((md: any) =>
        md.matches.map((match: any) => ({
            matchday: md.round,
            date: md.date,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            score: `${match.homeSets}-${match.awaySets}`,
        })));

    // Filter future schedule to only show games not in finishedGames
    const finishedSet = new Set(finishedGames.map((g: { matchday: string | number; homeTeam: string; awayTeam: string }) => `${g.matchday}|${g.homeTeam}|${g.awayTeam}`));
    const futureSchedule = (leagueData.futureSchedule || []).filter((g: any) => !finishedSet.has(`${g.round}|${g.homeTeam}|${g.awayTeam}`));

    
    // Group finished games by matchday
    const groupedFinishedGames = finishedGames.reduce((acc: any, game: any) => {
        if (!acc[game.matchday]) {
            acc[game.matchday] = [];
        }
        acc[game.matchday].push(game);
        return acc;
    }, {});

    // Get the latest matchday
    const latestMatchday = Math.max(...finishedGames.map((game: any) => game.matchday));
    const latestMatchdayGames = finishedGames.filter((game: any) => game.matchday === latestMatchday);

    // Check for pending games from the latest matchday in futureSchedule
    const pendingLatestMatchdayGames = futureSchedule.filter((g: any) => g.round === latestMatchday);

    // Find the team with a bye (not playing) in the latest matchday
    const allTeams = leagueStandings.map((team: any) => team.team);
    const playingTeams = new Set<string>();
    latestMatchdayGames.forEach((game: any) => {
        playingTeams.add(game.homeTeam);
        playingTeams.add(game.awayTeam);
    });
    pendingLatestMatchdayGames.forEach((game: any) => {
        playingTeams.add(game.homeTeam);
        playingTeams.add(game.awayTeam);
    });
    
    // Helper function to normalize team names for comparison
    function normalizeTeamName(name: string) {
        return name.replace(/\s+/g, ' ').trim().toLowerCase();
    }
    
    // Helper function to calculate forfeit losses needed based on played matchdays
    const calculateForfeitLosses = (won: number, lost: number, played: number): number => {
        const currentTotal = won + lost;
        const expectedTotal = played * 4; // 4 games per matchday
        const forfeitLosses = expectedTotal - currentTotal;
        return forfeitLosses > 0 ? forfeitLosses : 0;
    };

    // Check for teams with missing game details based on singles data
    const teamsWithMissingData = new Set<string>();
    leagueStandings.forEach((team: { team: string; played: number }) => {
        const stats = Object.entries(teamAverages).find(
            ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
        )?.[1];

        if (stats?.singles) {
            const [won, lost] = stats.singles.split('-').map(Number);
            const forfeitLosses = calculateForfeitLosses(won, lost, team.played);
            const totalSinglesGames = won + lost + forfeitLosses;
            const gamesPerMatchday = totalSinglesGames / team.played;
            
            // Each matchday should have 4 singles games
            if (gamesPerMatchday !== 4) {
                teamsWithMissingData.add(team.team);
            }
        }
    });

    const byeTeam = allTeams.find((team: string) => !playingTeams.has(team));

    // Calculate league statistics
    const validTeamAverages = leagueStandings
        .map((team: any) => {
            const stats = Object.entries(teamAverages).find(
                ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
            )?.[1];
            return stats?.average && !isNaN(stats.average) ? stats.average : null;
        })
        .filter((avg: number | null) => avg !== null);
    
    const leagueTeamAverage = validTeamAverages.length > 0
        ? (validTeamAverages.reduce((sum: number, avg: number) => sum + avg, 0) / validTeamAverages.length)
        : 0;

    // Calculate team average median
    const sortedTeamAverages = [...validTeamAverages].sort((a, b) => a - b);
    const teamMedian = sortedTeamAverages.length > 0
        ? sortedTeamAverages.length % 2 === 0
            ? (sortedTeamAverages[sortedTeamAverages.length / 2 - 1] + sortedTeamAverages[sortedTeamAverages.length / 2]) / 2
            : sortedTeamAverages[Math.floor(sortedTeamAverages.length / 2)]
        : 0;

    // Calculate player statistics
    const validPlayerAverages = playerStats
        .map((p: any) => p.average)
        .filter((avg: number) => avg && !isNaN(avg));
    
    const leaguePlayerAverage = validPlayerAverages.length > 0
        ? (validPlayerAverages.reduce((sum: number, avg: number) => sum + avg, 0) / validPlayerAverages.length)
        : 0;

    const sortedPlayerAverages = [...validPlayerAverages].sort((a, b) => a - b);
    const playerMedian = sortedPlayerAverages.length > 0
        ? sortedPlayerAverages.length % 2 === 0
            ? (sortedPlayerAverages[sortedPlayerAverages.length / 2 - 1] + sortedPlayerAverages[sortedPlayerAverages.length / 2]) / 2
            : sortedPlayerAverages[Math.floor(sortedPlayerAverages.length / 2)]
        : 0;

    return (
        <div className="flex gap-6 relative pb-20 lg:pb-0">
            {/* Desktop Sidebar */}
            <GenericSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                navigationItems={leagueNavigationItems}
            />
            
            {/* Mobile Bottom Navbar */}
            <GenericMobileNavbar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                navigationItems={leagueNavigationItems}
            />
            
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">

            {/* Table Section - League Standings & Latest Results */}
            {activeSection === 'table' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* League Table - 2/3 width on desktop */}
                    <div className="lg:col-span-2">
                        <LeagueTable
                            leagueStandings={leagueStandings}
                            teamAverages={teamAverages}
                            leagueTeamAverage={leagueTeamAverage}
                            onTeamSelect={onTeamSelect}
                            calculateForfeitLosses={calculateForfeitLosses}
                        />
                    </div>

                    {/* Latest Matchday Results - 1/3 width on desktop */}
                    <div className="lg:col-span-1">
                        <LatestResults
                            latestMatchday={latestMatchday}
                            latestMatchdayGames={latestMatchdayGames}
                            pendingLatestMatchdayGames={pendingLatestMatchdayGames}
                            byeTeam={byeTeam}
                            teamsWithMissingData={teamsWithMissingData}
                        />
                    </div>
                </div>
            )}

            {/* Latest Section - Detailed Match Information */}
            {activeSection === 'latest' && (
                <LatestMatchDetails
                    leagueData={leagueData}
                    loading={loading}
                    playerImages={playerImages}
                />
            )}

            {/* Statistics Section - Player Leaderboards */}
            {activeSection === 'statistics' && (
                <LeagueStatistics
                    playerStats={playerStats}
                    leagueStandings={leagueStandings}
                    teamAverages={teamAverages}
                    playerImages={playerImages}
                    leagueTeamAverage={leagueTeamAverage}
                    teamMedian={teamMedian}
                    leaguePlayerAverage={leaguePlayerAverage}
                    playerMedian={playerMedian}
                    validTeamAverages={validTeamAverages}
                    validPlayerAverages={validPlayerAverages}
                    bestLegs={leagueData?.bestLegs || []}
                    weeklyAverageWins={leagueData?.weeklyAverageWins || []}
                    highestGamedayAverages={leagueData?.highestGamedayAverages || []}
                    winningStreaks={leagueData?.winningStreaks || []}
                    top180s={leagueData?.top180s || []}
                    topHighFinishes={leagueData?.topHighFinishes || []}
                />
            )}

            {activeSection === 'results' && (
                <MatchResults groupedFinishedGames={groupedFinishedGames} />
            )}

            {/* Schedule Section */}
            {activeSection === 'schedule' && (
                <UpcomingSchedule
                    futureSchedule={futureSchedule}
                    cupMatches={leagueData.cupMatches || []}
                    leagueStandings={leagueStandings}
                />
            )}

            </div>
        </div>
    );
}
