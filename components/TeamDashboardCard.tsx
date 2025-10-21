import React from 'react';
import { User, Users } from 'lucide-react';
import { TeamData, TeamStandings, ClubVenue, OneEighty, HighFinish } from '@/lib/types';
import TeamComparison from './TeamComparison';

interface TeamDashboardCardProps {
    selectedTeam: string;
    selectedSeason: string;
    setSelectedSeason: (season: '2025/26' | '2024/25' | 'all') => void;
    leaguePosition: number | null;
    teamAverage: number | null;
    oneEightys: OneEighty[];
    highFinishes: HighFinish[];
    clubVenue: ClubVenue | null;
    teamData: TeamData | null;
    teamStandings: TeamStandings | null;
    teams: string[];
    comparisonTeam: string;
    setComparisonTeam: (team: string) => void;
    fetchComparisonTeam: (team: string, season?: string) => void;
    comparisonLoading: boolean;
    comparisonTeamData: TeamData | null;
    setComparisonTeamData: React.Dispatch<React.SetStateAction<TeamData | null>>;
}

export default function TeamDashboardCard({
    selectedTeam,
    selectedSeason,
    setSelectedSeason,
    leaguePosition,
    teamAverage,
    oneEightys,
    highFinishes,
    clubVenue,
    teamData,
    teamStandings,
    teams,
    comparisonTeam,
    setComparisonTeam,
    fetchComparisonTeam,
    comparisonLoading,
    comparisonTeamData,
    setComparisonTeamData
}: TeamDashboardCardProps) {
    return (
        <div className="mb-6 bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            {/* Gradient top bar */}
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-violet-500 via-amber-500 to-emerald-500" />
            
            <div className="p-6">
                {/* Main Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    {/* Team Name & Core Stats */}
                    <div className="flex items-center gap-4">
                        {leaguePosition !== null && (
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center border-2 border-white shadow-md">
                                    <span className="text-lg font-bold text-white">#{leaguePosition}</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-1">{selectedTeam}</h2>
                            <div className="flex items-center gap-3 text-sm">
                                {teamAverage !== null && (
                                    <div className="flex items-center gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                        <span className="text-gray-600">Avg</span>
                                        <span className="font-bold text-violet-600">{teamAverage.toFixed(1)}</span>
                                    </div>
                                )}
                                {oneEightys.reduce((sum, player) => sum + (player.count || 0), 0) > 0 && (
                                    <div className="flex items-center gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        <span className="text-gray-600">180s</span>
                                        <span className="font-bold text-amber-600">{oneEightys.reduce((sum, player) => sum + (player.count || 0), 0)}</span>
                                    </div>
                                )}
                                {highFinishes.reduce((sum, player) => sum + (player.finishes?.length || 0), 0) > 0 && (
                                    <div className="relative group/hifi flex items-center gap-1 cursor-pointer">
                                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                        <span className="text-gray-600">HiFi</span>
                                        <span className="font-bold text-rose-600">{highFinishes.reduce((sum, player) => sum + (player.finishes?.length || 0), 0)}</span>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute left-0 top-full mt-2 scale-0 group-hover/hifi:scale-100 transition-transform origin-top-left z-50">
                                            <div className="bg-gray-900 text-white rounded-lg shadow-xl p-2 whitespace-nowrap">
                                                <div className="flex gap-1.5">
                                                    {highFinishes.flatMap(player => player.finishes || [])
                                                        .sort((a, b) => b - a)
                                                        .map((finish, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 text-xs font-bold bg-rose-500 rounded">
                                                                {finish}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Side: Season + Venue */}
                    <div className="flex flex-col gap-3">
                        {/* Season Dropdown */}
                        {selectedTeam === 'DC Patron' ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Season:</span>
                                <select
                                    value={selectedSeason}
                                    onChange={(e) => setSelectedSeason(e.target.value as '2025/26' | '2024/25' | 'all')}
                                    className="text-xs font-semibold bg-white border-2 border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="2025/26">2025/26</option>
                                    <option value="2024/25">2024/25</option>
                                    <option value="all">All Seasons</option>
                                </select>
                            </div>
                        ) : (
                            <div className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg">Season 2025/26</div>
                        )}
                        
                        {/* Venue Info */}
                        {clubVenue && (
                            <div className="text-xs">
                                <div className="font-bold text-gray-900 mb-0.5">
                                    {clubVenue.clubName || clubVenue.name}
                                </div>
                                <div className="text-gray-600">
                                    {clubVenue.address}
                                    {clubVenue.zipcode && `, ${clubVenue.zipcode}`}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Stats Grid - Compact */}
                {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                 selectedTeam !== 'Fortunas Wölfe' && 
                 selectedTeam !== 'DC Patron II' && (
                <div className="mt-6 pt-6 border-t-2 border-gray-100">
                    <div className="flex flex-wrap items-stretch gap-4">
                        {/* Singles */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50/30 flex-1 min-w-[calc(50%-0.5rem)] md:min-w-0">
                            <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div>
                                <div className="text-[10px] font-semibold text-blue-600 uppercase">Singles</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {(teamData?.players ?? []).reduce((sum, player) => sum + (player.singlesWon || 0), 0)}
                                    <span className="text-sm text-gray-400 font-medium">
                                        /{(teamData?.players ?? []).reduce((sum, player) => sum + (player.singlesWon || 0) + (player.singlesLost || 0), 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Doubles */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-violet-200 bg-violet-50/30 flex-1 min-w-[calc(50%-0.5rem)] md:min-w-0">
                            <Users className="h-4 w-4 text-violet-500 flex-shrink-0" />
                            <div>
                                <div className="text-[10px] font-semibold text-violet-600 uppercase">Doubles</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {Math.round((teamData?.players ?? []).reduce((sum, player) => sum + (player.doublesWon || 0), 0) / 2)}
                                    <span className="text-sm text-gray-400 font-medium">
                                        /{Math.round((teamData?.players ?? []).reduce((sum, player) => sum + (player.doublesWon || 0) + (player.doublesLost || 0), 0) / 2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Record */}
                        {teamStandings && (
                            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50/30 flex-1 w-full md:w-auto md:min-w-0">
                                <div className="flex-1">
                                    <div className="text-[10px] font-semibold text-gray-600 uppercase mb-1">Record</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-900">
                                            {teamStandings.wins}-{teamStandings.draws}-{teamStandings.losses}
                                        </span>
                                        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                            <div className="h-full flex">
                                                <div className="h-full bg-emerald-500"
                                                    style={{ width: `${(teamStandings.wins / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` }} 
                                                />
                                                <div className="h-full bg-amber-500"
                                                    style={{ width: `${(teamStandings.draws / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` }} 
                                                />
                                                <div className="h-full bg-rose-500"
                                                    style={{ width: `${(teamStandings.losses / (teamStandings.wins + teamStandings.draws + teamStandings.losses)) * 100}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Team Comparison - Embedded */}
                    <TeamComparison
                        selectedTeam={selectedTeam}
                        selectedSeason={selectedSeason}
                        teams={teams}
                        comparisonTeam={comparisonTeam}
                        setComparisonTeam={setComparisonTeam}
                        fetchComparisonTeam={fetchComparisonTeam}
                        comparisonLoading={comparisonLoading}
                        teamData={teamData}
                        comparisonTeamData={comparisonTeamData}
                        setComparisonTeamData={setComparisonTeamData}
                    />
                </div>
                )}
            </div>
        </div>
    );
}
