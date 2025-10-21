import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, ArrowUp } from 'lucide-react';

interface TeamStanding {
    team: string;
    position: number;
    played: number;
    points: number;
    goalDiff: number;
    average: number;
}

interface TeamAverageStat {
    average: number;
    singles: string;
    doubles: string;
}

interface LeagueTableProps {
    leagueStandings: TeamStanding[];
    teamAverages: Record<string, TeamAverageStat>;
    leagueTeamAverage: number;
    onTeamSelect: (team: string) => void;
    calculateForfeitLosses: (won: number, lost: number, played: number) => number;
}

/**
 * League standings table component
 * Displays team rankings with points, goal difference, singles/doubles records, and averages
 */
export default function LeagueTable({ 
    leagueStandings, 
    teamAverages, 
    leagueTeamAverage, 
    onTeamSelect,
    calculateForfeitLosses 
}: LeagueTableProps) {
    
    // Helper function to normalize team names for comparison
    function normalizeTeamName(name: string) {
        return name.replace(/\s+/g, ' ').trim().toLowerCase();
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        League Standings
                    </CardTitle>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                        <span className="text-xs font-medium text-gray-600">League Avg:</span>
                        <span className="text-sm font-bold text-blue-600">{leagueTeamAverage.toFixed(2)}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Pos</th>
                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">Team</th>
                                <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">P</th>
                                <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Pts</th>
                                <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">+/-</th>
                                <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Singles</th>
                                <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Doubles</th>
                                <th className="text-center py-3 px-2 text-xs sm:text-sm font-semibold text-gray-600">Avg</th>
                            </tr>
                        </thead>
                        <tbody>
                        {leagueStandings.map((team) => {
                                let rowBg = '';
                                
                                if (team.position === 1) {
                                    rowBg = 'bg-green-50/50';
                                } else if (team.position === 2) {
                                    rowBg = 'bg-blue-50/50';
                                }
                                
                                return (
                                    <tr key={team.position} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${rowBg}`}>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-1">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs sm:text-sm font-bold ${
                                                    team.position === 1
                                                        ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                                                        : team.position === 2
                                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {team.position}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 sm:px-4">
                                            <button
                                                onClick={() => onTeamSelect(team.team)}
                                                className="group flex items-center gap-1 sm:gap-2 font-medium text-gray-900 hover:text-blue-600 cursor-pointer text-left transition-all w-full"
                                            >
                                                <span className="group-hover:translate-x-1 transition-transform text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" title={team.team}>
                                                    {team.team}
                                                </span>
                                                <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 rotate-90 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 flex-shrink-0" />
                                            </button>
                                        </td>
                                        <td className="py-3 px-2 text-center text-gray-600 text-xs sm:text-sm">{team.played}</td>
                                        <td className="py-3 px-2 text-center font-bold text-gray-900 text-xs sm:text-sm">{team.points}</td>
                                        <td className={`py-3 px-2 text-center font-medium text-xs sm:text-sm ${
                                            team.goalDiff > 0 ? 'text-green-600' : team.goalDiff < 0 ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                            {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                                        </td>
                                        <td className="py-3 px-2 text-center text-gray-700 font-medium text-xs sm:text-sm">
                                        {(() => {
                                            const stats = Object.entries(teamAverages).find(
                                                ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                            )?.[1];
                                            
                                            if (!stats?.singles) return '-';
                                            
                                            const [won, lost] = stats.singles.split('-').map(Number);
                                            const forfeitLosses = calculateForfeitLosses(won, lost, team.played);
                                            
                                            if (forfeitLosses > 0) {
                                                const adjustedRecord = `${won}-${lost + forfeitLosses}`;
                                                return (
                                                    <span className="relative group cursor-help">
                                                        {adjustedRecord}
                                                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            +{forfeitLosses} forfeit loss{forfeitLosses > 1 ? 'es' : ''}
                                                        </span>
                                                    </span>
                                                );
                                            }
                                            
                                            return stats.singles;
                                        })()}
                                        </td>
                                        <td className="py-3 px-2 text-center text-gray-700 font-medium text-xs sm:text-sm">
                                        {(() => {
                                            const stats = Object.entries(teamAverages).find(
                                                ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                            )?.[1];
                                            
                                            if (!stats?.doubles) return '-';
                                            
                                            const [won, lost] = stats.doubles.split('-').map(Number);
                                            const forfeitLosses = calculateForfeitLosses(won, lost, team.played);
                                            
                                            if (forfeitLosses > 0) {
                                                const adjustedRecord = `${won}-${lost + forfeitLosses}`;
                                                return (
                                                    <span className="relative group cursor-help">
                                                        {adjustedRecord}
                                                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            +{forfeitLosses} forfeit loss{forfeitLosses > 1 ? 'es' : ''}
                                                        </span>
                                                    </span>
                                                );
                                            }
                                            
                                            return stats.doubles;
                                        })()}
                                        </td>
                                        <td className="py-3 px-2 text-center text-blue-600 font-medium text-xs sm:text-sm">
                                        {(() => {
                                            const stats = Object.entries(teamAverages).find(
                                                ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                            )?.[1];
                                            return stats?.average && !isNaN(stats.average) ? stats.average.toFixed(2) : '-';
                                        })()}
                                        
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
