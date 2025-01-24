"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Search, Users, User, CalendarFold, Rows4, CheckCheck, MapPin, Martini, Phone, TrendingUp, Percent, BarChart, ArrowLeftRight } from 'lucide-react';
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader"; // Importing Spinner
import { Checkout, ClubVenue, MatchReport, Player, TeamData, ComparisonData, TeamStandings } from '@/lib/types';





const DartsStatisticsDashboard: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('DC Patron');
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [matchReports, setMatchReports] = useState<MatchReport[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [leaguePosition, setLeaguePosition] = useState<number | null>(null); // New state variable for league position
    const [clubVenue, setClubVenue] = useState<ClubVenue | null>(null);
    const [teamAverage, setTeamAverage] = useState<number | null>(null);
    const [winRate, setWinRate] = useState<number | null>(null);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
    const [teamStandings, setTeamStandings] = useState<TeamStandings | null>(null);

    // Update the teams array with the correct order
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
        'Relax One Steel 5'
    ];

    const filteredTeams = teams.filter(team =>
        team.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    return axios.get(`/api/scraper?action=spielberichte`);
                })
                .then(response => {
                    const url = response.data.link;
                    if (!url) throw new Error('Spielberichte-Link nicht gefunden.');
                    return axios.get(`/api/scraper?action=dartIds&url=${encodeURIComponent(url)}&team=${encodeURIComponent(selectedTeam)}`);
                })
                .then(response => {
                    const matchIds: string[] = response.data.ids; // Annahme: ids ist ein Array von Strings
                    return Promise.all(
                        matchIds.map((id: string) =>
                            axios.get(`/api/scraper?action=matchReport&id=${id}&team=${encodeURIComponent(selectedTeam)}`)
                        )
                    );
                })
                .then(matchReports => {
                    const reports = matchReports.map(res => res.data.report);
                    setMatchReports(reports);
                    const wins = reports.filter(report => report.lineup.includes(selectedTeam)).length;
                    const totalMatches = reports.length;
                    setWinRate(totalMatches > 0 ? (wins / totalMatches) * 100 : 0);
                })
                .catch(error => console.error('Error fetching data:', error))
                .finally(() => setLoading(false));

            // Add comparison data fetch
            axios.get(`/api/scraper?action=comparison&team=${encodeURIComponent(selectedTeam)}`)
                .then(response => {
                    setComparisonData(response.data.comparison);
                })
                .catch(error => console.error('Error fetching comparison data:', error));

            // Team Standings
            axios.get(`/api/scraper?action=standings&team=${encodeURIComponent(selectedTeam)}`)
                .then(response => {
                    setTeamStandings(response.data.standings);
                })
                .catch(error => console.error('Error fetching standings:', error));
        }
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

    const calculateDifference = (first: string, second: string) => {
        const firstRoundScore = Number(first.split('-')[0]);
        const secondRoundScore = Number(second.split('-')[0]);
        return secondRoundScore - firstRoundScore;
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
                                    <p className="text-2xl font-bold text-gray-900">
                                        {teamAverage !== null ? teamAverage.toFixed(2) : 'Loading...'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Martini className="h-6 w-6 text-red-500" />
                                        {clubVenue?.venue || 'Venue'}
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
                                        <p className="text-sm text-gray-500">Current Season Record</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <Tabs defaultValue="matches" className="space-y-4">
                            <TabsList className="flex flex-wrap gap-2 justify-start mb-12">
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
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm bg-white">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Rank</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {teamData && teamData.players.map((player: Player, index: number) => (
                                                        <tr key={player.playerName} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">{index + 1}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {player.playerName}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.adjustedAverage}</td>
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
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">First Round</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Second Round</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Difference</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {[...teams].map((team) => {
                                                        const data = comparisonData.find(d => d.opponent === team);
                                                        const difference = data?.firstRound && data?.secondRound 
                                                            ? calculateDifference(data.firstRound, data.secondRound)
                                                            : null;
                                                        
                                                        return (
                                                            <tr key={team} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    <div className="flex items-center justify-between sm:justify-start gap-2">
                                                                        <span>{team}</span>
                                                                        {/* Mobile difference indicator */}
                                                                        {difference !== null && (
                                                                            <span className={`sm:hidden px-2 py-1 rounded text-sm ${
                                                                                difference > 0
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : difference < 0
                                                                                        ? 'bg-red-100 text-red-800'
                                                                                        : 'bg-orange-100 text-orange-800'
                                                                            }`}>
                                                                                {`${difference >= 0 ? '+' : ''}${difference}`}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                                    {data?.firstRound || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                                    {data?.secondRound || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium hidden sm:table-cell">
                                                                    {difference !== null ? (
                                                                        <span className={`px-2 py-1 rounded ${
                                                                            difference > 0
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : difference < 0
                                                                                    ? 'bg-red-100 text-red-800'
                                                                                    : 'bg-orange-100 text-orange-800'
                                                                        }`}>
                                                                            {`${difference >= 0 ? '+' : ''}${difference}`}
                                                                        </span>
                                                                    ) : '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
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