"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Search, Users, User,  Rows4,  MapPin, Martini, Phone, BarChart, ArrowLeftRight,  ArrowUp,  Calendar, Navigation, Target, Zap } from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('DC Patron');
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [matchReports, setMatchReports] = useState<MatchReport[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [leaguePosition, setLeaguePosition] = useState<number | null>(null); // New state variable for league position
    const [clubVenue, setClubVenue] = useState<ClubVenue | null>(null);
    const [teamAverage, setTeamAverage] = useState<number | null>(null);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
    const [teamStandings, setTeamStandings] = useState<TeamStandings | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string>("team");
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
        'Vienna Devils 3',
        'Babylon Triple 1',
        'AS The Dart Side of the Moon II',
        'DSV NaNog Zinsfabrik',
        'DC Voltadolis Steel',
        'Snakes II',
        'Bad Boys LUMBERJACKS',
        'Dartclub Twentytwo 1',
        'LDC Martial Darts 4ward',
        'An Sporran 404 Double Not Found',
        'The Plumbatas',
        'Temmel Dart Lions',
        'Relax One Steel 5',
        'DC Patron'
    ];

    // Filter teams for search dropdown (include all teams)
    const filteredTeams = teams.filter(team =>
        team.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter teams for comparison table (exclude selected team)
    const comparisonTeams = teams.filter(team => team !== selectedTeam);

    // Helper function for ordinal numbers (1st, 2nd, 3rd, etc.)
    const getOrdinalSuffix = (i: number) => {
        const j = i % 10;
        const k = i % 100;
        if (j === 1 && k !== 11) {
            return "st";
        }
        if (j === 2 && k !== 12) {
            return "nd";
        }
        if (j === 3 && k !== 13) {
            return "rd";
        }
        return "th";
    };

    useEffect(() => {
        if (selectedTeam) {
            setLoading(true);
            setIsRetrying(false); // Reset retry status
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
                    const response = await axios.get(`/api/teamData?team=${encodeURIComponent(requestedTeam)}&forceUpdate=${forceUpdate}`);
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
                    }
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching data:', error);
                    if (requestedTeam === currentTeamRef.current) {
                        setLoading(false);
                    }
                }
            };

            fetchData();
        }
    }, [selectedTeam]);

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
        if (selectedPlayer === "team") {
            return {
                matchday: match.matchday,
                average: match.teamAverage,
                opponent: match.opponent || '',  // Use the opponent directly from matchAverages
                originalMatchday: match.matchday // Keep track of original matchday
            };
        } else {
            const playerAvg = match.playerAverages.find(p => p.playerName === selectedPlayer)?.average;
            if (playerAvg) {
                return {
                    matchday: match.matchday,
                    average: playerAvg,
                    opponent: match.opponent || '', // Use the opponent directly from matchAverages
                    originalMatchday: match.matchday // Keep track of original matchday
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
        const { cx, cy } = props;
        if (!cx || !cy) return (
            <svg width={0} height={0}></svg>
        );

        return (
            <svg key={`dot-${cx}-${cy}`} x={cx - 6} y={cy - 6} width={12} height={12} fill="none">
                <path
                    d="M1 1L11 11M1 11L11 1"
                    stroke="#ef4444"
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

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <DataSourceIndicator />
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">WDV Landesliga 5. Division A</h1>

                    {/* Search and Team Selection */}
                    <div className="relative">
                        <div className="flex items-center bg-white rounded-lg shadow-sm border p-2">
                            <Search className="h-5 w-5 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search Team..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="outline-none bg-transparent"
                            />
                        </div>

                        {/* Dropdown for Search Results */}
                        {searchTerm && (
                            <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border z-10">
                                {filteredTeams.map((team: string) => (
                                    <button
                                        key={team}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                                        onClick={() => {
                                            setSelectedTeam(team);
                                            setSearchTerm('');
                                        }}
                                    >
                                        {team}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <ClipLoader color={"#123abc"} loading={loading} size={80} />
                    </div>
                ) : (
                    <>


                        {/* Display Selected Team */}
                        <div className="mb-4 bg-white rounded-lg shadow-sm border p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">{selectedTeam}</h2>
                                    <p className="text-sm text-gray-500">Season 2024/25</p>
                                </div>
                                <div className="text-sm text-gray-500">
                                    League Position: <span className="font-semibold">
                                        {leaguePosition !== null ? `${leaguePosition}${getOrdinalSuffix(leaguePosition)}` : 'Loading...'}
                                    </span>
                                </div>
                            </div>
                        </div>





                        {/* Top Players Card */}
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-6 w-6 text-yellow-500" />
                                    <h3 className="text-xl font-semibold text-slate-900">              Top Performers
                                    </h3>

                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {teamData && teamData.players.slice(0, 3).map((player: Player, index: number) => {
                                        let medalClass = ''; // Variable für die CSS-Klasse der Medaille

                                        // Bestimmen der Klasse basierend auf dem Rang
                                        if (index === 0) {
                                            medalClass = 'bg-yellow-400 bg-opacity-75 text-yellow-800'; // Gold, halbtransparent
                                        } else if (index === 1) {
                                            medalClass = 'bg-gray-300 bg-opacity-75 text-gray-800'; // Silber, halbtransparent
                                        } else if (index === 2) {
                                            medalClass = 'bg-orange-400 bg-opacity-75 text-orange-800'; // Bronze, halbtransparent
                                        }

                                        return (
                                            <div key={player.playerName} className="bg-white p-4 rounded-lg shadow-sm border">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-4 py-2 rounded-full text-2xl font-extrabold ${medalClass}`}>
                                                        #{index + 1}
                                                    </span>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{player.playerName}</h3>
                                                        <p className="text-sm text-gray-500">{player.adjustedAverage} Avg</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart className="h-6 w-6 text-blue-500" />
                                        Team Average
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                <div className="space-y-2">

                                    <p className="text-2xl font-bold text-gray-900">
                                        {teamAverage !== null ? teamAverage.toFixed(2) : 'Loading...'}
                                    </p>
                                    <p className="text-sm text-gray-500">Current Team Average</p>
                                </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-6 w-6 text-amber-500" />
                                        Standings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                    <p className="text-2xl font-bold text-gray-900">
                                            {teamStandings 
                                                ? `${teamStandings.wins}-${teamStandings.draws}-${teamStandings.losses}`
                                                : 'Loading...'}
                                        </p>
                                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full flex">
                                                <div 
                                                    className="h-full bg-green-200" 
                                                    style={{ 
                                                        width: teamStandings 
                                                            ? `${(teamStandings.wins / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` 
                                                            : '0%' 
                                                    }} 
                                                />
                                                <div 
                                                    className="h-full bg-orange-200" 
                                                    style={{ 
                                                        width: teamStandings 
                                                            ? `${(teamStandings.draws / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` 
                                                            : '0%' 
                                                    }} 
                                                />
                                                <div 
                                                    className="h-full bg-red-200" 
                                                    style={{ 
                                                        width: teamStandings 
                                                            ? `${(teamStandings.losses / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` 
                                                            : '0%' 
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Martini className="h-6 w-6 text-purple-500" />
                                        {clubVenue?.venue}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                            <span className="text-sm">{clubVenue?.address}, {clubVenue?.city}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Phone className="h-4 w-4 text-slate-500" />
                                            <span className="text-sm">{clubVenue?.phone}</span>
                                    </div>
                                </div>
                            </CardContent>
                            </Card>
                        </div>
                        <Tabs defaultValue="matches" className="space-y-4">
                            <TabsList className="flex flex-wrap gap-2 justify-start mb-32 sm:mb-6">
                                <TabsTrigger value="matches" className="flex items-center">
                                    <Users className="h-5 w-5 text-green-500 mr-1" />
                                    Matches
                                </TabsTrigger>
                                <TabsTrigger value="stats" className="flex items-center">
                                    <User className="h-5 w-5 text-green-500 mr-1" />
                                    Player Stats
                                </TabsTrigger>
                                <TabsTrigger value="comparison" className="flex items-center">
                                    <ArrowLeftRight className="h-5 w-5 text-green-500 mr-1" />
                                    Point Comparison
                                </TabsTrigger>
                                <TabsTrigger value="charts" className="flex items-center">
                                    <BarChart className="h-5 w-5 text-green-500 mr-1" />
                                    Charts
                                </TabsTrigger>
                                <TabsTrigger value="performances" className="flex items-center">
                                    <Trophy className="h-5 w-5 text-green-500 mr-1" />
                                    Best Performances
                                </TabsTrigger>
                                <TabsTrigger value="pairs" className="flex items-center">
                                    <Users className="h-5 w-5 text-green-500 mr-1" />
                                    Best Pairs
                                </TabsTrigger>
                                <TabsTrigger value="scoreBreakdown" className="flex items-center">
                                    <Rows4 className="h-5 w-5 text-green-500 mr-1" />
                                    Score Distribution
                                </TabsTrigger>
                                <TabsTrigger value="schedule" className="flex items-center">
                                    <Calendar className="h-5 w-5 text-green-500 mr-1" />
                                    Schedule
                                </TabsTrigger>
                               
                            </TabsList>


                            <TabsContent value="matches">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {matchReports.map((matchday: MatchReport, index: number) => (
                                        <div key={index} className="bg-white rounded-lg border hover:border-blue-200 transition-all duration-200 overflow-hidden">
                                            <div className="p-4">
                                                {/* Header with score */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-50 flex items-center justify-center">
                                                            <span className="text-lg font-bold text-blue-600">
                                                                {index + 1}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-gray-900 break-words">
                                                            {matchday.opponent}
                                                        </h3>
                                                    </div>
                                                    <div className="flex-shrink-0 ml-2">
                                                        <span className={`inline-block px-4 py-2 rounded-lg text-lg font-bold ${getScoreColor(matchday.score)}`}>
                                                            {matchday.score}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Lineup with inline checkouts */}
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="text-xs text-gray-500 mb-2">Lineup & Checkouts</div>
                                                        <div className="text-sm space-y-1">
                                                            {matchday.lineup.map((player, idx) => {
                                                                // First determine if we're the home team by checking first player
                                                                const isHomeTeam = matchday.details.singles[0].homePlayer === matchday.lineup[0];
                                                                
                                                                // Check if opponent player is "nicht angetreten"
                                                                let isWalkover = false;
                                                                if ([0, 1, 4, 5].includes(idx)) { // Singles matches
                                                                    const matchIndex = idx > 3 ? idx - 2 : idx;
                                                                    const match = matchday.details.singles[matchIndex];
                                                                    isWalkover = isHomeTeam ? 
                                                                        match.awayPlayer.toLowerCase().includes('nicht angetreten') : 
                                                                        match.homePlayer.toLowerCase().includes('nicht angetreten');
                                                                } else { // Doubles matches
                                                                    const matchIndex = idx > 3 ? (idx - 4) : ((idx - 2));
                                                                    const match = matchday.details.doubles[matchIndex];
                                                                    isWalkover = isHomeTeam ? 
                                                                        match.awayPlayers.some(p => p.toLowerCase().includes('nicht angetreten')) : 
                                                                        match.homePlayers.some(p => p.toLowerCase().includes('nicht angetreten'));
                                                                }

                                                                // Get match result based on position
                                                                let isWin = false;
                                                                if ([0, 1, 4, 5].includes(idx)) { // Singles matches
                                                                    const matchIndex = idx > 3 ? idx - 2 : idx;
                                                                    const match = matchday.details.singles[matchIndex];
                                                                    isWin = isHomeTeam ? 
                                                                        match.homeScore > match.awayScore : 
                                                                        match.awayScore > match.homeScore;
                                                                } else { // Doubles matches
                                                                    const matchIndex = idx > 3 ? (idx - 4) : ((idx - 2));
                                                                    const match = matchday.details.doubles[matchIndex];
                                                                    isWin = isHomeTeam ? 
                                                                        match.homeScore > match.awayScore : 
                                                                        match.awayScore > match.homeScore;
                                                                }

                                                                // Get checkouts for singles matches (only if not walkover)
                                                                const isSinglesMatch = [0, 1, 4, 5].includes(idx);
                                                                const playerCheckouts = !isWalkover && isSinglesMatch 
                                                                    ? matchday.checkouts
                                                                        .filter(c => c.scores.startsWith(player))
                                                                        .map(c => c.scores.split(': ')[1])
                                                                    : [];

                                                                return (
                                                                    <div key={idx} className="flex items-center justify-between text-gray-700">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`font-medium w-6 h-6 flex items-center justify-center rounded-lg ${
                                                                                isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                            }`}>
                                                                                {idx + 1}
                                                                            </span>
                                                                            {player}
                                                                        </div>
                                                                        {isWalkover ? (
                                                                            <span className="text-gray-500 italic">w/o</span>
                                                                        ) : playerCheckouts.length > 0 && (
                                                                            <span className="text-gray-500">
                                                                                {playerCheckouts.join(', ')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Bottom section with average and details button */}
                                                    <div className="grid grid-cols-4 gap-4">
                                                        {/* Details button - takes up 3 columns */}
                                                        <div className="col-span-3">
                                                            <button
                                                                onClick={() => setSelectedMatchId(index)}
                                                                className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                            >
                                                                View Details
                                                            </button>
                                                        </div>
                                                        
                                                        {/* Average - takes up 1 column */}
                                                        <div className="col-span-1">
                                                            <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
                                                                <span className="text-sm font-medium text-blue-600">
                                                                    {matchAverages[index]?.teamAverage.toFixed(2) || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                                                {player.adjustedAverage.toFixed(2)} Avg
                                                            </span>
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
                                                            <div className="flex items-center gap-1">
                                                                <Trophy className={`h-4 w-4 ${
                                                                    teamStandings && teamStandings.wins > (teamStandings.losses + teamStandings.draws)
                                                                        ? 'text-amber-500'
                                                                        : 'text-gray-300'
                                                                }`} />
                                                                <span className="text-gray-500">More Wins than Losses</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <ArrowUp className={`h-4 w-4 ${
                                                                    leaguePosition && leaguePosition <= 6
                                                                        ? 'text-green-500'
                                                                        : 'text-gray-300'
                                                                }`} />
                                                                <span className="text-gray-500">Top 6</span>
                                                            </div>
                                                        </div>

                                                       
                                                    </div>
                                                </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                            </TabsContent>

                            <TabsContent value="comparison">
                                <Card>
                                    {selectedTeam === 'DC Patron' ? (
                                        <>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="flex items-center gap-2">
                                                       
                                                        Point Comparison
                                                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                                        calculateTotalDifference(comparisonData) > 0
                                                            ? 'bg-green-100 text-green-800'
                                                            : calculateTotalDifference(comparisonData) < 0
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        Total: {calculateTotalDifference(comparisonData) > 0 ? '+' : ''}{calculateTotalDifference(comparisonData)}
                                                    </span>
                                                    </CardTitle>
                                                  
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {comparisonTeams.map((team) => {
                                                        const data = comparisonData.find(d => d.opponent === team);
                                                        const difference = data?.firstRound && data?.secondRound 
                                                            ? calculateDifference(data.firstRound, data.secondRound)
                                                            : null;
                                                        
                                                        return (
                                                            <div key={team} 
                                                                className={`bg-white rounded-lg border p-4 ${
                                                                    difference !== null
                                                                        ? difference > 0 
                                                                            ? 'border-green-200'
                                                                            : difference < 0
                                                                                ? 'border-red-200'
                                                                                : 'border-orange-200'
                                                                        : 'border-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <h3 className="font-bold text-gray-900 text-lg">{team}</h3>
                                                                    {difference !== null && (
                                                                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                                                            difference > 0
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : difference < 0
                                                                                    ? 'bg-red-100 text-red-800'
                                                                                    : 'bg-orange-100 text-orange-800'
                                                                        }`}>
                                                                            {difference > 0 ? '+' : ''}{difference}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                                        <div className="text-xs text-gray-500 mb-2">First Round</div>
                                                                        {data?.firstRound ? (
                                                                            <span className={`inline-block px-3 py-1 rounded-lg text-lg font-bold ${getScoreColor(data.firstRound)}`}>
                                                                                {data.firstRound}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-sm text-gray-400">-</span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                                        <div className="text-xs text-gray-500 mb-2">Second Round</div>
                                                                        {data?.secondRound ? (
                                                                            <span className={`inline-block px-3 py-1 rounded-lg text-lg font-bold ${getScoreColor(data.secondRound)}`}>
                                                                                {data.secondRound}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-sm text-gray-400">-</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </>
                                    ) : (
                                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                            <ArrowLeftRight className="h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Point Comparison Limited</h3>
                                            <p className="text-gray-500 max-w-md">
                                                This feature is currently only available for DC Patron. Select DC Patron to view point comparisons.
                                            </p>
                                        </CardContent>
                                    )}
                                </Card>
                            </TabsContent>

                            <TabsContent value="charts">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle>Average Charts</CardTitle>
                                            <select 
                                                className="px-3 py-1 border rounded-md text-sm bg-white"
                                                value={selectedPlayer}
                                                onChange={(e) => setSelectedPlayer(e.target.value)}
                                            >
                                                <option value="team">{selectedTeam}</option>
                                                {teamData?.players.map((player) => (
                                                    <option key={player.playerName} value={player.playerName}>
                                                                {player.playerName}
                                                    </option>
                                                ))}
                                            </select>
                                                    </div>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-0.5 bg-[#22c55e]"></div>
                                                <span>Running Average</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 text-[#ef4444]">✕</div>
                                                <span>Match Average</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-0.5 bg-[#3b82f6] border-t-2 border-dashed"></div>
                                                <span>Current Average</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart
                                                    data={runningAverages}
                                                    margin={{
                                                        top: 20,
                                                        right: 30,
                                                        left: 20,
                                                        bottom: 20,
                                                    }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="matchday" 
                                                        label={{ 
                                                            value: 'Matchday', 
                                                            position: 'bottom' 
                                                        }}
                                                    />
                                                    <YAxis 
                                                        domain={[30, 50]}
                                                        ticks={[30, 35, 40, 45, 50]}
                                                        label={{ 
                                                            value: 'Average', 
                                                            angle: -90, 
                                                            position: 'insideLeft' 
                                                        }}
                                                    />
                                                    <Tooltip 
                                                        content={({ active, payload, label }: TooltipProps<number, string>) => {
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
                                                        }}
                                                    />
                                                    {runningAverages.length > 0 && (
                                                        <ReferenceLine 
                                                            y={runningAverages[runningAverages.length - 1].runningAverage}
                                                            stroke="#3b82f6" 
                                                            strokeWidth={3}
                                                            strokeDasharray="3 3"
                                                            label={{
                                                                position: 'right',
                                                                fill: '#3b82f6'
                                                            }}
                                                        />
                                                    )}
                                                    {/* Running average line */}
                                                    <Line 
                                                        key="running-average-line"
                                                        type="monotone" 
                                                        dataKey="runningAverage" 
                                                        stroke="#22c55e" 
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                    {/* Individual match averages with X markers */}
                                                    <Line
                                                        key="match-average-line"
                                                        type="monotone"
                                                        dataKey="average"
                                                        stroke="none"
                                                        dot={renderDot}
                                                        isAnimationActive={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>
                            </TabsContent>

                            <TabsContent value="performances">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            Best Performances
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {getAllPerformances().map((entry) => (
                                                <div key={entry.name} 
                                                    className="bg-white rounded-lg border hover:border-blue-200 transition-all duration-200 overflow-hidden p-4"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {entry.name} {entry.isTeam && <span className="text-blue-600">(Team)</span>}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                            entry.difference > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {entry.difference > 0 ? '+' : ''}{entry.difference.toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                <div className="text-xs text-gray-500 mb-1">Current Average</div>
                                                                <div className="text-lg font-semibold">{entry.currentAverage.toFixed(2)}</div>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                <div className="text-xs text-gray-500 mb-1">Best Average</div>
                                                                <div className="text-lg font-semibold">
                                                                    {isTeamPerformance(entry.bestPerformance) 
                                                                        ? entry.bestPerformance.teamAverage.toFixed(2) 
                                                                        : entry.bestPerformance.average.toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <div className="text-xs text-gray-500 mb-1">Best Match</div>
                                                            <div className="text-sm">
                                                                Matchday {entry.bestPerformance.matchday} vs {entry.bestPerformance.opponent}
                                                            </div>
                                                        </div>

                                                        <div className="bg-gray-50 rounded-lg p-3">
                                                            <div className="text-xs text-gray-500 mb-2">Best Checkouts</div>
                                                            <div className="flex gap-2">
                                                                {(() => {
                                                                    const checkouts = getBestCheckouts(entry.name, entry.isTeam);
                                                                    const lowestThree = getLowestThreeCheckouts();
                                                                    return checkouts.length > 0 ? (
                                                                        checkouts.map((checkout, index) => (
                                                                            <span key={index} className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                                                                entry.isTeam 
                                                                                    ? 'bg-gray-100 text-gray-700'
                                                                                    : checkout === lowestThree[0] ? 'bg-yellow-50 text-yellow-700' :
                                                                                      checkout === lowestThree[1] ? 'bg-gray-200 text-gray-700' :
                                                                                      checkout === lowestThree[2] ? 'bg-orange-50 text-orange-700' :
                                                                                      checkout <= 24 ? 'bg-blue-50 text-blue-700' :
                                                                                      ''
                                                                            }`}>
                                                                                {checkout}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-sm text-gray-400">-</span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="scoreBreakdown">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            Score Distribution
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const scores = matchReports.map(report => report.score).filter(Boolean);
                                            const scoreFrequency: { [key: string]: number } = {};
                                            let totalWins = 0;
                                            let totalLosses = 0;
                                            let totalDraws = 0;
                                            
                                            scores.forEach(score => {
                                                scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
                                                const [home, away] = score.split('-').map(Number);
                                                if (home > away) totalWins++;
                                                else if (home < away) totalLosses++;
                                                else totalDraws++;
                                            });

                                            const sortedScores = Object.entries(scoreFrequency).sort((a, b) => b[1] - a[1]);
                                            const totalMatches = totalWins + totalLosses + totalDraws;

                                            return (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="bg-white rounded-lg border p-4">
                                                            <div className="text-2xl font-bold text-green-600 mb-1">{totalWins}</div>
                                                            <div className="text-sm text-gray-500">Wins</div>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {((totalWins / totalMatches) * 100).toFixed(1)}% of matches
                                                            </div>
                                                        </div>
                                                        <div className="bg-white rounded-lg border p-4">
                                                            <div className="text-2xl font-bold text-orange-500 mb-1">{totalDraws}</div>
                                                            <div className="text-sm text-gray-500">Draws</div>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {((totalDraws / totalMatches) * 100).toFixed(1)}% of matches
                                                            </div>
                                                        </div>
                                                        <div className="bg-white rounded-lg border p-4">
                                                            <div className="text-2xl font-bold text-red-600 mb-1">{totalLosses}</div>
                                                            <div className="text-sm text-gray-500">Losses</div>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {((totalLosses / totalMatches) * 100).toFixed(1)}% of matches
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-lg border p-6">
                                                        <h3 className="text-sm font-medium text-gray-900 mb-4">Score Frequency</h3>
                                                        <div className="space-y-3">
                                                            {sortedScores.map(([score, count]) => {
                                                                const percentage = (count / scores.length) * 100;
                                                                return (
                                                                    <div key={score} className="relative">
                                                                        <div className="flex items-center gap-4">
                                                                            <span className={`w-20 text-lg font-semibold ${getScoreColor(score)} px-3 py-1 rounded-lg text-center`}>
                                                                                {score}
                                                                            </span>
                                                                            <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden">
                                                                                <div 
                                                                                    className="h-full bg-blue-100"
                                                                                    style={{ width: `${percentage}%` }}
                                                                                />
                                                                            </div>
                                                                            <div className="w-32 text-sm">
                                                                                <span className="font-medium">{count}×</span>
                                                                                <span className="text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="schedule">
                                <Card>
                                    {selectedTeam === 'DC Patron' ? (
                                        <>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Calendar className="h-6 w-6 text-blue-500" />
                                                    Match Schedule
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {(() => {
                                                    const today = new Date();
                                                    const upcomingMatches = scheduleData
                                                        .filter(match => new Date(match.date) >= today)
                                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                                    // Group matches by month
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
                                                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{monthYear}</h3>
                                                                    <div className="grid gap-4">
                                                                        {matches.map((match) => (
                                                                            <div key={match.round} 
                                                                                className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors duration-200"
                                                                            >
                                                                                <div className="p-4">
                                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                                                                                                <span className="text-lg font-bold text-blue-600">
                                                                                                    {new Date(match.date).getDate()}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex-grow">
                                                                                                <div className="flex items-center justify-between text-sm text-gray-500 sm:block">
                                                                                                    <span>Round {match.round}</span>
                                                                                                    <div className="flex-shrink-0 sm:hidden">
                                                                                                        {comparisonData.find(d => d.opponent === match.opponent)?.firstRound && (
                                                                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                                                                                                getScoreColor(comparisonData.find(d => d.opponent === match.opponent)?.firstRound || '')
                                                                                                            }`}>
                                                                                                                {comparisonData.find(d => d.opponent === match.opponent)?.firstRound}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="font-semibold text-gray-900 break-words pr-2" style={{ wordBreak: 'break-word' }}>
                                                                                                    {match.opponent}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="hidden sm:block">
                                                                                            {comparisonData.find(d => d.opponent === match.opponent)?.firstRound && (
                                                                                                <div className="text-right">
                                                                                                    <span className={`inline-block px-4 py-2 rounded-lg text-lg font-bold ${
                                                                                                        getScoreColor(comparisonData.find(d => d.opponent === match.opponent)?.firstRound || '')
                                                                                                    }`}>
                                                                                                        {comparisonData.find(d => d.opponent === match.opponent)?.firstRound}
                                                                                                    </span>
                                                                                                    <div className="text-xs text-gray-500 mt-1">Previous Match</div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                                                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                                                        <span className="font-medium">{match.venue}</span>
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="text-sm text-gray-500">
                                                                                            {match.address}, {match.location}
                                                                                        </div>
                                                                                        <a 
                                                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                                                `${match.venue} ${match.address} ${match.location}`
                                                                                            )}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
                                                                                        >
                                                                                            <Navigation className="h-4 w-4 mr-1" />
                                                                                            Get Directions
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
                                                })()}
                                    </CardContent>
                                        </>
                                    ) : (
                                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Limited</h3>
                                            <p className="text-gray-500 max-w-md">
                                                This feature is currently only available for DC Patron. Select DC Patron to view the match schedule.
                                            </p>
                                        </CardContent>
                                    )}
                                </Card>
                            </TabsContent>

                            <TabsContent value="pairs">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>Doubles Partnerships</CardTitle>
                                            <select
                                                value={selectedPlayer}
                                                onChange={(e) => setSelectedPlayer(e.target.value)}
                                                className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="team">All Pairs</option>
                                                {teamData?.players.map((player) => (
                                                    <option key={player.playerName} value={player.playerName}>
                                                        {player.playerName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {!loading && matchReports.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {(() => {
                                                    // Collect all doubles matches and their results
                                                    const pairsStats = matchReports.reduce((stats: {[key: string]: {
                                                        games: {
                                                            matchday: number,
                                                            opponent: string,
                                                            isWin: boolean
                                                        }[]
                                                    }}, match, matchIndex) => {
                                                        // Add null checks
                                                        if (!match?.details?.singles?.[0]?.homePlayer || !match?.lineup?.[0]) {
                                                            return stats;
                                                        }

                                                        const isHomeTeam = match.details.singles[0].homePlayer === match.lineup[0];
                                                        
                                                        // Process all doubles matches
                                                        match.details.doubles?.forEach((double) => {
                                                            if (!double?.homePlayers || !double?.awayPlayers) {
                                                                return;
                                                            }

                                                            // Get the correct pair based on whether we're home or away
                                                            const ourPlayers = isHomeTeam ? double.homePlayers : double.awayPlayers;
                                                            const pairKey = ourPlayers.sort().join(' / ');
                                                            const isWin = isHomeTeam ? 
                                                                (double.homeScore ?? 0) > (double.awayScore ?? 0) : 
                                                                (double.awayScore ?? 0) > (double.homeScore ?? 0);

                                                            if (!stats[pairKey]) {
                                                                stats[pairKey] = { games: [] };
                                                            }
                                                            
                                                            stats[pairKey].games.push({
                                                                matchday: matchIndex + 1,
                                                                opponent: match.opponent || 'Unknown',
                                                                isWin
                                                            });
                                                        });
                                                        return stats;
                                                    }, {});

                                                    // Convert to array and sort: first by 3+ games and win rate, then just win rate
                                                    return Object.entries(pairsStats)
                                                        .map(([pair, stats]) => {
                                                            const totalGames = stats.games.length;
                                                            const wins = stats.games.filter(g => g.isWin).length;
                                                            const winRate = (wins / totalGames) * 100;
                                                            return { pair, stats, totalGames, winRate };
                                                        })
                                                        .filter(({ pair }) => 
                                                            selectedPlayer === "team" || 
                                                            pair.includes(selectedPlayer)
                                                        )
                                                        .sort((a, b) => {
                                                            const aHasEnoughGames = a.totalGames >= 3;
                                                            const bHasEnoughGames = b.totalGames >= 3;
                                                            
                                                            if (aHasEnoughGames !== bHasEnoughGames) {
                                                                return aHasEnoughGames ? -1 : 1;
                                                            }
                                                            
                                                            return b.winRate - a.winRate;
                                                        })
                                                        .map(({ pair, stats, totalGames, winRate }) => {
                                                            const wins = stats.games.filter(g => g.isWin).length;
                                                            
                                                            return (
                                                                <div key={pair} className="bg-white rounded-lg border hover:border-blue-200 transition-all duration-200 overflow-hidden">
                                                                    <div className="p-4">
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                                <div className="flex flex-col">
                                                                                    <span>{pair.split(' / ')[0]} &</span>
                                                                                    <span>{pair.split(' / ')[1]}</span>
                                                                                </div>
                                                                            </h3>
                                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                                                totalGames < 3 
                                                                                    ? 'bg-orange-50 text-orange-700'  // Less than 3 games
                                                                                    : winRate >= 50 
                                                                                        ? 'bg-green-50 text-green-700'  // 50% or higher
                                                                                        : 'bg-red-50 text-red-700'  // Below 50%
                                                                            }`}>
                                                                                {winRate.toFixed(1)}%
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        <div className="space-y-4">
                                                                            {/* Win Rate Progress Bar */}
                                                                            <div>
                                                                                <div className="flex justify-between text-sm mb-1">
                                                                                    <span className="text-gray-500">Win Rate</span>
                                                                                    <span className="font-medium text-gray-900">
                                                                                        {wins}-{totalGames - wins}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                                    <div 
                                                                                        className="h-full bg-green-500 rounded-full"
                                                                                        style={{ width: `${winRate}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            {/* Games List */}
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-500 mb-2">Games</div>
                                                                                    <div className="space-y-2">
                                                                                        {Object.entries(
                                                                                            stats.games.reduce((acc, game) => {
                                                                                                if (!acc[game.opponent]) {
                                                                                                    acc[game.opponent] = { games: [] };
                                                                                                }
                                                                                                acc[game.opponent].games.push(game);
                                                                                                return acc;
                                                                                            }, {} as { [key: string]: { games: { matchday: number; isWin: boolean }[] } })
                                                                                        ).map(([opponent, data]) => (
                                                                                            <div key={opponent} className="flex items-center justify-between text-sm">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="flex gap-1">
                                                                                                        {data.games.map((game, idx) => (
                                                                                                            <span key={idx} className={`w-6 h-6 flex items-center justify-center rounded-lg font-medium ${
                                                                                                                game.isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                                                            }`}>
                                                                                                                {game.matchday}
                                                                                                            </span>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                    <span className="text-gray-700">{opponent}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="flex justify-center items-center p-8">
                                                <p className="text-gray-500">
                                                    {loading ? "Loading pairs data..." : "No match data available"}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
            <Modal 
                isOpen={selectedMatchId !== null}
                onClose={() => setSelectedMatchId(null)}
            >
                {selectedMatchId !== null && matchReports[selectedMatchId] && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">Match Details</h2>
                        
                        {/* First Singles (1-2) */}
                        {matchReports[selectedMatchId].details.singles.slice(0, 2).map((match, idx) => (
                            <div key={`single1-${idx}`} className="flex items-center py-2 border-b">
                                <span className="w-[42%] text-right pr-4 text-xs sm:text-base">{match.homePlayer}</span>
                                <span className="w-[16%] text-center px-3 py-1 rounded bg-gray-100">
                                    <span className="text-[10px] sm:text-base">
                                        {match.homeScore} - {match.awayScore}
                                    </span>
                                </span>
                                <span className="w-[42%] pl-4 text-xs sm:text-base">{match.awayPlayer}</span>
                            </div>
                        ))}
                        
                        {/* First Doubles (3-4) */}
                        {matchReports[selectedMatchId].details.doubles.slice(0, 2).map((match, idx) => (
                            <div key={`double1-${idx}`} className="flex items-center py-2 border-b">
                                <span className="w-[42%] text-right pr-4 text-xs sm:text-base">{match.homePlayers.join(' & ')}</span>
                                <span className="w-[16%] text-center px-3 py-1 rounded bg-gray-100">
                                    <span className="text-[10px] sm:text-base">
                                        {match.homeScore} - {match.awayScore}
                                    </span>
                                </span>
                                <span className="w-[42%] pl-4 text-xs sm:text-base">{match.awayPlayers.join(' & ')}</span>
                            </div>
                        ))}
                        
                        {/* Second Singles (5-6) */}
                        {matchReports[selectedMatchId].details.singles.slice(2, 4).map((match, idx) => (
                            <div key={`single2-${idx}`} className="flex items-center py-2 border-b">
                                <span className="w-[42%] text-right pr-4 text-xs sm:text-base">{match.homePlayer}</span>
                                <span className="w-[16%] text-center px-3 py-1 rounded bg-gray-100">
                                    <span className="text-[10px] sm:text-base">
                                        {match.homeScore} - {match.awayScore}
                                    </span>
                                </span>
                                <span className="w-[42%] pl-4 text-xs sm:text-base">{match.awayPlayer}</span>
                            </div>
                        ))}
                        
                        {/* Second Doubles (7-8) */}
                        {matchReports[selectedMatchId].details.doubles.slice(2, 4).map((match, idx) => (
                            <div key={`double2-${idx}`} className="flex items-center py-2 border-b">
                                <span className="w-[42%] text-right pr-4 text-xs sm:text-base">{match.homePlayers.join(' & ')}</span>
                                <span className="w-[16%] text-center px-3 py-1 rounded bg-gray-100">
                                    <span className="text-[10px] sm:text-base">
                                        {match.homeScore} - {match.awayScore}
                                    </span>
                                </span>
                                <span className="w-[42%] pl-4 text-xs sm:text-base">{match.awayPlayers.join(' & ')}</span>
                            </div>
                        ))}
                        
                        {/* Totals */}
                        <div className="pt-4 space-y-2">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between">
                                <span className="w-full sm:w-[42%] text-center sm:text-right pr-0 sm:pr-4 text-xs sm:text-base mb-1 sm:mb-0">Total Legs</span>
                                <span className="w-[25%] sm:w-[16%] text-center px-3 py-1 rounded bg-blue-100">
                                    <span className="text-[10px] sm:text-base">
                                        {matchReports[selectedMatchId].details.totalLegs.home} - {matchReports[selectedMatchId].details.totalLegs.away}
                                    </span>
                                </span>
                                <span className="hidden sm:block sm:w-[42%]"></span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between">
                                <span className="w-full sm:w-[42%] text-center sm:text-right pr-0 sm:pr-4 text-xs sm:text-base mb-1 sm:mb-0">Total Sets</span>
                                <span className="w-[25%] sm:w-[16%] text-center px-3 py-1 rounded bg-blue-100">
                                    <span className="text-[10px] sm:text-base">
                                        {matchReports[selectedMatchId].details.totalSets.home} - {matchReports[selectedMatchId].details.totalSets.away}
                                    </span>
                                </span>
                                <span className="hidden sm:block sm:w-[42%]"></span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DartsStatisticsDashboard;