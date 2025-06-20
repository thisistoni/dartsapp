'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipLoader } from 'react-spinners';
import { 
  Trophy, 
  Target, 
  Users, 
  MapPin, 
  Phone, 
  Calendar,
  TrendingUp,
  Award,
  BarChart3,
  Search,
  ChevronDown,
  Star,
  Zap,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import your existing types
import { Player, MatchReport, ClubVenue, ComparisonData, TeamStandings, MatchAverages, OneEighty, HighFinish } from '@/lib/types';

interface TeamData {
  players: Player[];
  matchReports: MatchReport[];
  leaguePosition: number;
  clubVenue: ClubVenue;
  comparisonData: ComparisonData[];
  teamStandings: TeamStandings;
  matchAverages: MatchAverages[];
  oneEightys: OneEighty[];
  highFinishes: HighFinish[];
}

const teams = [
  'DC Patron',
  'DC Dornbirn',
  'DC Feldkirch',
  'DC Bludenz',
  'DC Rankweil',
  'DC Hohenems',
  'DC Lustenau',
  'DC Hard',
  'DC Götzis',
  'DC Wolfurt',
  'DC Lauterach',
  'DC Schwarzach',
  'DC Egg'
];

export default function DartsDashboard() {
  const [selectedTeam, setSelectedTeam] = useState<string>('DC Patron');
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const filteredTeams = teams.filter(team =>
    team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchTeamData = async (teamName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teamData?team=${encodeURIComponent(teamName)}`);
      const result = await response.json();
      setTeamData(result.data);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData(selectedTeam);
  }, [selectedTeam]);

  const handleTeamSelect = (team: string) => {
    setSelectedTeam(team);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const getTopPerformers = () => {
    if (!teamData?.players) return [];
    return [...teamData.players]
      .sort((a, b) => b.adjustedAverage - a.adjustedAverage)
      .slice(0, 3);
  };

  const getTeamAverage = () => {
    if (!teamData?.players || teamData.players.length === 0) return 0;
    const sum = teamData.players.reduce((acc, player) => acc + player.adjustedAverage, 0);
    return (sum / teamData.players.length).toFixed(2);
  };

  const getWinRate = () => {
    if (!teamData?.teamStandings) return 0;
    const { wins, draws, losses } = teamData.teamStandings;
    const total = wins + draws + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <ClipLoader color="#3b82f6" size={60} />
          <p className="mt-4 text-slate-600 font-medium">Loading team data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  WDV Landesliga
                </h1>
                <p className="text-sm text-slate-600">Statistics Dashboard</p>
              </div>
            </div>
            
            {/* Team Selector */}
            <div className="relative">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 min-w-[200px] justify-between group"
                >
                  <span className="font-medium text-slate-900">{selectedTeam}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50"
                    >
                      <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search teams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredTeams.map((team) => (
                          <button
                            key={team}
                            onClick={() => handleTeamSelect(team)}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors duration-150 ${
                              team === selectedTeam ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                            }`}
                          >
                            {team}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Stats Overview */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">League Position</p>
                    <p className="text-3xl font-bold">{teamData?.leaguePosition || 'N/A'}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Team Average</p>
                    <p className="text-3xl font-bold">{getTeamAverage()}</p>
                  </div>
                  <Target className="h-8 w-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Win Rate</p>
                    <p className="text-3xl font-bold">{getWinRate()}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Total Players</p>
                    <p className="text-3xl font-bold">{teamData?.players?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Performers */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getTopPerformers().map((player, index) => (
                    <motion.div
                      key={player.playerName}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : 'bg-amber-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{player.playerName}</p>
                          <p className="text-2xl font-bold text-slate-700">{player.adjustedAverage}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="players" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-white/70 backdrop-blur-sm border border-slate-200/50 p-1 rounded-xl">
                <TabsTrigger value="players" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Players</span>
                </TabsTrigger>
                <TabsTrigger value="matches" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Matches</span>
                </TabsTrigger>
                <TabsTrigger value="venue" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Venue</span>
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Results</span>
                </TabsTrigger>
                <TabsTrigger value="averages" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Averages</span>
                </TabsTrigger>
                <TabsTrigger value="special" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Special</span>
                </TabsTrigger>
              </TabsList>

              {/* Players Tab */}
              <TabsContent value="players">
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Users className="h-5 w-5 text-blue-600" />
                      Player Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Player</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Average</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Singles</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Doubles</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Win Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamData?.players?.map((player, index) => (
                            <motion.tr
                              key={player.playerName}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150"
                            >
                              <td className="py-3 px-4 font-medium text-slate-900">{player.playerName}</td>
                              <td className="py-3 px-4 text-slate-700 font-semibold">{player.adjustedAverage}</td>
                              <td className="py-3 px-4 text-slate-600">{player.singles || 'N/A'}</td>
                              <td className="py-3 px-4 text-slate-600">{player.doubles || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  (player.winRate || 0) >= 50 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {player.winRate || 0}%
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Match Reports Tab */}
              <TabsContent value="matches">
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Recent Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamData?.matchReports?.map((match, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200/50"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                vs {match.opponent}
                              </h3>
                              <p className="text-2xl font-bold text-slate-700 mb-3">{match.score}</p>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-600">Lineup:</p>
                                <div className="flex flex-wrap gap-2">
                                  {match.lineup.map((player, playerIndex) => (
                                    <span
                                      key={playerIndex}
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {player}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="lg:text-right">
                              <p className="text-sm font-medium text-slate-600 mb-2">Match Details:</p>
                              <div className="space-y-1 text-sm text-slate-700">
                                <p>Sets: {match.details.totalSets.home}-{match.details.totalSets.away}</p>
                                <p>Legs: {match.details.totalLegs.home}-{match.details.totalLegs.away}</p>
                              </div>
                            </div>
                          </div>
                          
                          {match.checkouts.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <p className="text-sm font-medium text-slate-600 mb-2">Checkouts:</p>
                              <div className="space-y-1">
                                {match.checkouts.map((checkout, checkoutIndex) => (
                                  <p key={checkoutIndex} className="text-sm text-slate-700 font-mono">
                                    {checkout.scores}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Club Venue Tab */}
              <TabsContent value="venue">
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Club Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamData?.clubVenue ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-slate-600">Club Name</label>
                            <p className="text-lg font-semibold text-slate-900">{teamData.clubVenue.clubName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600">Venue</label>
                            <p className="text-lg text-slate-700">{teamData.clubVenue.venue}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600">Address</label>
                            <p className="text-lg text-slate-700">{teamData.clubVenue.address}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-slate-600">City</label>
                            <p className="text-lg text-slate-700">{teamData.clubVenue.city}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600">Phone</label>
                            <p className="text-lg text-slate-700 flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-500" />
                              {teamData.clubVenue.phone}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600">League Rank</label>
                            <p className="text-lg font-semibold text-slate-900">#{teamData.clubVenue.rank}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600">No venue information available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Comparison Tab */}
              <TabsContent value="comparison">
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Season Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Opponent</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">First Round</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Second Round</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamData?.comparisonData?.map((comparison, index) => (
                            <motion.tr
                              key={comparison.opponent}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150"
                            >
                              <td className="py-3 px-4 font-medium text-slate-900">{comparison.opponent}</td>
                              <td className="py-3 px-4 text-slate-700">{comparison.firstRound || 'TBD'}</td>
                              <td className="py-3 px-4 text-slate-700">{comparison.secondRound || 'TBD'}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Match Averages Tab */}
              <TabsContent value="averages">
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Match Averages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamData?.matchAverages?.map((match, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200/50"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                Match {match.matchday} vs {match.opponent}
                              </h3>
                              <p className="text-2xl font-bold text-blue-600 mt-2">
                                Team Average: {match.teamAverage}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm font-medium text-slate-600 mb-3">Player Averages:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {match.playerAverages.map((player, playerIndex) => (
                                <div
                                  key={playerIndex}
                                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200/50"
                                >
                                  <span className="text-sm font-medium text-slate-700">{player.playerName}</span>
                                  <span className="text-sm font-bold text-slate-900">{player.average}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Special Stats Tab */}
              <TabsContent value="special">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 180s */}
                  <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        180s
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teamData?.oneEightys?.map((player, index) => (
                          <motion.div
                            key={player.playerName}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200/50"
                          >
                            <span className="font-medium text-slate-900">{player.playerName}</span>
                            <span className="text-lg font-bold text-yellow-700">{player.count}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* High Finishes */}
                  <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Award className="h-5 w-5 text-purple-500" />
                        High Finishes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teamData?.highFinishes?.map((player, index) => (
                          <motion.div
                            key={player.playerName}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-slate-900">{player.playerName}</span>
                              <span className="text-sm text-purple-600 font-medium">
                                {player.finishes.length} finishes
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {player.finishes.map((finish, finishIndex) => (
                                <span
                                  key={finishIndex}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-200 text-purple-800"
                                >
                                  {finish}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}