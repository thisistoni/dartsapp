/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Search, Users, User,  MapPin, Martini, Phone, BarChart, ArrowUp,  Calendar, Navigation, Target, Zap, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader"; // Importing Spinner
import { ClubVenue, MatchReport, Player, TeamData, ComparisonData, TeamStandings, MatchAverages, OneEighty, HighFinish } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart as RechartsBarChart, Bar, Legend } from 'recharts';
import { TooltipProps } from 'recharts';
import axiosRetry from 'axios-retry';
import TeamDetailHeader from '@/components/TeamDetailHeader';
import TeamDetailPage from '@/components/TeamDetailPage';
import LeagueOverviewPage from '@/components/LeagueOverviewPage';
import { Section } from '@/types/navigation';
import { useTeamData, useComparisonData, useSearchFilter } from '@/hooks';
import { 
    getBestCheckouts, 
    getLowestThreeCheckouts, 
    calculateDifference, 
    calculateTotalDifference, 
    getScoreColor,
    sortPlayers,
    processMatchData,
    calculateRunningAverages,
    renderMatchDot,
    getChartDomain
} from '@/utils';
import { playerImages, teams, leagueNavigationItems } from '@/constants';

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


const DartsStatisticsDashboard: React.FC = () => {
    // Basic state
    const [selectedTeam, setSelectedTeam] = useState<string>('League Overview');
    const [selectedSeason, setSelectedSeason] = useState<'2025/26' | '2024/25' | 'all'>('2025/26');
    const [activeSection, setActiveSection] = useState<Section>('matches');
    const [selectedPlayer, setSelectedPlayer] = useState<string>("team");
    const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>("all");
    const [checkoutPlayerFilter, setCheckoutPlayerFilter] = useState<string>("all");
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [sortColumn] = useState<string>('winRate');
    const [sortDirection] = useState<'asc' | 'desc'>('desc');
    
    // Refs for axios retry (used in global axios config)
    const currentTeamRef = useRef<string>('');
    const retryTimeoutRef = useRef<NodeJS.Timeout>();
    
    // Update ref when selected team changes
    useEffect(() => {
        currentTeamRef.current = selectedTeam;
    }, [selectedTeam]);
    
    // Custom Hooks
    const teamDataHook = useTeamData(selectedTeam, selectedSeason, refreshTrigger);
    const comparisonHook = useComparisonData();
    const searchHook = useSearchFilter(teams);
    
    // Destructure team data hook
    const {
        teamData,
        matchReports,
        leaguePosition,
        clubVenue,
        comparisonData,
        teamStandings,
        matchAverages,
        oneEightys,
        highFinishes,
        scheduleData,
        teamAverage,
        dataSource,
        loading,
        isInitialLoad
    } = teamDataHook;
    
    // Destructure comparison hook
    const {
        comparisonTeam,
        setComparisonTeam,
        comparisonTeamData,
        setComparisonTeamData,
        comparisonLoading,
        fetchComparisonTeam
    } = comparisonHook;
    
    // Destructure search hook
    const {
        searchTerm,
        setSearchTerm,
        filteredTeams,
        searchContainerRef
    } = searchHook;

    // Update the useEffect where we fetch data to handle the fade-away
    // ✅ REMOVED: useEffect for showIndicator - no longer needed

    // Filter teams for comparison table (exclude selected team)
    const comparisonTeams = teams.filter(team => team !== selectedTeam);
    
    // Reset season to 2025/26 when team changes
    useEffect(() => {
        setSelectedSeason('2025/26');
    }, [selectedTeam]);

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

    // Using utility functions from @/utils (imported at top)

    // Wrapper for getBestCheckouts utility function
    const getBestCheckoutsForPlayer = (playerName: string, isTeam: boolean = false) => 
        getBestCheckouts(matchReports, playerName, isTeam, 5);

    // Use utility functions for match data processing
    const matchData = processMatchData(matchAverages, selectedPlayer);
    const runningAverages = calculateRunningAverages(matchData);

    // Wrapper for getLowestThreeCheckouts utility function
    const getLowestCheckouts = () => getLowestThreeCheckouts(matchReports);

    // Wrapper for renderMatchDot utility function
    const renderDot = (props: DotProps) => renderMatchDot(props, selectedPlayer, matchReports, matchData);



    // Use utility function for sorting players
    const sortedPlayers = sortPlayers(teamData?.players || [], sortColumn, sortDirection);

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

    // ✅ REMOVED: DataSourceIndicator - no longer needed since we only use Supabase

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

    // Calculate the domain dynamically based on the actual data
    const getChartDomain = () => {
        if (runningAverages.length === 0) return [30, 50];  // fallback if no data
        
        const allValues = runningAverages.flatMap(d => [d.average, d.runningAverage].filter(v => v !== undefined));
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        
        // Add 5-10% padding and round to nearest 5
        const padding = (maxValue - minValue) * 0.1;
        const min = Math.floor((minValue - padding) / 5) * 5;
        const max = Math.ceil((maxValue + padding) / 5) * 5;
        
        return [min, max];
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Main Header */}
                <TeamDetailHeader
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filteredTeams={filteredTeams}
                    setSelectedTeam={setSelectedTeam}
                    searchContainerRef={searchContainerRef}
                    onSyncComplete={() => setRefreshTrigger(prev => prev + 1)}
                />

                {/* Main Content */}
                {loading ? (
                    <div className="flex justify-center items-center min-h-[50vh]">
                        <div className="flex flex-col items-center gap-4">
                            <ClipLoader color="#3B82F6" size={50} />
                            <p className="text-gray-600">Loading team data...</p>
                        </div>
                    </div>
                ) : (
                    <>
                    {selectedTeam === 'League Overview' ? (
                        <LeagueOverviewPage 
                            onTeamSelect={setSelectedTeam}
                            refreshTrigger={refreshTrigger}
                        />
                    ) : (
                        <TeamDetailPage
                            selectedTeam={selectedTeam}
                            selectedSeason={selectedSeason}
                            setSelectedSeason={setSelectedSeason}
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            teamData={teamData}
                            teamStandings={teamStandings}
                            leaguePosition={leaguePosition}
                            teamAverage={teamAverage}
                            clubVenue={clubVenue}
                            oneEightys={oneEightys}
                            highFinishes={highFinishes}
                            sortedPlayers={sortedPlayers}
                            teamWinRate={teamWinRate}
                            matchReports={matchReports}
                            matchAverages={matchAverages}
                            scheduleData={scheduleData}
                            teams={teams}
                            comparisonTeam={comparisonTeam}
                            setComparisonTeam={setComparisonTeam}
                            fetchComparisonTeam={fetchComparisonTeam}
                            comparisonLoading={comparisonLoading}
                            comparisonTeamData={comparisonTeamData}
                            setComparisonTeamData={setComparisonTeamData}
                            selectedPlayer={selectedPlayer}
                            setSelectedPlayer={setSelectedPlayer}
                            selectedPlayerFilter={selectedPlayerFilter}
                            setSelectedPlayerFilter={setSelectedPlayerFilter}
                            checkoutPlayerFilter={checkoutPlayerFilter}
                            setCheckoutPlayerFilter={setCheckoutPlayerFilter}
                            runningAverages={runningAverages}
                            matchData={matchData}
                            pairStats={pairStats}
                            playerImages={playerImages}
                            getBestCheckouts={getBestCheckoutsForPlayer}
                            getLowestThreeCheckouts={getLowestCheckouts}
                        />
                    )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DartsStatisticsDashboard;