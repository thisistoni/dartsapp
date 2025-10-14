/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Search, Users, User,  MapPin, Martini, Phone, BarChart, ArrowUp,  Calendar, Navigation, Target, Zap, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader"; // Importing Spinner
import { ClubVenue, MatchReport, Player, TeamData, ComparisonData, TeamStandings, MatchAverages, OneEighty, HighFinish } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TooltipProps } from 'recharts';
import axiosRetry from 'axios-retry';

interface DotProps {
    cx?: number;
    cy?: number;
    payload?: {
        value: number;
        matchday: number;
        opponent: string;
    };
}

interface ScheduleMatch {
    round: string;
    date: string;
    opponent: string;
    venue: string;
    address: string;
    location: string;
}

interface TeamPerformance {
    teamAverage: number;
    matchday: number;
    opponent: string;
}

interface PlayerPerformance {
    average: number;
    matchday: number;
    opponent: string;
}


// Helper function to get player initials
const getPlayerInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Player Avatar Component
const PlayerAvatar: React.FC<{ name: string; imageUrl?: string; size?: 'sm' | 'md' }> = ({ name, imageUrl, size = 'sm' }) => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    const initials = getPlayerInitials(name);
    
    // Generate a consistent color based on name
    const getColorFromName = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-red-500',
            'bg-orange-500',
            'bg-teal-500',
        ];
        return colors[Math.abs(hash) % colors.length];
    };
    
    if (imageUrl) {
        return (
            <img 
                src={imageUrl} 
                alt={name}
                className={`${sizeClasses} rounded-full object-cover flex-shrink-0`}
                onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.currentTarget.style.display = 'none';
                }}
            />
        );
    }
    
    return (
        <div className={`${sizeClasses} rounded-full ${getColorFromName(name)} text-white font-bold flex items-center justify-center flex-shrink-0`}>
            {initials}
        </div>
    );
};

// League Overview Component with real data
const LeagueOverview: React.FC<{ onTeamSelect: (team: string) => void }> = ({ onTeamSelect }) => {
    const [loading, setLoading] = useState(true);
    const [leagueData, setLeagueData] = useState<any>(null);
    
    // Player images mapping
    const playerImages: { [key: string]: string } = {
        'Luca Schuckert': 'schucki.jpg',
        'Marko Cvejic': '/cvejic-marko.jpg',
        'Josip Matijevic': 'https://www.oefb.at/oefb2/images/1278650591628556536_4dcb084bb2c30e1395ee-1,0-320x320.png',
        'Muhamet Mahmutaj': 'muki-m.jpg',
        'Marvin De Chavez': 'https://www.oefb.at/oefb2/images/1278650591628556536_49e17c18c1d6921a7870-1,0-320x320.png',
        'Christoph Hafner': 'chris-h.jpg',
        'Michael Frühwirth': 'https://www.oefb.at/oefb2/images/1278650591628556536_ba89cc5af9585cffb11c-1,0-320x320.png',
        'Ermin Kokic': 'https://www.oefb.at/oefb2/images/1278650591628556536_e807ce175060c2e86db6-1,0-320x320.png',
        'Dominik Kubiak': 'https://www.oefb.at/oefb2/images/1278650591628556536_77be3e9035fdc75e8cff-1,0-320x320.png',
        'Markus Hafner': 'markus.jpg',
        'Dejan Stojadinovic': 'dejan.jpg'
    };
    
    useEffect(() => {
        const fetchLeagueData = async () => {
            try {
                const response = await axios.get('/api/leagueOverview');
                const { results, futureSchedule, cupMatches, teamAverages, playerStats, latestMatches } = response.data;
                console.log('API response playerStats:', playerStats?.length);
                console.log('API response latestMatches:', latestMatches);
                console.log('latestMatches length:', latestMatches?.length);
                console.log('latestMatches data:', JSON.stringify(latestMatches, null, 2));
                console.log('cupMatches:', cupMatches);
                // Calculate standings from results
                const standings = calculateStandings(results.matchdays);
                setLeagueData({ results, standings, futureSchedule, cupMatches, teamAverages, playerStats, latestMatches });
            } catch (error) {
                console.error('Error fetching league overview:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeagueData();
    }, []);

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
        <div className="space-y-6">

            {/* League Table and Latest Results Side by Side on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* League Table - 2/3 width on desktop */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-6 w-6 text-yellow-500" />
                                    League Standings
                                </CardTitle>
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                    <span className="text-xs font-medium text-gray-600">League Avg:</span>
                                    <span className="text-sm font-bold text-blue-600">{leagueTeamAverage.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Pos</th>
                                            <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Team</th>
                                            <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">P</th>
                                            <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Pts</th>
                                            <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">+/-</th>
                                            <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Singles</th>
                                            <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Doubles</th>
                                            <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Avg</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {leagueStandings.map((team: { team: string; position: number; played: number; points: number; goalDiff: number; average: number }) => {
                                            let rowBg = '';
                                            
                                            if (team.position === 1) {
                                              
                                                rowBg = 'bg-green-50/50';
                                            } else if (team.position === 2) {
                                               
                                                rowBg = 'bg-blue-50/50';
                                            }
                                            
                                            return (
                                                <tr key={team.position} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${rowBg}`}>
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs sm:text-sm font-bold ${
                                                                team.position === 1
                                                                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                                                                    : team.position === 2
                                                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                                                    : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {team.position}
                                                            </span>
                                                           
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <button
                                                            onClick={() => onTeamSelect(team.team)}
                                                            className="group flex items-center gap-1 sm:gap-2 font-medium text-gray-900 hover:text-blue-600 cursor-pointer text-left transition-all w-full"
                                                        >
                                                            <span className="group-hover:translate-x-1 transition-transform text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" title={team.team}>
                                                                {team.team}
                                                            </span>
                                                            <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 rotate-90 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 flex-shrink-0" />
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-2 text-center text-gray-600 text-xs sm:text-sm">{team.played}</td>
                                                    <td className="py-3 px-2 text-center font-bold text-gray-900 text-xs sm:text-sm">{team.points}</td>
                                                    <td className={`py-3 px-2 text-center font-medium text-xs sm:text-sm ${
                                                        team.goalDiff > 0 ? 'text-green-600' : team.goalDiff < 0 ? 'text-red-600' : 'text-gray-600'
                                                    }`}>
                                                        {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                                                    </td>
                                                    <td className="py-3 px-2 text-center text-gray-700 font-medium text-xs sm:text-sm">
                                                    {(() => {
                                                        function normalizeTeamName(name: string) {
                                                            return name.replace(/\s+/g, ' ').trim().toLowerCase();
                                                        }
                                                        const stats = Object.entries(teamAverages).find(
                                                            ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                        )?.[1];
                                                        
                                                        if (!stats?.singles) return '-';
                                                        
                                                        const [won, lost] = stats.singles.split('-').map(Number);
                                                        const forfeitLosses = calculateForfeitLosses(won, lost, team.played);
                                                        
                                                        if (forfeitLosses > 0) {
                                                            const adjustedRecord = `${won}-${lost + forfeitLosses}`;
                                                            return (
                                                                <span className="relative group cursor-help">
                                                                    {adjustedRecord}
                                                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                        +{forfeitLosses} forfeit loss{forfeitLosses > 1 ? 'es' : ''}
                                                                    </span>
                                                                </span>
                                                            );
                                                        }
                                                        
                                                        return stats.singles;
                                                    })()}
                                                    </td>
                                                    <td className="py-3 px-2 text-center text-gray-700 font-medium text-xs sm:text-sm">
                                                    {(() => {
                                                        function normalizeTeamName(name: string) {
                                                            return name.replace(/\s+/g, ' ').trim().toLowerCase();
                                                        }
                                                        const stats = Object.entries(teamAverages).find(
                                                            ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                        )?.[1];
                                                        
                                                        if (!stats?.doubles) return '-';
                                                        
                                                        const [won, lost] = stats.doubles.split('-').map(Number);
                                                        const forfeitLosses = calculateForfeitLosses(won, lost, team.played);
                                                        
                                                        if (forfeitLosses > 0) {
                                                            const adjustedRecord = `${won}-${lost + forfeitLosses}`;
                                                            return (
                                                                <span className="relative group cursor-help">
                                                                    {adjustedRecord}
                                                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                        +{forfeitLosses} forfeit loss{forfeitLosses > 1 ? 'es' : ''}
                                                                    </span>
                                                                </span>
                                                            );
                                                        }
                                                        
                                                        return stats.doubles;
                                                    })()}
                                                    </td>
                                                    <td className="py-3 px-2 text-center text-blue-600 font-medium text-xs sm:text-sm">
                                                    {(() => {
                                                        function normalizeTeamName(name: string) {
                                                            return name.replace(/\s+/g, ' ').trim().toLowerCase();
                                                        }
                                                        const stats = Object.entries(teamAverages).find(
                                                            ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                        )?.[1];
                                                        return stats?.average && !isNaN(stats.average) ? stats.average.toFixed(2) : '-';
                                                    })()}
                                                    
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Latest Matchday Results - 1/3 width on desktop */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Latest Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <span className="text-sm font-bold text-green-600">Matchday {latestMatchday}</span>
                                    {latestMatchdayGames.length > 0 && (
                                        <span className="text-xs text-gray-500">({latestMatchdayGames[0].date})</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {latestMatchdayGames.map((game: any, index: number) => {
                                        const [homeScore, awayScore] = game.score.split('-');
                                        const isDraw = homeScore === awayScore;
                                        const hasMissingData = teamsWithMissingData.has(game.homeTeam) || teamsWithMissingData.has(game.awayTeam);
                                        
                                        return (
                                            <div key={index} className={`bg-gray-50 rounded-lg p-3 border ${hasMissingData ? 'border-red-300 bg-red-50/50' : ''}`}>
                                                {hasMissingData && (
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <AlertTriangle className="h-3 w-3 text-red-600" />
                                                        <span className="text-xs text-red-700 font-medium">Game details pending</span>
                                                    </div>
                                                )}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                                                        <span className="font-medium text-gray-900 truncate" title={game.homeTeam}>{game.homeTeam}</span>
                                                        <span className={`font-bold flex-shrink-0 ${isDraw ? 'text-orange-600' : 'text-green-700'}`}>
                                                            {homeScore}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                                                        <span className="font-medium text-gray-900 truncate" title={game.awayTeam}>{game.awayTeam}</span>
                                                        <span className={`font-bold flex-shrink-0 ${isDraw ? 'text-orange-600' : 'text-red-700'}`}>
                                                            {awayScore}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Show pending games from the latest matchday */}
                                    {pendingLatestMatchdayGames.map((game: any, index: number) => (
                                        <div key={`pending-${index}`} className="bg-amber-50/50 rounded-lg p-3 border border-amber-200 border-dashed">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className="h-3 w-3 text-amber-600" />
                                                    <span className="text-xs text-amber-700 font-medium">Result pending</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                                                    <span className="font-medium text-gray-700 truncate" title={game.homeTeam}>{game.homeTeam}</span>
                                                    <span className="text-xs text-gray-500 flex-shrink-0">vs</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                                                    <span className="font-medium text-gray-700 truncate" title={game.awayTeam}>{game.awayTeam}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Show bye team if exists */}
                                    {byeTeam && (
                                        <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium text-gray-900">{byeTeam}</span>
                                                    <p className="text-xs text-gray-500 mt-0.5">Free this matchday</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Results & Schedule Tabs */}
            <Card className="mt-8">
                <Tabs defaultValue="weekly" className="w-full">
                    <CardHeader>
                        <TabsList className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-0">
                            <TabsTrigger value="weekly" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" /> 
                                <span className="hidden sm:inline">Latest</span>
                                <span className="sm:hidden">Latest</span>
                            </TabsTrigger>
                            <TabsTrigger value="statistics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" /> 
                                <span className="hidden sm:inline">Statistics</span>
                                <span className="sm:hidden">Stats</span>
                            </TabsTrigger>
                            <TabsTrigger value="results" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /> 
                                <span>Results</span>
                            </TabsTrigger>
                            <TabsTrigger value="schedule" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" /> 
                                <span className="hidden sm:inline">Schedule</span>
                                <span className="sm:hidden">Schedule</span>
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <TabsContent value="weekly">
                            <div className="space-y-6">
                                {/* Latest Match Singles */}
                                {leagueData?.latestMatches && leagueData.latestMatches.length > 0 ? (
                                    <>
                                        {/* Main Title */}
                                        <div className="mb-4">
                                            <h2 className="text-lg font-bold text-gray-800">
                                                Matchday {leagueData.latestMatches[0].matchday} - {leagueData.latestMatches[0].date}
                                            </h2>
                                        </div>
                                        
                                        {leagueData.latestMatches.map((match: any, matchIndex: number) => (
                                            <div key={matchIndex}>
                                                <div className="mb-3">
                                                    <h3 className="text-sm font-semibold text-gray-700">
                                                        {match.homeTeam} <span className="text-blue-600 font-bold">{match.score}</span> {match.awayTeam}
                                                    </h3>
                                                </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {match.singles && match.singles.map((single: any, singleIndex: number) => {
                                                    const homeWon = single.homeScore > single.awayScore;
                                                    const awayWon = single.awayScore > single.homeScore;
                                                    
                                                    return (
                                                        <div key={singleIndex} className={`rounded-lg p-3 border ${
                                                            homeWon ? 'bg-gradient-to-br from-green-50 to-white border-green-200' :
                                                            awayWon ? 'bg-gradient-to-br from-red-50 to-white border-red-200' :
                                                            'bg-gray-50 border-gray-200'
                                                        }`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <PlayerAvatar name={single.homePlayer} imageUrl={playerImages[single.homePlayer]} size="sm" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`text-sm truncate ${homeWon ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                                            {single.homePlayer}
                                                                        </div>
                                                                        {single.homeAverage > 0 && (
                                                                            <div className="text-xs text-gray-700 font-medium">
                                                                                {single.homeAverage.toFixed(2)} • {single.homeCheckouts || '-'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-lg font-bold ${homeWon ? 'text-green-600' : 'text-gray-400'}`}>
                                                                        {single.homeScore}
                                                                    </div>
                                                                    {homeWon && <div className="text-xs text-gray-400">Win</div>}
                                                                </div>
                                                            </div>
                                                            <div className={`flex items-center justify-between pt-2 border-t ${
                                                                homeWon ? 'border-green-100' : awayWon ? 'border-red-100' : 'border-gray-100'
                                                            }`}>
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <PlayerAvatar name={single.awayPlayer} imageUrl={playerImages[single.awayPlayer]} size="sm" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className={`text-sm truncate ${awayWon ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                                            {single.awayPlayer}
                                                                        </div>
                                                                        {single.awayAverage > 0 && (
                                                                            <div className="text-xs text-gray-600">
                                                                                {single.awayAverage.toFixed(2)} • {single.awayCheckouts || '-'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-lg font-bold ${awayWon ? 'text-green-600' : 'text-gray-400'}`}>
                                                                        {single.awayScore}
                                                                    </div>
                                                                    {awayWon && <div className="text-xs text-gray-400">Win</div>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Weekly Highlights - Best Average & Best Checkout */}
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <h3 className="text-base font-bold text-gray-800 mb-4">Weekly Highlights</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Best Average */}
                                            {(() => {
                                                let bestAvg = { player: '', team: '', average: 0 };
                                                leagueData.latestMatches.forEach((match: any) => {
                                                    match.singles?.forEach((single: any) => {
                                                        if (single.homeAverage > bestAvg.average) {
                                                            bestAvg = { 
                                                                player: single.homePlayer, 
                                                                team: match.homeTeam, 
                                                                average: single.homeAverage 
                                                            };
                                                        }
                                                        if (single.awayAverage > bestAvg.average) {
                                                            bestAvg = { 
                                                                player: single.awayPlayer, 
                                                                team: match.awayTeam, 
                                                                average: single.awayAverage 
                                                            };
                                                        }
                                                    });
                                                });
                                                
                                                return bestAvg.average > 0 ? (
                                                    <div className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-300 rounded-lg p-4">
                                                        <div className="flex items-center gap-3">
                                                            <PlayerAvatar 
                                                                name={bestAvg.player} 
                                                                imageUrl={playerImages[bestAvg.player]} 
                                                                
                                                            />
                                                            <div className="flex-1">
                                                                <div className="text-xs font-medium text-yellow-600 uppercase tracking-wide mb-1">
                                                                    🏆 Best Average
                                                                </div>
                                                                <div className="font-bold text-gray-900 text-lg">{bestAvg.player}</div>
                                                                <div className="text-sm text-gray-600">{bestAvg.team}</div>
                                                                <div className="text-2xl font-bold text-yellow-600 mt-1">
                                                                    {bestAvg.average.toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}
                                            
                                            {/* Best Leg */}
                                            {(() => {
                                                let bestLeg = { player: '', team: '', checkout: Infinity, checkouts: '' };
                                                leagueData.latestMatches.forEach((match: any) => {
                                                    match.singles?.forEach((single: any) => {
                                                        // Parse home checkouts
                                                        if (single.homeCheckouts && single.homeCheckouts !== '-') {
                                                            const checkouts = single.homeCheckouts.split(',').map((c: string) => parseInt(c.trim())).filter((n: number) => !isNaN(n));
                                                            const minCheckout = Math.min(...checkouts);
                                                            if (minCheckout < bestLeg.checkout && minCheckout > 0) {
                                                                bestLeg = {
                                                                    player: single.homePlayer,
                                                                    team: match.homeTeam,
                                                                    checkout: minCheckout,
                                                                    checkouts: single.homeCheckouts
                                                                };
                                                            }
                                                        }
                                                        // Parse away checkouts
                                                        if (single.awayCheckouts && single.awayCheckouts !== '-') {
                                                            const checkouts = single.awayCheckouts.split(',').map((c: string) => parseInt(c.trim())).filter((n: number) => !isNaN(n));
                                                            const minCheckout = Math.min(...checkouts);
                                                            if (minCheckout < bestLeg.checkout && minCheckout > 0) {
                                                                bestLeg = {
                                                                    player: single.awayPlayer,
                                                                    team: match.awayTeam,
                                                                    checkout: minCheckout,
                                                                    checkouts: single.awayCheckouts
                                                                };
                                                            }
                                                        }
                                                    });
                                                });
                                                
                                                return bestLeg.checkout !== Infinity ? (
                                                    <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-lg p-4">
                                                        <div className="flex items-center gap-3">
                                                            <PlayerAvatar 
                                                                name={bestLeg.player} 
                                                                imageUrl={playerImages[bestLeg.player]} 
                                                             
                                                            />
                                                            <div className="flex-1">
                                                                <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                                                                    🎯 Best Leg
                                                                </div>
                                                                <div className="font-bold text-gray-900 text-lg">{bestLeg.player}</div>
                                                                <div className="text-sm text-gray-600">{bestLeg.team}</div>
                                                                <div className="text-2xl font-bold text-green-600 mt-1">
                                                                    {bestLeg.checkout}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-500 p-4">
                                        {loading ? 'Loading latest matches...' : 'No recent match data available. Check console for details.'}
                                        {!loading && (
                                            <div className="mt-2 text-xs">
                                                Debug: latestMatches = {JSON.stringify(leagueData?.latestMatches)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="statistics">
                            <div className="space-y-6">
                                {/* Player Leaderboard */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Top 5 Average */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-purple-600" />
                                            Top Average
                                        </h3>
                                        <div className="space-y-2">
                                            {playerStats && playerStats.length > 0 ? (
                                                playerStats
                                                    .filter(p => p.average > 0)
                                                    .sort((a, b) => b.average - a.average)
                                                    .slice(0, 5)
                                                    .map((player, idx) => {
                                                    const singlesGames = player.singlesWon + player.singlesLost;
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {idx + 1}
                                                                </span>
                                                                <PlayerAvatar name={player.name} imageUrl={playerImages[player.name]} size="sm" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-gray-900 truncate" title={player.name}>{player.name}</div>
                                                                    <div className="text-xs text-gray-500 truncate" title={player.team}>{player.team}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right ml-2">
                                                                <div className="text-sm font-bold text-purple-600">{player.average.toFixed(2)}</div>
                                                                <div className="text-xs text-gray-500">{singlesGames} games</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-xs text-gray-500 p-2">No data available</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Top 5 Singles % */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Target className="h-4 w-4 text-blue-600" />
                                            Top Singles %
                                        </h3>
                                        <div className="space-y-2">
                                            {playerStats
                                                .filter(p => (p.singlesWon + p.singlesLost) >= 1)
                                                .sort((a, b) => {
                                                    if (b.singlesPercentage !== a.singlesPercentage) {
                                                        return b.singlesPercentage - a.singlesPercentage;
                                                    }
                                                    return (b.singlesWon + b.singlesLost) - (a.singlesWon + a.singlesLost);
                                                })
                                                .slice(0, 5)
                                                .map((player, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                                idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                                idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {idx + 1}
                                                            </span>
                                                            <PlayerAvatar name={player.name} imageUrl={playerImages[player.name]} size="sm" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-gray-900 truncate" title={player.name}>{player.name}</div>
                                                                <div className="text-xs text-gray-500 truncate" title={player.team}>{player.team}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-2">
                                                            <div className="text-sm font-bold text-blue-600">{player.singlesPercentage.toFixed(1)}%</div>
                                                            <div className="text-xs text-gray-500">{player.singlesWon}-{player.singlesLost}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Top 5 Doubles % */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-green-600" />
                                            Top Doubles %
                                        </h3>
                                        <div className="space-y-2">
                                            {playerStats
                                                .filter(p => (p.doublesWon + p.doublesLost) >= 1)
                                                .sort((a, b) => {
                                                    if (b.doublesPercentage !== a.doublesPercentage) {
                                                        return b.doublesPercentage - a.doublesPercentage;
                                                    }
                                                    return (b.doublesWon + b.doublesLost) - (a.doublesWon + a.doublesLost);
                                                })
                                                .slice(0, 5)
                                                .map((player, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                                idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                                idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {idx + 1}
                                                            </span>
                                                            <PlayerAvatar name={player.name} imageUrl={playerImages[player.name]} size="sm" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-gray-900 truncate" title={player.name}>{player.name}</div>
                                                                <div className="text-xs text-gray-500 truncate" title={player.team}>{player.team}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-2">
                                                            <div className="text-sm font-bold text-green-600">{player.doublesPercentage.toFixed(1)}%</div>
                                                            <div className="text-xs text-gray-500">{player.doublesWon}-{player.doublesLost}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Top 5 Combined % */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-amber-600" />
                                            Top Combined %
                                        </h3>
                                        <div className="space-y-2">
                                            {playerStats
                                                .filter(p => (p.singlesWon + p.singlesLost + p.doublesWon + p.doublesLost) >= 3)
                                                .sort((a, b) => {
                                                    if (b.combinedPercentage !== a.combinedPercentage) {
                                                        return b.combinedPercentage - a.combinedPercentage;
                                                    }
                                                    const aTotalGames = a.singlesWon + a.singlesLost + a.doublesWon + a.doublesLost;
                                                    const bTotalGames = b.singlesWon + b.singlesLost + b.doublesWon + b.doublesLost;
                                                    return bTotalGames - aTotalGames;
                                                })
                                                .slice(0, 5)
                                                .map((player, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                                idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                                idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {idx + 1}
                                                            </span>
                                                            <PlayerAvatar name={player.name} imageUrl={playerImages[player.name]} size="sm" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-gray-900 truncate" title={player.name}>{player.name}</div>
                                                                <div className="text-xs text-gray-500 truncate" title={player.team}>{player.team}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-2">
                                                            <div className="text-sm font-bold text-amber-600">{player.combinedPercentage.toFixed(1)}%</div>
                                                            <div className="text-xs text-gray-500">{player.singlesWon + player.doublesWon}-{player.singlesLost + player.doublesLost}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 180s & High Finishes Section */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {/* Player 180s */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-red-500" />
                                                Most 180s - Players
                                            </h3>
                                            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                                <div className="text-center">
                                                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-gray-500">Coming Soon</p>
                                                    <p className="text-xs text-gray-400 mt-1">Data not yet available</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Player HiFi */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <Trophy className="h-4 w-4 text-blue-500" />
                                                High Finishes - Players
                                            </h3>
                                            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                                <div className="text-center">
                                                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-gray-500">Coming Soon</p>
                                                    <p className="text-xs text-gray-400 mt-1">Data not yet available</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Team 180s */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-red-500" />
                                                Most 180s - Teams
                                            </h3>
                                            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                                <div className="text-center">
                                                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-gray-500">Coming Soon</p>
                                                    <p className="text-xs text-gray-400 mt-1">Data not yet available</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Team HiFi */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <Trophy className="h-4 w-4 text-blue-500" />
                                                High Finishes - Teams
                                            </h3>
                                            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                                <div className="text-center">
                                                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-gray-500">Coming Soon</p>
                                                    <p className="text-xs text-gray-400 mt-1">Data not yet available</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Rankings Section */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-yellow-500" />
                                        Team Rankings
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Top 3 Singles % */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-blue-600" />
                                                Top Singles %
                                            </h3>
                                            <div className="space-y-2">
                                                {(() => {
                                                    const singlesRankings = leagueStandings
                                                        .map((team: any) => {
                                                            const stats = Object.entries(teamAverages).find(
                                                                ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                            )?.[1];
                                                            if (stats?.singles) {
                                                                const [wonVal, lostVal] = stats.singles.split('-').map(Number);
                                                                const won = wonVal;
                                                                let lost = lostVal;
                                                                let record = stats.singles;
                                                                
                                                                // Add forfeit loss for BSW Zwara Panier
                                                                if (normalizeTeamName(team.team) === normalizeTeamName('BSW Zwara Panier')) {
                                                                    lost += 1;
                                                                    record = `${won}-${lost}`;
                                                                }
                                                                
                                                                const total = won + lost;
                                                                const percentage = total > 0 ? (won / total) * 100 : 0;
                                                                return { team: team.team, percentage, record };
                                                            }
                                                            return null;
                                                        })
                                                        .filter(Boolean)
                                                        .sort((a: any, b: any) => b.percentage - a.percentage)
                                                        .slice(0, 3);

                                                    return singlesRankings.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                                    'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={item.team}>
                                                                    {item.team}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-bold text-blue-600">{item.percentage.toFixed(1)}%</div>
                                                                <div className="text-xs text-gray-500">{item.record}</div>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>

                                        {/* Top 3 Doubles % */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <Users className="h-4 w-4 text-green-600" />
                                                Top Doubles %
                                            </h3>
                                            <div className="space-y-2">
                                                {(() => {
                                                    const doublesRankings = leagueStandings
                                                        .map((team: any) => {
                                                            const stats = Object.entries(teamAverages).find(
                                                                ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                            )?.[1];
                                                            if (stats?.doubles) {
                                                                const [won, lost] = stats.doubles.split('-').map(Number);
                                                                const total = won + lost;
                                                                const percentage = total > 0 ? (won / total) * 100 : 0;
                                                                return { team: team.team, percentage, record: stats.doubles };
                                                            }
                                                            return null;
                                                        })
                                                        .filter(Boolean)
                                                        .sort((a: any, b: any) => b.percentage - a.percentage)
                                                        .slice(0, 3);

                                                    return doublesRankings.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                                    'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={item.team}>
                                                                    {item.team}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-bold text-green-600">{item.percentage.toFixed(1)}%</div>
                                                                <div className="text-xs text-gray-500">{item.record}</div>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>

                                        {/* Top 3 Average */}
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-purple-600" />
                                                Top Average
                                            </h3>
                                            <div className="space-y-2">
                                                {(() => {
                                                    const averageRankings = leagueStandings
                                                        .map((team: any) => {
                                                            const stats = Object.entries(teamAverages).find(
                                                                ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                            )?.[1];
                                                            if (stats?.average && stats.average > 0) {
                                                                return { team: team.team, average: stats.average };
                                                            }
                                                            return null;
                                                        })
                                                        .filter(Boolean)
                                                        .sort((a: any, b: any) => b.average - a.average)
                                                        .slice(0, 3);

                                                    return averageRankings.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                                    'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={item.team}>
                                                                    {item.team}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm font-bold text-purple-600">
                                                                {item.average.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* League Statistics Section */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-blue-600" />
                                        League Statistics
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {/* Team Average */}
                                        <div className="text-center">
                                            <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-center mb-3">
                                                    <div className="bg-blue-100 rounded-full p-3">
                                                        <Trophy className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="text-4xl font-bold text-blue-600 mb-1">{leagueTeamAverage.toFixed(2)}</div>
                                                <div className="text-sm font-semibold text-gray-700 mb-1">Team Avg</div>
                                                <div className="text-xs text-gray-500">{validTeamAverages.length} teams</div>
                                            </div>
                                        </div>

                                        {/* Team Median */}
                                        <div className="text-center">
                                            <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-center mb-3">
                                                    <div className="bg-indigo-100 rounded-full p-3">
                                                        <Trophy className="h-6 w-6 text-indigo-600" />
                                                    </div>
                                                </div>
                                                <div className="text-4xl font-bold text-indigo-600 mb-1">{teamMedian.toFixed(2)}</div>
                                                <div className="text-sm font-semibold text-gray-700 mb-1">Team Median</div>
                                                <div className="text-xs text-gray-500">Middle value</div>
                                            </div>
                                        </div>

                                        {/* Player Average */}
                                        <div className="text-center">
                                            <div className="bg-white rounded-xl p-6 border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-center mb-3">
                                                    <div className="bg-amber-100 rounded-full p-3">
                                                        <Target className="h-6 w-6 text-amber-600" />
                                                    </div>
                                                </div>
                                                <div className="text-4xl font-bold text-amber-600 mb-1">{leaguePlayerAverage.toFixed(2)}</div>
                                                <div className="text-sm font-semibold text-gray-700 mb-1">Player Avg</div>
                                                <div className="text-xs text-gray-500">{validPlayerAverages.length} players</div>
                                            </div>
                                        </div>

                                        {/* Player Median */}
                                        <div className="text-center">
                                            <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-center mb-3">
                                                    <div className="bg-orange-100 rounded-full p-3">
                                                        <Target className="h-6 w-6 text-orange-600" />
                                                    </div>
                                                </div>
                                                <div className="text-4xl font-bold text-orange-600 mb-1">{playerMedian.toFixed(2)}</div>
                                                <div className="text-sm font-semibold text-gray-700 mb-1">Player Median</div>
                                                <div className="text-xs text-gray-500">Middle value</div>
                                            </div>
                                        </div>

                                        {/* Active Players */}
                                        <div className="text-center">
                                            <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-center mb-3">
                                                    <div className="bg-green-100 rounded-full p-3">
                                                        <Target className="h-6 w-6 text-green-600" />
                                                    </div>
                                                </div>
                                                <div className="text-4xl font-bold text-green-600 mb-1">{playerStats.length}</div>
                                                <div className="text-sm font-semibold text-gray-700 mb-1">Active Players</div>
                                                <div className="text-xs text-gray-500">With records</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="results">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(groupedFinishedGames)
                                    .sort(([a], [b]) => Number(b) - Number(a))
                                    .map(([matchday, games]) => (
                                        <div key={matchday} className="space-y-2">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <span className="text-sm font-bold text-green-600">MD {matchday}</span>
                                                {(games as any[])[0] && (
                                                    <span className="text-xs text-gray-500">({(games as any[])[0].date})</span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {(games as any[]).map((game: any, index: number) => {
                                                    const [homeScore, awayScore] = game.score.split('-');
                                                    const isDraw = homeScore === awayScore;
                                                    
                                                    return (
                                                        <div key={index} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between gap-2 text-xs">
                                                                    <span className="font-medium text-gray-900 truncate" title={game.homeTeam}>{game.homeTeam}</span>
                                                                    <span className={`font-bold flex-shrink-0 ${isDraw ? 'text-orange-600' : 'text-green-700'}`}>
                                                                        {homeScore}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2 text-xs">
                                                                    <span className="font-medium text-gray-900 truncate" title={game.awayTeam}>{game.awayTeam}</span>
                                                                    <span className={`font-bold flex-shrink-0 ${isDraw ? 'text-orange-600' : 'text-red-700'}`}>
                                                                        {awayScore}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="schedule">
                            {futureSchedule.length === 0 ? (
                                <div className="text-sm text-gray-500 p-4">No future games scheduled.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(() => {
                                        // Group by round, then inject Cup Round 2 between 6 and 7
                                        const grouped = futureSchedule.reduce((acc: any, game: any) => {
                                            if (!acc[game.round]) acc[game.round] = [];
                                            acc[game.round].push(game);
                                            return acc;
                                        }, {});
                                        // Insert Cup Round 2 after round 6 (if we have Cup matches)
                                        const cupMatches = leagueData.cupMatches || [];
                                        const rounds = Object.keys(grouped).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
                                        const output: Array<[string, any[]]> = [];
                                        for (let i = 0; i < rounds.length; ++i) {
                                            output.push([rounds[i].toString(), grouped[rounds[i]]]);
                                            if (rounds[i] === 6 && cupMatches.length > 0) {
                                                output.push([
                                                    'Cup Round 2',
                                                    cupMatches
                                                ]);
                                            }
                                        }
                                        return output.map(([round, games]) => {
                                            // Count unique teams from our league in Cup Round 2
                                            let leagueTeamsInCup = 0;
                                            if (round === 'Cup Round 2') {
                                                const uniqueLeagueTeams = new Set<string>();
                                                (games as any[]).forEach((game: any) => {
                                                    const homeInLeague = leagueStandings.some((team: any) => 
                                                        team.team.toLowerCase() === game.homeTeam.toLowerCase()
                                                    );
                                                    const awayInLeague = leagueStandings.some((team: any) => 
                                                        team.team.toLowerCase() === game.awayTeam.toLowerCase()
                                                    );
                                                    if (homeInLeague) uniqueLeagueTeams.add(game.homeTeam.toLowerCase());
                                                    if (awayInLeague) uniqueLeagueTeams.add(game.awayTeam.toLowerCase());
                                                });
                                                leagueTeamsInCup = uniqueLeagueTeams.size;
                                            }
                                            
                                            return (
                                                <div key={round} className="space-y-2">
                                                    <div className="flex items-center gap-2 pb-2 border-b">
                                                        <span className={`text-sm font-bold ${round === 'Cup Round 2' ? 'text-pink-700' : 'text-blue-700'}`}>
                                                            {round === 'Cup Round 2' ? 'Cup R2' : `MD ${round}`}
                                                        </span>
                                                        {(games as any[])[0] && (
                                                            <span className="text-xs text-gray-500">
                                                                ({(games as any[])[0].date})
                                                                {round === 'Cup Round 2' && leagueTeamsInCup > 0 && (
                                                                    <span className="ml-1 font-semibold text-pink-600">{leagueTeamsInCup}/7 active</span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                <div className="space-y-2">
                                                    {(games as any[]).map((game: any, idx: number) => {
                                                        // Check if teams are in our league (Division 5)
                                                        const homeInLeague = leagueStandings.some((team: any) => 
                                                            team.team.toLowerCase() === game.homeTeam.toLowerCase()
                                                        );
                                                        const awayInLeague = leagueStandings.some((team: any) => 
                                                            team.team.toLowerCase() === game.awayTeam.toLowerCase()
                                                        );
                                                        
                                                        return (
                                                            <div key={idx} className={`rounded-lg p-2 border ${round === 'Cup Round 2' ? 'bg-pink-50/50 border-pink-200' : 'bg-gray-50 border-gray-200'}`}>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                                        <span className="font-medium text-gray-900 truncate" title={game.homeTeam}>
                                                                            {game.homeTeam}
                                                                            {!homeInLeague && game.homeDivision && (
                                                                                <span className="text-gray-500 ml-1">({game.homeDivision}. Div)</span>
                                                                            )}
                                                                        </span>
                                                                        <span className={`text-xs flex-shrink-0 ${round === 'Cup Round 2' ? 'text-pink-600' : 'text-gray-500'}`}>
                                                                            {round === 'Cup Round 2' ? 'Cup' : 'vs'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                                        <span className="font-medium text-gray-900 truncate" title={game.awayTeam}>
                                                                            {game.awayTeam}
                                                                            {!awayInLeague && game.awayDivision && (
                                                                                <span className="text-gray-500 ml-1">({game.awayDivision}. Div)</span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

        </div>
    );
};

const DartsStatisticsDashboard: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('League Overview');
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [matchReports, setMatchReports] = useState<MatchReport[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState<boolean>(false);
    const [leaguePosition, setLeaguePosition] = useState<number | null>(null); // New state variable for league position
    const [clubVenue, setClubVenue] = useState<ClubVenue | null>(null);
    const [teamAverage, setTeamAverage] = useState<number | null>(null);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
    const [teamStandings, setTeamStandings] = useState<TeamStandings | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string>("team");
    const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>("all"); // Filter for matches tab
    const [matchAverages, setMatchAverages] = useState<MatchAverages[]>([]);
    const [sortColumn] = useState<string>('winRate');
    const [sortDirection] = useState<'asc' | 'desc'>('desc');
    const [scheduleData, setScheduleData] = useState<ScheduleMatch[]>([]);
    const [oneEightys, setOneEightys] = useState<OneEighty[]>([]);
    const [highFinishes, setHighFinishes] = useState<HighFinish[]>([]);
    const [dataSource, setDataSource] = useState<'database' | 'scraped' | null>(null);
    const updateTimeoutRef = useRef<NodeJS.Timeout>();
    // Add this state for controlling visibility
    const [showIndicator, setShowIndicator] = useState(true);
    // Add a new state for tracking retry status
    const [isRetrying, setIsRetrying] = useState(false);
    const currentTeamRef = useRef<string>('');
    // At the top level of the component, add a retry timeout ref
    const retryTimeoutRef = useRef<NodeJS.Timeout>();
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    // First, add a state for showing/hiding secondary tabs
    
    // Performance comparison states
    const [comparisonTeam, setComparisonTeam] = useState<string>('');
    const [comparisonTeamData, setComparisonTeamData] = useState<TeamData | null>(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    
    // Season switcher state (only for DC Patron)
    const [selectedSeason, setSelectedSeason] = useState<'2025/26' | '2024/25' | 'all'>('2025/26');

    // Add this at the top level
    const playerImages: { [key: string]: string } = {
        'Luca Schuckert': 'schucki.jpg',
        'Marko Cvejic': '/cvejic-marko.jpg',
        'Josip Matijevic': 'https://www.oefb.at/oefb2/images/1278650591628556536_4dcb084bb2c30e1395ee-1,0-320x320.png',
        'Muhamet Mahmutaj': 'muki-m.jpg',
        'Marvin De Chavez': 'https://www.oefb.at/oefb2/images/1278650591628556536_49e17c18c1d6921a7870-1,0-320x320.png',
        'Christoph Hafner': 'chris-h.jpg',
        'Michael Frühwirth': 'https://www.oefb.at/oefb2/images/1278650591628556536_ba89cc5af9585cffb11c-1,0-320x320.png',
        'Ermin Kokic': 'https://www.oefb.at/oefb2/images/1278650591628556536_e807ce175060c2e86db6-1,0-320x320.png',
        'Dominik Kubiak': 'https://www.oefb.at/oefb2/images/1278650591628556536_77be3e9035fdc75e8cff-1,0-320x320.png',
        'Markus Hafner': 'markus.jpg',
        'Dejan Stojadinovic': 'dejan.jpg'
    };

    // First, add a ref for the search container
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Add useEffect for click outside handling
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update the useEffect where we fetch data to handle the fade-away
    useEffect(() => {
        if (dataSource === 'scraped') {
            const timer = setTimeout(() => {
                setShowIndicator(false);
            }, 5000);
            return () => clearTimeout(timer);
        } else {
            setShowIndicator(true);
        }
    }, [dataSource]);

    // Update the teams array with all teams including DC Patron
    const teams: string[] = [
        'Dartclub Twentytwo 4',
        'PSV Wien Darts 1',
        'TC Aspern 1',
        'Temmel Fundraising Darts Lions 2',
        'AS The Dart Side of the Moon II',
        'BSW Zwara Panier',
        'DC Patron',
        'Fortunas Wölfe',
        'DC Patron II',
    ];

    // Filter teams for search dropdown (include all teams + League Overview)
    const allOptions = ['League Overview', ...teams];
    const filteredTeams = searchTerm.trim() === '' 
        ? allOptions 
        : allOptions.filter(option => {
            const searchLower = searchTerm.toLowerCase();
            const optionLower = option.toLowerCase();
            return optionLower.includes(searchLower);
        });

    // Filter teams for comparison table (exclude selected team)
    const comparisonTeams = teams.filter(team => team !== selectedTeam);
    
    // Reset season to 2025/26 when team changes
    useEffect(() => {
        setSelectedSeason('2025/26');
    }, [selectedTeam]);
    
    useEffect(() => {
        if (selectedTeam) {
            // Skip data fetching for League Overview
            if (selectedTeam === 'League Overview') {
                setIsInitialLoad(false);
                return;
            }
            
            setLoading(true);
            setIsInitialLoad(true); // Set initial load state
            currentTeamRef.current = selectedTeam;

            // Clear existing timeouts
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }

            // Function to fetch data
            const fetchData = async (forceUpdate = false) => {
                const requestedTeam = currentTeamRef.current;  // Capture team at request time
                try {
                    // Add season parameter for DC Patron
                    const seasonParam = selectedTeam === 'DC Patron' ? `&season=${selectedSeason}` : '';
                    const response = await axios.get(`/api/teamData?team=${encodeURIComponent(requestedTeam)}&forceUpdate=${forceUpdate}${seasonParam}`);
                    const { data, source } = response.data;

                    // Only update state if we're still on the same team
                    if (requestedTeam === currentTeamRef.current) {
                        setDataSource(source);
                        setMatchReports(data.matchReports);
                        setLeaguePosition(data.leaguePosition);
                        setClubVenue(data.clubVenue);
                        setComparisonData(data.comparisonData);
                        setTeamStandings(data.teamStandings);
                        setMatchAverages(data.matchAverages);
                        setOneEightys(data.oneEightys);
                        setHighFinishes(data.highFinishes);

                        const teamData = {
                            players: data.players
                        };
                        setTeamData(teamData);
                        setTeamAverage(data.players.reduce((sum: number, player: Player) => 
                            sum + player.adjustedAverage, 0) / data.players.length);

                        // Schedule next update only if still on same team
                        if (source === 'database') {
                            updateTimeoutRef.current = setTimeout(() => {
                                if (requestedTeam === currentTeamRef.current) {
                                    fetchData(true);
                                }
                            }, 1000);
                        }
                        setIsInitialLoad(false); // Clear initial load state after data is set
                        setLoading(false);
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                    if (requestedTeam === currentTeamRef.current) {
                        setIsInitialLoad(false);
                        setLoading(false);
                    }
                }
            };

            fetchData();
        }
    }, [selectedTeam, selectedSeason]);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const response = await axios.get('/api/schedule');
                setScheduleData(response.data);
            } catch (error) {
                console.error('Error fetching schedule:', error);
            }
        };

        fetchSchedule();
    }, []);

    const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
        if (!isOpen) return null;
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full h-[80vh] sm:h-auto sm:max-w-4xl m-4 overflow-y-auto sm:overflow-visible relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-sm px-4 py-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                        Close
                    </button>
                    <div className="p-4 sm:p-6">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const calculateDifference = (first: string, second: string) => {
        if (!first || !second) return 0;
        
        // Get only the first number from each score (before the dash)
        const firstScore = Number(first.split('-')[0]);
        const secondScore = Number(second.split('-')[0]);
        
        // Return the difference between second round and first round scores
        return secondScore - firstScore;
    };

    const calculateTotalDifference = (data: ComparisonData[]) => {
        return data.reduce((total, match) => {
            if (match.firstRound && match.secondRound) {
                return total + calculateDifference(match.firstRound, match.secondRound);
            }
            return total;
        }, 0);
    };

    // Fetch comparison team data
    const fetchComparisonTeam = async (teamName: string) => {
        if (!teamName) return;
        
        setComparisonLoading(true);
        try {
            const response = await axios.get(`/api/teamData?team=${encodeURIComponent(teamName)}`);
            setComparisonTeamData(response.data.data);
        } catch (error) {
            console.error('Error fetching comparison team:', error);
            setComparisonTeamData(null);
        } finally {
            setComparisonLoading(false);
        }
    };

    // Add this helper function
    const getScoreColor = (score: string) => {
        if (!score) return '';
        const [home, away] = score.split('-').map(Number);
        if (home > away) return 'bg-green-100 text-green-800';
        if (home < away) return 'bg-red-100 text-red-800';
        return 'bg-orange-100 text-orange-800';
    };

    // Update the getBestCheckouts function to return 5 instead of 3
    const getBestCheckouts = (playerName: string, isTeam: boolean = false) => {
        const allCheckouts = matchReports.flatMap(report => 
            report.checkouts
                .filter(c => isTeam ? true : c.scores.startsWith(playerName))
                .map(c => {
                    const scores = c.scores.split(': ')[1];
                    return scores === '-' ? [] : scores.split(', ').map(Number);
                })
                .flat()
        );
        
        return allCheckouts
            .filter(c => !isNaN(c))
            .sort((a, b) => a - b)
            .slice(0, 5);  // Changed from 3 to 5
    };

    // Update the matchData calculation to keep original matchday numbers
    const matchData = matchAverages.map((match) => {
        // Create display matchday with season prefix if available
        const displayMatchday = match.seasonPrefix 
            ? `${match.seasonPrefix}-${match.originalMatchday}` 
            : match.matchday;
            
        if (selectedPlayer === "team") {
            return {
                matchday: displayMatchday,
                average: match.teamAverage,
                opponent: match.opponent || '',  // Use the opponent directly from matchAverages
                originalMatchday: match.matchday, // Keep track of original matchday
                numericMatchday: match.matchday // For sorting/indexing
            };
        } else {
            const playerAvg = match.playerAverages.find(p => p.playerName === selectedPlayer)?.average;
            if (playerAvg) {
                return {
                    matchday: displayMatchday,
                    average: playerAvg,
                    opponent: match.opponent || '', // Use the opponent directly from matchAverages
                    originalMatchday: match.matchday, // Keep track of original matchday
                    numericMatchday: match.matchday // For sorting/indexing
                };
            }
            return null;
        }
    }).filter((data): data is NonNullable<typeof data> => data !== null);

    // Update the running average calculation
    const runningAverages = matchData.map((_, index) => {
        const previousMatches = matchData.slice(0, index + 1);
        const sum = previousMatches.reduce((acc, curr) => acc + curr.average, 0);
        return {
            ...matchData[index],
            runningAverage: Number((sum / previousMatches.length).toFixed(2))
        };
    });

    // Add this function at the top level of the component
    const getLowestThreeCheckouts = () => {
        const allCheckouts = matchReports.flatMap(report => 
            report.checkouts
                .map(c => {
                    const scores = c.scores.split(': ')[1];
                    return scores === '-' ? [] : scores.split(', ').map(Number);
                })
                .flat()
        ).filter(c => !isNaN(c));

        return allCheckouts.sort((a, b) => a - b).slice(0, 3);
    };

    // Define the dot renderer as a simple function that returns an SVG element
    const renderDot = (props: DotProps) => {
        const { cx, cy, payload } = props;
        if (!cx || !cy || !payload) return (
            <svg width={0} height={0}></svg>
        );

        // Find the match report for this matchday
        // Handle both numeric matchday and string matchday with season prefix (e.g., "1-5", "2-3")
        let matchReport;
        const matchday = payload.matchday as number | string;
        if (typeof matchday === 'string' && matchday.includes('-')) {
            // For "all seasons" mode with prefix like "1-5"
            const matchDataEntry = matchData.find(m => m.matchday === matchday);
            if (matchDataEntry && matchDataEntry.numericMatchday) {
                matchReport = matchReports[matchDataEntry.numericMatchday - 1];
            }
        } else {
            // For single season mode
            const numericMatchday = typeof matchday === 'number' ? matchday : parseInt(matchday);
            matchReport = matchReports[numericMatchday - 1];
        }
        
        if (!matchReport) return (
            <svg width={0} height={0}></svg>
        );

        // For team average, check the match score
        if (selectedPlayer === "team") {
            const [homeScore, awayScore] = matchReport.score.split('-').map(Number);
            let color;
            if (homeScore > awayScore) {
                color = "#22c55e";  // green for win
            } else if (homeScore < awayScore) {
                color = "#ef4444";  // red for loss
            } else {
                color = "#f59e0b";  // amber for draw
            }

            return (
                <svg key={`dot-${cx}-${cy}`} x={cx - 6} y={cy - 6} width={12} height={12} fill="none">
                    <path
                        d="M1 1L11 11M1 11L11 1"
                        stroke={color}
                        strokeWidth={2}
                    />
                </svg>
            );
        }

        // For player average, find their result in the lineup
        const playerIndex = matchReport.lineup.indexOf(selectedPlayer);
        if (playerIndex === -1) return (
            <svg width={0} height={0}></svg>
        );

        // Check if player won their matches
        const playerWon = matchReport.details.singles.some(match => 
            (match.homePlayer === selectedPlayer && match.homeScore > match.awayScore) ||
            (match.awayPlayer === selectedPlayer && match.awayScore > match.homeScore)
        );

        const color = playerWon ? "#22c55e" : "#ef4444";  // green for win, red for loss

        return (
            <svg key={`dot-${cx}-${cy}`} x={cx - 6} y={cy - 6} width={12} height={12} fill="none">
                <path
                    d="M1 1L11 11M1 11L11 1"
                    stroke={color}
                    strokeWidth={2}
                />
            </svg>
        );
    };



    // Sort the players array
    const sortedPlayers = [...(teamData?.players || [])].sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        
        switch (sortColumn) {
            case 'playerName':
                return direction * a.playerName.localeCompare(b.playerName);
            case 'average':
                return direction * (a.adjustedAverage - b.adjustedAverage);
            case 'singles': {
                const [aWins = 0] = a.singles?.split('-').map(Number) || [0];
                const [bWins = 0] = b.singles?.split('-').map(Number) || [0];
                return direction * (aWins - bWins);
            }
            case 'doubles': {
                const [aWins = 0] = a.doubles?.split('-').map(Number) || [0];
                const [bWins = 0] = b.doubles?.split('-').map(Number) || [0];
                return direction * (aWins - bWins);
            }
            case 'winRate':
                return direction * ((a.winRate || 0) - (b.winRate || 0));
            default:
                return 0;
        }
    });

    // First, create a sorted array of all entries (team and players)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getAllPerformances = () => {
        // Get team performance
        const teamBestPerformance = matchAverages.reduce((best, current) => 
            current.teamAverage > best.teamAverage ? current : best,
            matchAverages[0] || { teamAverage: 0, matchday: 0, opponent: '-' }
        ) as TeamPerformance;
        const teamDifference = teamBestPerformance.teamAverage - (teamAverage || 0);
        const teamEntry = {
            isTeam: true,
            name: selectedTeam,
            currentAverage: teamAverage || 0,
            bestPerformance: teamBestPerformance,
            difference: teamDifference
        };

        // Get player performances
        const playerEntries = teamData?.players.map(player => {
            const playerAverages = matchAverages
                .flatMap(match => ({
                    average: match.playerAverages.find(avg => avg.playerName === player.playerName)?.average || 0,
                    matchday: match.matchday,
                    opponent: match.opponent
                }))
                .filter(data => data.average > 0);
            
            const bestPerformance = playerAverages.reduce((best, current) => 
                current.average > best.average ? current : best,
                playerAverages[0] || { average: 0, matchday: 0, opponent: '-' }
            ) as PlayerPerformance;
            
            const difference = bestPerformance.average - player.adjustedAverage;

            return {
                isTeam: false,
                name: player.playerName,
                currentAverage: player.adjustedAverage,
                bestPerformance,
                difference
            };
        }) || [];

        // Combine and sort by difference
        return [...playerEntries, teamEntry]
            .sort((a, b) => b.difference - a.difference);
    };

    // Add type guard function
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function isTeamPerformance(performance: PlayerPerformance | TeamPerformance): performance is TeamPerformance {
        return 'teamAverage' in performance;
    }

    // Calculate team win rate once
    const teamWinRate = (() => {
        const totalSinglesWins = teamData?.players.reduce((total, player) => {
            const [wins = 0] = player.singles?.split('-').map(Number) || [0];
            return total + wins;
        }, 0) || 0;
        
        const totalSinglesLosses = teamData?.players.reduce((total, player) => {
            const [_unused, losses = 0] = player.singles?.split('-').map(Number) || [0];
            return total + losses +_unused-_unused;
        }, 0) || 0;
        
        const totalDoublesWins = Math.round((teamData?.players.reduce((total, player) => {
            const [wins = 0] = player.doubles?.split('-').map(Number) || [0];
            return total + wins;
        }, 0) || 0) / 2);
        
        const totalDoublesLosses = Math.round((teamData?.players.reduce((total, player) => {
            const [_unused, losses = 0] = player.doubles?.split('-').map(Number) || [0];
            return total + losses+_unused-_unused;
        }, 0) || 0) / 2);
        
        const totalWins = totalSinglesWins + totalDoublesWins;
        const totalGames = totalSinglesWins + totalSinglesLosses + totalDoublesWins + totalDoublesLosses;
        
        return totalGames > 0 ? Number(((totalWins / totalGames) * 100).toFixed(1)) : 0;
    })();

    // Update the DataSourceIndicator component
    const DataSourceIndicator = () => (
        <div className="fixed bottom-4 right-4 z-50 overflow-hidden">
            {dataSource && (
                <div 
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg
                        transition-all duration-1000 ease-in-out transform 
                        ${dataSource === 'database' 
                            ? 'bg-blue-100 text-blue-800 translate-x-0'
                            : isRetrying 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                        } 
                        ${dataSource === 'scraped' && !showIndicator && !isRetrying
                            ? 'translate-x-[200%] opacity-0' 
                            : 'translate-x-0 opacity-100'
                        }`}
                >
                    {dataSource === 'database' ? (
                        <>
                            <div className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                            <span>Updating ...</span>
                        </>
                    ) : isRetrying ? (
                        <>
                            <div className="w-3 h-3 rounded-full border-2 border-yellow-600 border-t-transparent animate-spin" />
                            <span>Retrying connection...</span>
                        </>
                    ) : (
                        <>
                            <svg 
                                className="w-4 h-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M5 13l4 4L19 7" 
                                />
                            </svg>
                            <span>Updated</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    // Update the axios-retry configuration
    axiosRetry(axios, { 
        retries: 3,
        retryDelay: (retryCount) => {
            const requestedTeam = currentTeamRef.current;
            // Clear any existing retry timeout
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            
            retryTimeoutRef.current = setTimeout(() => {
                if (requestedTeam === currentTeamRef.current) {
                    setIsRetrying(true);
                }
            }, 100);
            
            return retryCount * 1000;
        },
        retryCondition: (error) => {
            const shouldRetry = axiosRetry.isNetworkOrIdempotentRequestError(error) || 
                               error.code === 'ECONNRESET';
            if (!shouldRetry || currentTeamRef.current !== selectedTeam) {
                setIsRetrying(false);
                return false;
            }
            return shouldRetry;
        },
        onRetry: (retryCount, error, requestConfig) => {
            console.log(`Retry attempt ${retryCount} for ${requestConfig.url}`);
            if (retryCount === 3 || currentTeamRef.current !== selectedTeam) {
                setIsRetrying(false);
            }
        }
    });


    // Add this before the return statement
    const pairStats = matchReports.reduce((stats: { 
        [key: string]: { 
            wins: number, 
            losses: number, 
            winRate: number,
            matches: Array<{
                matchday: number | string,
                opponent: string,
                isWin: boolean
            }>
        } 
    }, match, matchIndex) => {
        const isHomeTeam = match.details.singles[0].homePlayer === match.lineup[0];
        
        match.details.doubles.forEach((double) => {
            const ourPlayers = isHomeTeam ? double.homePlayers : double.awayPlayers;
            const pairKey = ourPlayers.sort().join(' & ');
            const isWin = isHomeTeam ? double.homeScore > double.awayScore : double.awayScore > double.homeScore;

            if (!stats[pairKey]) {
                stats[pairKey] = { 
                    wins: 0, 
                    losses: 0, 
                    winRate: 0,
                    matches: []
                };
            }
            
            if (isWin) stats[pairKey].wins++;
            else stats[pairKey].losses++;
            
            stats[pairKey].winRate = Math.round((stats[pairKey].wins / (stats[pairKey].wins + stats[pairKey].losses)) * 100);
            
            // Use season prefix if available (for "all seasons" mode)
            const matchdayDisplay = match.seasonPrefix 
                ? `${match.seasonPrefix}-${match.originalMatchday}` 
                : matchIndex + 1;
            
            stats[pairKey].matches.push({
                matchday: matchdayDisplay,
                opponent: match.opponent,
                isWin
            });
        });
        
        return stats;
    }, {});

    // Add this helper function at the top level
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length > 1 ? 
            `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase() : 
            name.substring(0, 2).toUpperCase();
    };

    const medalColors: { [key: number]: string } = {
        0: 'from-amber-400/40 to-amber-500/40',
        1: 'from-slate-400/40 to-slate-500/40',
        2: 'from-orange-400/40 to-orange-500/40'
    };

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    {/* Opponent Name */}
                    <div className="mb-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                            {matchData.find(m => m.matchday === label)?.opponent}
                        </span>
                    </div>
                    {/* Values */}
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded ${
                                entry.name === 'runningAverage' 
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            }`}>
                                {Number(entry.value).toFixed(2)}
                            </span>
                            <span className="text-gray-600">
                                {entry.name === 'runningAverage' ? 'Running Average' : 'Match Average'}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // First, calculate the domain based on the data
    const getChartDomain = () => {
        const minValue = Math.min(...runningAverages.map(d => d.average));
        const maxValue = Math.max(...runningAverages.map(d => d.average));
        
        let [min, max] = [30, 50];  // default range
        
        if (minValue < 30) min = Math.floor(minValue / 5) * 5;  // round down to nearest 5
        if (maxValue > 50) max = Math.ceil(maxValue / 5) * 5;   // round up to nearest 5
        
        return [min, max];
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <DataSourceIndicator />
            <div className="max-w-7xl mx-auto">
                {/* Main Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                            <Target className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">WDV Landesliga</h1>
                            <span className="text-sm font-medium text-gray-500">5. Division A</span>
                        </div>
                    </div>

                    {/* Search and Team Selection */}
                    <div className="relative w-full md:w-64" ref={searchContainerRef}>  {/* Added width control */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search team..."
                            className="w-full pl-10 pr-4 py-2.5 text-[16px] sm:text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        />
                        {searchTerm && filteredTeams.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-100 shadow-lg overflow-hidden z-50">
                                <div className="max-h-[48rem] overflow-y-auto">  {/* Changed to 48rem (768px) */}
                                    {filteredTeams.map((team) => (
                                        <button
                                            key={team}
                                            onClick={() => {
                                                setSelectedTeam(team);
                                                setSearchTerm('');
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-gray-700 cursor-pointer transition-colors duration-150"
                                        >
                                            {team}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hide content during initial load */}
                {!isInitialLoad ? (
                    <>
                        {/* League Overview - Completely different page */}
                        {selectedTeam === 'League Overview' ? (
                            <LeagueOverview onTeamSelect={setSelectedTeam} />
                        ) : (
                        <>
                        {/* Display Selected Team */}
                        <div className="mb-6 bg-white rounded-xl shadow-sm border overflow-visible">
                            <div className="h-1 w-full bg-gradient-to-r from-blue-400/40 to-blue-500/40" />
                            <div className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                            <Trophy className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <div>
                                            {/* Modified team name and badges container */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <h2 className="text-xl font-semibold text-gray-900">{selectedTeam}</h2>
                                                <div className="flex gap-1.5 mt-1 sm:mt-0">
                                                    {/* Position Badge */}
                                                    <div className="relative group/badge">
                                                        <div className={`h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg ${
                                                            leaguePosition && leaguePosition <= 6
                                                                ? 'bg-emerald-50 border border-emerald-100'
                                                                : 'bg-blue-50 border border-blue-100'
                                                        } flex items-center justify-center`}>
                                                            <span className={`text-[10px] font-bold ${
                                                                leaguePosition && leaguePosition <= 6
                                                                    ? 'text-emerald-600'
                                                                    : 'text-blue-600'
                                                            }`}>POS</span>
                                                        </div>
                                                        <div className={`absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white ${
                                                            leaguePosition && leaguePosition <= 6
                                                                ? 'text-emerald-600 border border-emerald-200'
                                                                : 'text-blue-600 border border-blue-200'
                                                        } text-[10px] flex items-center justify-center font-medium`}>
                                                            {leaguePosition !== null ? leaguePosition : '-'}
                                                        </div>
                                                    </div>

                                                    {/* Average Badge */}
                                                    <div className="relative group/badge">
                                                        <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                                                            <span className="text-[10px] font-bold text-violet-600">AVG</span>
                                                        </div>
                                                        <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-violet-600 text-[10px] flex items-center justify-center border border-violet-200 font-medium">
                                                            {teamAverage !== null ? teamAverage.toFixed(1) : '-'}
                                                        </div>
                                                    </div>

                                                    {/* Existing 180s and HiFi badges */}
                                                    {oneEightys.reduce((sum, player) => sum + (player.count || 0), 0) > 0 && (
                                                        <div className="relative group/badge">
                                                            <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                                                <span className="text-[10px] font-bold text-amber-600">180</span>
                                                            </div>
                                                            <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-amber-600 text-[10px] flex items-center justify-center border border-amber-200 font-medium">
                                                                {oneEightys.reduce((sum, player) => sum + (player.count || 0), 0)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {highFinishes.reduce((sum, player) => sum + (player.finishes?.length || 0), 0) > 0 && (
                                                        <div className="relative group/badge">
                                                            <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center group-hover/badge:bg-rose-100 transition-colors">
                                                                <span className="text-[10px] font-bold text-rose-600">HiFi</span>
                                                            </div>
                                                            <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-rose-600 text-[10px] flex items-center justify-center border border-rose-200 font-medium">
                                                                {highFinishes.reduce((sum, player) => sum + (player.finishes?.length || 0), 0)}
                                                            </div>

                                                            {/* Hover tooltip for high finishes */}
                                                            <div className="absolute right-0 top-full mt-2 scale-0 group-hover/badge:scale-100 transition-transform origin-top-right z-[100]">
                                                                <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-2 whitespace-nowrap">
                                                                    <div className="text-[11px] font-medium text-slate-500 mb-1.5">High Finishes</div>
                                                                    <div className="flex gap-1.5">
                                                                        {highFinishes.flatMap(player => player.finishes || [])
                                                                            .sort((a, b) => b - a)
                                                                            .map((finish, idx) => (
                                                                                <span 
                                                                                    key={idx}
                                                                                    className="px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 rounded border border-rose-100"
                                                                                >
                                                                                    {finish}
                                                                                </span>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                                {/* Arrow */}
                                                                <div className="absolute -top-1 right-3 w-2 h-2 bg-white border-t border-l border-gray-100 transform -rotate-45"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Season Switcher - Only for DC Patron */}
                                            {selectedTeam === 'DC Patron' ? (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-gray-400 font-medium">Season:</span>
                                                    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                                                        <button
                                                            onClick={() => setSelectedSeason('2025/26')}
                                                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                                                selectedSeason === '2025/26'
                                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                                    : 'text-gray-600 hover:text-gray-900'
                                                            }`}
                                                        >
                                                            2025/26
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedSeason('2024/25')}
                                                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                                                selectedSeason === '2024/25'
                                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                                    : 'text-gray-600 hover:text-gray-900'
                                                            }`}
                                                        >
                                                            2024/25
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedSeason('all')}
                                                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                                                selectedSeason === 'all'
                                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                                    : 'text-gray-600 hover:text-gray-900'
                                                            }`}
                                                        >
                                                            All Seasons
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">Season 2025/26</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Performers Card - Hide for old seasons and certain teams */}
                        {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                         selectedTeam !== 'Fortunas Wölfe' && 
                         selectedTeam !== 'DC Patron II' && (
                        <div className="mb-8 bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-amber-400/40 to-amber-500/40" />
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <span className="text-base font-medium text-gray-900">Top Performers</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {teamData && teamData.players.slice(0, 3).map((player: Player, index: number) => (
                                        <div key={player.playerName} 
                                            className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                                        >
                                            <div className={`h-1.5 w-full bg-gradient-to-r ${medalColors[index]}`} />
                                            <div className="p-5">
                                                <div className="flex items-center gap-3">
                                                    {/* Player Avatar */}
                                                    <div className="relative">
                                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-50 to-blue-50 border-3 border-white shadow-md overflow-hidden flex items-center justify-center flex-shrink-0">
                                                            {selectedTeam === 'DC Patron' && playerImages[player.playerName] ? (
                                                                <img 
                                                                    src={playerImages[player.playerName]} 
                                                                    alt={player.playerName}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-2xl font-bold text-violet-700">
                                                                    {getInitials(player.playerName)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Medal Badge on Avatar */}
                                                        <div className={`absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${
                                                            index === 0 
                                                                ? 'bg-amber-400 text-white'
                                                                : index === 1
                                                                    ? 'bg-slate-400 text-white'
                                                                    : 'bg-orange-400 text-white'
                                                        }`}>
                                                            <span className="text-xs font-bold">{index + 1}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Player Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 truncate">{player.playerName}</h3>
                                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-md border border-violet-100">
                                                                {player.adjustedAverage === 0 ? '-' : `${player.adjustedAverage.toFixed(2)}`}
                                                            </span>
                                                            {player.singles && player.singles !== '0-0' && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                                                                    {player.singles}
                                                                </span>
                                                            )}
                                                            {(() => {
                                                                const player180 = oneEightys.find(x => x.playerName === player.playerName);
                                                                const playerHiFi = highFinishes.find(x => x.playerName === player.playerName);
                                                                const hifiList = playerHiFi?.finishes && playerHiFi.finishes.length > 0 
                                                                    ? playerHiFi.finishes.join(', ')
                                                                    : null;
                                                                
                                                                return (
                                                                    <>
                                                                        {player180 && player180.count > 0 && (
                                                                            <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-50 text-yellow-700 rounded-md border border-yellow-100">
                                                                                {player180.count}x180
                                                                            </span>
                                                                        )}
                                                                        {hifiList && (
                                                                            <span className="px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded-md border border-red-100">
                                                                                {hifiList}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Stats Cards Grid - Hide for old seasons and certain teams */}
                        {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                         selectedTeam !== 'Fortunas Wölfe' && 
                         selectedTeam !== 'DC Patron II' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Team Average Card with Singles/Doubles */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-violet-400/40 to-violet-500/40" />
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                                                <BarChart className="h-5 w-5 text-violet-500" />
                                            </div>
                                            <span className="text-base font-medium text-gray-900">Performance</span>
                                        </div>
                                        
                                        {/* Comparison Team Selector */}
                                        <div className="relative">
                                            <select
                                                value={comparisonTeam}
                                                onChange={(e) => {
                                                    setComparisonTeam(e.target.value);
                                                    if (e.target.value) {
                                                        fetchComparisonTeam(e.target.value);
                                                    } else {
                                                        setComparisonTeamData(null);
                                                    }
                                                }}
                                                className="appearance-none text-xs font-medium bg-white border border-violet-200 rounded-lg pl-3 pr-8 py-2 text-gray-700 hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
                                            >
                                                <option value="">Compare team...</option>
                                                {teams.filter(t => t !== selectedTeam).map(team => (
                                                    <option key={team} value={team}>{team}</option>
                                                ))}
                                            </select>
                                            <ArrowUp className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-violet-400 pointer-events-none rotate-180" />
                                        </div>
                                    </div>
                                    
                                    {/* Singles and Doubles Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative rounded-lg bg-slate-50/50 p-3 border border-slate-100 group hover:border-blue-200">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-lg"></div>
                                            <div className="relative z-10">
                                                <div className="text-[11px] text-blue-600 font-medium mb-1">Singles</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-semibold text-slate-700">
                                                        {(teamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.singles?.split('-')[0] || '0'), 0)}
                                                    </span>
                                                    <span className="text-sm text-slate-400">
                                                        /{(teamData?.players ?? []).reduce((sum, player) => {
                                                            const [wins, losses] = player.singles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                            return sum + wins + losses;
                                                        }, 0)}
                                                    </span>
                                                </div>
                                            </div>
                                            <User className="absolute bottom-1 right-1 h-8 w-8 text-blue-200" />
                                        </div>
                                        <div className="relative rounded-lg bg-slate-50/50 p-3 border border-slate-100 group hover:border-violet-200">
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent rounded-lg"></div>
                                            <div className="relative z-10">
                                                <div className="text-[11px] text-violet-600 font-medium mb-1">Doubles</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-semibold text-slate-700">
                                                        {Math.round((teamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.doubles?.split('-')[0] || '0'), 0) / 2)}
                                                    </span>
                                                    <span className="text-sm text-slate-400">
                                                        /{Math.round((teamData?.players ?? []).reduce((sum, player) => {
                                                            const [wins, losses] = player.doubles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                            return sum + wins + losses;
                                                        }, 0) / 2)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Users className="absolute bottom-1 right-1 h-8 w-8 text-violet-200" />
                                        </div>
                                    </div>
                                    
                                    {/* Comparison Section */}
                                    {comparisonTeam && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            {comparisonLoading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <ClipLoader color="#8B5CF6" size={35} />
                                                        <p className="text-sm text-gray-500">Loading {comparisonTeam}...</p>
                                                    </div>
                                                </div>
                                            ) : comparisonTeamData ? (
                                                <div className="space-y-3">
                                                    <div className="text-xs font-medium text-gray-500 mb-2">vs {comparisonTeam}</div>
                                                    
                                                    {/* Singles Comparison */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                                            <span>Singles</span>
                                                            <span>
                                                                {(() => {
                                                                    const yourSingles = (teamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.singles?.split('-')[0] || '0'), 0);
                                                                    const yourSinglesTotal = (teamData?.players ?? []).reduce((sum, player) => {
                                                                        const [wins, losses] = player.singles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                                        return sum + wins + losses;
                                                                    }, 0);
                                                                    const theirSingles = (comparisonTeamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.singles?.split('-')[0] || '0'), 0);
                                                                    const theirSinglesTotal = (comparisonTeamData?.players ?? []).reduce((sum, player) => {
                                                                        const [wins, losses] = player.singles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                                        return sum + wins + losses;
                                                                    }, 0);
                                                                    
                                                                    const yourRate = yourSinglesTotal > 0 ? (yourSingles / yourSinglesTotal * 100).toFixed(0) : 0;
                                                                    const theirRate = theirSinglesTotal > 0 ? (theirSingles / theirSinglesTotal * 100).toFixed(0) : 0;
                                                                    
                                                                    return `${yourRate}% vs ${theirRate}%`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1 h-2">
                                                            {(() => {
                                                                const yourSingles = (teamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.singles?.split('-')[0] || '0'), 0);
                                                                const yourSinglesTotal = (teamData?.players ?? []).reduce((sum, player) => {
                                                                    const [wins, losses] = player.singles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                                    return sum + wins + losses;
                                                                }, 0);
                                                                const theirSingles = (comparisonTeamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.singles?.split('-')[0] || '0'), 0);
                                                                const theirSinglesTotal = (comparisonTeamData?.players ?? []).reduce((sum, player) => {
                                                                    const [wins, losses] = player.singles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                                    return sum + wins + losses;
                                                                }, 0);
                                                                
                                                                const yourRate = yourSinglesTotal > 0 ? (yourSingles / yourSinglesTotal * 100) : 0;
                                                                const theirRate = theirSinglesTotal > 0 ? (theirSingles / theirSinglesTotal * 100) : 0;
                                                                const total = yourRate + theirRate;
                                                                const yourWidth = total > 0 ? (yourRate / total * 100) : 50;
                                                                
                                                                return (
                                                                    <>
                                                                        <div 
                                                                            className={`rounded-l transition-all ${yourRate > theirRate ? 'bg-blue-500' : 'bg-blue-300'}`}
                                                                            style={{ width: `${yourWidth}%` }}
                                                                        />
                                                                        <div 
                                                                            className={`rounded-r transition-all ${theirRate > yourRate ? 'bg-red-500' : 'bg-red-300'}`}
                                                                            style={{ width: `${100 - yourWidth}%` }}
                                                                        />
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Doubles Comparison */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                                            <span>Doubles</span>
                                                            <span>
                                                                {(() => {
                                                                    const yourDoubles = Math.round((teamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.doubles?.split('-')[0] || '0'), 0) / 2);
                                                                    const yourDoublesTotal = Math.round((teamData?.players ?? []).reduce((sum, player) => {
                                                                        const [wins, losses] = player.doubles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                                        return sum + wins + losses;
                                                                    }, 0) / 2);
                                                                    const theirDoubles = Math.round((comparisonTeamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.doubles?.split('-')[0] || '0'), 0) / 2);
                                                                    const theirDoublesTotal = Math.round((comparisonTeamData?.players ?? []).reduce((sum, player) => {
                                                                        const [wins, losses] = player.doubles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                                        return sum + wins + losses;
                                                                    }, 0) / 2);
                                                                    
                                                                    const yourRate = yourDoublesTotal > 0 ? (yourDoubles / yourDoublesTotal * 100).toFixed(0) : 0;
                                                                    const theirRate = theirDoublesTotal > 0 ? (theirDoubles / theirDoublesTotal * 100).toFixed(0) : 0;
                                                                    
                                                                    return `${yourRate}% vs ${theirRate}%`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1 h-2">
                                                            {(() => {
                                                                const yourDoubles = Math.round((teamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.doubles?.split('-')[0] || '0'), 0) / 2);
                                                                const yourDoublesTotal = Math.round((teamData?.players ?? []).reduce((sum, player) => {
                                                                    const [wins, losses] = player.doubles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                                    return sum + wins + losses;
                                                                }, 0) / 2);
                                                                const theirDoubles = Math.round((comparisonTeamData?.players ?? []).reduce((sum, player) => sum + parseInt(player.doubles?.split('-')[0] || '0'), 0) / 2);
                                                                const theirDoublesTotal = Math.round((comparisonTeamData?.players ?? []).reduce((sum, player) => {
                                                                    const [wins, losses] = player.doubles?.split('-').map(n => parseInt(n) || 0) || [0, 0];
                                                                    return sum + wins + losses;
                                                                }, 0) / 2);
                                                                
                                                                const yourRate = yourDoublesTotal > 0 ? (yourDoubles / yourDoublesTotal * 100) : 0;
                                                                const theirRate = theirDoublesTotal > 0 ? (theirDoubles / theirDoublesTotal * 100) : 0;
                                                                const total = yourRate + theirRate;
                                                                const yourWidth = total > 0 ? (yourRate / total * 100) : 50;
                                                                
                                                                return (
                                                                    <>
                                                                        <div 
                                                                            className={`rounded-l transition-all ${yourRate > theirRate ? 'bg-violet-500' : 'bg-violet-300'}`}
                                                                            style={{ width: `${yourWidth}%` }}
                                                                        />
                                                                        <div 
                                                                            className={`rounded-r transition-all ${theirRate > yourRate ? 'bg-red-500' : 'bg-red-300'}`}
                                                                            style={{ width: `${100 - yourWidth}%` }}
                                                                        />
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500 text-center py-4">Failed to load comparison data</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Standings Card */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-amber-400/40 to-amber-500/40" />
                                <div className="p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                            <Trophy className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <span className="text-base font-medium text-gray-900">Record</span>
                                    </div>
                                    {teamStandings && (
                                        <>
                                            <div className="flex items-baseline gap-2 mb-3">
                                                <span className="text-2xl font-bold text-gray-900">
                                                    {`${teamStandings.wins}-${teamStandings.draws}-${teamStandings.losses}`}
                                                </span>
                                                <span className="text-sm text-gray-500">W-D-L</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full flex">
                                                    <div className="h-full bg-emerald-200 transition-all duration-300"
                                                        style={{ width: `${(teamStandings.wins / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` }} 
                                                    />
                                                    <div className="h-full bg-amber-200 transition-all duration-300"
                                                        style={{ width: `${(teamStandings.draws / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` }} 
                                                    />
                                                    <div className="h-full bg-rose-200 transition-all duration-300"
                                                        style={{ width: `${(teamStandings.losses / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` }} 
                                                />
                                            </div>
                                        </div>
                                        </>
                                    )}
                                    </div>
                            </div>

                            {/* Venue Card */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-emerald-400/40 to-emerald-500/40" />
                                <div className="p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                            <Martini className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <span className="text-base font-medium text-gray-900">{clubVenue?.venue}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span>{clubVenue?.address}, {clubVenue?.city}</span>
                                            </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span>{clubVenue?.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                        <Tabs defaultValue="matches" className="space-y-4">
                            <TabsList className="flex flex-wrap gap-2 justify-start mb-32 sm:mb-6">
                                {/* Primary Tabs - Always visible */}
                                <TabsTrigger value="matches" className="flex items-center">
                                    <Users className="h-5 w-5 text-green-500 mr-1" />
                                    Matches
                                </TabsTrigger>
                                {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                                 selectedTeam !== 'Fortunas Wölfe' && 
                                 selectedTeam !== 'DC Patron II' && (
                                <TabsTrigger value="mergedStats" className="flex items-center">
                                    <User className="h-5 w-5 text-green-500 mr-1" />
                                    Player Overview
                                </TabsTrigger>
                                )}
                                <TabsTrigger value="pairs" className="flex items-center">
                                    <Users className="h-5 w-5 text-green-500 mr-1" />
                                    Pairs
                                </TabsTrigger>
                               
                                <TabsTrigger value="charts" className="flex items-center">
                                    <BarChart className="h-5 w-5 text-green-500 mr-1" />
                                    Charts
                                </TabsTrigger>
                                {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                                 selectedTeam !== 'Fortunas Wölfe' && 
                                 selectedTeam !== 'DC Patron II' && (
                                <TabsTrigger value="schedule" className="flex items-center">
                                            <Calendar className="h-5 w-5 text-green-500 mr-1" />
                                            Schedule
                                </TabsTrigger>
                                )}
                            
                                        {/* <TabsTrigger value="stats" className="flex items-center">
                                            <User className="h-5 w-5 text-green-500 mr-1" />
                                            Stats
                                        </TabsTrigger>
                                        
                                <TabsTrigger value="performances" className="flex items-center">
                                    <Trophy className="h-5 w-5 text-green-500 mr-1" />
                                           Performances
                                </TabsTrigger>
                                <TabsTrigger value="scoreBreakdown" className="flex items-center">
                                    <Rows4 className="h-5 w-5 text-green-500 mr-1" />
                                         Distribution
                                </TabsTrigger> */}
                            </TabsList>


                            <TabsContent value="matches">
                                {/* Player Filter Dropdown */}
                                <div className="mb-6 flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700">Filter by Player:</label>
                                    <select
                                        value={selectedPlayerFilter}
                                        onChange={(e) => setSelectedPlayerFilter(e.target.value)}
                                        className="appearance-none text-sm font-medium bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer min-w-[200px]"
                                    >
                                        <option value="all">All Matches</option>
                                        {(() => {
                                            // Get unique singles players from home team only
                                            const players = new Set<string>();
                                            matchReports.forEach(match => {
                                                const isHomeTeam = match.isHomeMatch !== undefined 
                                                    ? match.isHomeMatch 
                                                    : match.details.singles[0].homePlayer === match.lineup[0];
                                                
                                                match.details.singles.forEach(single => {
                                                    const playerName = isHomeTeam ? single.homePlayer : single.awayPlayer;
                                                    if (playerName) players.add(playerName);
                                                });
                                            });
                                            return Array.from(players).sort().map(player => (
                                                <option key={player} value={player}>{player}</option>
                                            ));
                                        })()}
                                    </select>
                                    {selectedPlayerFilter !== "all" && (
                                        <button
                                            onClick={() => setSelectedPlayerFilter("all")}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Clear Filter
                                        </button>
                                    )}
                                </div>

                                {/* Player Singles View */}
                                {selectedPlayerFilter !== "all" ? (
                                    <div className="space-y-4">
                                        {/* Player Header */}
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                            <div className="flex items-center gap-3">
                                                <PlayerAvatar name={selectedPlayerFilter} imageUrl={playerImages[selectedPlayerFilter]} size="md" />
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{selectedPlayerFilter}</h3>
                                                    <p className="text-sm text-gray-600">Singles Games</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Match Cards */}
                                        <div>
                                        {matchReports.map((matchday: MatchReport, matchIndex: number) => {
                                            const isHomeTeam = matchday.isHomeMatch !== undefined 
                                                ? matchday.isHomeMatch 
                                                : matchday.details.singles[0].homePlayer === matchday.lineup[0];
                                            
                                            // Find all singles games for this player in this match
                                            const playerSinglesGames = matchday.details.singles
                                                .map((game, singlesIndex) => ({ game, singlesIndex }))
                                                .filter(({ game }) => {
                                                    const playerInGame = isHomeTeam 
                                                        ? game.homePlayer === selectedPlayerFilter
                                                        : game.awayPlayer === selectedPlayerFilter;
                                                    return playerInGame;
                                                });

                                            if (playerSinglesGames.length === 0) return null;

                                            // Find actual index in filtered list
                                            const filteredMatches = matchReports.filter((md, idx) => {
                                                const isHome = md.isHomeMatch !== undefined 
                                                    ? md.isHomeMatch 
                                                    : md.details.singles[0].homePlayer === md.lineup[0];
                                                const hasPlayerGames = md.details.singles.some(game => {
                                                    return isHome 
                                                        ? game.homePlayer === selectedPlayerFilter
                                                        : game.awayPlayer === selectedPlayerFilter;
                                                });
                                                return hasPlayerGames;
                                            });
                                            const filteredIndex = filteredMatches.findIndex(md => md === matchday);
                                            const isFirst = filteredIndex === 0;
                                            const isLast = filteredIndex === filteredMatches.length - 1;

                                            return (
                                                <div key={matchIndex} className={`bg-white border border-gray-200 shadow-sm p-3 sm:p-4 ${
                                                    isFirst ? 'rounded-t-lg' : ''
                                                } ${
                                                    isLast ? 'rounded-b-lg' : ''
                                                } ${
                                                    !isFirst ? 'border-t-0' : ''
                                                }`}>
                                                    {/* EXACT Match Header from MatchReport */}
                                                    <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 border border-blue-100 text-sm sm:text-base font-bold text-blue-600">
                                                                    {matchday.seasonPrefix ? `${matchday.seasonPrefix}-${matchday.originalMatchday}` : matchIndex + 1}
                                                                </span>
                                                                <h3 className="text-base sm:text-lg font-bold text-gray-800">vs {matchday.opponent}</h3>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center px-2.5 py-1 text-sm font-medium rounded ${
                                                                    matchday.isHomeMatch 
                                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                                                                }`}>
                                                                    {matchday.isHomeMatch ? 'H' : 'A'}
                                                                </span>
                                                                <div className={`px-2 sm:px-3 py-0.5 sm:py-1 text-base sm:text-lg font-bold rounded border ${
                                                                    matchday.score.split('-')[0] > matchday.score.split('-')[1]
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        : matchday.score.split('-')[0] === matchday.score.split('-')[1]
                                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                }`}>
                                                                    {matchday.score}
                                                                </div>
                                                                <div className="px-2 sm:px-3 py-0.5 sm:py-1 text-sm sm:text-base font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded">
                                                                    {matchAverages[matchIndex]?.teamAverage.toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Singles Games List - EXACT format from MatchReport */}
                                                    <div>
                                                        {playerSinglesGames.map(({ game, singlesIndex }, idx) => {
                                                            const match = game;
                                                            const player = selectedPlayerFilter;
                                                            
                                                            // Determine win/loss
                                                            const isWin = isHomeTeam ? 
                                                                match.homeScore > match.awayScore : 
                                                                match.awayScore > match.homeScore;
                                                            
                                                            // Get opponent info
                                                            const opponentName = isHomeTeam ? match.awayPlayer : match.homePlayer;
                                                            
                                                            // Check for walkover
                                                            const isWalkover = isHomeTeam 
                                                                ? match.awayPlayer.toLowerCase().includes('nicht angetreten') 
                                                                : match.homePlayer.toLowerCase().includes('nicht angetreten');
                                                            
                                                            // Get checkouts
                                                            const playerCheckouts = matchday.checkouts
                                                                .filter(c => c.scores.startsWith(player))
                                                                .map(c => c.scores.split(': ')[1])
                                                                .filter(c => c && c !== '-');
                                                            
                                                            const opponentCheckouts = matchday.checkouts
                                                                .filter(c => c.scores.startsWith(opponentName))
                                                                .map(c => c.scores.split(': ')[1])
                                                                .filter(c => c && c !== '-');
                                                            
                                                            // Get averages
                                                            const matchdayAvg = matchAverages[matchIndex]?.playerAverages.find(
                                                                pa => pa.playerName === player
                                                            )?.average;
                                                            
                                                            const runningAvg = sortedPlayers.find(p => p.playerName === player)?.adjustedAverage ?? 0;
                                                            const avgDiff = matchdayAvg ? matchdayAvg - runningAvg : 0;
                                                            
                                                            // Get score
                                                            const playerScore = isHomeTeam ? match.homeScore : match.awayScore;
                                                            const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;

                                                            return (
                                                                <div key={singlesIndex} className={`p-2 sm:p-3 ${
                                                                    idx === 0 ? 'border rounded-t-lg' : 'border-l border-r border-b'
                                                                } ${
                                                                    idx === playerSinglesGames.length - 1 ? 'rounded-b-lg' : ''
                                                                } ${
                                                                    isWin ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/30 border-gray-200'
                                                                }`}>
                                                                    <div className="flex items-center gap-1.5 sm:gap-3">
                                                                        {/* Your Player (Left Side) */}
                                                                        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                                                            {playerImages[player] && (
                                                                                <div className="hidden sm:block">
                                                                                    <PlayerAvatar name={player} imageUrl={playerImages[player]} size="md" />
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-bold text-xs sm:text-sm text-gray-900 truncate">{player}</div>
                                                                                {matchdayAvg && !isWalkover && (
                                                                                    <div className="text-xs sm:text-sm text-gray-700 font-bold truncate">
                                                                                        <span className="text-purple-600">{matchdayAvg.toFixed(2)}</span>
                                                                                        {avgDiff !== 0 && (
                                                                                            <span className={`ml-1 ${avgDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                                {avgDiff > 0 ? '▲' : '▼'}
                                                                                            </span>
                                                                                        )}
                                                                                        {playerCheckouts.length > 0 && (
                                                                                            <span className="text-blue-600 ml-1">• {playerCheckouts.join(', ')}</span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${isWin ? 'text-green-600' : 'text-gray-400'}`}>
                                                                                {playerScore}
                                                                            </div>
                                                                        </div>

                                                                        {/* Separator */}
                                                                        <div className="flex-shrink-0 text-gray-300 font-bold text-base sm:text-xl">-</div>

                                                                        {/* Opponent (Right Side) */}
                                                                        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                                                            <div className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${!isWin ? 'text-red-600' : 'text-gray-400'}`}>
                                                                                {opponentScore}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-bold text-xs sm:text-sm text-gray-900 truncate text-right">{opponentName}</div>
                                                                                {!isWalkover && (opponentCheckouts.length > 0 || matchdayAvg) && (
                                                                                    <div className="text-xs sm:text-sm text-gray-700 truncate text-right font-bold">
                                                                                        {opponentCheckouts.length > 0 && (
                                                                                            <span className="text-blue-600">{opponentCheckouts.join(', ')}</span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {playerImages[opponentName] && (
                                                                                <div className="hidden sm:block">
                                                                                    <PlayerAvatar name={opponentName} imageUrl={playerImages[opponentName]} size="md" />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Walkover indicator */}
                                                                        {isWalkover && (
                                                                            <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded italic flex-shrink-0">
                                                                                w/o
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        </div>
                                    </div>
                                ) : (
                                    /* Original Team Matches View */
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {[...matchReports].reverse().map((matchday: MatchReport, index: number) => {
                                        // Debug: Log the isHomeMatch value
                                        console.log('Match', index + 1, 'isHomeMatch:', matchday.isHomeMatch, 'opponent:', matchday.opponent);
                                        
                                        // Use the isHomeMatch property from scraper, fallback to old logic if undefined
                                        const isHomeTeam = matchday.isHomeMatch !== undefined 
                                            ? matchday.isHomeMatch 
                                            : matchday.details.singles[0].homePlayer === matchday.lineup[0];
                                        
                                        // Create array of all individual games in proper order
                                        const allGames: Array<{
                                            type: 'singles' | 'doubles';
                                            index: number;
                                            lineupIndex: number;
                                            match: any;
                                            player: string;
                                        }> = [];
                                        
                                        // S1
                                        allGames.push({
                                            type: 'singles',
                                            index: 0,
                                            lineupIndex: 0,
                                            match: matchday.details.singles[0],
                                            player: matchday.lineup[0]
                                        });
                                        
                                        // S2
                                        allGames.push({
                                            type: 'singles',
                                            index: 1,
                                            lineupIndex: 1,
                                            match: matchday.details.singles[1],
                                            player: matchday.lineup[1]
                                        });
                                        
                                        // D1
                                        allGames.push({
                                            type: 'doubles',
                                            index: 0,
                                            lineupIndex: 2,
                                            match: matchday.details.doubles[0],
                                            player: matchday.lineup[2]
                                        });
                                        
                                        // D2
                                        allGames.push({
                                            type: 'doubles',
                                            index: 1,
                                            lineupIndex: 3,
                                            match: matchday.details.doubles[1],
                                            player: matchday.lineup[3]
                                        });
                                        
                                        // S3
                                        allGames.push({
                                            type: 'singles',
                                            index: 2,
                                            lineupIndex: 4,
                                            match: matchday.details.singles[2],
                                            player: matchday.lineup[4]
                                        });
                                        
                                        // S4
                                        allGames.push({
                                            type: 'singles',
                                            index: 3,
                                            lineupIndex: 5,
                                            match: matchday.details.singles[3],
                                            player: matchday.lineup[5]
                                        });
                                        
                                        // D3
                                        if (matchday.details.doubles[2]) {
                                            allGames.push({
                                                type: 'doubles',
                                                index: 2,
                                                lineupIndex: 6,
                                                match: matchday.details.doubles[2],
                                                player: matchday.lineup[6]
                                            });
                                        }
                                        
                                        // D4
                                        if (matchday.details.doubles[3]) {
                                            allGames.push({
                                                type: 'doubles',
                                                index: 3,
                                                lineupIndex: 7,
                                                match: matchday.details.doubles[3],
                                                player: matchday.lineup[7]
                                            });
                                        }

                                        return (
                                            <div key={matchReports.length - index - 1} className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
                                                {/* Matchday Header */}
                                                <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 border border-blue-100 text-sm sm:text-base font-bold text-blue-600">
                                                                {matchday.seasonPrefix ? `${matchday.seasonPrefix}-${matchday.originalMatchday}` : matchReports.length - index}
                                                            </span>
                                                            <h3 className="text-base sm:text-lg font-bold text-gray-800">vs {matchday.opponent}</h3>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center px-2.5 py-1 text-sm font-medium rounded ${
                                                                matchday.isHomeMatch 
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                                                            }`}>
                                                                {matchday.isHomeMatch ? 'H' : 'A'}
                                                            </span>
                                                            <div className={`px-2 sm:px-3 py-0.5 sm:py-1 text-base sm:text-lg font-bold rounded border ${
                                                                matchday.score.split('-')[0] > matchday.score.split('-')[1]
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : matchday.score.split('-')[0] === matchday.score.split('-')[1]
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                            }`}>
                                                                {matchday.score}
                                                            </div>
                                                            <div className="px-2 sm:px-3 py-0.5 sm:py-1 text-sm sm:text-base font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded">
                                                                {matchAverages[matchReports.length - index - 1]?.teamAverage.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Games List */}
                                                <div className="space-y-1.5 sm:space-y-2">
                                                    {allGames.map((game, gameIdx) => {
                                                        const isSinglesMatch = game.type === 'singles';
                                                        const match = game.match;
                                                        const player = game.player;
                                                        const idx = game.lineupIndex;
                                                        
                                                        // DC Patron players with avatars
                                                        const dcPatronPlayersWithAvatars = [
                                                            'Muhamet Mahmutaj',
                                                            'Marko Cvejic',
                                                            'Markus Hafner',
                                                            'Christoph Hafner',
                                                            'Dejan Stojadinovic',
                                                            'Luca Schuckert'
                                                        ];
                                                        
                                                        // Determine win/loss
                                                        const isWin = isHomeTeam ? 
                                                            match.homeScore > match.awayScore : 
                                                            match.awayScore > match.homeScore;
                                                        
                                                        // Get opponent info
                                                        const opponentName = isHomeTeam ? 
                                                            (isSinglesMatch ? match.awayPlayer : match.awayPlayers.join(' / ')) :
                                                            (isSinglesMatch ? match.homePlayer : match.homePlayers.join(' / '));
                                                        
                                                        // Check for walkover
                                                        const isWalkover = isSinglesMatch ?
                                                            (isHomeTeam ? match.awayPlayer.toLowerCase().includes('nicht angetreten') : match.homePlayer.toLowerCase().includes('nicht angetreten')) :
                                                            (isHomeTeam ? match.awayPlayers.some((p: string) => p.toLowerCase().includes('nicht angetreten')) : match.homePlayers.some((p: string) => p.toLowerCase().includes('nicht angetreten')));
                                                        
                                                        // Get checkouts
                                                        const playerCheckouts = isSinglesMatch 
                                                            ? matchday.checkouts
                                                                .filter(c => c.scores.startsWith(player))
                                                                .map(c => c.scores.split(': ')[1])
                                                                .filter(c => c && c !== '-')
                                                            : [];
                                                        
                                                        const opponentCheckouts = isSinglesMatch
                                                            ? matchday.checkouts
                                                                .filter(c => c.scores.startsWith(opponentName))
                                                                .map(c => c.scores.split(': ')[1])
                                                                .filter(c => c && c !== '-')
                                                            : [];
                                                        
                                                        // Get averages for singles
                                                        const matchdayAvg = isSinglesMatch ? 
                                                            matchAverages[matchReports.length - index - 1]?.playerAverages.find(
                                                                pa => pa.playerName === player
                                                            )?.average : null;
                                                        
                                                        const runningAvg = sortedPlayers.find(p => p.playerName === player)?.adjustedAverage ?? 0;
                                                        const avgDiff = matchdayAvg ? matchdayAvg - runningAvg : 0;
                                                        
                                                        // Get score
                                                        const playerScore = isHomeTeam ? match.homeScore : match.awayScore;
                                                        const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;
                                                        
                                                        // For doubles, split names
                                                        const playerNames = isSinglesMatch ? [player] : (isHomeTeam ? match.homePlayers : match.awayPlayers);
                                                        const opponentNames = isSinglesMatch ? [opponentName] : (isHomeTeam ? match.awayPlayers : match.homePlayers);
                                                        
                                                        return (
                                                            <div key={gameIdx} className={`rounded-lg p-2 sm:p-3 border ${
                                                                isWin ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/30 border-gray-200'
                                                            }`}>
                                                                <div className="flex items-center gap-1.5 sm:gap-3">
                                                                    {/* Your Player (Left Side) */}
                                                                    <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                                                        {isSinglesMatch ? (
                                                                            dcPatronPlayersWithAvatars.includes(player) && (
                                                                                <div className="hidden sm:block">
                                                                                    <PlayerAvatar name={player} imageUrl={playerImages[player]} size="md" />
                                                                                </div>
                                                                            )
                                                                        ) : (
                                                                            (dcPatronPlayersWithAvatars.includes(playerNames[0]) || dcPatronPlayersWithAvatars.includes(playerNames[1])) && (
                                                                                <div className="hidden sm:flex -space-x-2">
                                                                                    <div className="h-10 w-10 rounded-full bg-blue-50 border-2 border-white overflow-hidden flex items-center justify-center relative z-10">
                                                                                        {playerImages[playerNames[0]] ? (
                                                                                            <img src={playerImages[playerNames[0]]} alt={playerNames[0]} className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            <span className="text-xs font-semibold text-blue-600">{playerNames[0]?.charAt(0)}</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="h-10 w-10 rounded-full bg-purple-50 border-2 border-white overflow-hidden flex items-center justify-center">
                                                                                        {playerImages[playerNames[1]] ? (
                                                                                            <img src={playerImages[playerNames[1]]} alt={playerNames[1]} className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            <span className="text-xs font-semibold text-purple-600">{playerNames[1]?.charAt(0)}</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                        <div className="flex-1 min-w-0">
                                                                            {isSinglesMatch ? (
                                                                                <>
                                                                                    <div className="font-bold text-xs sm:text-sm text-gray-900 truncate">{player}</div>
                                                                                    {matchdayAvg && !isWalkover && (
                                                                                        <div className="text-xs sm:text-sm text-gray-700 font-bold truncate">
                                                                                            <span className="text-purple-600">{matchdayAvg.toFixed(2)}</span>
                                                                                            {avgDiff !== 0 && (
                                                                                                <span className={`ml-1 ${avgDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                                    {avgDiff > 0 ? '▲' : '▼'}
                                                                                                </span>
                                                                                            )}
                                                                                            {playerCheckouts.length > 0 && (
                                                                                                <span className="text-blue-600 ml-1">• {playerCheckouts.join(', ')}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                <div className="font-bold text-xs sm:text-sm text-gray-900">
                                                                                    <div className="truncate">{playerNames[0]}</div>
                                                                                    <div className="truncate">{playerNames[1]}</div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${isWin ? 'text-green-600' : 'text-gray-400'}`}>
                                                                            {playerScore}
                                                                        </div>
                                                                    </div>

                                                                    {/* Separator */}
                                                                    <div className="flex-shrink-0 text-gray-300 font-bold text-base sm:text-xl">-</div>

                                                                    {/* Opponent (Right Side) */}
                                                                    <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                                                        <div className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${!isWin ? 'text-red-600' : 'text-gray-400'}`}>
                                                                            {opponentScore}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            {isSinglesMatch ? (
                                                                                <>
                                                                                    <div className="font-bold text-xs sm:text-sm text-gray-900 truncate text-right">{opponentName}</div>
                                                                                    {!isWalkover && (opponentCheckouts.length > 0 || matchdayAvg) && (
                                                                                        <div className="text-xs sm:text-sm text-gray-700 truncate text-right font-bold">
                                                                                            {opponentCheckouts.length > 0 && (
                                                                                                <span className="text-blue-600">{opponentCheckouts.join(', ')}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                <div className="font-bold text-xs sm:text-sm text-gray-900 text-right">
                                                                                    <div className="truncate">{opponentNames[0]}</div>
                                                                                    <div className="truncate">{opponentNames[1]}</div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {isSinglesMatch ? (
                                                                            dcPatronPlayersWithAvatars.includes(opponentName) && (
                                                                                <div className="hidden sm:block">
                                                                                    <PlayerAvatar name={opponentName} imageUrl={playerImages[opponentName]} size="md" />
                                                                                </div>
                                                                            )
                                                                        ) : (
                                                                            (dcPatronPlayersWithAvatars.includes(opponentNames[0]) || dcPatronPlayersWithAvatars.includes(opponentNames[1])) && (
                                                                                <div className="hidden sm:flex -space-x-2">
                                                                                    <div className="h-10 w-10 rounded-full bg-blue-50 border-2 border-white overflow-hidden flex items-center justify-center relative z-10">
                                                                                        {playerImages[opponentNames[0]] ? (
                                                                                            <img src={playerImages[opponentNames[0]]} alt={opponentNames[0]} className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            <span className="text-xs font-semibold text-blue-600">{opponentNames[0]?.charAt(0)}</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="h-10 w-10 rounded-full bg-purple-50 border-2 border-white overflow-hidden flex items-center justify-center">
                                                                                        {playerImages[opponentNames[1]] ? (
                                                                                            <img src={playerImages[opponentNames[1]]} alt={opponentNames[1]} className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            <span className="text-xs font-semibold text-purple-600">{opponentNames[1]?.charAt(0)}</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>

                                                                    {/* Walkover indicator */}
                                                                    {isWalkover && (
                                                                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded italic flex-shrink-0">
                                                                            w/o
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Result in Legs */}
                                                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-500 font-medium mb-1 sm:mb-2">Result in Legs</div>
                                                        <div className={`text-xl sm:text-2xl font-bold ${
                                                            (() => {
                                                                const [yourSingles, oppSingles] = matchday.details.singles.reduce((acc, match) => {
                                                                    const yourScore = isHomeTeam ? match.homeScore : match.awayScore;
                                                                    const oppScore = isHomeTeam ? match.awayScore : match.homeScore;
                                                                    return [acc[0] + yourScore, acc[1] + oppScore];
                                                                }, [0, 0]);
                                                                const [yourDoubles, oppDoubles] = matchday.details.doubles.reduce((acc, match) => {
                                                                    const yourScore = isHomeTeam ? match.homeScore : match.awayScore;
                                                                    const oppScore = isHomeTeam ? match.awayScore : match.homeScore;
                                                                    return [acc[0] + yourScore, acc[1] + oppScore];
                                                                }, [0, 0]);
                                                                const yourTotal = yourSingles + yourDoubles;
                                                                const oppTotal = oppSingles + oppDoubles;
                                                                return yourTotal > oppTotal ? 'text-green-600' : yourTotal < oppTotal ? 'text-red-600' : 'text-gray-600';
                                                            })()
                                                        }`}>
                                                            {(() => {
                                                                const [yourSingles, oppSingles] = matchday.details.singles.reduce((acc, match) => {
                                                                    const yourScore = isHomeTeam ? match.homeScore : match.awayScore;
                                                                    const oppScore = isHomeTeam ? match.awayScore : match.homeScore;
                                                                    return [acc[0] + yourScore, acc[1] + oppScore];
                                                                }, [0, 0]);
                                                                const [yourDoubles, oppDoubles] = matchday.details.doubles.reduce((acc, match) => {
                                                                    const yourScore = isHomeTeam ? match.homeScore : match.awayScore;
                                                                    const oppScore = isHomeTeam ? match.awayScore : match.homeScore;
                                                                    return [acc[0] + yourScore, acc[1] + oppScore];
                                                                }, [0, 0]);
                                                                return `${yourSingles + yourDoubles}-${oppSingles + oppDoubles}`;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                )}
                            </TabsContent>

                            <TabsContent value="stats">
                                <Card>
                                            <CardHeader>
                                        <div className="flex items-center justify-between">
                                        <CardTitle>Player Statistics</CardTitle>
                                          
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {sortedPlayers.map((player) => (
                                                <div key={player.playerName} 
                                                    className="bg-white rounded-lg border hover:border-blue-200 transition-all duration-200 overflow-hidden"
                                                >
                                                    <div className="p-4">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h3 className="text-lg font-semibold text-gray-900">{player.playerName}</h3>
                                                            {player.adjustedAverage > 0 && (
                                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                                                    {player.adjustedAverage.toFixed(2)} Avg
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                            {/* Win Rate Progress */}
                                                    <div>
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span className="text-gray-500">Win Rate</span>
                                                                    <span className="font-medium text-gray-900">{player.winRate}%</span>
                                                        </div>
                                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-green-500 rounded-full"
                                                                        style={{ width: `${player.winRate}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Match Stats */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <div className="text-xs text-gray-500 mb-1">Singles</div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-lg font-semibold text-gray-900">
                                                                            {player.singles?.split('-')[0] || '0'}
                                                                        </span>
                                                                        <span className="text-sm text-gray-500">
                                                                            - {player.singles?.split('-')[1] || '0'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <div className="text-xs text-gray-500 mb-1">Doubles</div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-lg font-semibold text-gray-900">
                                                                            {player.doubles?.split('-')[0] || '0'}
                                                                        </span>
                                                                        <span className="text-sm text-gray-500">
                                                                            - {player.doubles?.split('-')[1] || '0'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Performance Indicators - Single flex container for all achievements */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 sm:gap-2">
                                                                {/* First row on mobile / First item on desktop */}
                                                                <div className="flex items-center gap-1">
                                                                    <ArrowUp className={`h-4 w-4 ${
                                                                        player.adjustedAverage > (teamAverage || 0)
                                                                            ? 'text-green-500'
                                                                            : 'text-gray-300'
                                                                    }`} />
                                                                    <span className="text-gray-500">Above Team Avg</span>
                                                                </div>
                                                                
                                                                {/* Second row on mobile / Second item on desktop */}
                                                                <div className="flex items-center gap-1">
                                                                    <Trophy className={`h-4 w-4 ${
                                                                        (player?.winRate ?? 0) > teamWinRate
                                                                            ? 'text-amber-500'
                                                                            : 'text-gray-300'
                                                                    }`} />
                                                                    <span className="text-gray-500">Above Team Winrate</span>
                                                                </div>
                                                                
                                                                {/* Third row on mobile / Third item on desktop */}
                                                                <div className="flex items-center gap-1">
                                                                    <Target className={`h-4 w-4 ${
                                                                        oneEightys.find(x => x.playerName === player.playerName)?.count ?? 0 > 0
                                                                            ? 'text-purple-500'
                                                                            : 'text-gray-300'
                                                                    }`} />
                                                                    <span className="text-gray-500">180s ({oneEightys.find(x => x.playerName === player.playerName)?.count ?? 0})</span>
                                                                </div>
                                                                
                                                                {/* Fourth row on mobile / Fourth item on desktop */}
                                                                <div className="flex items-center gap-1">
                                                                    <Zap className={`h-4 w-4 ${
                                                                        (highFinishes.find(x => x.playerName === player.playerName)?.finishes?.length ?? 0) > 0
                                                                            ? 'text-red-500'
                                                                            : 'text-gray-300'
                                                                    }`} />
                                                                    <span className="text-gray-500">High Finish ({
                                                                        highFinishes.find(x => x.playerName === player.playerName)?.finishes?.join(', ') ?? '-'
                                                                    })</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Team Card */}
                                            <div className="bg-white rounded-lg border hover:border-blue-200 transition-all duration-200 overflow-hidden">
                                                <div className="p-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-lg font-semibold text-gray-900">{selectedTeam}</h3>
                                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                                            {teamAverage?.toFixed(2) || '0.00'} Avg
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        {/* Win Rate Progress - Updated calculation */}
                                                    <div>
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="text-gray-500">Win Rate</span>
                                                                <span className="font-medium text-gray-900">
                                                                    {(() => {
                                                                        const totalSinglesWins = teamData?.players.reduce((total, player) => {
                                                                            const [wins = 0] = player.singles?.split('-').map(Number) || [0];
                                                                            return total + wins;
                                                                        }, 0) || 0;
                                                                        
                                                                        const totalSinglesLosses = teamData?.players.reduce((total, player) => {
                                                                            const [_unused, losses = 0] = player.singles?.split('-').map(Number) || [0];
                                                                            return total + losses+_unused-_unused;
                                                                        }, 0) || 0;
                                                                        
                                                                        const totalDoublesWins = Math.round((teamData?.players.reduce((total, player) => {
                                                                            const [wins = 0] = player.doubles?.split('-').map(Number) || [0];
                                                                            return total + wins;
                                                                        }, 0) || 0) / 2);
                                                                        
                                                                        const totalDoublesLosses = Math.round((teamData?.players.reduce((total, player) => {
                                                                            const [_unused, losses = 0] = player.doubles?.split('-').map(Number) || [0];
                                                                            return total + losses+_unused-_unused;
                                                                        }, 0) || 0) / 2);
                                                                        
                                                                        const totalWins = totalSinglesWins + totalDoublesWins;
                                                                        const totalGames = totalSinglesWins + totalSinglesLosses + totalDoublesWins + totalDoublesLosses;
                                                                        
                                                                        return totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';
                                                                    })()}%
                                                                </span>
                                                        </div>
                                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-green-500 rounded-full"
                                                                    style={{ 
                                                                        width: (() => {
                                                                            const totalSinglesWins = teamData?.players.reduce((total, player) => {
                                                                                const [wins = 0] = player.singles?.split('-').map(Number) || [0];
                                                                                return total + wins;
                                                                            }, 0) || 0;
                                                                            
                                                                            const totalSinglesLosses = teamData?.players.reduce((total, player) => {
                                                                                const [_unused, losses = 0] = player.singles?.split('-').map(Number) || [0];
                                                                                return total + losses+_unused-_unused;
                                                                            }, 0) || 0;
                                                                            
                                                                            const totalDoublesWins = Math.round((teamData?.players.reduce((total, player) => {
                                                                                const [wins = 0] = player.doubles?.split('-').map(Number) || [0];
                                                                                return total + wins;
                                                                            }, 0) || 0) / 2);
                                                                            
                                                                            const totalDoublesLosses = Math.round((teamData?.players.reduce((total, player) => {
                                                                                const [_unused, losses = 0] = player.doubles?.split('-').map(Number) || [0];
                                                                                return total + losses+_unused-_unused;
                                                                            }, 0) || 0) / 2);
                                                                            
                                                                            const totalWins = totalSinglesWins + totalDoublesWins;
                                                                            const totalGames = totalSinglesWins + totalSinglesLosses + totalDoublesWins + totalDoublesLosses;
                                                                            
                                                                            return totalGames > 0 ? `${(totalWins / totalGames) * 100}%` : '0%';
                                                                        })()
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Match Stats */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                <div className="text-xs text-gray-500 mb-1">Total Singles</div>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-semibold text-gray-900">
                                                                        {teamData?.players.reduce((total, player) => {
                                                                            const [wins = 0] = player.singles?.split('-').map(Number) || [0];
                                                                            return total + wins;
                                                                        }, 0)}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500">
                                                                        - {teamData?.players.reduce((total, player) => {
                                                                            const [_unused, losses = 0] = player.singles?.split('-').map(Number) || [0];
                                                                            return total + losses+_unused-_unused;
                                                                        }, 0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                <div className="text-xs text-gray-500 mb-1">Total Doubles</div>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-semibold text-gray-900">
                                                                        {(teamData?.players.reduce((total, player) => {
                                                                            const [wins = 0] = player.doubles?.split('-').map(Number) || [0];
                                                                            return total + wins;
                                                                        }, 0) ?? 0) / 2}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500">
                                                                        - {(teamData?.players.reduce((total, player) => {
                                                                            const [_unused, losses = 0] = player.doubles?.split('-').map(Number) || [0];
                                                                            return total + losses+_unused-_unused;
                                                                        }, 0) ?? 0) / 2}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Performance Indicators */}
                                                        <div className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-1.5">
                                                                <Trophy className={`h-4 w-4 ${
                                                                    teamStandings && teamStandings.wins > (teamStandings.losses + teamStandings.draws)
                                                                        ? 'text-amber-500'
                                                                        : 'text-gray-300'
                                                                }`} />
                                                                <span className="text-gray-500">More Wins than Losses</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <ArrowUp className={`h-4 w-4 ${
                                                                    leaguePosition && leaguePosition <= 6
                                                                        ? 'text-green-500'
                                                                        : 'text-gray-300'
                                                                }`} />
                                                                <span className="text-gray-500">Top 6</span>
                                                            </div>
                                                        </div>

                                                        {/* Add the new badges section */}
                                                        <div className="flex gap-1.5 mt-3">
                                                            {oneEightys.reduce((sum, player) => sum + (player.count || 0), 0) > 0 && (
                                                                <div className="relative group/badge">
                                                                    <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                                                        <span className="text-[10px] font-bold text-amber-600">180</span>
                                                                    </div>
                                                                    <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-amber-600 text-[10px] flex items-center justify-center border border-amber-200 font-medium">
                                                                        {oneEightys.reduce((sum, player) => sum + (player.count || 0), 0)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {highFinishes.reduce((sum, player) => sum + (player.finishes?.length || 0), 0) > 0 && (
                                                                <div className="relative group/badge">
                                                                    <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center group-hover/badge:bg-rose-100 transition-colors">
                                                                        <span className="text-[10px] font-bold text-rose-600">HiFi</span>
                                                                    </div>
                                                                    <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-rose-600 text-[10px] flex items-center justify-center border border-rose-200 font-medium">
                                                                        {highFinishes.reduce((sum, player) => sum + (player.finishes?.length || 0), 0)}
                                                                    </div>

                                                                    {/* Hover tooltip for high finishes */}
                                                                    <div className="absolute right-0 top-full mt-2 scale-0 group-hover/badge:scale-100 transition-transform origin-top-right z-[100]">
                                                                        <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-2 whitespace-nowrap">
                                                                            <div className="text-[11px] font-medium text-slate-500 mb-1.5">High Finishes</div>
                                                                            <div className="flex gap-1.5">
                                                                                {highFinishes.flatMap(player => player.finishes || [])
                                                                                    .sort((a, b) => b - a)
                                                                                    .map((finish, idx) => (
                                                                                        <span 
                                                                                            key={idx}
                                                                                            className="px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 rounded border border-rose-100"
                                                                                        >
                                                                                            {finish}
                                                                                        </span>
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                        {/* Arrow */}
                                                                        <div className="absolute -top-1 right-3 w-2 h-2 bg-white border-t border-l border-gray-100 transform -rotate-45"></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                            </TabsContent>

                            <TabsContent value="comparison">
                                <div className="space-y-6">
                                    {/* Header */}
                                                <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-gray-800">Points Comparison</h2>
                                        <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                                        calculateTotalDifference(comparisonData) > 0
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : calculateTotalDifference(comparisonData) === 0
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                                        }`}>
                                            Total Difference: {calculateTotalDifference(comparisonData) > 0 ? '+' : ''}{calculateTotalDifference(comparisonData)}
                                                </div>
                                    </div>

                                    {/* Comparison Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {comparisonTeams.map((team) => {
                                                        const data = comparisonData.find(d => d.opponent === team);
                                                        const difference = data?.firstRound && data?.secondRound 
                                                            ? calculateDifference(data.firstRound, data.secondRound)
                                                            : null;
                                                        
                                                        return (
                                                            <div key={team} 
                                                    className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
                                                >
                                                    {/* Accent line based on difference */}
                                                    <div className={`h-1 w-full bg-gradient-to-r ${
                                                        difference === null
                                                            ? 'from-slate-400/40 to-slate-500/40'
                                                            : difference > 0
                                                                ? 'from-emerald-400/40 to-emerald-500/40'
                                                                : difference === 0
                                                                    ? 'from-amber-400/40 to-amber-500/40'
                                                                    : 'from-rose-400/40 to-rose-500/40'
                                                    }`} />

                                                    <div className="p-5">
                                                        {/* Team Name and Difference */}
                                                                <div className="flex items-center justify-between mb-4">
                                                            <h3 className="text-base font-semibold text-gray-900">{team}</h3>
                                                                    {difference !== null && (
                                                                <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                                                            difference > 0
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                        : difference === 0
                                                                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                                                                }`}>
                                                                    {difference > 0 ? '+' : ''}{difference} points
                                                                </div>
                                                                    )}
                                                                </div>
                                                                
                                                        {/* Rounds Comparison */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="relative rounded-lg bg-slate-50/50 p-3 border border-slate-100">
                                                                <div className="text-[11px] text-slate-600 font-medium mb-1">First Round</div>
                                                                <div className="flex items-baseline gap-1">
                                                                        {data?.firstRound ? (
                                                                        <span className={`px-2 py-1 text-sm font-medium rounded-md ${
                                                                            parseInt(data.firstRound) > 4
                                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                                : parseInt(data.firstRound) === 4
                                                                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                                                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                                                                        }`}>
                                                                                {data.firstRound}
                                                                            </span>
                                                                        ) : (
                                                                        <span className="text-sm text-slate-400">Pending</span>
                                                                        )}
                                                                    </div>
                                                            </div>
                                                            <div className="relative rounded-lg bg-slate-50/50 p-3 border border-slate-100">
                                                                <div className="text-[11px] text-slate-600 font-medium mb-1">Second Round</div>
                                                                <div className="flex items-baseline gap-1">
                                                                        {data?.secondRound ? (
                                                                        <span className={`px-2 py-1 text-sm font-medium rounded-md ${
                                                                            (() => {
                                                                                const [wins] = data.secondRound.split('-').map(Number);
                                                                                return wins > 4
                                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                                    : wins === 4
                                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                                                        : 'bg-rose-50 text-rose-700 border border-rose-100';
                                                                            })()
                                                                        }`}>
                                                                            {data.secondRound}
                                                                            </span>
                                                                        ) : (
                                                                        <span className="text-sm text-slate-400">Pending</span>
                                                                        )}
                                                                    </div>
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        {difference !== null && (
                                                            <div className="mt-4 space-y-2">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="font-medium text-slate-600">Improvement</span>
                                                                    <span className="font-medium text-slate-700">{difference > 0 ? '+' : ''}{difference}</span>
                                                                </div>
                                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                                            difference > 0
                                                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                                                : difference === 0
                                                                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                                                                    : 'bg-gradient-to-r from-rose-400 to-rose-500'
                                                                        }`}
                                                                        style={{ width: `${Math.abs(difference) * 10}%`, maxWidth: '100%' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="charts">
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-semibold text-gray-800">Average Development</h2>
                                        <select
                                            value={selectedPlayer}
                                            onChange={(e) => setSelectedPlayer(e.target.value)}
                                            className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="team">Team Average</option>
                                            {teamData?.players.map((player) => (
                                                <option key={player.playerName} value={player.playerName}>
                                                    {player.playerName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Chart */}
                                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                        <div className="h-1 w-full bg-gradient-to-r from-blue-400/40 to-blue-500/40" />
                                        <div className="p-5">
                                            {/* Add Legend */}
                                            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-0.5 bg-[#22c55e]"></div>
                                                    <span>Running Average</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <div className="w-4 h-4 text-[#22c55e]">✕</div>
                                                        <div className="w-4 h-4 text-[#f59e0b]">✕</div>
                                                        <div className="w-4 h-4 text-[#ef4444]">✕</div>
                                                    </div>
                                                    <span>Match Average (Win/Draw/Loss)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-0.5 bg-[#3b82f6] border-t-2 border-dashed"></div>
                                                    <span>Current Average</span>
                                                </div>
                                            </div>

                                            <div className="h-[300px] sm:h-[400px] -ml-2 sm:ml-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={runningAverages} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis 
                                                            dataKey="matchday" 
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 12 }}
                                                            dy={10}
                                                        />
                                                        <YAxis 
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 12 }}
                                                            dx={-10}
                                                            domain={getChartDomain()}
                                                            ticks={Array.from(
                                                                { length: (getChartDomain()[1] - getChartDomain()[0]) / 5 + 1 },
                                                                (_, i) => getChartDomain()[0] + i * 5
                                                            )}
                                                        />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        {/* Add key props to Line components */}
                                                        <Line
                                                            key="match-average"
                                                            type="monotone"
                                                            dataKey="average"
                                                            stroke="none"
                                                            dot={renderDot}
                                                            isAnimationActive={false}
                                                        />
                                                        <Line
                                                            key="running-average"
                                                            type="monotone"
                                                            dataKey="runningAverage"
                                                            stroke="#22c55e"
                                                            strokeWidth={2}
                                                            dot={false}
                                                            activeDot={{ r: 6, fill: "#22c55e" }}
                                                        />
                                                        {/* Move reference lines outside of render condition */}
                                                        <ReferenceLine 
                                                            key="last-average"
                                                            y={runningAverages[runningAverages.length - 1]?.runningAverage}
                                                            stroke="#3b82f6"
                                                            strokeDasharray="3 3"
                                                            strokeWidth={2}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                             selectedTeam !== 'Fortunas Wölfe' && 
                             selectedTeam !== 'DC Patron II' && (
                            <TabsContent value="schedule">
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-semibold text-gray-800">Upcoming Matches</h2>
                                        <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                            Season 2024/25
                                        </div>
                                    </div>

                                    {selectedTeam === 'DC Patron' ? (
                                        (() => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0); // Set to start of day

                                            const upcomingMatches = scheduleData
                                                .filter(match => {
                                                    const matchDate = new Date(match.date);
                                                    matchDate.setHours(0, 0, 0, 0); // Set to start of day
                                                    return matchDate >= today;
                                                })
                                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                            const matchesByMonth = upcomingMatches.reduce((acc, match) => {
                                                const monthYear = new Date(match.date).toLocaleDateString('de-AT', {
                                                    month: 'long',
                                                    year: 'numeric'
                                                });
                                                if (!acc[monthYear]) acc[monthYear] = [];
                                                acc[monthYear].push(match);
                                                return acc;
                                            }, {} as Record<string, typeof upcomingMatches>);

                                            return (
                                                <div className="space-y-8">
                                                    {Object.entries(matchesByMonth).map(([monthYear, matches]) => (
                                                        <div key={monthYear} className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                                    <Calendar className="h-5 w-5 text-blue-500" />
                                                                </div>
                                                                <h3 className="text-lg font-semibold text-gray-900">{monthYear}</h3>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {matches.map((match) => (
                                                                    <div key={match.round} 
                                                                        className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible border border-gray-100"
                                                                    >
                                                                        <div className="h-1 w-full bg-gradient-to-r from-blue-400/40 to-blue-500/40" />
                                                                        <div className="p-4">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                                                        <span className="text-base font-bold text-blue-600">
                                                                                            {new Date(match.date).getDate()}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex-grow">
                                                                                        <div className="text-xs text-gray-500">Round {match.round}</div>
                                                                                        <div className="font-medium text-gray-900">{match.opponent}</div>
                                                                                    </div>
                                                                                </div>
                                                                                {comparisonData.find(d => d.opponent === match.opponent)?.firstRound && (
                                                                                    <div className="mt-2 sm:mt-0">
                                                                                        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                                                                                            getScoreColor(comparisonData.find(d => d.opponent === match.opponent)?.firstRound || '')
                                                                                        }`}>
                                                                                            {comparisonData.find(d => d.opponent === match.opponent)?.firstRound}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            
                                                                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                                                <span className="text-sm font-medium">{match.venue}</span>
                                                                            </div>
                                                                            
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="text-xs text-gray-500">
                                                                                    {match.address}, {match.location}
                                                                                </div>
                                                                                <a 
                                                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                                        `${match.address}, ${match.location}`
                                                                                    )}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
                                                                                >
                                                                                    <Navigation className="h-3 w-3 mr-1" />
                                                                                    Directions
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Limited</h3>
                                            <p className="text-gray-500 max-w-md">
                                                This feature is currently only available for DC Patron. Select DC Patron to view the match schedule.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            )}

                            <TabsContent value="pairs">
                                <div className="space-y-6">
                                    {/* Header with Filter */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-semibold text-gray-800">Doubles Partnerships</h2>
                                            <select
                                                value={selectedPlayer}
                                                onChange={(e) => setSelectedPlayer(e.target.value)}
                                            className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="team">All Pairs</option>
                                                {selectedTeam === 'DC Patron' && selectedSeason === 'all' && (
                                                    <option value="active-players">Active Players</option>
                                                )}
                                                {teamData?.players.map((player) => (
                                                    <option key={player.playerName} value={player.playerName}>
                                                        {player.playerName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                    {/* Partnerships Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Object.entries(pairStats)
                                            .filter(([pair]) => {
                                                if (selectedPlayer === "team") return true;
                                                if (selectedPlayer === "active-players") {
                                                    const activePlayers = [
                                                        'Marko Cvejic',
                                                        'Luca Schuckert',
                                                        'Muhamet Mahmutaj',
                                                        'Markus Hafner',
                                                        'Christoph Hafner',
                                                        'Dejan Stojadinovic'
                                                    ];
                                                    const players = pair.split(' & ');
                                                    return players.every(player => activePlayers.includes(player));
                                                }
                                                return pair.includes(selectedPlayer);
                                            })
                                            .sort(([, a], [, b]) => {
                                                const aHasEnoughMatches = (a.wins + a.losses) >= 3;
                                                const bHasEnoughMatches = (b.wins + b.losses) >= 3;
                                                
                                                // If one has enough matches and the other doesn't, prioritize the one with enough
                                                if (aHasEnoughMatches !== bHasEnoughMatches) {
                                                    return aHasEnoughMatches ? -1 : 1;
                                                }
                                                
                                                // If both have enough matches or both don't, sort by win rate
                                                return b.winRate - a.winRate;
                                            })
                                            .map(([pair, stats]) => {
                                                const totalMatches = stats.wins + stats.losses;
                                                const hasEnoughMatches = totalMatches >= 3;

                                                // Add visual distinction for pairs with fewer than 3 matches
                                                const cardStyle = hasEnoughMatches 
                                                    ? "border-gray-100" 
                                                    : "border-gray-100 opacity-75";

                                                return (
                                                    <div key={pair} 
                                                        className={`group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible border ${cardStyle}`}
                                                    >
                                                        {/* Accent line based on win rate and matches played */}
                                                        <div className={`h-1 w-full bg-gradient-to-r ${
                                                            totalMatches < 3 
                                                                ? 'from-blue-400/40 to-blue-500/40'
                                                                : stats.winRate > 50
                                                                    ? 'from-emerald-400/40 to-emerald-500/40'
                                                                    : stats.winRate === 50
                                                                        ? 'from-amber-400/40 to-amber-500/40'
                                                                        : 'from-rose-400/40 to-rose-500/40'
                                                        }`} />

                                                        <div className="p-5">
                                                            {/* Players Section */}
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex -space-x-3">
                                                                        <div className="h-10 w-10 rounded-full bg-violet-50 border-2 border-white overflow-hidden flex items-center justify-center">
                                                                            {selectedTeam === 'DC Patron' && playerImages[pair.split(' & ')[0]] ? (
                                                                                <img 
                                                                                    src={playerImages[pair.split(' & ')[0]]} 
                                                                                    alt={pair.split(' & ')[0]}
                                                                                    className="h-full w-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-xs font-medium text-violet-700">
                                                                                    {getInitials(pair.split(' & ')[0])}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="h-10 w-10 rounded-full bg-violet-50 border-2 border-white overflow-hidden flex items-center justify-center">
                                                                            {selectedTeam === 'DC Patron' && playerImages[pair.split(' & ')[1]] ? (
                                                                                <img 
                                                                                    src={playerImages[pair.split(' & ')[1]]} 
                                                                                    alt={pair.split(' & ')[1]}
                                                                                    className="h-full w-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-xs font-medium text-violet-700">
                                                                                    {getInitials(pair.split(' & ')[1])}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-1">
                                                                        <div className="text-sm font-medium text-gray-900">{pair.split(' & ')[0]}</div>
                                                                        <div className="text-sm font-medium text-gray-900">{pair.split(' & ')[1]}</div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                                                    stats.winRate >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                    stats.winRate >= 50 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                                    'bg-slate-50 text-slate-700 border border-slate-100'
                                                                }`}>
                                                                    {stats.winRate}% Win Rate
                                                                </div>
                                                            </div>

                                                            {/* Stats Grid */}
                                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                                <div className="relative rounded-lg bg-slate-50/50 p-2 border border-slate-100">
                                                                    <div className="text-[11px] text-slate-600 font-medium mb-0.5">Matches</div>
                                                                    <div className="text-lg font-semibold text-slate-700">{totalMatches}</div>
                                                                </div>
                                                                <div className="relative rounded-lg bg-emerald-50/50 p-2 border border-emerald-100">
                                                                    <div className="text-[11px] text-emerald-600 font-medium mb-0.5">Wins</div>
                                                                    <div className="text-lg font-semibold text-emerald-700">{stats.wins}</div>
                                                                </div>
                                                                <div className="relative rounded-lg bg-rose-50/50 p-2 border border-rose-100">
                                                                    <div className="text-[11px] text-rose-600 font-medium mb-0.5">Losses</div>
                                                                    <div className="text-lg font-semibold text-rose-700">{stats.losses}</div>
                                                                </div>
                                                            </div>

                                                            {/* Match History */}
                                                            <div className="space-y-2 overflow-visible">
                                                                <div className="text-xs font-medium text-slate-500">Match History</div>
                                                                <div className="flex flex-wrap gap-2 overflow-visible">
                                                                    {stats.matches.map((match, idx) => (
                                                                        <div key={idx} 
                                                                            className={`relative h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-medium hover:scale-110 transition-transform duration-200 group/circle ${
                                                                                match.isWin 
                                                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' 
                                                                                    : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                                                                            }`}
                                                                        >
                                                                            <span>{match.matchday}</span>
                                                                            
                                                                            {/* Tooltip */}
                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/circle:block z-[100]">
                                                                                <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                                                    {match.opponent}
                                                                                </div>
                                                                                <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 w-0 h-0 mx-auto"></div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </TabsContent>

                            {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                             selectedTeam !== 'Fortunas Wölfe' && 
                             selectedTeam !== 'DC Patron II' && (
                            <TabsContent value="mergedStats">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible">
                                    {sortedPlayers.map((player) => {
                                        const playerAverages = matchAverages
                                            .flatMap(match => ({
                                                average: match.playerAverages.find(avg => avg.playerName === player.playerName)?.average || 0,
                                                matchday: match.matchday,
                                                opponent: match.opponent
                                            }))
                                            .filter(data => data.average > 0);
                                        
                                        const bestPerformance = playerAverages.reduce((best, current) => 
                                            current.average > best.average ? current : best,
                                            playerAverages[0] || { average: 0, matchday: 0, opponent: '-' }
                                        );
                                        
                                        const difference = bestPerformance.average - player.adjustedAverage;
                                        const oneEightyCount = oneEightys.find(x => x.playerName === player.playerName)?.count ?? 0;
                                        const highFinishList = highFinishes.find(x => x.playerName === player.playerName)?.finishes ?? [];
                                                            
                                                            return (
                                            <div key={player.playerName} 
                                                className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible border border-gray-100"
                                            >
                                                {/* Subtle top accent line */}
                                                <div className={`h-1 w-full bg-gradient-to-r ${
                                                    player.adjustedAverage > (teamAverage || 0) 
                                                        ? 'from-teal-400/40 to-teal-500/40'
                                                        : 'from-slate-400/30 to-slate-500/30'
                                                }`} />

                                                <div className="p-5 overflow-visible">
                                                    {/* Header Section with minimalist design */}
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4 sm:gap-0">
                                                        {/* Player Info Section */}
                                                        <div className="flex items-center gap-3">
                                                            {/* Avatar */}
                                                            <div className="h-12 w-12 rounded-full bg-violet-50 border-2 border-white overflow-hidden flex items-center justify-center flex-shrink-0">
                                                                {selectedTeam === 'DC Patron' && playerImages[player.playerName] ? (
                                                                    <img 
                                                                        src={playerImages[player.playerName]} 
                                                                        alt={player.playerName}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm font-medium text-violet-700">
                                                                        {getInitials(player.playerName)}
                                                                    </span>
                                                                )}
                                                                                </div>
                                                            {/* Name and Stats */}
                                                            <div className="space-y-1">
                                                                <h3 className="text-lg font-semibold text-gray-800">{player.playerName}</h3>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-md border border-gray-100 whitespace-nowrap">
                                                                            {player.adjustedAverage === 0 ? '-' : `${player.adjustedAverage.toFixed(2)} avg`}
                                                                            </span>
                                                                        {difference > 0 && (
                                                                            <div className="group/peak relative">
                                                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-md border border-violet-100 whitespace-nowrap">
                                                                                    Peak: {bestPerformance.average.toFixed(2)}
                                                                                </span>

                                                                                {/* Peak Performance Tooltip */}
                                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/peak:block z-[100]">
                                                                                    <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                                                        {bestPerformance.opponent}
                                                                                        <br />
                                                                                        {(() => {
                                                                                            const matchWithPeak = matchReports[bestPerformance.matchday - 1];
                                                                                            const playerGame = matchWithPeak?.details.singles.find(game => 
                                                                                                game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                                                            );
                                                                                            const opponentPlayer = playerGame?.homePlayer === player.playerName 
                                                                                                ? playerGame.awayPlayer 
                                                                                                : playerGame?.homePlayer;
                                                                                            const playerWon = playerGame ? 
                                                                                                (playerGame.homePlayer === player.playerName && playerGame.homeScore > playerGame.awayScore) ||
                                                                                                (playerGame.awayPlayer === player.playerName && playerGame.awayScore > playerGame.homeScore)
                                                                                                : false;

                                                                                            return (
                                                                                                <>
                                                                                                    vs {opponentPlayer}
                                                                                                    <div className="mt-1">
                                                                                                        <span className="text-slate-400 italic">MD{bestPerformance.matchday}</span>
                                                                                                        <span className={`ml-1 ${playerWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                                            {playerWon ? 'W' : 'L'}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                    <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 w-0 h-0 mx-auto"></div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                                        </div>
                                                                        
                                                        {/* Achievement Badges */}
                                                        <div className="flex gap-1.5 ml-14 sm:ml-0">
                                                            {player.adjustedAverage > (teamAverage || 0) && (
                                                                <div className="relative group/badge">
                                                                    <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                                        <span className="text-[10px] font-bold text-blue-600">AVG+</span>
                                                                                </div>
                                                                    <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-blue-600 text-[10px] flex items-center justify-center border border-blue-200 font-medium">
                                                                        +{(player.adjustedAverage - (teamAverage || 0)).toFixed(1)}
                                                                                </div>
                                                                </div>
                                                            )}
                                                            {(player?.winRate ?? 0) > teamWinRate && (
                                                                <div className="relative group/badge">
                                                                    <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                                                        <span className="text-[10px] font-bold text-emerald-600">WIN+</span>
                                                                    </div>
                                                                    <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-emerald-600 text-[10px] flex items-center justify-center border border-emerald-200 font-medium">
                                                                        +{((player?.winRate ?? 0) - teamWinRate).toFixed(0)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {oneEightyCount > 0 && (
                                                                <div className="relative group/badge">
                                                                    <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                                                        <span className="text-[10px] font-bold text-amber-600">180</span>
                                                                    </div>
                                                                    <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-amber-600 text-[10px] flex items-center justify-center border border-amber-200 font-medium">
                                                                        {oneEightyCount}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {highFinishList.length > 0 && (
                                                                <div className="relative group/badge">
                                                                    <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center group-hover/badge:bg-rose-100 transition-colors">
                                                                        <span className="text-[10px] font-bold text-rose-600">HiFi</span>
                                                                    </div>
                                                                    <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-rose-600 text-[10px] flex items-center justify-center border border-rose-200 font-medium">
                                                                        {highFinishList.length}
                                                                            </div>

                                                                    {/* Hover tooltip for high finishes */}
                                                                    <div className="absolute right-0 top-full mt-2 scale-0 group-hover/badge:scale-100 transition-transform origin-top-right z-[100]">
                                                                        <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-2 whitespace-nowrap">
                                                                            <div className="text-[11px] font-medium text-slate-500 mb-1.5">High Finishes</div>
                                                                            <div className="flex gap-1.5">
                                                                                {highFinishList.map((finish, idx) => (
                                                                                    <span 
                                                                                        key={idx}
                                                                                        className="px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 rounded border border-rose-100"
                                                                                    >
                                                                                        {finish}
                                                                                                            </span>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                        {/* Arrow */}
                                                                        <div className="absolute -top-1 right-3 w-2 h-2 bg-white border-t border-l border-gray-100 transform -rotate-45"></div>
                                                                                            </div>
                                                                                    </div>
                                                            )}
                                                                            </div>
                                                                        </div>
                                                                        
                                                    {/* Elegant stats grid */}
                                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                                        <div className="relative rounded-lg bg-slate-50/50 p-3 border border-slate-100 group hover:border-blue-200">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-lg"></div>
                                                            <div className="relative z-10">
                                                                <div className="text-[11px] text-blue-600 font-medium mb-1">Singles</div>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-xl font-semibold text-slate-700">
                                                                        {player.singles?.split('-')[0] || '0'}
                                                                    </span>
                                                                    <span className="text-sm text-slate-400">
                                                                        /{parseInt(player.singles?.split('-')[0] || '0') + parseInt(player.singles?.split('-')[1] || '0')}
                                                                                    </span>
                                                                                    </div>
                                                                                </div>
                                                            <User className="absolute bottom-1 right-1 h-8 w-8 text-blue-200" />
                                            </div>
                                                        <div className="relative rounded-lg bg-slate-50/50 p-3 border border-slate-100 group hover:border-violet-200">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent rounded-lg"></div>
                                                            <div className="relative z-10">
                                                                <div className="text-[11px] text-violet-600 font-medium mb-1">Doubles</div>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-xl font-semibold text-slate-700">
                                                                        {player.doubles?.split('-')[0] || '0'}
                                                                    </span>
                                                                    <span className="text-sm text-slate-400">
                                                                        /{parseInt(player.doubles?.split('-')[0] || '0') + parseInt(player.doubles?.split('-')[1] || '0')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Users className="absolute bottom-1 right-1 h-8 w-8 text-violet-200" />
                                                        </div>
                                                    </div>

                                                    {/* Refined win rate bar */}
                                                    <div className="mb-5">
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-xs font-medium text-slate-500">Win Rate</span>
                                                            <span className="text-xs font-semibold text-slate-700">{player.winRate}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                                                                style={{ width: `${player.winRate}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                    

                                                    {/* Elegant checkouts display */}
                                                    {getBestCheckouts(player.playerName).length > 0 && (
                                                        <div className="flex flex-row items-center justify-between overflow-visible">  {/* Changed from flex-wrap to flex-row */}
                                                            <div className="flex flex-wrap gap-1.5 max-w-[75%]">  {/* Added max-width to prevent overflow */}
                                                                {getBestCheckouts(player.playerName).map((checkout, idx) => {
                                                                    const lowestThree = getLowestThreeCheckouts();
                                                                    let checkoutStyle = "";
                                                                    
                                                                    if (checkout === lowestThree[0]) {
                                                                        // Gold for lowest
                                                                        checkoutStyle = "bg-amber-50 text-amber-700 border-amber-200";
                                                                    } else if (checkout === lowestThree[1]) {
                                                                        // Silver for second lowest
                                                                        checkoutStyle = "bg-gray-100 text-gray-700 border-gray-200";
                                                                    } else if (checkout === lowestThree[2]) {
                                                                        // Bronze for third lowest
                                                                        checkoutStyle = "bg-orange-50 text-orange-700 border-orange-200";
                                                                    } else if (checkout <= 24) {
                                                                        // Light blue for checkouts under 24
                                                                        checkoutStyle = "bg-blue-50 text-blue-700 border-blue-100";
                                                                    } else {
                                                                        // Light grey for all others
                                                                        checkoutStyle = "bg-slate-50 text-slate-600 border-slate-200";
                                                                    }

                                                                    // Find all matches where this checkout occurred
                                                                    const matchesWithCheckout = matchReports.filter(match => 
                                                                        match.checkouts.some(c => 
                                                                            c.scores.startsWith(player.playerName) && 
                                                                            c.scores.split(': ')[1].split(', ').includes(checkout.toString())
                                                                        )
                                                                    );

                                                                    // Get the index of this specific checkout occurrence
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    const checkoutOccurrences = getBestCheckouts(player.playerName)
                                                                        .filter(c => c === checkout)
                                                                        .length;
                                                                    const currentCheckoutIndex = getBestCheckouts(player.playerName)
                                                                        .slice(0, idx + 1)
                                                                        .filter(c => c === checkout)
                                                                        .length - 1;

                                                                    // Get the correct match for this specific checkout occurrence
                                                                    const matchWithCheckout = matchesWithCheckout[currentCheckoutIndex];

                                                                    return (
                                                                        <div key={idx} 
                                                                            className="group/checkout relative"
                                                                        >
                                                                            <div className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs font-medium rounded-md border ${checkoutStyle}`}>
                                                                                {checkout}
                                                                            </div>

                                                                            {/* Tooltip */}
                                                                            {matchWithCheckout && (
                                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/checkout:block z-[100]">
                                                                                    <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                                                        {matchWithCheckout.opponent}
                                                                                        <br />
                                                                                        {(() => {
                                                                                            const playerGame = matchWithCheckout.details.singles.find(game => 
                                                                                                game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                                                            );
                                                                                            const opponentPlayer = playerGame?.homePlayer === player.playerName 
                                                                                                ? playerGame.awayPlayer 
                                                                                                : playerGame?.homePlayer;
                                                                                            return `vs ${opponentPlayer}`;
                                                                                        })()}
                                                                                        <div className="mt-1">
                                                                                            <span className="text-slate-400 italic">MD{matchReports.indexOf(matchWithCheckout) + 1}</span>
                                                                                            {(() => {
                                                                                                const playerGame = matchWithCheckout.details.singles.find(game => 
                                                                                                    game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                                                                );
                                                                                                const playerWon = playerGame ? 
                                                                                                    (playerGame.homePlayer === player.playerName && playerGame.homeScore > playerGame.awayScore) ||
                                                                                                    (playerGame.awayPlayer === player.playerName && playerGame.awayScore > playerGame.homeScore)
                                                                                                    : false;

                                                                                                return (
                                                                                                    <span className={`ml-1 ${playerWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                                        {playerWon ? 'W' : 'L'}
                                                                                                    </span>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 w-0 h-0 mx-auto"></div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Form Guide Circles */}
                                                            <div className="flex items-center gap-2 overflow-visible flex-shrink-0">  {/* Added flex-shrink-0 */}
                                                                {/* Get filtered matches first to check count */}
                                                                {(() => {
                                                                    const filteredMatches = [...matchReports]
                                                                        .reverse()
                                                                        .filter(match => match.details.singles.some(game => 
                                                                            game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                                        ))
                                                                        .slice(0, 5);

                                                                    return (
                                                                        <>
                                                                            <span className="text-xs text-gray-500 italic">
                                                                                L{filteredMatches.length < 5 ? filteredMatches.length : 5}
                                                                            </span>
                                                                            <div className="flex gap-1.5 overflow-visible">
                                                                                {filteredMatches.map((match, idx) => {
                                                                                    const playerGame = match.details.singles.find(game => 
                                                                                        game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                                                    );
                                                                                    const playerWon = playerGame ? 
                                                                                        (playerGame.homePlayer === player.playerName && playerGame.homeScore > playerGame.awayScore) ||
                                                                                        (playerGame.awayPlayer === player.playerName && playerGame.awayScore > playerGame.homeScore)
                                                                                        : false;

                                                                                    const opponentPlayer = playerGame?.homePlayer === player.playerName 
                                                                                        ? playerGame.awayPlayer 
                                                                                        : playerGame?.homePlayer;

                                                                                    return (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="group/circle relative"
                                                                                        >
                                                                                            <div
                                                                                                className={`h-3 w-3 rounded-full ${
                                                                                                    playerWon 
                                                                                                        ? 'bg-emerald-400'
                                                                                                        : 'bg-rose-400'
                                                                                                }`}
                                                                                            />
                                                                                            
                                                                                            {/* Tooltip */}
                                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/circle:block z-[100]">
                                                                                                <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                                                                    {match.opponent}
                                                                                                    <br />
                                                                                                    vs {opponentPlayer}
                                                                                                    <div className="mt-1 text-slate-400 italic">
                                                                                                        MD{matchReports.indexOf(match) + 1}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 w-0 h-0 mx-auto"></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    )}
                                                                    </div>
                                                                </div>
                                                            );
                                    })}
                                            </div>
                            </TabsContent>
                            )}
                        </Tabs>
                        </>
                        )}
                    </>
                ) : (
                    <div className="flex justify-center items-center min-h-[50vh]">
                        <div className="flex flex-col items-center gap-4">
                            <ClipLoader color="#3B82F6" size={50} />
                            <p className="text-gray-600">Loading team data...</p>
                        </div>
                    </div>
                )}
            </div>
            <Modal 
                isOpen={selectedMatchId !== null}
                onClose={() => setSelectedMatchId(null)}
            >
                {selectedMatchId !== null && matchReports[selectedMatchId] && (
                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="flex items-start justify-between pb-4 border-b">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-semibold text-gray-800">Matchday {selectedMatchId + 1}</h2>
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-gray-500">{matchReports[selectedMatchId].opponent}</span>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${
                                            matchReports[selectedMatchId].score.split('-')[0] > matchReports[selectedMatchId].score.split('-')[1]
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : matchReports[selectedMatchId].score.split('-')[0] === matchReports[selectedMatchId].score.split('-')[1]
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                        }`}>
                                            Sets {matchReports[selectedMatchId].score}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                                            Legs {matchReports[selectedMatchId].details.totalLegs.home}-{matchReports[selectedMatchId].details.totalLegs.away}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Match Flow Section */}
                        <div className="grid gap-4">
                            {/* First Singles (0-1) */}
                        {matchReports[selectedMatchId].details.singles.slice(0, 2).map((match, idx) => {
                            // Get checkouts for both players
                            const homeCheckouts = matchReports[selectedMatchId].checkouts
                                .filter(c => c.scores.startsWith(match.homePlayer + ':'))
                                .map(c => c.scores.split(': ')[1])
                                .join(', ');
                            const awayCheckouts = matchReports[selectedMatchId].checkouts
                                .filter(c => c.scores.startsWith(match.awayPlayer + ':'))
                                .map(c => c.scores.split(': ')[1])
                                .join(', ');
                            
                            return (
                                <div key={`single1-${idx}`} 
                                    className="flex items-center bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden"
                                >
                                    <div className={`w-[42%] flex flex-col items-end gap-1 p-3 ${
                                        match.homeScore > match.awayScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{match.homePlayer}</span>
                                            {match.homeScore > match.awayScore && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    W
                                        </span>
                                            )}
                                        </div>
                                        {homeCheckouts && (
                                            <span className="text-[10px] text-gray-500 italic">{homeCheckouts}</span>
                                        )}
                                    </div>
                                    <div className="w-[16%] flex items-center justify-center px-2 py-2 bg-white border-x border-slate-100">
                                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                            {match.homeScore}-{match.awayScore}
                                </span>
                                    </div>
                                    <div className={`w-[42%] flex flex-col items-start gap-1 p-3 ${
                                        match.awayScore > match.homeScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{match.awayPlayer}</span>
                                            {match.awayScore > match.homeScore && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    W
                                                </span>
                                            )}
                                        </div>
                                        {awayCheckouts && (
                                            <span className="text-[10px] text-gray-500 italic">{awayCheckouts}</span>
                                        )}
                                    </div>
                            </div>
                            );
                        })}
                        
                            {/* First Doubles (0-1) */}
                        {matchReports[selectedMatchId].details.doubles.slice(0, 2).map((match, idx) => (
                                <div key={`double1-${idx}`} 
                                    className="flex items-center bg-violet-50/50 rounded-lg border border-violet-100 overflow-hidden"
                                >
                                    <div className={`w-[42%] flex items-center justify-end gap-2 p-3 ${
                                        match.homeScore > match.awayScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <span className="text-sm font-medium">{match.homePlayers.join(' / ')}</span>
                                        {match.homeScore > match.awayScore && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                W
                                    </span>
                                        )}
                                    </div>
                                    <div className="w-[16%] flex items-center justify-center px-2 py-2 bg-white border-x border-violet-100">
                                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                            {match.homeScore}-{match.awayScore}
                                </span>
                            </div>
                                    <div className={`w-[42%] flex items-center gap-2 p-3 ${
                                        match.awayScore > match.homeScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <span className="text-sm font-medium">{match.awayPlayers.join(' / ')}</span>
                                        {match.awayScore > match.homeScore && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                W
                                    </span>
                                        )}
                                    </div>
                            </div>
                        ))}
                        
                            {/* Second Singles (2-3) */}
                            {matchReports[selectedMatchId].details.singles.slice(2).map((match, idx) => {
                                // Get checkouts for both players
                                const homeCheckouts = matchReports[selectedMatchId].checkouts
                                    .filter(c => c.scores.startsWith(match.homePlayer + ':'))
                                    .map(c => c.scores.split(': ')[1])
                                    .join(', ');
                                const awayCheckouts = matchReports[selectedMatchId].checkouts
                                    .filter(c => c.scores.startsWith(match.awayPlayer + ':'))
                                    .map(c => c.scores.split(': ')[1])
                                    .join(', ');
                                
                                return (
                                <div key={`single2-${idx}`} 
                                    className="flex items-center bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden"
                                >
                                    <div className={`w-[42%] flex flex-col items-end gap-1 p-3 ${
                                        match.homeScore > match.awayScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{match.homePlayer}</span>
                                            {match.homeScore > match.awayScore && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    W
                                        </span>
                                            )}
                                        </div>
                                        {homeCheckouts && (
                                            <span className="text-[10px] text-gray-500 italic">{homeCheckouts}</span>
                                        )}
                                    </div>
                                    <div className="w-[16%] flex items-center justify-center px-2 py-2 bg-white border-x border-slate-100">
                                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                            {match.homeScore}-{match.awayScore}
                                </span>
                                    </div>
                                    <div className={`w-[42%] flex flex-col items-start gap-1 p-3 ${
                                        match.awayScore > match.homeScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{match.awayPlayer}</span>
                                            {match.awayScore > match.homeScore && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    W
                                                </span>
                                            )}
                                        </div>
                                        {awayCheckouts && (
                                            <span className="text-[10px] text-gray-500 italic">{awayCheckouts}</span>
                                        )}
                                    </div>
                            </div>
                                );
                            })}
                        
                            {/* Second Doubles (2-3) */}
                            {matchReports[selectedMatchId].details.doubles.slice(2).map((match, idx) => (
                                <div key={`double2-${idx}`} 
                                    className="flex items-center bg-violet-50/50 rounded-lg border border-violet-100 overflow-hidden"
                                >
                                    {/* Same structure as First Doubles */}
                                    <div className={`w-[42%] flex items-center justify-end gap-2 p-3 ${
                                        match.homeScore > match.awayScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <span className="text-sm font-medium">{match.homePlayers.join(' / ')}</span>
                                        {match.homeScore > match.awayScore && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                W
                                    </span>
                                        )}
                                    </div>
                                    <div className="w-[16%] flex items-center justify-center px-2 py-2 bg-white border-x border-violet-100">
                                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                            {match.homeScore}-{match.awayScore}
                                </span>
                            </div>
                                    <div className={`w-[42%] flex items-center gap-2 p-3 ${
                                        match.awayScore > match.homeScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <span className="text-sm font-medium">{match.awayPlayers.join(' / ')}</span>
                                        {match.awayScore > match.homeScore && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                W
                                    </span>
                                        )}
                            </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DartsStatisticsDashboard;