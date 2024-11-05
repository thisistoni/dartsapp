"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Search, Users, User, CalendarFold,Rows4,CheckCheck, MapPin, Martini, Phone } from 'lucide-react';
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader"; // Importing Spinner

// Define interfaces for your data structures
interface Player {
  playerName: string;
  adjustedAverage: number;
  // Add other properties if necessary
}

interface TeamData {
  players: Player[];
  // Add other properties if necessary
}

interface Checkout {
  scores: string;
}

interface MatchReport {
  lineup: string[];
  checkouts: Checkout[];
  // Add other properties if necessary
}

// Define the interface for Club Venue
interface ClubVenue {
  rank: string;
  teamName: string;
  clubName: string;
  venue: string;
  address: string;
  city: string;
  phone: string;
}



const DartsStatisticsDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('DC Patron');
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [matchReports, setMatchReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [leaguePosition, setLeaguePosition] = useState<number | null>(null); // New state variable for league position
  const [clubVenue, setClubVenue] = useState<ClubVenue | null>(null);

  // Simulated team list
  const teams: string[] = [
    'Dartclub Twentytwo 1',
    'Relax One Steel 5',
    'Babylon Triple 1',
    'DC Voltadolis Steel',
    'An Sporran 404 Double Not Found',
    'Temmel Dart Lions',
    'LDC Martial Darts 4ward',
    'Snakes II',
    'Vienna Devils 3',
    'Bad Boys LUMBERJACKS',
    'DC Patron',
    'The Plumbatas',
    'DSV NaNog Zinsfabrik',
    'AS The Dart Side of the Moon II'
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
    // Fetch team data whenever the selected team changes
    if (selectedTeam) {
      setLoading(true);
      setLeaguePosition(null); // Reset league position

      // Fetch league position
      axios.get(`https://v2202406227836275390.happysrv.de/api/league-position/${encodeURIComponent(selectedTeam)}`)
        .then(response => {
          setLeaguePosition(response.data.position);
        })
        .catch(error => {
          console.error('Error fetching league position:', error);
        });

        // Fetch club venue information
      axios
      .get(`https://v2202406227836275390.happysrv.de/api/club-venue/${encodeURIComponent(selectedTeam)}`)
      .then((response) => {
        setClubVenue(response.data);
      })
      .catch((error) => {
        console.error('Error fetching club venue:', error);
      });

      // Fetch team data and match reports
      axios.get(`https://v2202406227836275390.happysrv.de/api/team-players-average/${encodeURIComponent(selectedTeam)}`)
        .then(response => {
          const data: TeamData = response.data;
          setTeamData(data);
          return axios.get(`https://v2202406227836275390.happysrv.de/api/dart-ids/${encodeURIComponent(selectedTeam)}`);
        })
        .then(response => {
          const matchIds: string[] = response.data.ids;
          return Promise.all(matchIds.map((id: string) => axios.get(`https://v2202406227836275390.happysrv.de/api/match-report/${id}/${encodeURIComponent(selectedTeam)}`)));
        })
        .then(matchReportResponses => {
          const reports: MatchReport[] = matchReportResponses.map(res => res.data);
          setMatchReports(reports);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedTeam]);


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
            <Card className="mb-6 bg-white overflow-hidden shadow-sm border">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Info Section */}
          <div className="flex-1 space-y-4">
            
              <div className="flex items-center space-x-2">
                <Martini className="h-6 w-6 text-red-500" />
                <h3 className="text-xl font-semibold text-slate-900">{clubVenue?.clubName}</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span>{clubVenue?.address+", "+clubVenue?.city}</span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="h-4 w-4 text-slate-500" />
                <span>{clubVenue?.phone}</span>
              </div>
              </div>

          </div>
        </div>
      </CardContent>
    </Card>            {/* Main Content Tabs */}
            <Tabs defaultValue="matches" className="space-y-4">
              <TabsList>
              <TabsTrigger value="matches" className="flex items-center">
  <Users className="h-5 w-5 text-green-500 mr-1" /> {/* Users-Icon für Matches */}
  Matches
</TabsTrigger>

      

                <TabsTrigger value="stats" className="flex items-center"><User className="h-5 w-5 text-green-500 mr-1" /> Player Stats</TabsTrigger>
              </TabsList>

              <TabsContent value="matches">
  <div className="space-y-4">
    {matchReports.map((matchday: MatchReport, index: number) => (
      <Card key={index}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarFold className="h-6 w-6 text-blue-500" />
            <CardTitle>Matchday {index + 1}</CardTitle>
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
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default DartsStatisticsDashboard;