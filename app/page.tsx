"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Search, Users, User, CalendarFold, Rows4, CheckCheck, MapPin, Martini, Phone, BarChart, ArrowLeftRight, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Navigation, ChevronDown } from 'lucide-react';
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader"; // Importing Spinner
import { Checkout, ClubVenue, MatchReport, Player, TeamData, ComparisonData, TeamStandings, MatchAverages } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
    const [sortColumn, setSortColumn] = useState<string>('winRate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [scheduleData, setScheduleData] = useState<ScheduleMatch[]>([]);
    const [isNextMatchExpanded, setIsNextMatchExpanded] = useState(false);

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

            // First get the Spielberichte link
            axios.get(`/api/scraper?action=spielberichte`)
                .then(response => {
                    const url = response.data.link;
                    if (!url) throw new Error('Spielberichte-Link nicht gefunden.');
                    return axios.get(`/api/scraper?action=dartIds&url=${encodeURIComponent(url)}&team=${encodeURIComponent(selectedTeam)}`);
                })
                .then(response => {
                    const matchIds = response.data.ids;
                    // Fetch all match reports first
                    return Promise.all(
                        matchIds.map((id: string) => 
                            axios.get(`/api/scraper?action=matchReport&id=${id}&team=${encodeURIComponent(selectedTeam)}`)
                        )
                    );
                })
                .then(matchReports => {
                    const reports = matchReports.map(res => res.data.report);
                    setMatchReports(reports);
                    console.log('✓ Match reports loaded successfully');
                    
                    // Now fetch averages for each match report
                    return Promise.all(
                        matchReports.map((res, index) => {
                            const matchId = res.config.url?.split('id=')[1]?.split('&')[0];
                            if (!matchId) throw new Error('Match ID not found');
                            return axios.get(`/api/scraper?action=matchAverages&url=${encodeURIComponent(`https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${matchId}&saison=2024/25`)}&team=${encodeURIComponent(selectedTeam)}`)
                                .then(avgRes => ({
                                    ...avgRes.data.averages,
                                    matchday: index + 1,
                                    opponent: reports[index].opponent
                                }));
                        })
                    );
                })
                .then(averages => {
                    setMatchAverages(averages);
                    console.log('✓ Player averages synchronized');
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                })
                .finally(() => setLoading(false));

            // Keep the other API calls separate
            axios.get(`/api/scraper?action=comparison&team=${encodeURIComponent(selectedTeam)}`)
                .then(response => {
                    setComparisonData(response.data.comparison);
                })
                .catch(error => console.error('Error fetching comparison data:', error));

            // League Position
            axios.get(`/api/scraper?action=leaguePosition&team=${encodeURIComponent(selectedTeam)}`)
                .then(response => setLeaguePosition(response.data.position))
                .catch(error => console.error('Error fetching league position:', error));

            // Club Venue
            axios.get(`/api/scraper?action=clubVenue&team=${encodeURIComponent(selectedTeam)}`)
                .then(response => setClubVenue(response.data.venue))
                .catch(error => console.error('Error fetching club venue:', error));

            // Team Players Average
            axios.get(`/api/scraper?action=teamAverage&team=${encodeURIComponent(selectedTeam)}`)
                .then(response => {
                    const data = response.data.players;
                    setTeamData({ players: data });
                    setTeamAverage(data.reduce((sum: number, player: Player) => sum + player.adjustedAverage, 0) / data.length);
                    console.log('✓ Team statistics loaded');
                })
                .catch(error => console.error('Error fetching team average:', error));

            // Team Standings
            axios.get(`/api/scraper?action=standings&team=${encodeURIComponent(selectedTeam)}`)
                .then(response => {
                    setTeamStandings(response.data.standings);
                })
                .catch(error => console.error('Error fetching standings:', error));
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

    // Update the getBestCheckouts function to return an array instead of a string
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
            .slice(0, 3);
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

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
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

    return (
        <div className="min-h-screen bg-gray-100 p-8">
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

                            {/* Next Match Card (Mobile Only) */}
                            {selectedTeam === 'DC Patron' && (
                                <div className="block md:hidden">
                                    <Card>
                                        <CardHeader 
                                            className="cursor-pointer"
                                            onClick={() => setIsNextMatchExpanded(!isNextMatchExpanded)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Calendar className="h-6 w-6 text-blue-500" />
                                                    Next Match
                                                </CardTitle>
                                                <ChevronDown 
                                                    className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                                                        isNextMatchExpanded ? 'transform rotate-180' : ''
                                                    }`}
                                                />
                        </div>
                                        </CardHeader>
                                        <div className={`overflow-hidden transition-all duration-200 ${
                                            isNextMatchExpanded ? 'max-h-96' : 'max-h-0'
                                        }`}>
                                            <CardContent>
                                                {(() => {
                                                    const today = new Date();
                                                    const nextMatch = scheduleData
                                                        .filter(match => new Date(match.date) >= today)
                                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                                                    return nextMatch ? (
                                                        <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors duration-200">
                                                            <div className="p-4">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                                                                            <span className="text-lg font-bold text-blue-600">
                                                                                {new Date(nextMatch.date).getDate()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex-grow">
                                                                            <div className="flex items-center justify-between text-sm text-gray-500 sm:block">
                                                                                <span>Round {nextMatch.round}</span>
                                                                                <div className="flex-shrink-0 sm:hidden">
                                                                                    {comparisonData.find(d => d.opponent === nextMatch.opponent)?.firstRound && (
                                                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                                                                                            getScoreColor(comparisonData.find(d => d.opponent === nextMatch.opponent)?.firstRound || '')
                                                                                        }`}>
                                                                                            {comparisonData.find(d => d.opponent === nextMatch.opponent)?.firstRound}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="font-semibold text-gray-900 break-words pr-2" style={{ wordBreak: 'break-word' }}>
                                                                                {nextMatch.opponent}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                        </div>

                                                                <div className="flex items-center gap-2 text-gray-600 mb-3">
                                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                                    <span className="font-medium">{nextMatch.venue}</span>
                                            </div>

                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-sm text-gray-500">
                                                                        {nextMatch.address}, {nextMatch.location}
                                            </div>
                                                                    <a 
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                            `${nextMatch.venue} ${nextMatch.address} ${nextMatch.location}`
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
                                                    ) : (
                                                        <div className="text-gray-500 text-center py-4">
                                                            No upcoming matches
                                                        </div>
                                                    );
                                                })()}
                            </CardContent>
                                        </div>
                                    </Card>
                                </div>
                            )}
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
                                <TabsTrigger value="scoreBreakdown" className="flex items-center">
                                    <Rows4 className="h-5 w-5 text-green-500 mr-1" />
                                    Distribution
                                </TabsTrigger>
                                <TabsTrigger value="schedule" className="flex items-center">
                                    <Calendar className="h-5 w-5 text-green-500 mr-1" />
                                    Schedule
                                </TabsTrigger>
                            </TabsList>


                            <TabsContent value="matches">
                                <div className="space-y-4">
                                    {matchReports.map((matchday: MatchReport, index: number) => (
                                        <Card key={index}>
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <CalendarFold className="h-6 w-6 text-blue-500" />
                                                    <CardTitle>Matchday {index + 1} vs. {matchday.opponent}</CardTitle>
                                                    <button
                                                        onClick={() => setSelectedMatchId(index)}
                                                        className="text-sm px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                                                    >
                                                        Details
                                                    </button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Lineup */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Rows4 className="h-5 w-5 text-blue-500" />
                                                            <h3 className="font-semibold">Lineup</h3>
                                                        </div>
                                                        <ul className="space-y-1">
                                                            {matchday.lineup.map((player: string, idx: number) => (
                                                                <li key={idx} className="text-sm text-gray-600">
                                                                    {idx + 1}. {player}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    {/* Checkouts */}
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CheckCheck className="h-5 w-5 text-blue-500" />
                                                            <h3 className="font-semibold">Checkouts</h3>
                                                        </div>
                                                        <ul className="space-y-1">
                                                            {matchday.checkouts.map((checkout: Checkout, idx: number) => (
                                                                <li key={idx} className="text-sm text-gray-600">
                                                                    {checkout.scores}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {/* Add Score Section */}
                                                        <div className="mt-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="font-semibold">Final Score</h3>
                                                            </div>
                                                            <div className={`inline-block px-4 py-2 rounded-lg ${getScoreColor(matchday.score)}`}>
                                                                <span className="text-lg font-semibold">
                                                                    {matchday.score || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="stats">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Player Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto relative">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 z-10"
                                                            onClick={() => handleSort('playerName')}>
                                                            <div className="flex items-center gap-2">
                                                                Name
                                                                {sortColumn === 'playerName' ? (
                                                                    sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ArrowUpDown className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                            onClick={() => handleSort('winRate')}>
                                                            <div className="flex items-center gap-2">
                                                                Win Rate
                                                                {sortColumn === 'winRate' ? (
                                                                    sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ArrowUpDown className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                            onClick={() => handleSort('singles')}>
                                                            <div className="flex items-center gap-2">
                                                                Singles
                                                                {sortColumn === 'singles' ? (
                                                                    sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ArrowUpDown className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                            onClick={() => handleSort('doubles')}>
                                                            <div className="flex items-center gap-2">
                                                                Doubles
                                                                {sortColumn === 'doubles' ? (
                                                                    sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ArrowUpDown className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                            onClick={() => handleSort('average')}>
                                                            <div className="flex items-center gap-2">
                                                                Average
                                                                {sortColumn === 'average' ? (
                                                                    sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ArrowUpDown className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {sortedPlayers.map((player, index) => (
                                                        <tr key={player.playerName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                            <td className={`sticky left-0 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 z-10 ${
                                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                            }`}>
                                                                {player.playerName}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {player.winRate ? `${player.winRate}%` : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {player.singles || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {player.doubles || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {player.adjustedAverage.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>

                                </Card>
                            </TabsContent>

                            <TabsContent value="comparison">
                                <Card>
                                    {selectedTeam === 'DC Patron' ? (
                                        <>
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <CardTitle>Point Comparison</CardTitle>
                                                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                                        calculateTotalDifference(comparisonData) > 0
                                                            ? 'bg-green-100 text-green-800'
                                                            : calculateTotalDifference(comparisonData) < 0
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {`${calculateTotalDifference(comparisonData) >= 0 ? '+' : ''}${calculateTotalDifference(comparisonData)}`}
                                                    </span>
                                                </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm bg-white">
                                                <thead>
                                                    <tr className="border-b">
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    <span className="hidden sm:inline">Opponent</span>
                                                                    <span className="sm:hidden">Opponent +/-</span>
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                                                    First Round
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                                                    Second Round
                                                                </th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                                                    Difference
                                                                </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                            {comparisonTeams.map((team) => {
                                                                const data = comparisonData.find(d => d.opponent === team);
                                                                const difference = data?.firstRound && data?.secondRound 
                                                                    ? calculateDifference(data.firstRound, data.secondRound)
                                                                    : null;
                                                                
                                                                return (
                                                                    <tr key={team} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="text-gray-900 break-words pr-2" style={{ wordBreak: 'break-word' }}>
                                                                                    {team}
                                                                                </div>
                                                                                <div className="sm:hidden">
                                                                                    {difference !== null && (
                                                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
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
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                                            {data?.firstRound ? (
                                                                                <span className={`px-3 py-1 rounded-lg ${getScoreColor(data.firstRound)}`}>
                                                                                    {data.firstRound}
                                                                                </span>
                                                                            ) : '-'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                                            {data?.secondRound ? (
                                                                                <span className={`px-3 py-1 rounded-lg ${getScoreColor(data.secondRound)}`}>
                                                                                    {data.secondRound}
                                                                                </span>
                                                                            ) : '-'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                                            {difference !== null && (
                                                                                <span className={`px-3 py-1 rounded-lg ${
                                                                                    difference > 0
                                                                                        ? 'bg-green-100 text-green-800'
                                                                                        : difference < 0
                                                                                            ? 'bg-red-100 text-red-800'
                                                                                            : 'bg-orange-100 text-orange-800'
                                                                                }`}>
                                                                                    {difference > 0 ? '+' : ''}{difference}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
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
                                                        formatter={(value: number, name: string) => {
                                                            return [value.toFixed(2), name === 'runningAverage' ? 'Running Average' : 'Match Average'];
                                                        }}
                                                        labelFormatter={(_, data) => {
                                                            const match = data[0]?.payload;
                                                            return match ? `Matchday ${match.matchday} vs ${match.opponent}` : `Matchday`;
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
                                        <CardTitle>Best Player Performances</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto relative">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10">
                                                            Player
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Current Average
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Best Average
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Difference
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Matchday
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Opponent
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Best 3 Checkouts
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {getAllPerformances().map((entry) => (
                                                        <tr key={entry.name} className={entry.isTeam ? "border-b" : ""}>
                                                            <td className={`sticky left-0 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-white z-10 ${
                                                                entry.isTeam ? 'bg-white' : 'bg-gray-50'
                                                            }`}>
                                                                {entry.name} {entry.isTeam && <span className="text-blue-600">(Team)</span>}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${entry.isTeam ? "font-bold" : ""} text-gray-900`}>
                                                                {entry.currentAverage.toFixed(2)}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${entry.isTeam ? "font-bold" : ""} text-gray-900`}>
                                                                {isTeamPerformance(entry.bestPerformance) 
                                                                    ? entry.bestPerformance.teamAverage.toFixed(2) 
                                                                    : entry.bestPerformance.average.toFixed(2)}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${entry.isTeam ? "font-bold" : ""} ${
                                                                entry.difference > 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                                {entry.difference > 0 ? '+' : ''}{entry.difference.toFixed(2)}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${entry.isTeam ? "font-bold" : ""} text-gray-900`}>
                                                                {entry.isTeam ? entry.bestPerformance.matchday : entry.bestPerformance.matchday || '-'}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${entry.isTeam ? "font-bold" : ""} text-gray-900`}>
                                                                {entry.isTeam ? entry.bestPerformance.opponent : entry.bestPerformance.opponent}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${entry.isTeam ? "font-bold" : ""} text-gray-900`}>
                                                                {(() => {
                                                                    const checkouts = getBestCheckouts(entry.name, entry.isTeam);
                                                                    const lowestThree = getLowestThreeCheckouts();
                                                                    if (checkouts.length === 0) return '-';
                                                                    return (
                                                                        <div className="flex gap-2">
                                                                            {checkouts.map((checkout, index) => (
                                                                                <span key={index} className={`px-3 py-1 rounded-lg ${
                                                                                    !entry.isTeam && (
                                                                                        checkout === lowestThree[0] ? 'bg-yellow-50 text-yellow-700 font-bold' :
                                                                                        checkout === lowestThree[1] ? 'bg-gray-100 text-gray-700 font-bold' :
                                                                                        checkout === lowestThree[2] ? 'bg-orange-50 text-orange-700 font-bold' :
                                                                                        ''
                                                                                    )
                                                                                }`}>
                                                                                    {checkout}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="scoreBreakdown">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Score Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            // Get all scores and calculate statistics
                                            const scores = matchReports.map(report => report.score).filter(Boolean);
                                            const scoreFrequency: { [key: string]: number } = {};
                                            let totalWins = 0;
                                            let totalLosses = 0;
                                            let totalDraws = 0;
                                            
                                            // Process scores
                                            scores.forEach(score => {
                                                scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
                                                const [home, away] = score.split('-').map(Number);
                                                if (home > away) totalWins++;
                                                else if (home < away) totalLosses++;
                                                else totalDraws++;
                                            });

                                            // Sort scores by frequency
                                            const sortedScores = Object.entries(scoreFrequency)
                                                .sort((a, b) => b[1] - a[1]);

                                            return (
                                                <div className="space-y-8">
                                                    {/* Summary Stats */}
                                                    <div className="h-16">
                                                        {/* Stats numbers */}
                                                        <div className="grid grid-cols-3 h-16">
                                                            <div className="text-center flex flex-col justify-center">
                                                                <div className="text-2xl font-bold text-green-600">{totalWins}</div>
                                                                <div className="text-sm text-gray-600">Wins</div>
                                                            </div>
                                                            <div className="text-center flex flex-col justify-center">
                                                                <div className="text-2xl font-bold text-orange-400">{totalDraws}</div>
                                                                <div className="text-sm text-gray-600">Draws</div>
                                                            </div>
                                                            <div className="text-center flex flex-col justify-center">
                                                                <div className="text-2xl font-bold text-red-600">{totalLosses}</div>
                                                                <div className="text-sm text-gray-600">Losses</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score Distribution */}
                                                    <div className="space-y-3">
                                                        {sortedScores.map(([score, count]) => {
                                                            const percentage = (count / scores.length) * 100;
                                                            return (
                                                                <div key={score} className="relative">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-24 text-lg font-semibold ${getScoreColor(score)} px-3 py-1 rounded-lg text-center`}>
                                                                            {score}
                                                                        </div>
                                                                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                                                                            <div 
                                                                                className="h-full bg-blue-100"
                                                                                style={{ width: `${percentage}%` }}
                                                                            />
                                                                        </div>
                                                                        <div className="w-20 text-sm text-gray-600">
                                                                            {count} time{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
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