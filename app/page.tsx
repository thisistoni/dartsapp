"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Search, Users, User,  MapPin, Martini, Phone, BarChart, ArrowLeftRight,  ArrowUp,  Calendar, Navigation, Target, Zap, CheckCircle } from 'lucide-react';
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

const DartsStatisticsDashboard: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('DC Patron');
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

    // Add this at the top level
    const playerImages: { [key: string]: string } = {
        'Luca Schuckert': 'https://www.oefb.at/oefb2/images/1278650591628556536_b0b441e826bc548aa7fc-1,0-320x320.png',
        'Marko Cvejic': 'https://www.oefb.at/oefb2/images/1278650591628556536_e1e6df7df2184ef1349b-1,0-320x320.png',
        'Josip Matijevic': 'https://www.oefb.at/oefb2/images/1278650591628556536_4dcb084bb2c30e1395ee-1,0-320x320.png',
        'Muhamet Mahmutaj': 'https://www.oefb.at/oefb2/images/1278650591628556536_f740f25ac9da09af2246-1,0-320x320.png',
        'Marvin De Chavez': 'https://www.oefb.at/oefb2/images/1278650591628556536_49e17c18c1d6921a7870-1,0-320x320.png',
        'Christoph Hafner': 'https://www.oefb.at/oefb2/images/1278650591628556536_7ccdd5ee9c5e8e2a0c22-1,0-320x320.png',
        'Michael Frühwirth': 'https://www.oefb.at/oefb2/images/1278650591628556536_ba89cc5af9585cffb11c-1,0-320x320.png',
        'Ermin Kokic': 'https://www.oefb.at/oefb2/images/1278650591628556536_e807ce175060c2e86db6-1,0-320x320.png',
        'Dominik Kubiak': 'https://www.oefb.at/oefb2/images/1278650591628556536_77be3e9035fdc75e8cff-1,0-320x320.png',
        'Markus Hafner': 'https://www.oefb.at/oefb2/images/1278650591628556536_762e3056bd0e1a82d61c-1,0-320x320.png'
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
    
    useEffect(() => {
        if (selectedTeam) {
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
        const { cx, cy, payload } = props;
        if (!cx || !cy || !payload) return (
            <svg width={0} height={0}></svg>
        );

        // Find the match report for this matchday
        const matchReport = matchReports[payload.matchday - 1];
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

    const getPointDifference = (matchday: number) => {
        if (matchday < 14) return null;
        
        // Get corresponding first round matchday (13 matchdays before)
        const firstRoundMatch = matchReports[matchday - 14];
        const secondRoundMatch = matchReports[matchday - 1];
        
        if (!firstRoundMatch || !secondRoundMatch) return null;

        // Get the home scores (first number) from both matches
        const firstRoundScore = parseInt(firstRoundMatch.score.split('-')[0]);
        const secondRoundScore = parseInt(secondRoundMatch.score.split('-')[0]);
        
        // Return the difference between second round and first round scores
        return secondRoundScore - firstRoundScore;
    };

    const getAverageDifference = (matchday: number) => {
        if (matchday < 14) return 0;
        
        const currentAvg = matchAverages[matchday - 1]?.teamAverage ?? 0;
        const previousAvg = matchAverages[matchday - 14]?.teamAverage ?? 0;
        
        return currentAvg - previousAvg;
    };

    // Add this before the return statement
    const pairStats = matchReports.reduce((stats: { 
        [key: string]: { 
            wins: number, 
            losses: number, 
            winRate: number,
            matches: Array<{
                matchday: number,
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
            
            stats[pairKey].matches.push({
                matchday: matchIndex + 1,
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
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
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
                                            <span className="text-sm text-gray-500">Season 2024/25</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Performers Card */}
                        <div className="mb-8 bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-amber-400/40 to-amber-500/40" />
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <span className="text-base font-medium text-gray-900">Top Performers</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {teamData && teamData.players.slice(0, 3).map((player: Player, index: number) => (
                                        <div key={player.playerName} 
                                            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible border border-gray-100"
                                        >
                                            <div className={`h-1 w-full bg-gradient-to-r ${medalColors[index]}`} />
                                            <div className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Player Avatar */}
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
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{player.playerName}</h3>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                                                                index === 0 
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'  // Gold
                                                                    : index === 1
                                                                        ? 'bg-slate-50 text-slate-700 border-slate-100'  // Silver
                                                                        : 'bg-orange-50 text-orange-700 border-orange-100'  // Bronze
                                                            }`}>
                                                                #{index + 1}
                                                            </span>
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-md border border-violet-100">
                                                                {player.adjustedAverage.toFixed(2)} avg
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Team Average Card with Singles/Doubles */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="h-1 w-full bg-gradient-to-r from-violet-400/40 to-violet-500/40" />
                                <div className="p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                                            <BarChart className="h-5 w-5 text-violet-500" />
                                        </div>
                                        <span className="text-base font-medium text-gray-900">Performance</span>
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
                        <Tabs defaultValue="matches" className="space-y-4">
                            <TabsList className="flex flex-wrap gap-2 justify-start mb-32 sm:mb-6">
                                {/* Primary Tabs - Always visible */}
                                <TabsTrigger value="matches" className="flex items-center">
                                    <Users className="h-5 w-5 text-green-500 mr-1" />
                                    Matches
                                </TabsTrigger>
                                <TabsTrigger value="mergedStats" className="flex items-center">
                                    <User className="h-5 w-5 text-green-500 mr-1" />
                                    Player Overview
                                </TabsTrigger>
                                <TabsTrigger value="pairs" className="flex items-center">
                                    <Users className="h-5 w-5 text-green-500 mr-1" />
                                    Pairs
                                </TabsTrigger>
                                {selectedTeam === 'DC Patron' && (
                                <TabsTrigger value="comparison" className="flex items-center">
                                    <ArrowLeftRight className="h-5 w-5 text-green-500 mr-1" />
                                        Points +/-
                                </TabsTrigger>
                                )}
                                <TabsTrigger value="charts" className="flex items-center">
                                    <BarChart className="h-5 w-5 text-green-500 mr-1" />
                                    Charts
                                </TabsTrigger>
                                <TabsTrigger value="schedule" className="flex items-center">
                                            <Calendar className="h-5 w-5 text-green-500 mr-1" />
                                            Schedule
                                </TabsTrigger>
                            
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...matchReports].reverse().map((matchday: MatchReport, index: number) => {
                                        // First determine if we're the home team by checking first player
                                        const isHomeTeam = matchday.details.singles[0].homePlayer === matchday.lineup[0];
                                        
                                        return (
                                            <div 
                                                key={matchReports.length - index - 1} 
                                                className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
                                            >
                                                {/* Subtle top accent line */}
                                                <div className={`h-1 w-full bg-gradient-to-r ${
                                                    matchday.score.split('-')[0] > matchday.score.split('-')[1]
                                                        ? 'from-emerald-400/40 to-emerald-500/40'
                                                        : matchday.score.split('-')[0] === matchday.score.split('-')[1]
                                                            ? 'from-amber-400/40 to-amber-500/40'
                                                            : 'from-rose-400/40 to-rose-500/40'
                                                }`} />

                                                <div className="p-5">
                                                    {/* Header Section */}
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                                    <span className="text-sm font-bold text-blue-600">
                                                                        {matchReports.length - index}
                                                            </span>
                                                        </div>
                                                                <h3 className="text-lg sm:text-lg text-sm font-semibold text-gray-800 truncate">
                                                            {matchday.opponent}
                                                        </h3>
                                                    </div>
                                                            <div className="flex items-center gap-1.5">
                                                                {/* Match Score Badge with connected boxes */}
                                                                <div className="flex items-center">
                                                                    <div className={`px-2.5 py-1 text-xs font-medium rounded-l-md border-y border-l ${
                                                                        matchday.score.split('-')[0] > matchday.score.split('-')[1]
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                            : matchday.score.split('-')[0] === matchday.score.split('-')[1]
                                                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                                                    }`}>
                                                            {matchday.score}
                                                                    </div>
                                                                    {matchReports.length - index >= 14 ? (
                                                                        <div className={`px-2.5 py-1 text-xs font-medium border border-l-0 flex items-center gap-1 ${
                                                                            (getPointDifference(matchReports.length - index) ?? 0) > 0 
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                                                : (getPointDifference(matchReports.length - index) ?? 0) === 0
                                                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                                                        }`}>
                                                                            <span className="text-[10px] opacity-60"><i>vs MD{matchReports.length - index - 13}</i></span>
                                                                            <span>
                                                                                {(getPointDifference(matchReports.length - index) ?? 0) > 0 ? '+' : ''}
                                                                                {getPointDifference(matchReports.length - index) ?? 0}
                                                        </span>
                                                    </div>
                                                                    ) : (
                                                                        <div className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-r-md -ml-[1px] flex items-center gap-1">
                                                                            <span className="text-blue-400 text-[10px]">AVG</span>
                                                                            <span>{matchAverages[matchReports.length - index - 1]?.teamAverage.toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                </div>

                                                                {/* Average Badge with comparison for matchday 14+ */}
                                                                {matchReports.length - index >= 14 && (
                                                                    <div className="flex items-center">
                                                                        <div className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-l-md flex items-center gap-1">
                                                                            <span className="text-blue-400 text-[10px]">AVG</span>
                                                                            <span>{matchAverages[matchReports.length - index - 1]?.teamAverage.toFixed(2)}</span>
                                                                        </div>
                                                                        <div className={`px-2 py-1 text-xs font-medium border border-l-0 rounded-r-md flex items-center gap-0.5 ${
                                                                            getAverageDifference(matchReports.length - index) > 0
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                                                        }`}>
                                                                            <span className="text-[10px] opacity-60"><i>vs MD{matchReports.length - index - 13}</i></span>
                                                                            <span>
                                                                                {getAverageDifference(matchReports.length - index) > 0 ? '+' : ''}
                                                                                {getAverageDifference(matchReports.length - index).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Lineup Section */}
                                                <div className="space-y-4">
                                                        <div className="rounded-lg bg-slate-50/50 border border-slate-100 p-3">
                                                            <div className="text-xs text-slate-500 font-medium mb-2">Lineup & Performances</div>
                                                            <div className="space-y-2">
                                                            {matchday.lineup.map((player, idx) => {
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

                                                                    // Get checkouts for singles matches
                                                                const isSinglesMatch = [0, 1, 4, 5].includes(idx);
                                                                    const playerCheckouts = isSinglesMatch 
                                                                    ? matchday.checkouts
                                                                        .filter(c => c.scores.startsWith(player))
                                                                        .map(c => c.scores.split(': ')[1])
                                                                    : [];

                                                                    // Get player's matchday average and running average for singles matches
                                                                    const matchdayAvg = isSinglesMatch ? 
                                                                        matchAverages[matchReports.length - index - 1]?.playerAverages.find(
                                                                            pa => pa.playerName === player
                                                                        )?.average : null;
                                                                    
                                                                    const runningAvg = sortedPlayers.find(p => p.playerName === player)?.adjustedAverage ?? 0;
                                                                    const avgDiff = matchdayAvg ? matchdayAvg - runningAvg : 0;

                                                                // Inside the lineup.map function, before the return statement
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

                                                                return (
                                                                        <div key={idx} className="flex items-center justify-between group/player">
                                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                                                                    isWin ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                                            }`}>
                                                                                    <span className="text-[10px] font-medium">{idx + 1}</span>
                                                                        </div>
                                                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                                                    <span className="text-sm text-slate-700 truncate">{player}</span>
                                                                                    {isSinglesMatch && matchdayAvg && (
                                                                                        <div className="flex items-center gap-0.5 flex-shrink-0">
                                                                                            <span className="text-xs text-slate-500 italic">
                                                                                                {matchdayAvg.toFixed(2)}
                                                                            </span>
                                                                                            {avgDiff !== 0 && (
                                                                                                <span className={`text-[10px] ${avgDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                                    {avgDiff > 0 ? '▲' : '▼'}
                                                                            </span>
                                                                        )}
                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-1.5 flex-shrink-0">
                                                                        {isWalkover ? (
                                                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-50 text-slate-500 rounded border border-slate-100 italic">
                                                                                        w/o
                                                                            </span>
                                                                                ) : (
                                                                                    playerCheckouts.map((checkout, cidx) => (
                                                                                        <span key={cidx} 
                                                                                            className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded border border-blue-100"
                                                                                        >
                                                                                            {checkout}
                                                                                        </span>
                                                                                    ))
                                                                                )}
                                                                            </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                        {/* Match Details Button */}
                                                            <button
                                                            onClick={() => setSelectedMatchId(matchReports.length - index - 1)}
                                                            className="w-full px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                                                            >
                                                                View Details
                                                            </button>
                                                        </div>
                                                            </div>
                                                        </div>
                                        );
                                    })}
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
                                                                            parseInt(data.firstRound) >= 2  // Parse string to number
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
                                                                            data?.secondRound ? (
                                                                                ['7-1', '6-2', '5-3', '8-0'].includes(data.secondRound)
                                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                                    : data.secondRound === '4-4'
                                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                                                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                                                                            ) : 'text-sm text-slate-400'
                                                                        }`}>
                                                                            {data.secondRound || 'Pending'}
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
                                            .filter(([pair]) => selectedPlayer === "team" || pair.includes(selectedPlayer))
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
                                                                            {player.adjustedAverage.toFixed(2)} avg
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
                        </Tabs>
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
                        {matchReports[selectedMatchId].details.singles.slice(0, 2).map((match, idx) => (
                                <div key={`single1-${idx}`} 
                                    className="flex items-center bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden"
                                >
                                    <div className={`w-[42%] flex items-center justify-end gap-2 p-3 ${
                                        match.homeScore > match.awayScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <span className="text-sm font-medium">{match.homePlayer}</span>
                                        {match.homeScore > match.awayScore && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                W
                                    </span>
                                        )}
                                    </div>
                                    <div className="w-[16%] flex items-center justify-center px-2 py-2 bg-white border-x border-slate-100">
                                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                            {match.homeScore}-{match.awayScore}
                                </span>
                                    </div>
                                    <div className={`w-[42%] flex items-center gap-2 p-3 ${
                                        match.awayScore > match.homeScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <span className="text-sm font-medium">{match.awayPlayer}</span>
                                        {match.awayScore > match.homeScore && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                W
                                            </span>
                                        )}
                                    </div>
                            </div>
                        ))}
                        
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
                            {matchReports[selectedMatchId].details.singles.slice(2).map((match, idx) => (
                                <div key={`single2-${idx}`} 
                                    className="flex items-center bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden"
                                >
                                    {/* Same structure as First Singles */}
                                    <div className={`w-[42%] flex items-center justify-end gap-2 p-3 ${
                                        match.homeScore > match.awayScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <span className="text-sm font-medium">{match.homePlayer}</span>
                                        {match.homeScore > match.awayScore && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                W
                                    </span>
                                        )}
                                    </div>
                                    <div className="w-[16%] flex items-center justify-center px-2 py-2 bg-white border-x border-slate-100">
                                        <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                            {match.homeScore}-{match.awayScore}
                                </span>
                                    </div>
                                    <div className={`w-[42%] flex items-center gap-2 p-3 ${
                                        match.awayScore > match.homeScore ? 'text-emerald-600' : 'text-slate-600'
                                    }`}>
                                        <span className="text-sm font-medium">{match.awayPlayer}</span>
                                        {match.awayScore > match.homeScore && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                W
                                            </span>
                                        )}
                                    </div>
                            </div>
                        ))}
                        
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