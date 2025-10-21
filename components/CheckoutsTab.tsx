import { Target, Trophy, BarChart as BarChartIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface MatchReport {
    lineup: string[];
    checkouts: Array<{ scores: string }>;
    seasonPrefix?: string;
    originalMatchday?: number;
    details: any;
    isHomeMatch?: boolean;
}

interface CheckoutsTabProps {
    matchReports: MatchReport[];
    checkoutPlayerFilter: string;
    setCheckoutPlayerFilter: (value: string) => void;
}

export default function CheckoutsTab({
    matchReports,
    checkoutPlayerFilter,
    setCheckoutPlayerFilter
}: CheckoutsTabProps) {
    return (
        <div className="space-y-6">
            {/* Header with Player Filter */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Checkout Statistics</h2>
                <select
                    value={checkoutPlayerFilter}
                    onChange={(e) => setCheckoutPlayerFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="all">All Players</option>
                    {(() => {
                        // Get unique HOME TEAM SINGLES players only
                        const players = new Set<string>();
                        matchReports.forEach(report => {
                            const isHomeTeam = report.isHomeMatch !== undefined 
                                ? report.isHomeMatch 
                                : report.details.singles[0]?.homePlayer === report.lineup[0];
                            
                            // Get singles players from home team
                            report.details.singles.forEach((single: any) => {
                                const playerName = isHomeTeam ? single.homePlayer : single.awayPlayer;
                                if (playerName) players.add(playerName);
                            });
                        });
                        return Array.from(players).sort().map(player => (
                            <option key={player} value={player}>{player}</option>
                        ));
                    })()}
                </select>
            </div>

            {/* Grid Layout: Chart + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Checkout Chart - 2/3 on desktop */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-green-400/40 to-green-500/40" />
                    <div className="p-5">
                        <div className="h-[300px] sm:h-[400px] -ml-2 sm:ml-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                data={(() => {
                                    // Process checkout data - HOME TEAM ONLY
                                    const checkoutData: { [key: number]: { count: number; details: Array<{ player: string; matchday: string }> } } = {};
                                    
                                    matchReports.forEach((report, index) => {
                                        const matchdayLabel = report.seasonPrefix 
                                            ? `${report.seasonPrefix}-${report.originalMatchday}` 
                                            : `MD${index + 1}`;
                                        
                                        report.checkouts.forEach(checkout => {
                                            const playerName = checkout.scores.split(':')[0].trim();
                                            const checkoutsStr = checkout.scores.split(':')[1];
                                            
                                            // Only include HOME TEAM players (from lineup)
                                            if (!report.lineup.includes(playerName)) {
                                                return;
                                            }
                                            
                                            // Skip if filtering by player and doesn't match
                                            if (checkoutPlayerFilter !== 'all' && playerName !== checkoutPlayerFilter) {
                                                return;
                                            }
                                            
                                            if (checkoutsStr && checkoutsStr !== '-') {
                                                const checkouts = checkoutsStr.split(',').map(c => parseInt(c.trim())).filter(n => !isNaN(n));
                                                checkouts.forEach(checkoutValue => {
                                                    if (!checkoutData[checkoutValue]) {
                                                        checkoutData[checkoutValue] = { count: 0, details: [] };
                                                    }
                                                    checkoutData[checkoutValue].count += 1;
                                                    checkoutData[checkoutValue].details.push({
                                                        player: playerName,
                                                        matchday: matchdayLabel
                                                    });
                                                });
                                            }
                                        });
                                    });
                                    
                                    // Convert to array and sort by checkout value
                                    return Object.entries(checkoutData)
                                        .map(([checkout, data]) => ({
                                            checkout: parseInt(checkout),
                                            count: data.count,
                                            details: data.details
                                        }))
                                        .sort((a, b) => a.checkout - b.checkout);
                                })()}
                                margin={{ top: 10, right: 10, bottom: 20, left: -20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="checkout" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200 max-w-xs">
                                                    <p className="text-sm font-bold text-gray-900 mb-2">
                                                        Checkout: {data.checkout}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mb-2">
                                                        Total Count: {data.count}
                                                    </p>
                                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                                        <p className="text-xs font-semibold text-gray-700 mb-1">Details:</p>
                                                        <div className="max-h-32 overflow-y-auto space-y-1">
                                                            {data.details.map((detail: any, idx: number) => (
                                                                <div key={idx} className="text-xs text-gray-600">
                                                                    • {detail.player} ({detail.matchday})
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="count" 
                                    fill="#22c55e" 
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Stats Card - 1/3 on desktop */}
                <div className="lg:col-span-1 space-y-4">
                    {(() => {
                        // Calculate checkout statistics for ALL players to get rankings
                        const playerCheckoutsMap: { [playerName: string]: number[] } = {};
                        
                        matchReports.forEach(report => {
                            report.checkouts.forEach(checkout => {
                                const playerName = checkout.scores.split(':')[0].trim();
                                const checkoutsStr = checkout.scores.split(':')[1];
                                
                                // Only include HOME TEAM players
                                if (!report.lineup.includes(playerName)) {
                                    return;
                                }
                                
                                if (checkoutsStr && checkoutsStr !== '-') {
                                    const checkouts = checkoutsStr.split(',').map(c => parseInt(c.trim())).filter(n => !isNaN(n));
                                    if (!playerCheckoutsMap[playerName]) {
                                        playerCheckoutsMap[playerName] = [];
                                    }
                                    playerCheckoutsMap[playerName].push(...checkouts);
                                }
                            });
                        });
                        
                        // Calculate median for each player and rank them (lower = better, but exclude 0)
                        const playerMedians = Object.entries(playerCheckoutsMap)
                            .map(([playerName, checkouts]) => {
                                const sorted = [...checkouts].sort((a, b) => a - b);
                                const median = sorted.length > 0
                                    ? sorted.length % 2 === 0
                                        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                                        : sorted[Math.floor(sorted.length / 2)]
                                    : 0;
                                return { playerName, median, checkouts };
                            })
                            .filter(p => p.checkouts.length > 0 && p.median > 0) // Exclude players with no checkouts or 0 median
                            .sort((a, b) => a.median - b.median); // Lower median = better rank
                        
                        // Get current player's data
                        const allCheckouts: number[] = [];
                        
                        matchReports.forEach(report => {
                            report.checkouts.forEach(checkout => {
                                const playerName = checkout.scores.split(':')[0].trim();
                                const checkoutsStr = checkout.scores.split(':')[1];
                                
                                // Only include HOME TEAM players
                                if (!report.lineup.includes(playerName)) {
                                    return;
                                }
                                
                                // Skip if filtering by player and doesn't match
                                if (checkoutPlayerFilter !== 'all' && playerName !== checkoutPlayerFilter) {
                                    return;
                                }
                                
                                if (checkoutsStr && checkoutsStr !== '-') {
                                    const checkouts = checkoutsStr.split(',').map(c => parseInt(c.trim())).filter(n => !isNaN(n));
                                    allCheckouts.push(...checkouts);
                                }
                            });
                        });
                        
                        // Calculate statistics
                        const totalCheckouts = allCheckouts.length;
                        const avgCheckout = totalCheckouts > 0 
                            ? (allCheckouts.reduce((a, b) => a + b, 0) / totalCheckouts).toFixed(1)
                            : 0;
                        
                        const sortedCheckouts = [...allCheckouts].sort((a, b) => a - b);
                        const median = totalCheckouts > 0
                            ? sortedCheckouts.length % 2 === 0
                                ? ((sortedCheckouts[sortedCheckouts.length / 2 - 1] + sortedCheckouts[sortedCheckouts.length / 2]) / 2).toFixed(1)
                                : sortedCheckouts[Math.floor(sortedCheckouts.length / 2)]
                            : 0;
                        
                        // Find rank (only if specific player is selected)
                        const playerRank = checkoutPlayerFilter !== 'all' 
                            ? playerMedians.findIndex(p => p.playerName === checkoutPlayerFilter) + 1
                            : null;
                        
                        const countAbove40 = allCheckouts.filter(c => c > 40).length;
                        const count30to40 = allCheckouts.filter(c => c >= 30 && c <= 40).length;
                        const countBelow30 = allCheckouts.filter(c => c < 30).length;
                        
                        return (
                            <>
                                {/* Overall Stats Card */}
                                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                    <div className="h-1 w-full bg-gradient-to-r from-blue-400/40 to-blue-500/40" />
                                    <div className="p-4">
                                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <Target className="h-4 w-4 text-blue-500" />
                                            Overall Statistics
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">Total Checkouts</span>
                                                <span className="text-sm font-bold text-gray-900">{totalCheckouts}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">Average</span>
                                                <span className="text-sm font-bold text-green-600">{avgCheckout}</span>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-gray-600">Median</span>
                                                    <span className="text-sm font-bold text-blue-600">{median}</span>
                                                </div>
                                                {playerRank && (
                                                    <div className="mt-1 text-center">
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                            #{playerRank} in Team
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Leaderboard Card - Only show when "All Players" is selected */}
                                {checkoutPlayerFilter === 'all' && playerMedians.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                        <div className="h-1 w-full bg-gradient-to-r from-indigo-400/40 to-indigo-500/40" />
                                        <div className="p-4">
                                            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <Trophy className="h-4 w-4 text-indigo-500" />
                                                Median Leaderboard
                                            </h3>
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {playerMedians.map((player, index) => (
                                                    <div key={player.playerName} className={`flex items-center justify-between p-2 rounded-lg ${
                                                        index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                                                        index === 1 ? 'bg-gray-50 border border-gray-200' :
                                                        index === 2 ? 'bg-orange-50 border border-orange-200' :
                                                        'bg-gray-50/50'
                                                    }`}>
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span className={`text-xs font-bold flex-shrink-0 w-6 ${
                                                                index === 0 ? 'text-yellow-600' :
                                                                index === 1 ? 'text-gray-600' :
                                                                index === 2 ? 'text-orange-600' :
                                                                'text-gray-500'
                                                            }`}>
                                                                #{index + 1}
                                                            </span>
                                                            <span className="text-xs font-medium text-gray-900 truncate">
                                                                {player.playerName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-blue-600">
                                                                {player.median.toFixed(1)}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                ({player.checkouts.length})
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Distribution Card */}
                                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                    <div className="h-1 w-full bg-gradient-to-r from-amber-400/40 to-amber-500/40" />
                                    <div className="p-4">
                                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <BarChartIcon className="h-4 w-4 text-amber-500" />
                                            Distribution
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">&gt; 40</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-green-600">{countAbove40}</span>
                                                    <span className="text-xs text-gray-500">
                                                        ({totalCheckouts > 0 ? ((countAbove40 / totalCheckouts) * 100).toFixed(0) : 0}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">30-40</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-amber-600">{count30to40}</span>
                                                    <span className="text-xs text-gray-500">
                                                        ({totalCheckouts > 0 ? ((count30to40 / totalCheckouts) * 100).toFixed(0) : 0}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">&lt; 30</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-blue-600">{countBelow30}</span>
                                                    <span className="text-xs text-gray-500">
                                                        ({totalCheckouts > 0 ? ((countBelow30 / totalCheckouts) * 100).toFixed(0) : 0}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
