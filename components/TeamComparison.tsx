import React, { Dispatch, SetStateAction } from 'react';
import { BarChart, User, Users } from 'lucide-react';
import ClipLoader from "react-spinners/ClipLoader";
import { TeamData } from '@/lib/types';

interface TeamComparisonProps {
    selectedTeam: string;
    selectedSeason: string;
    teams: string[];
    comparisonTeam: string;
    setComparisonTeam: (team: string) => void;
    fetchComparisonTeam: (team: string, season?: string) => void;
    comparisonLoading: boolean;
    teamData: TeamData | null;
    comparisonTeamData: TeamData | null;
    setComparisonTeamData: Dispatch<SetStateAction<TeamData | null>>;
}

export default function TeamComparison({
    selectedTeam,
    selectedSeason,
    teams,
    comparisonTeam,
    setComparisonTeam,
    fetchComparisonTeam,
    comparisonLoading,
    teamData,
    comparisonTeamData,
    setComparisonTeamData
}: TeamComparisonProps) {
    // Only show comparison for current season and certain teams
    if ((selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') ||
        selectedTeam === 'Fortunas Wölfe' ||
        selectedTeam === 'DC Patron II') {
        return null;
    }

    return (
        <>
            {/* Team Comparison */}
            <div className="mt-4 flex items-center gap-3">
                <BarChart className="h-4 w-4 text-violet-500" />
                <span className="text-xs font-medium text-gray-700">Compare with:</span>
                <select
                    value={comparisonTeam}
                    onChange={(e) => {
                        setComparisonTeam(e.target.value);
                        if (e.target.value) {
                            fetchComparisonTeam(e.target.value, selectedSeason);
                        } else {
                            setComparisonTeamData(null);
                        }
                    }}
                    className="text-xs font-semibold bg-white border-2 border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer flex-1"
                >
                    <option value="">Select team...</option>
                    {teams.filter(t => t !== selectedTeam).map(team => (
                        <option key={team} value={team}>{team}</option>
                    ))}
                </select>
            </div>
            
            {/* Comparison Results */}
            {comparisonTeam && (
                <div className="mt-4 bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                    {comparisonLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <ClipLoader color="#8B5CF6" size={24} />
                        </div>
                    ) : comparisonTeamData ? (
                        <div>
                            {/* Header */}
                            <div className="bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-3 flex items-center justify-center gap-3">
                                <span className="text-sm font-bold text-white truncate max-w-[40%] text-right">{selectedTeam}</span>
                                <div className="flex-shrink-0 bg-white rounded-full px-3 py-1">
                                    <span className="text-xs font-black text-violet-600">VS</span>
                                </div>
                                <span className="text-sm font-bold text-white truncate max-w-[40%] text-left">{comparisonTeam}</span>
                            </div>
                            
                            {/* Stats Grid */}
                            <div className="p-3 space-y-3">
                                {/* Singles Comparison */}
                                {(() => {
                                    const yourSingles = (teamData?.players ?? []).reduce((sum, player) => sum + (player.singlesWon || 0), 0);
                                    const yourSinglesTotal = (teamData?.players ?? []).reduce((sum, player) => 
                                        sum + (player.singlesWon || 0) + (player.singlesLost || 0), 0);
                                    const theirSingles = (comparisonTeamData?.players ?? []).reduce((sum, player) => sum + (player.singlesWon || 0), 0);
                                    const theirSinglesTotal = (comparisonTeamData?.players ?? []).reduce((sum, player) => 
                                        sum + (player.singlesWon || 0) + (player.singlesLost || 0), 0);
                                    
                                    const yourRate = yourSinglesTotal > 0 ? (yourSingles / yourSinglesTotal * 100) : 0;
                                    const theirRate = theirSinglesTotal > 0 ? (theirSingles / theirSinglesTotal * 100) : 0;
                                    const yourLosses = yourSinglesTotal - yourSingles;
                                    const theirLosses = theirSinglesTotal - theirSingles;
                                    
                                    return (
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-blue-500" />
                                                    <span className="text-xs font-bold text-gray-700">Singles</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-semibold">
                                                    <span className={yourRate > theirRate ? 'text-emerald-600' : 'text-gray-600'}>
                                                        {yourRate.toFixed(0)}%
                                                    </span>
                                                    <span className={theirRate > yourRate ? 'text-rose-600' : 'text-gray-600'}>
                                                        {theirRate.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                                                    <div 
                                                        className={`flex items-center justify-center text-[10px] font-bold text-white ${yourRate > theirRate ? 'bg-emerald-500' : 'bg-blue-400'}`}
                                                        style={{ width: `${yourRate}%`, minWidth: yourRate > 0 ? '48px' : '0' }}
                                                    >
                                                        {yourSingles}-{yourLosses}
                                                    </div>
                                                </div>
                                                <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                                                    <div 
                                                        className={`flex items-center justify-center text-[10px] font-bold text-white ${theirRate > yourRate ? 'bg-rose-500' : 'bg-gray-400'}`}
                                                        style={{ width: `${theirRate}%`, minWidth: theirRate > 0 ? '48px' : '0' }}
                                                    >
                                                        {theirSingles}-{theirLosses}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            
                                {/* Doubles Comparison */}
                                {(() => {
                                    const yourDoubles = Math.round((teamData?.players ?? []).reduce((sum, player) => sum + (player.doublesWon || 0), 0) / 2);
                                    const yourDoublesTotal = Math.round((teamData?.players ?? []).reduce((sum, player) => 
                                        sum + (player.doublesWon || 0) + (player.doublesLost || 0), 0) / 2);
                                    const theirDoubles = Math.round((comparisonTeamData?.players ?? []).reduce((sum, player) => sum + (player.doublesWon || 0), 0) / 2);
                                    const theirDoublesTotal = Math.round((comparisonTeamData?.players ?? []).reduce((sum, player) => 
                                        sum + (player.doublesWon || 0) + (player.doublesLost || 0), 0) / 2);
                                    
                                    const yourRate = yourDoublesTotal > 0 ? (yourDoubles / yourDoublesTotal * 100) : 0;
                                    const theirRate = theirDoublesTotal > 0 ? (theirDoubles / theirDoublesTotal * 100) : 0;
                                    const yourLosses = yourDoublesTotal - yourDoubles;
                                    const theirLosses = theirDoublesTotal - theirDoubles;
                                    
                                    return (
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5 text-violet-500" />
                                                    <span className="text-xs font-bold text-gray-700">Doubles</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-semibold">
                                                    <span className={yourRate > theirRate ? 'text-emerald-600' : 'text-gray-600'}>
                                                        {yourRate.toFixed(0)}%
                                                    </span>
                                                    <span className={theirRate > yourRate ? 'text-rose-600' : 'text-gray-600'}>
                                                        {theirRate.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                                                    <div 
                                                        className={`flex items-center justify-center text-[10px] font-bold text-white ${yourRate > theirRate ? 'bg-emerald-500' : 'bg-violet-400'}`}
                                                        style={{ width: `${yourRate}%`, minWidth: yourRate > 0 ? '48px' : '0' }}
                                                    >
                                                        {yourDoubles}-{yourLosses}
                                                    </div>
                                                </div>
                                                <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                                                    <div 
                                                        className={`flex items-center justify-center text-[10px] font-bold text-white ${theirRate > yourRate ? 'bg-rose-500' : 'bg-gray-400'}`}
                                                        style={{ width: `${theirRate}%`, minWidth: theirRate > 0 ? '48px' : '0' }}
                                                    >
                                                        {theirDoubles}-{theirLosses}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-2">Failed to load comparison data</p>
                    )}
                </div>
            )}
        </>
    );
}
