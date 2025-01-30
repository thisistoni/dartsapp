"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Swords, Trophy, Calendar, X } from 'lucide-react';
import axios from 'axios';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { MonthlyTable, PlayerRanking, Challenge } from '@/lib/models/tableTypes';
import ClipLoader from "react-spinners/ClipLoader";
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ScoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (winner: string) => void;
    challenger: string;
    defender: string;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ isOpen, onClose, onSubmit, challenger, defender }) => {
    const [winner, setWinner] = useState<string>('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Select Winner</h3>
                    <button onClick={onClose} className="p-1">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setWinner(challenger)}
                            className={`p-3 rounded border text-left ${
                                winner === challenger 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {challenger}
                        </button>
                        <button
                            onClick={() => setWinner(defender)}
                            className={`p-3 rounded border text-left ${
                                winner === defender 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {defender}
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            if (winner) {
                                onSubmit(winner);
                                setWinner('');
                            }
                        }}
                        disabled={!winner}
                        className={`w-full py-2 rounded ${
                            winner
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Submit Result
                    </button>
                </div>
            </div>
        </div>
    );
};



const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-600';
    if (winRate >= 50) return 'text-blue-600';
    if (winRate >= 30) return 'text-yellow-600';
    return 'text-red-600';
};

const getAverageColor = (average: number) => {
    if (average >= 60) return 'text-green-600';
    if (average >= 50) return 'text-blue-600';
    if (average >= 40) return 'text-yellow-600';
    return 'text-red-600';
};

// Add interfaces for TeamData
interface PlayerStats {
    average: number;
    winRate: number;
}

interface TeamDataPlayer {
    playerName: string;
    adjustedAverage: number;
    wins: number;
    losses: number;
    winRate: number;
}

interface TeamDataResponse {
    data: {
        players: TeamDataPlayer[];
    };
}

// Update the type definition
interface NewMonthData {
    month: string;
    players: PlayerRanking[];
    challenges: Challenge[];
}

// Add interface for position changes
interface PositionChange {
    current: number;
    previous: number;
    difference: number;
}

// Add function to calculate new positions with accumulated scores
const calculateNewPositions = async (month: string): Promise<PlayerRanking[]> => {
    try {
        // Get all previous months up to current month
        const currentDate = parseISO(month);
        const seasonStart = new Date(2024, 8, 1); // September 1, 2024
        const accumulatedScores = new Map<string, { wins: number; losses: number }>();
        
        // Fetch and accumulate scores from all previous months
        let currentMonth = seasonStart;
        while (currentMonth <= currentDate) {
            const monthStr = format(currentMonth, 'yyyy-MM');
            const response = await axios.get(`/api/table?month=${monthStr}`);
            
            if (response.data.data) {
                response.data.data.players.forEach((player: PlayerRanking) => {
                    const current = accumulatedScores.get(player.name) || { wins: 0, losses: 0 };
                    accumulatedScores.set(player.name, {
                        wins: current.wins + player.wins,
                        losses: current.losses + player.losses
                    });
                });
            }
            
            currentMonth = addMonths(currentMonth, 1);
        }

        // Sort players based on accumulated scores
        const players = Array.from(accumulatedScores.entries()).map(([name, scores]) => ({
            name,
            wins: scores.wins,
            losses: scores.losses,
            winRate: scores.wins / (scores.wins + scores.losses) || 0
        }));

        players.sort((a, b) => {
            if (b.winRate !== a.winRate) {
                return b.winRate - a.winRate;
            }
            // If win rates are equal, player with more games played ranks higher
            const aTotalGames = a.wins + a.losses;
            const bTotalGames = b.wins + b.losses;
            return bTotalGames - aTotalGames;
        });

        // Return new month's data with accumulated scores
        return players.map((player, index) => ({
            name: player.name,
            position: index + 1,
            wins: player.wins,        // Keep accumulated wins
            losses: player.losses,    // Keep accumulated losses
            challengesLeft: 2         // Reset challenges for new month
        }));
    } catch (error) {
        console.error('Error calculating new positions:', error);
        return [];
    }
};

// Add function to calculate position changes
const getPositionChanges = async (month: string): Promise<Map<string, PositionChange>> => {
    const changes = new Map<string, PositionChange>();
    const currentDate = parseISO(month);
    const previousMonth = subMonths(currentDate, 1);
    
    try {
        // Get previous month's data
        const previousResponse = await axios.get(`/api/table?month=${format(previousMonth, 'yyyy-MM')}`);
        const previousData = previousResponse.data.data;
        
        // Get current month's data
        const currentResponse = await axios.get(`/api/table?month=${month}`);
        const currentData = currentResponse.data.data;
        
        if (previousData && currentData) {
            currentData.players.forEach(player => {
                const previousPosition = previousData.players.find(p => p.name === player.name)?.position || player.position;
                changes.set(player.name, {
                    current: player.position,
                    previous: previousPosition,
                    difference: previousPosition - player.position
                });
            });
        }
    } catch (error) {
        console.error('Error calculating position changes:', error);
    }
    
    return changes;
};

const TablePage: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tableData, setTableData] = useState<MonthlyTable | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [scoreModal, setScoreModal] = useState<{
        isOpen: boolean;
        challenger: string;
        defender: string;
    }>({ isOpen: false, challenger: '', defender: '' });
    const [teamStats, setTeamStats] = useState<Record<string, PlayerStats>>({});
    const [positionChanges, setPositionChanges] = useState<Map<string, PositionChange>>(new Map());

    // Add function to check if a date is in the future
    const isFutureMonth = (date: Date) => {
        const now = new Date();
        return date.getMonth() > now.getMonth() || date.getFullYear() > now.getFullYear();
    };

    // Add function to check if a date is in the past
    const isPastMonth = (date: Date) => {
        const now = new Date();
        return date.getMonth() < now.getMonth() || date.getFullYear() < now.getFullYear();
    };

    // Add function to fetch team stats
    const fetchTeamStats = async () => {
        try {
            const response = await axios.get<TeamDataResponse>('/api/teamData?team=DC%20Patron');
            const { data } = response.data;
            
            // Create a map of player stats using the data directly
            const playerStats = data.players.reduce<Record<string, PlayerStats>>((acc, player) => {
                acc[player.playerName] = {
                    average: player.adjustedAverage || 0,
                    winRate: player.winRate || 0
                };
                return acc;
            }, {});
            
            console.log('Team Stats:', playerStats);
            setTeamStats(playerStats);
        } catch (error) {
            console.error('Error fetching team stats:', error);
        }
    };

    // Initialize with current month
    useEffect(() => {
        const now = new Date();
        setCurrentDate(now);
        fetchTableData(format(now, 'yyyy-MM'));
        fetchTeamStats();
    }, []);

    // Update fetchTableData to handle accumulated scores and position changes
    const fetchTableData = async (month: string) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/table?month=${month}`);
            
            if (!response.data.data) {
                // If no data exists for the new month, create it with accumulated scores
                const newPositions = await calculateNewPositions(month);
                const newMonthData: NewMonthData = {
                    month: month,
                    players: newPositions,
                    challenges: []
                };
                
                // Save new month data
                await axios.post('/api/table', {
                    month: month,
                    data: newMonthData
                });
                
                setTableData(newMonthData as unknown as MonthlyTable);
            } else {
                setTableData(response.data.data);
            }
            
            // Get position changes
            const changes = await getPositionChanges(month);
            setPositionChanges(changes);
            
        } catch (error) {
            console.error('Error fetching table data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
        const newDate = direction === 'prev' 
            ? subMonths(currentDate, 1) 
            : addMonths(currentDate, 1);

        // Prevent navigating to future months
        if (isFutureMonth(newDate)) return;

        setCurrentDate(newDate);
    };

    const initiateChallenge = async (defender: string) => {
        if (!selectedPlayer) return;

        try {
            const response = await axios.post<{ data: MonthlyTable }>('/api/table', {
                challenger: selectedPlayer,
                defender,
                month: format(currentDate, 'yyyy-MM'),
                action: 'challenge'
            });
            setTableData(response.data.data);
            setSelectedPlayer(null);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert('Failed to create challenge');
            }
        }
    };

    const completeChallenge = async (winner: string) => {
        try {
            const response = await axios.post<{ data: MonthlyTable }>('/api/table', {
                challenger: scoreModal.challenger,
                defender: scoreModal.defender,
                month: format(currentDate, 'yyyy-MM'),
                action: 'complete',
                winner
            });
            setTableData(response.data.data);
            setScoreModal({ isOpen: false, challenger: '', defender: '' });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert('Failed to complete challenge');
            }
        }
    };

    const cancelChallenge = async (challenger: string, defender: string) => {
        try {
            const response = await axios.post<{ data: MonthlyTable }>('/api/table', {
                challenger,
                defender,
                month: format(currentDate, 'yyyy-MM'),
                action: 'cancel'
            });
            setTableData(response.data.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert('Failed to cancel challenge');
            }
        }
    };

    const canChallenge = (challenger: PlayerRanking, defender: PlayerRanking) => {
        if (!tableData) return false;
        
        // Disable all challenges for past months
        if (isPastMonth(currentDate)) return false;
        
        // Top player (position 1) cannot challenge anyone
        if (challenger.position === 1) return false;
        
        // Check position difference (can challenge 1 or 2 positions above)
        const positionDiff = challenger.position - defender.position;
        const validPosition = positionDiff > 0 && positionDiff <= 2;
        
        if (!validPosition) return false;

        // Check if challenger has any active challenges
        const hasActiveChallenge = tableData.challenges.some(c => 
            c.challenger === challenger.name && 
            !c.completed
        );

        if (hasActiveChallenge) return false;

        // Check if defender has any active challenges (sent or received)
        const defenderHasActiveChallenge = tableData.challenges.some(c => 
            (c.challenger === defender.name || c.defender === defender.name) && 
            !c.completed
        );

        if (defenderHasActiveChallenge) return false;

        // Find all challenges between these players
        const challenges = tableData.challenges.filter(c => 
            (c.challenger === challenger.name && c.defender === defender.name) ||
            (c.challenger === defender.name && c.defender === challenger.name)
        );

        // If no challenges exist, allow the challenge
        if (challenges.length === 0) return true;

        // Only check most recent challenge
        const latestChallenge = challenges[challenges.length - 1];

        // If the latest challenge is completed, allow a new challenge
        return latestChallenge.completed;
    };

    // Add function to check if player has active challenge
    const hasActiveChallenge = (playerName: string) => {
        return tableData?.challenges.some(c => 
            c.challenger === playerName && 
            !c.completed
        ) ?? false;
    };

    // Add function to check if player has received a challenge
    const hasReceivedChallenge = (playerName: string) => {
        return tableData?.challenges.some(c => 
            c.defender === playerName && 
            !c.completed
        ) ?? false;
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {loading ? (
                <LoadingSpinner text="Loading Team Rankings..." />
            ) : tableData ? (
                <div className="max-w-2xl mx-auto">
                    <Card className="mb-4">
                        <CardHeader className="p-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    DC Patron Rankings
                                </CardTitle>
                                <div className="flex items-center gap-2 text-sm">
                                    <button 
                                        onClick={() => handleMonthChange('prev')}
                                        className={isPastMonth(subMonths(currentDate, 1)) ? 'text-gray-300' : ''}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        {format(currentDate, 'MMM yyyy')}
                                    </span>
                                    <button 
                                        onClick={() => handleMonthChange('next')}
                                        className={isFutureMonth(addMonths(currentDate, 1)) ? 'text-gray-300' : ''}
                                        disabled={isFutureMonth(addMonths(currentDate, 1))}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-sm">
                                            <th className="px-3 py-2 text-left">#</th>
                                            <th className="px-3 py-2 text-left">Player</th>
                                            <th className="px-3 py-2 text-center">W/L</th>
                                            <th className="px-3 py-2 text-right">Challenge</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {tableData?.players.map((player) => (
                                            <tr 
                                                key={player.name}
                                                className={`border-b ${
                                                    selectedPlayer === player.name 
                                                        ? 'bg-blue-50' 
                                                        : player.position <= 5
                                                            ? 'bg-sky-50'
                                                            : ''
                                                }`}
                                            >
                                                <td className="px-3 py-2 font-medium">
                                                    <div className="flex items-center gap-1">
                                                        {player.position}
                                                        {positionChanges.get(player.name)?.difference !== 0 && (
                                                            <span className={`text-xs ${
                                                                positionChanges.get(player.name)?.difference > 0 
                                                                    ? 'text-green-600' 
                                                                    : 'text-red-600'
                                                            }`}>
                                                                {positionChanges.get(player.name)?.difference > 0 ? (
                                                                    <span title={`Up ${positionChanges.get(player.name)?.difference} positions`}>↑</span>
                                                                ) : (
                                                                    <span title={`Down ${Math.abs(positionChanges.get(player.name)?.difference || 0)} positions`}>↓</span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex flex-col">
                                                        <span>{player.name}</span>
                                                        <div className="flex gap-2 text-xs text-gray-500">
                                                            <span>
                                                                <span className={getAverageColor(teamStats[player.name]?.average || 0)}>
                                                                    {teamStats[player.name]?.average.toFixed(1) || '0.0'}
                                                                </span>
                                                                {' avg'}
                                                            </span>
                                                            <span>|</span>
                                                            <span>
                                                                <span className={getWinRateColor(teamStats[player.name]?.winRate || 0)}>
                                                                    {(teamStats[player.name]?.winRate || 0).toFixed(0)}%
                                                                </span>
                                                                {' league win'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <div className="flex flex-col">
                                                        <span>{player.wins}/{player.losses}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {selectedPlayer ? (
                                                        selectedPlayer === player.name ? (
                                                            <button
                                                                onClick={() => setSelectedPlayer(null)}
                                                                className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => initiateChallenge(player.name)}
                                                                disabled={!canChallenge(
                                                                    tableData.players.find(p => p.name === selectedPlayer)!,
                                                                    player
                                                                )}
                                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                                    canChallenge(
                                                                        tableData.players.find(p => p.name === selectedPlayer)!,
                                                                        player
                                                                    )
                                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                        : 'bg-gray-100 text-gray-400'
                                                                }`}
                                                            >
                                                                Challenge
                                                            </button>
                                                        )
                                                    ) : (
                                                        <button
                                                            onClick={() => setSelectedPlayer(player.name)}
                                                            disabled={
                                                                player.position === 1 || 
                                                                player.challengesLeft === 0 || 
                                                                isPastMonth(currentDate) ||
                                                                hasActiveChallenge(player.name) ||
                                                                hasReceivedChallenge(player.name)
                                                            }
                                                            title={hasActiveChallenge(player.name) ? "Has active challenge" : undefined}
                                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                                isPastMonth(currentDate) || hasActiveChallenge(player.name) || hasReceivedChallenge(player.name)
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : player.position === 1
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : player.challengesLeft === 0
                                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                            }`}
                                                        >
                                                            {isPastMonth(currentDate) 
                                                                ? 'Month ended' 
                                                                : hasActiveChallenge(player.name)
                                                                    ? `Active (${player.challengesLeft} left)`
                                                                    : hasReceivedChallenge(player.name)
                                                                        ? `Received (${player.challengesLeft} left)`
                                                                        : `${player.challengesLeft} left`
                                                            }
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Challenges - Only show when data exists */}
                    {!loading && tableData && tableData.challenges && (
                        <div className="space-y-2">
                            {tableData.challenges
                                .filter((c: Challenge) => !c.isRematch || c.isRematch)
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((challenge, index) => {
                                    return (
                                        <div 
                                            key={index}
                                            className="bg-white rounded-lg border p-3 text-sm flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={challenge.result?.winner === challenge.challenger ? 'font-bold' : ''}>
                                                    {challenge.challenger}
                                                </span>
                                                <Swords className="h-3 w-3 text-red-500" />
                                                <span className={challenge.result?.winner === challenge.defender ? 'font-bold' : ''}>
                                                    {challenge.defender}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {challenge.completed ? (
                                                    <>
                                                        {challenge.isRematch ? (
                                                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                                                Rematch completed
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {challenge.isRematch ? (
                                                            <>
                                                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                                                    Rematch
                                                                </span>
                                                                <button
                                                                    onClick={() => setScoreModal({
                                                                        isOpen: true,
                                                                        challenger: challenge.challenger,
                                                                        defender: challenge.defender
                                                                    })}
                                                                    className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded hover:bg-green-200"
                                                                >
                                                                    Add Result
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => setScoreModal({
                                                                        isOpen: true,
                                                                        challenger: challenge.challenger,
                                                                        defender: challenge.defender
                                                                    })}
                                                                    className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded hover:bg-green-200"
                                                                >
                                                                    Add Result
                                                                </button>
                                                                <button
                                                                    onClick={() => cancelChallenge(challenge.challenger, challenge.defender)}
                                                                    className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded hover:bg-red-200"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            ) : null}

            <ScoreModal
                isOpen={scoreModal.isOpen}
                onClose={() => setScoreModal({ isOpen: false, challenger: '', defender: '' })}
                onSubmit={completeChallenge}
                challenger={scoreModal.challenger}
                defender={scoreModal.defender}
            />
        </div>
    );
};

export default TablePage; 