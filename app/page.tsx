'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  ChevronDown,
  Star,
  Zap,
  Activity,
  Menu,
  X,
  Home,
  Settings,
  Info
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

// Sample data for different teams
const sampleTeamData: Record<string, TeamData> = {
  'DC Patron': {
    players: [
      { playerName: 'Max Mustermann', adjustedAverage: 78.5, singles: '8-2', doubles: '6-4', winRate: 70 },
      { playerName: 'Hans Schmidt', adjustedAverage: 72.3, singles: '7-3', doubles: '5-5', winRate: 60 },
      { playerName: 'Peter Wagner', adjustedAverage: 69.8, singles: '6-4', doubles: '7-3', winRate: 65 },
      { playerName: 'Klaus Müller', adjustedAverage: 65.2, singles: '5-5', doubles: '4-6', winRate: 45 },
      { playerName: 'Franz Huber', adjustedAverage: 63.7, singles: '4-6', doubles: '6-4', winRate: 50 },
      { playerName: 'Josef Bauer', adjustedAverage: 61.4, singles: '3-7', doubles: '5-5', winRate: 40 }
    ],
    matchReports: [
      {
        lineup: ['Max Mustermann', 'Hans Schmidt', 'Peter Wagner', 'Klaus Müller'],
        checkouts: [
          { scores: 'Max Mustermann: 120, 81' },
          { scores: 'Hans Schmidt: 100' },
          { scores: 'Peter Wagner: 76, 64' }
        ],
        opponent: 'DC Dornbirn',
        score: '6-2',
        details: {
          singles: [
            { homePlayer: 'Max Mustermann', awayPlayer: 'Thomas Berger', homeScore: 3, awayScore: 1 },
            { homePlayer: 'Hans Schmidt', awayPlayer: 'Michael Steiner', homeScore: 3, awayScore: 2 }
          ],
          doubles: [
            { homePlayers: ['Peter Wagner', 'Klaus Müller'], awayPlayers: ['Andreas Wolf', 'Stefan Mayer'], homeScore: 3, awayScore: 0 }
          ],
          totalLegs: { home: 18, away: 12 },
          totalSets: { home: 6, away: 2 }
        }
      },
      {
        lineup: ['Max Mustermann', 'Franz Huber', 'Josef Bauer', 'Peter Wagner'],
        checkouts: [
          { scores: 'Max Mustermann: 140, 100, 76' },
          { scores: 'Franz Huber: 84' }
        ],
        opponent: 'DC Feldkirch',
        score: '4-4',
        details: {
          singles: [
            { homePlayer: 'Max Mustermann', awayPlayer: 'Robert Klein', homeScore: 3, awayScore: 2 },
            { homePlayer: 'Franz Huber', awayPlayer: 'Daniel Gross', homeScore: 1, awayScore: 3 }
          ],
          doubles: [
            { homePlayers: ['Josef Bauer', 'Peter Wagner'], awayPlayers: ['Martin Lang', 'Christian Fuchs'], homeScore: 2, awayScore: 3 }
          ],
          totalLegs: { home: 15, away: 15 },
          totalSets: { home: 4, away: 4 }
        }
      }
    ],
    leaguePosition: 3,
    clubVenue: {
      rank: '3',
      teamName: 'DC Patron',
      clubName: 'Dart Club Patron',
      venue: 'Gasthaus Zur Post',
      address: 'Hauptstraße 15',
      city: 'Dornbirn',
      phone: '+43 5572 12345'
    },
    comparisonData: [
      { opponent: 'DC Dornbirn', firstRound: '6-2', secondRound: null },
      { opponent: 'DC Feldkirch', firstRound: '4-4', secondRound: '5-3' },
      { opponent: 'DC Bludenz', firstRound: '7-1', secondRound: null },
      { opponent: 'DC Rankweil', firstRound: '3-5', secondRound: '6-2' }
    ],
    teamStandings: {
      wins: 8,
      draws: 3,
      losses: 2
    },
    matchAverages: [
      {
        matchday: 1,
        teamAverage: 72.4,
        opponent: 'DC Dornbirn',
        playerAverages: [
          { playerName: 'Max Mustermann', average: 78.5 },
          { playerName: 'Hans Schmidt', average: 72.3 },
          { playerName: 'Peter Wagner', average: 69.8 },
          { playerName: 'Klaus Müller', average: 65.2 }
        ]
      },
      {
        matchday: 2,
        teamAverage: 68.9,
        opponent: 'DC Feldkirch',
        playerAverages: [
          { playerName: 'Max Mustermann', average: 76.2 },
          { playerName: 'Franz Huber', average: 63.7 },
          { playerName: 'Josef Bauer', average: 61.4 },
          { playerName: 'Peter Wagner', average: 74.3 }
        ]
      }
    ],
    oneEightys: [
      { playerName: 'Max Mustermann', count: 12 },
      { playerName: 'Hans Schmidt', count: 8 },
      { playerName: 'Peter Wagner', count: 6 },
      { playerName: 'Klaus Müller', count: 3 }
    ],
    highFinishes: [
      { playerName: 'Max Mustermann', finishes: [140, 120, 100, 81] },
      { playerName: 'Hans Schmidt', finishes: [100, 84, 76] },
      { playerName: 'Peter Wagner', finishes: [76, 64] }
    ]
  },
  'DC Dornbirn': {
    players: [
      { playerName: 'Thomas Berger', adjustedAverage: 75.2, singles: '7-3', doubles: '5-5', winRate: 60 },
      { playerName: 'Michael Steiner', adjustedAverage: 71.8, singles: '6-4', doubles: '6-4', winRate: 60 },
      { playerName: 'Andreas Wolf', adjustedAverage: 68.5, singles: '5-5', doubles: '7-3', winRate: 60 },
      { playerName: 'Stefan Mayer', adjustedAverage: 64.9, singles: '4-6', doubles: '5-5', winRate: 45 },
      { playerName: 'Martin Fischer', adjustedAverage: 62.3, singles: '3-7', doubles: '4-6', winRate: 35 }
    ],
    matchReports: [
      {
        lineup: ['Thomas Berger', 'Michael Steiner', 'Andreas Wolf', 'Stefan Mayer'],
        checkouts: [
          { scores: 'Thomas Berger: 100, 84' },
          { scores: 'Michael Steiner: 76' }
        ],
        opponent: 'DC Patron',
        score: '2-6',
        details: {
          singles: [
            { homePlayer: 'Thomas Berger', awayPlayer: 'Max Mustermann', homeScore: 1, awayScore: 3 },
            { homePlayer: 'Michael Steiner', awayPlayer: 'Hans Schmidt', homeScore: 2, awayScore: 3 }
          ],
          doubles: [
            { homePlayers: ['Andreas Wolf', 'Stefan Mayer'], awayPlayers: ['Peter Wagner', 'Klaus Müller'], homeScore: 0, awayScore: 3 }
          ],
          totalLegs: { home: 12, away: 18 },
          totalSets: { home: 2, away: 6 }
        }
      }
    ],
    leaguePosition: 5,
    clubVenue: {
      rank: '5',
      teamName: 'DC Dornbirn',
      clubName: 'Dart Club Dornbirn',
      venue: 'Sportcafe Arena',
      address: 'Messestraße 8',
      city: 'Dornbirn',
      phone: '+43 5572 54321'
    },
    comparisonData: [
      { opponent: 'DC Patron', firstRound: '2-6', secondRound: null },
      { opponent: 'DC Feldkirch', firstRound: '5-3', secondRound: '2-6' },
      { opponent: 'DC Bludenz', firstRound: '4-4', secondRound: null }
    ],
    teamStandings: {
      wins: 5,
      draws: 4,
      losses: 4
    },
    matchAverages: [
      {
        matchday: 1,
        teamAverage: 67.6,
        opponent: 'DC Patron',
        playerAverages: [
          { playerName: 'Thomas Berger', average: 75.2 },
          { playerName: 'Michael Steiner', average: 71.8 },
          { playerName: 'Andreas Wolf', average: 68.5 },
          { playerName: 'Stefan Mayer', average: 54.9 }
        ]
      }
    ],
    oneEightys: [
      { playerName: 'Thomas Berger', count: 9 },
      { playerName: 'Michael Steiner', count: 7 },
      { playerName: 'Andreas Wolf', count: 4 }
    ],
    highFinishes: [
      { playerName: 'Thomas Berger', finishes: [100, 84, 76] },
      { playerName: 'Michael Steiner', finishes: [76, 64] }
    ]
  }
};

export default function DartsDashboard() {
  const [selectedTeam, setSelectedTeam] = useState<string>('DC Patron');
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const fetchTeamData = async (teamName: string) => {
    setLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Get sample data or create default data for teams not in sample
    const data = sampleTeamData[teamName] || {
      players: [
        { playerName: 'Player 1', adjustedAverage: 65.0, singles: '5-5', doubles: '4-6', winRate: 45 },
        { playerName: 'Player 2', adjustedAverage: 62.5, singles: '4-6', doubles: '5-5', winRate: 45 },
        { playerName: 'Player 3', adjustedAverage: 60.0, singles: '3-7', doubles: '6-4', winRate: 45 },
        { playerName: 'Player 4', adjustedAverage: 58.5, singles: '2-8', doubles: '7-3', winRate: 45 }
      ],
      matchReports: [
        {
          lineup: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
          checkouts: [{ scores: 'Player 1: 76' }],
          opponent: 'Sample Opponent',
          score: '4-4',
          details: {
            singles: [
              { homePlayer: 'Player 1', awayPlayer: 'Opponent 1', homeScore: 2, awayScore: 3 }
            ],
            doubles: [
              { homePlayers: ['Player 2', 'Player 3'], awayPlayers: ['Opponent 2', 'Opponent 3'], homeScore: 3, awayScore: 1 }
            ],
            totalLegs: { home: 15, away: 15 },
            totalSets: { home: 4, away: 4 }
          }
        }
      ],
      leaguePosition: Math.floor(Math.random() * 12) + 1,
      clubVenue: {
        rank: '8',
        teamName: teamName,
        clubName: `Club ${teamName}`,
        venue: 'Sample Venue',
        address: 'Sample Address 123',
        city: 'Sample City',
        phone: '+43 1234 56789'
      },
      comparisonData: [
        { opponent: 'Sample Team 1', firstRound: '4-4', secondRound: null },
        { opponent: 'Sample Team 2', firstRound: '3-5', secondRound: '6-2' }
      ],
      teamStandings: {
        wins: 6,
        draws: 3,
        losses: 4
      },
      matchAverages: [
        {
          matchday: 1,
          teamAverage: 61.5,
          opponent: 'Sample Opponent',
          playerAverages: [
            { playerName: 'Player 1', average: 65.0 },
            { playerName: 'Player 2', average: 62.5 },
            { playerName: 'Player 3', average: 60.0 },
            { playerName: 'Player 4', average: 58.5 }
          ]
        }
      ],
      oneEightys: [
        { playerName: 'Player 1', count: 5 },
        { playerName: 'Player 2', count: 3 }
      ],
      highFinishes: [
        { playerName: 'Player 1', finishes: [76, 64] },
        { playerName: 'Player 2', finishes: [84] }
      ]
    };
    
    setTeamData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeamData(selectedTeam);
  }, [selectedTeam]);

  const handleTeamSelect = (team: string) => {
    setSelectedTeam(team);
    setSidebarOpen(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-md border-r border-slate-200/50 overflow-y-auto">
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 p-6 border-b border-slate-200/50">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                WDV Landesliga
              </h1>
              <p className="text-sm text-slate-600">Statistics Dashboard</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Navigation
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('players')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === 'players'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Players
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === 'matches'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Matches
                </button>
                <button
                  onClick={() => setActiveTab('venue')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === 'venue'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Venue
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === 'comparison'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Results
                </button>
                <button
                  onClick={() => setActiveTab('averages')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === 'averages'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Averages
                </button>
                <button
                  onClick={() => setActiveTab('special')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === 'special'
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Special Stats
                </button>
              </div>
            </div>

            {/* Teams List */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Teams
              </h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {teams.map((team) => (
                  <button
                    key={team}
                    onClick={() => handleTeamSelect(team)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                      team === selectedTeam
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-80 bg-white/95 backdrop-blur-md border-r border-slate-200/50 z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      WDV Landesliga
                    </h1>
                    <p className="text-sm text-slate-600">Statistics Dashboard</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="px-4 py-6 space-y-2">
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Navigation
                  </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('overview');
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === 'overview'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Home className="h-4 w-4" />
                      Overview
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('players');
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === 'players'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Players
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('matches');
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === 'matches'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      Matches
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('venue');
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === 'venue'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                      Venue
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('comparison');
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === 'comparison'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Results
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('averages');
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === 'averages'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Activity className="h-4 w-4" />
                      Averages
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('special');
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === 'special'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                      Special Stats
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Teams
                  </h3>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {teams.map((team) => (
                      <button
                        key={team}
                        onClick={() => handleTeamSelect(team)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                          team === selectedTeam
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium border border-blue-200'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-80">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-slate-900">{selectedTeam}</h1>
              <p className="text-xs text-slate-600">WDV Landesliga</p>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:block bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-30">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedTeam}</h1>
                <p className="text-sm text-slate-600">Team Statistics & Performance</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Position #{teamData?.leaguePosition || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 lg:p-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
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
              </>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <motion.div variants={itemVariants}>
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
              </motion.div>
            )}

            {/* Match Reports Tab */}
            {activeTab === 'matches' && (
              <motion.div variants={itemVariants}>
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
              </motion.div>
            )}

            {/* Club Venue Tab */}
            {activeTab === 'venue' && (
              <motion.div variants={itemVariants}>
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
              </motion.div>
            )}

            {/* Comparison Tab */}
            {activeTab === 'comparison' && (
              <motion.div variants={itemVariants}>
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
              </motion.div>
            )}

            {/* Match Averages Tab */}
            {activeTab === 'averages' && (
              <motion.div variants={itemVariants}>
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
              </motion.div>
            )}

            {/* Special Stats Tab */}
            {activeTab === 'special' && (
              <motion.div variants={itemVariants}>
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
              </motion.div>
            )}
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/50 z-30">
          <div className="grid grid-cols-4 gap-1 p-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'players'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Players</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'matches'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-medium">Matches</span>
            </button>
            <button
              onClick={() => setActiveTab('special')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'special'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Zap className="h-5 w-5" />
              <span className="text-xs font-medium">Special</span>
            </button>
          </div>
        </div>

        {/* Bottom padding for mobile navigation */}
        <div className="lg:hidden h-20" />
      </div>
    </div>
  );
}