'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Menu,
  X,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  User,
  Award,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Scatter } from 'recharts';

// Sample data based on the images
const sampleTeams = [
  'DC Patron',
  'Relax One Steel 5',
  'MD13',
  'Team Alpha',
  'Team Beta'
];

const sampleAverageData = [
  { matchday: 1, runningAverage: 39.5, matchAverage: 39.2, result: 'loss' },
  { matchday: 2, runningAverage: 40.1, matchAverage: 40.3, result: 'loss' },
  { matchday: 3, runningAverage: 39.8, matchAverage: 39.9, result: 'win' },
  { matchday: 4, runningAverage: 39.2, matchAverage: 38.5, result: 'loss' },
  { matchday: 5, runningAverage: 40.5, matchAverage: 42.1, result: 'win' },
  { matchday: 6, runningAverage: 40.8, matchAverage: 44.2, result: 'win' },
  { matchday: 7, runningAverage: 39.9, matchAverage: 32.8, result: 'loss' },
  { matchday: 8, runningAverage: 40.2, matchAverage: 41.5, result: 'loss' },
  { matchday: 9, runningAverage: 40.6, matchAverage: 44.8, result: 'win' },
  { matchday: 10, runningAverage: 40.4, matchAverage: 41.2, result: 'loss' },
  { matchday: 11, runningAverage: 40.8, matchAverage: 41.8, result: 'win' },
  { matchday: 12, runningAverage: 41.1, matchAverage: 44.5, result: 'win' },
  { matchday: 13, runningAverage: 41.3, matchAverage: 42.1, result: 'loss' },
  { matchday: 14, runningAverage: 41.0, matchAverage: 36.8, result: 'loss' },
  { matchday: 15, runningAverage: 41.2, matchAverage: 45.8, result: 'win' },
  { matchday: 16, runningAverage: 41.4, matchAverage: 42.1, result: 'win' },
  { matchday: 17, runningAverage: 41.1, matchAverage: 41.8, result: 'loss' },
  { matchday: 18, runningAverage: 41.3, matchAverage: 43.2, result: 'win' },
  { matchday: 19, runningAverage: 41.5, matchAverage: 42.1, result: 'win' },
  { matchday: 20, runningAverage: 41.2, matchAverage: 42.8, result: 'loss' },
  { matchday: 21, runningAverage: 41.4, matchAverage: 44.2, result: 'win' },
  { matchday: 22, runningAverage: 41.1, matchAverage: 37.8, result: 'loss' },
  { matchday: 23, runningAverage: 41.3, matchAverage: 41.2, result: 'loss' },
  { matchday: 24, runningAverage: 41.0, matchAverage: 39.5, result: 'loss' },
  { matchday: 25, runningAverage: 41.2, matchAverage: 43.1, result: 'loss' },
  { matchday: 26, runningAverage: 41.1, matchAverage: 39.8, result: 'win' }
];

const sampleMatchReports = [
  {
    matchday: 26,
    opponent: 'Relax One Steel 5',
    score: '4-4',
    teamAverage: 39.52,
    opponentAverage: -3.09,
    lineup: [
      { position: 1, player: 'Michael Frühwirth', average: 39.83, result: 'loss', checkouts: [] },
      { position: 2, player: 'Markus Hafner', average: 46.84, result: 'win', checkouts: [29, 30, 34] },
      { position: 3, players: ['Michael Frühwirth', 'Christoph Hafner'], result: 'win' },
      { position: 4, players: ['Markus Hafner', 'Luca Schuckert'], result: 'loss' },
      { position: 5, player: 'Luca Schuckert', average: 34.50, result: 'win', checkouts: [46, 38, 39] },
      { position: 6, player: 'Christoph Hafner', average: 36.89, result: 'win', checkouts: [41, 32, 46] },
      { position: 7, players: ['Markus Hafner', 'Luca Schuckert'], result: 'loss' },
      { position: 8, players: ['Christoph Hafner', 'Michael Frühwirth'], result: 'loss' }
    ]
  }
];

const samplePlayerPairs = [
  {
    players: ['Christoph Hafner', 'Markus Hafner'],
    matches: 10,
    wins: 4,
    losses: 6,
    winRate: 40,
    matchHistory: [
      { matchday: 5, result: 'loss' },
      { matchday: 6, result: 'loss' },
      { matchday: 9, result: 'win' },
      { matchday: 9, result: 'win' },
      { matchday: 10, result: 'loss' },
      { matchday: 10, result: 'win' },
      { matchday: 20, result: 'loss' },
      { matchday: 20, result: 'loss' },
      { matchday: 24, result: 'win' },
      { matchday: 24, result: 'loss' }
    ]
  }
];

const samplePlayers = [
  {
    name: 'Luca Schuckert',
    currentAverage: 42.55,
    peakAverage: 58.56,
    averageChange: 4.0,
    winChange: 15,
    oneEightys: 2,
    highFinishes: 2,
    singles: { wins: 12, total: 19 },
    doubles: { wins: 19, total: 35 },
    winRate: 57.4,
    recentForm: ['loss', 'win', 'win', 'win', 'win'],
    recentScores: [19, 22, 24, 24, 24]
  }
];

const CustomScatter = (props: any) => {
  const { cx, cy, payload } = props;
  const color = payload.result === 'win' ? '#22c55e' : payload.result === 'loss' ? '#ef4444' : '#f59e0b';
  const symbol = payload.result === 'win' ? '✓' : payload.result === 'loss' ? '✗' : '−';
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.8} />
      <text x={cx} y={cy + 1} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
        {symbol}
      </text>
    </g>
  );
};

export default function DartsDashboard() {
  const [selectedTeam, setSelectedTeam] = useState('DC Patron');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                {change}
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AverageChart = () => (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">Average Development</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Team Average</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-gray-600">Running Average</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Match Average (Win/Draw/Loss)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-400 border-dashed"></div>
            <span className="text-gray-600">Current Average</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleAverageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="matchday" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                domain={[30, 50]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <Line 
                type="monotone" 
                dataKey="runningAverage" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="matchAverage" 
                stroke="transparent"
                dot={<CustomScatter />}
              />
              <Line 
                type="monotone" 
                dataKey={() => 41.1}
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const MatchReportCard = ({ match }: any) => (
    <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
              {match.matchday}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{match.opponent}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
            {match.score}
          </div>
          <div className="text-sm text-gray-600">
            vs {match.opponent} <span className="text-green-600">+1</span>
          </div>
          <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">
            AVG {match.teamAverage}
          </div>
          <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm">
            vs {match.opponent} {match.opponentAverage}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="font-semibold text-gray-700 mb-4">Lineup & Performances</h4>
        <div className="space-y-3">
          {match.lineup.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  item.result === 'win' ? 'bg-green-100 text-green-600' : 
                  item.result === 'loss' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.position}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {item.players ? item.players.join(', ') : item.player}
                  </p>
                  {item.average && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">{item.average}</span>
                      {item.result === 'win' ? 
                        <ArrowUp className="w-3 h-3 text-green-500" /> : 
                        <ArrowDown className="w-3 h-3 text-red-500" />
                      }
                    </div>
                  )}
                </div>
              </div>
              {item.checkouts && item.checkouts.length > 0 && (
                <div className="text-sm text-blue-600 font-medium">
                  {item.checkouts.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4">
          View Details
        </Button>
      </CardContent>
    </Card>
  );

  const PlayerPairCard = ({ pair }: any) => (
    <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{pair.players[0]}</h3>
              <h3 className="font-bold text-gray-900">{pair.players[1]}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{pair.winRate}%</p>
            <p className="text-sm text-gray-600">Win Rate</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{pair.matches}</p>
            <p className="text-sm text-gray-600">Matches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{pair.wins}</p>
            <p className="text-sm text-gray-600">Wins</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{pair.losses}</p>
            <p className="text-sm text-gray-600">Losses</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Match History</h4>
          <div className="flex flex-wrap gap-2">
            {pair.matchHistory.map((match: any, index: number) => (
              <div
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  match.result === 'win' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {match.matchday}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PlayerOverviewCard = ({ player }: any) => (
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{player.name}</h3>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-lg font-semibold text-gray-700">{player.currentAverage} avg</span>
                <span className="text-sm text-purple-600">Peak: {player.peakAverage}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-semibold">
                +{player.averageChange}
              </div>
              <p className="text-xs text-gray-600 mt-1">AVG*</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm font-semibold">
                +{player.winChange}
              </div>
              <p className="text-xs text-gray-600 mt-1">WIN*</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded text-sm font-semibold">
                {player.oneEightys}
              </div>
              <p className="text-xs text-gray-600 mt-1">180</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                {player.highFinishes}
              </div>
              <p className="text-xs text-gray-600 mt-1">HiFi</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-blue-600 font-semibold mb-2">Singles</h4>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">
                {player.singles.wins}
              </span>
              <span className="text-gray-500">/{player.singles.total}</span>
              <div className="flex-1">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-purple-600 font-semibold mb-2">Doubles</h4>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">
                {player.doubles.wins}
              </span>
              <span className="text-gray-500">/{player.doubles.total}</span>
              <div className="flex-1">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Win Rate</span>
            <span className="text-lg font-bold text-gray-900">{player.winRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${player.winRate}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {player.recentScores.map((score: number, index: number) => (
              <div
                key={index}
                className={`px-2 py-1 rounded text-sm font-medium ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {score}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600 mr-2">L5</span>
            {player.recentForm.map((result: string, index: number) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  result === 'win' ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-gray-900">{selectedTeam}</h1>
            <p className="text-sm text-gray-600">Position: 3rd</p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">WDV Dashboard</h1>
                <p className="text-blue-100 text-sm">Landesliga Tool</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-blue-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Team Selection */}
          <div className="p-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sampleTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'averages', label: 'Average Chart', icon: TrendingUp },
                { id: 'matches', label: 'Match Reports', icon: Calendar },
                { id: 'pairs', label: 'Player Pairs', icon: Users },
                { id: 'players', label: 'Player Overview', icon: User },
                { id: 'venue', label: 'Venue Info', icon: MapPin }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-80">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white shadow-sm border-b px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedTeam}</h1>
              <p className="text-gray-600">League Position: 3rd • Season 2024/25</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Team Average</p>
                <p className="text-xl font-bold text-blue-600">41.2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Team Average"
                  value="41.2"
                  change="+2.1"
                  trend="up"
                  icon={Target}
                />
                <StatCard
                  title="Win Rate"
                  value="65%"
                  change="+5%"
                  trend="up"
                  icon={Trophy}
                />
                <StatCard
                  title="Matches Played"
                  value="26"
                  icon={Activity}
                />
                <StatCard
                  title="League Position"
                  value="3rd"
                  change="+1"
                  trend="up"
                  icon={Award}
                />
              </div>

              {/* Top Performers */}
              <Card className="bg-white border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {samplePlayers.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{player.name}</p>
                            <p className="text-sm text-gray-600">{player.currentAverage} avg</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{player.winRate}%</p>
                          <p className="text-sm text-gray-600">Win Rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'averages' && (
            <div className="space-y-8">
              <AverageChart />
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-8">
              <div className="grid gap-8">
                {sampleMatchReports.map((match, index) => (
                  <MatchReportCard key={index} match={match} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pairs' && (
            <div className="space-y-8">
              <div className="grid gap-8">
                {samplePlayerPairs.map((pair, index) => (
                  <PlayerPairCard key={index} pair={pair} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-8">
              <div className="grid gap-8">
                {samplePlayers.map((player, index) => (
                  <PlayerOverviewCard key={index} player={player} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'venue' && (
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Club Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Gasthaus Zur Post</p>
                      <p className="text-gray-600">Hauptstraße 123, 1234 Wien</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <p className="text-gray-600">+43 1 234 5678</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <p className="text-gray-600">info@dcpatron.at</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'averages', label: 'Charts', icon: TrendingUp },
            { id: 'matches', label: 'Matches', icon: Calendar },
            { id: 'players', label: 'Players', icon: User }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                activeTab === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}