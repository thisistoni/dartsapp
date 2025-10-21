import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Zap, Target, Trophy, Users, Clock } from 'lucide-react';

interface PlayerAvatarProps {
    name: string;
    imageUrl?: string;
    size?: 'sm' | 'md';
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, imageUrl, size = 'sm' }) => {
    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getColorFromName = (name: string) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
        ];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const initials = getInitials(name);
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name}
                className={`${sizeClasses} rounded-full object-cover flex-shrink-0`}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                }}
            />
        );
    }

    return (
        <div className={`${sizeClasses} rounded-full ${getColorFromName(name)} text-white font-bold flex items-center justify-center flex-shrink-0`}>
            {initials}
        </div>
    );
};

interface PlayerStat {
    name: string;
    team: string;
    average: number;
    singlesWon: number;
    singlesLost: number;
    singlesPercentage: number;
    doublesWon: number;
    doublesLost: number;
    doublesPercentage: number;
    combinedPercentage: number;
}

interface TeamStanding {
    team: string;
    played: number;
    [key: string]: any;
}

interface TeamAverage {
    average: number;
    singles: string;
    doubles: string;
}

interface LeagueStatisticsProps {
    playerStats: PlayerStat[];
    leagueStandings: TeamStanding[];
    teamAverages: Record<string, TeamAverage>;
    playerImages: { [key: string]: string };
    leagueTeamAverage: number;
    teamMedian: number;
    leaguePlayerAverage: number;
    playerMedian: number;
    validTeamAverages: number[];
    validPlayerAverages: number[];
    bestLegs: Array<{ player: string; team: string; checkout: number; count: number }>;
    weeklyAverageWins: Array<{ player: string; team: string; count: number }>;
    highestGamedayAverages: Array<{ player: string; team: string; average: number; matchday: number }>;
    winningStreaks: Array<{ player: string; team: string; streak: number }>;
    top180s: Array<{ player: string; team: string; count: number }>;
    topHighFinishes: Array<{ player: string; team: string; finish: number; count: number }>;
}

/**
 * League statistics component
 * Displays player leaderboards, team rankings, and league-wide statistics
 */
export default function LeagueStatistics({
    playerStats,
    leagueStandings,
    teamAverages,
    playerImages,
    leagueTeamAverage,
    teamMedian,
    leaguePlayerAverage,
    playerMedian,
    validTeamAverages,
    validPlayerAverages,
    bestLegs,
    weeklyAverageWins,
    highestGamedayAverages,
    winningStreaks,
    top180s,
    topHighFinishes
}: LeagueStatisticsProps) {
    // Helper function to normalize team names for comparison
    function normalizeTeamName(name: string) {
        return name.replace(/\s+/g, ' ').trim().toLowerCase();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-6 w-6 text-purple-500" />
                    League Statistics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Player Leaderboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Top 5 Average */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-purple-600" />
                                Top Average
                            </h3>
                            <div className="space-y-2">
                                {playerStats && playerStats.length > 0 ? (
                                    playerStats
                                        .filter(p => {
                                            const singlesGames = p.singlesWon + p.singlesLost;
                                            return p.average > 0 && singlesGames >= 3;
                                        })
                                        .sort((a, b) => b.average - a.average)
                                        .slice(0, 5)
                                        .map((player, idx) => {
                                        const singlesGames = player.singlesWon + player.singlesLost;
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <PlayerAvatar name={player.name} imageUrl={playerImages[player.name]} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 truncate" title={player.name}>{player.name}</div>
                                                        <div className="text-xs text-gray-500 truncate" title={player.team}>{player.team}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-2">
                                                    <div className="text-sm font-bold text-purple-600">{player.average.toFixed(2)}</div>
                                                    <div className="text-xs text-gray-500">{singlesGames} games</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-xs text-gray-500 p-2">No data available</div>
                                )}
                            </div>
                        </div>

                        {/* Top 5 Singles % */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-600" />
                                Top Singles %
                            </h3>
                            <div className="space-y-2">
                                {playerStats
                                    .filter(p => (p.singlesWon + p.singlesLost) >= 1)
                                    .sort((a, b) => {
                                        if (b.singlesPercentage !== a.singlesPercentage) {
                                            return b.singlesPercentage - a.singlesPercentage;
                                        }
                                        return (b.singlesWon + b.singlesLost) - (a.singlesWon + a.singlesLost);
                                    })
                                    .slice(0, 5)
                                    .map((player, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <PlayerAvatar name={player.name} imageUrl={playerImages[player.name]} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 truncate" title={player.name}>{player.name}</div>
                                                    <div className="text-xs text-gray-500 truncate" title={player.team}>{player.team}</div>
                                                </div>
                                            </div>
                                            <div className="text-right ml-2">
                                                <div className="text-sm font-bold text-blue-600">{player.singlesPercentage.toFixed(1)}%</div>
                                                <div className="text-xs text-gray-500">{player.singlesWon}-{player.singlesLost}</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Top 5 Doubles % */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4 text-green-600" />
                                Top Doubles %
                            </h3>
                            <div className="space-y-2">
                                {playerStats
                                    .filter(p => (p.doublesWon + p.doublesLost) >= 1)
                                    .sort((a, b) => {
                                        if (b.doublesPercentage !== a.doublesPercentage) {
                                            return b.doublesPercentage - a.doublesPercentage;
                                        }
                                        return (b.doublesWon + b.doublesLost) - (a.doublesWon + a.doublesLost);
                                    })
                                    .slice(0, 5)
                                    .map((player, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <PlayerAvatar name={player.name} imageUrl={playerImages[player.name]} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 truncate" title={player.name}>{player.name}</div>
                                                    <div className="text-xs text-gray-500 truncate" title={player.team}>{player.team}</div>
                                                </div>
                                            </div>
                                            <div className="text-right ml-2">
                                                <div className="text-sm font-bold text-green-600">{player.doublesPercentage.toFixed(1)}%</div>
                                                <div className="text-xs text-gray-500">{player.doublesWon}-{player.doublesLost}</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Top 5 Combined % */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-600" />
                                Top Combined %
                            </h3>
                            <div className="space-y-2">
                                {playerStats
                                    .filter(p => (p.singlesWon + p.singlesLost + p.doublesWon + p.doublesLost) >= 3)
                                    .sort((a, b) => {
                                        if (b.combinedPercentage !== a.combinedPercentage) {
                                            return b.combinedPercentage - a.combinedPercentage;
                                        }
                                        const aTotalGames = a.singlesWon + a.singlesLost + a.doublesWon + a.doublesLost;
                                        const bTotalGames = b.singlesWon + b.singlesLost + b.doublesWon + b.doublesLost;
                                        return bTotalGames - aTotalGames;
                                    })
                                    .slice(0, 5)
                                    .map((player, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <PlayerAvatar name={player.name} imageUrl={playerImages[player.name]} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 truncate" title={player.name}>{player.name}</div>
                                                    <div className="text-xs text-gray-500 truncate" title={player.team}>{player.team}</div>
                                                </div>
                                            </div>
                                            <div className="text-right ml-2">
                                                <div className="text-sm font-bold text-amber-600">{player.combinedPercentage.toFixed(1)}%</div>
                                                <div className="text-xs text-gray-500">{player.singlesWon + player.doublesWon}-{player.singlesLost + player.doublesLost}</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Best Legs & Weekly Average Section */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Best Legs */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-green-500" />
                                    Best Legs
                                </h3>
                                <div className="space-y-2">
                                    {bestLegs && bestLegs.length > 0 ? (
                                        bestLegs.map((leg, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <PlayerAvatar name={leg.player} imageUrl={playerImages[leg.player]} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900 truncate">{leg.player}</div>
                                                        <div className="text-gray-500 truncate">{leg.team}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end ml-2">
                                                    <span className="font-bold text-green-600">{leg.checkout}</span>
                                                    <span className="text-gray-400 text-[10px]">{leg.count}x</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <div className="text-center">
                                                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No data yet</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Highest Weekly Avg */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-purple-500" />
                                    Highest Weekly Avg
                                </h3>
                                <div className="space-y-2">
                                    {weeklyAverageWins && weeklyAverageWins.length > 0 ? (
                                        weeklyAverageWins.map((player, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <PlayerAvatar name={player.player} imageUrl={playerImages[player.player]} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900 truncate">{player.player}</div>
                                                        <div className="text-gray-500 truncate">{player.team}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end ml-2">
                                                    <span className="font-bold text-purple-600">{player.count}</span>
                                                    <span className="text-gray-400 text-[10px]">wins</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <div className="text-center">
                                                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No data yet</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Highest Matchday Average */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                    Highest Matchday Avg
                                </h3>
                                <div className="space-y-2">
                                    {highestGamedayAverages && highestGamedayAverages.length > 0 ? (
                                        highestGamedayAverages.map((player, idx) => (
                                            <div key={`${player.player}-${player.matchday}-${idx}`} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <PlayerAvatar name={player.player} imageUrl={playerImages[player.player]} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900 truncate">{player.player}</div>
                                                        <div className="text-gray-500 truncate">{player.team}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end ml-2">
                                                    <span className="font-bold text-blue-600">{player.average.toFixed(2)}</span>
                                                    <span className="text-gray-400 text-[10px]">MD{player.matchday}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <div className="text-center">
                                                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No data yet</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Winning Streaks */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-orange-500" />
                                    Winning Streak
                                </h3>
                                <div className="space-y-2">
                                    {winningStreaks && winningStreaks.length > 0 ? (
                                        winningStreaks.map((player, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <PlayerAvatar name={player.player} imageUrl={playerImages[player.player]} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900 truncate">{player.player}</div>
                                                        <div className="text-gray-500 truncate">{player.team}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end ml-2">
                                                    <span className="font-bold text-orange-600">{player.streak}</span>
                                                    <span className="text-gray-400 text-[10px]">wins</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <div className="text-center">
                                                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No data yet</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Player 180s */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-red-500" />
                                    Most 180s - Players
                                </h3>
                                <div className="space-y-2">
                                    {top180s && top180s.length > 0 ? (
                                        top180s.map((player, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <PlayerAvatar name={player.player} imageUrl={playerImages[player.player]} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900 truncate">{player.player}</div>
                                                        <div className="text-gray-500 truncate">{player.team}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end ml-2">
                                                    <span className="font-bold text-red-600">{player.count}</span>
                                                    <span className="text-gray-400 text-[10px]">180s</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <div className="text-center">
                                                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No data yet</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Player HiFi */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-blue-500" />
                                    High Finishes - Players
                                </h3>
                                <div className="space-y-2">
                                    {topHighFinishes && topHighFinishes.length > 0 ? (
                                        topHighFinishes.map((player, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                                                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <PlayerAvatar name={player.player} imageUrl={playerImages[player.player]} size="sm" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900 truncate">{player.player}</div>
                                                        <div className="text-gray-500 truncate">{player.team}</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end ml-2">
                                                    <span className="font-bold text-blue-600">{player.finish}</span>
                                                    <span className="text-gray-400 text-[10px]">{player.count}x</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <div className="text-center">
                                                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No data yet</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Team 180s */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-red-500" />
                                    Most 180s - Teams
                                </h3>
                                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <div className="text-center">
                                        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-500">Coming Soon</p>
                                        <p className="text-xs text-gray-400 mt-1">Data not yet available</p>
                                    </div>
                                </div>
                            </div>

                            {/* Team HiFi */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-blue-500" />
                                    High Finishes - Teams
                                </h3>
                                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <div className="text-center">
                                        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-500">Coming Soon</p>
                                        <p className="text-xs text-gray-400 mt-1">Data not yet available</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Rankings Section */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Team Rankings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Top 3 Singles % */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Target className="h-4 w-4 text-blue-600" />
                                    Top Singles %
                                </h3>
                                <div className="space-y-2">
                                    {(() => {
                                        const singlesRankings = leagueStandings
                                            .map((team: any) => {
                                                const stats = Object.entries(teamAverages).find(
                                                    ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                )?.[1];
                                                if (stats?.singles) {
                                                    const [wonVal, lostVal] = stats.singles.split('-').map(Number);
                                                    const won = wonVal;
                                                    let lost = lostVal;
                                                    let record = stats.singles;
                                                    
                                                    // Add forfeit loss for BSW Zwara Panier
                                                    if (normalizeTeamName(team.team) === normalizeTeamName('BSW Zwara Panier')) {
                                                        lost += 1;
                                                        record = `${won}-${lost}`;
                                                    }
                                                    
                                                    const total = won + lost;
                                                    const percentage = total > 0 ? (won / total) * 100 : 0;
                                                    return { team: team.team, percentage, record };
                                                }
                                                return null;
                                            })
                                            .filter(Boolean)
                                            .sort((a: any, b: any) => b.percentage - a.percentage)
                                            .slice(0, 3);

                                        return singlesRankings.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={item.team}>
                                                        {item.team}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-blue-600">{item.percentage.toFixed(1)}%</div>
                                                    <div className="text-xs text-gray-500">{item.record}</div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Top 3 Doubles % */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-green-600" />
                                    Top Doubles %
                                </h3>
                                <div className="space-y-2">
                                    {(() => {
                                        const doublesRankings = leagueStandings
                                            .map((team: any) => {
                                                const stats = Object.entries(teamAverages).find(
                                                    ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                )?.[1];
                                                if (stats?.doubles) {
                                                    const [won, lost] = stats.doubles.split('-').map(Number);
                                                    const total = won + lost;
                                                    const percentage = total > 0 ? (won / total) * 100 : 0;
                                                    return { team: team.team, percentage, record: stats.doubles };
                                                }
                                                return null;
                                            })
                                            .filter(Boolean)
                                            .sort((a: any, b: any) => b.percentage - a.percentage)
                                            .slice(0, 3);

                                        return doublesRankings.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={item.team}>
                                                        {item.team}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-green-600">{item.percentage.toFixed(1)}%</div>
                                                    <div className="text-xs text-gray-500">{item.record}</div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Top 3 Average */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-purple-600" />
                                    Top Average
                                </h3>
                                <div className="space-y-2">
                                    {(() => {
                                        const averageRankings = leagueStandings
                                            .map((team: any) => {
                                                const stats = Object.entries(teamAverages).find(
                                                    ([key]) => normalizeTeamName(key) === normalizeTeamName(team.team)
                                                )?.[1];
                                                if (stats?.average && stats.average > 0) {
                                                    return { team: team.team, average: stats.average };
                                                }
                                                return null;
                                            })
                                            .filter(Boolean)
                                            .sort((a: any, b: any) => b.average - a.average)
                                            .slice(0, 3);

                                        return averageRankings.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={item.team}>
                                                        {item.team}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-bold text-purple-600">
                                                    {item.average.toFixed(2)}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* League Statistics Section */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-blue-600" />
                            League Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {/* Team Average */}
                            <div className="text-center">
                                <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-center mb-3">
                                        <div className="bg-blue-100 rounded-full p-3">
                                            <Trophy className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-blue-600 mb-1">{leagueTeamAverage.toFixed(2)}</div>
                                    <div className="text-sm font-semibold text-gray-700 mb-1">Team Avg</div>
                                    <div className="text-xs text-gray-500">{validTeamAverages.length} teams</div>
                                </div>
                            </div>

                            {/* Team Median */}
                            <div className="text-center">
                                <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-center mb-3">
                                        <div className="bg-indigo-100 rounded-full p-3">
                                            <Trophy className="h-6 w-6 text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-indigo-600 mb-1">{teamMedian.toFixed(2)}</div>
                                    <div className="text-sm font-semibold text-gray-700 mb-1">Team Median</div>
                                    <div className="text-xs text-gray-500">Middle value</div>
                                </div>
                            </div>

                            {/* Player Average */}
                            <div className="text-center">
                                <div className="bg-white rounded-xl p-6 border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-center mb-3">
                                        <div className="bg-amber-100 rounded-full p-3">
                                            <Target className="h-6 w-6 text-amber-600" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-amber-600 mb-1">{leaguePlayerAverage.toFixed(2)}</div>
                                    <div className="text-sm font-semibold text-gray-700 mb-1">Player Avg</div>
                                    <div className="text-xs text-gray-500">{validPlayerAverages.length} players</div>
                                </div>
                            </div>

                            {/* Player Median */}
                            <div className="text-center">
                                <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-center mb-3">
                                        <div className="bg-orange-100 rounded-full p-3">
                                            <Target className="h-6 w-6 text-orange-600" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-orange-600 mb-1">{playerMedian.toFixed(2)}</div>
                                    <div className="text-sm font-semibold text-gray-700 mb-1">Player Median</div>
                                    <div className="text-xs text-gray-500">Middle value</div>
                                </div>
                            </div>

                            {/* Active Players */}
                            <div className="text-center">
                                <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-center mb-3">
                                        <div className="bg-green-100 rounded-full p-3">
                                            <Target className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-bold text-green-600 mb-1">{playerStats.length}</div>
                                    <div className="text-sm font-semibold text-gray-700 mb-1">Active Players</div>
                                    <div className="text-xs text-gray-500">With records</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
