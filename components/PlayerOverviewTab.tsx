import { User, Users } from 'lucide-react';

interface Player {
    playerName: string;
    adjustedAverage: number;
    singles?: string;
    doubles?: string;
    singlesWon?: number;
    singlesLost?: number;
    doublesWon?: number;
    doublesLost?: number;
    winRate?: number;
}

interface MatchAverages {
    matchday: number;
    opponent: string;
    playerAverages: Array<{ playerName: string; average: number }>;
}

interface MatchReport {
    opponent: string;
    lineup: string[];
    checkouts: Array<{ scores: string }>;
    details: {
        singles: Array<{
            homePlayer: string;
            awayPlayer: string;
            homeScore: number;
            awayScore: number;
        }>;
    };
}

interface OneEighty {
    playerName: string;
    count: number;
}

interface HighFinish {
    playerName: string;
    finishes: number[];
}

interface PlayerOverviewTabProps {
    selectedTeam: string;
    sortedPlayers: Player[];
    teamAverage: number | null;
    teamWinRate: number;
    matchAverages: MatchAverages[];
    matchReports: MatchReport[];
    oneEightys: OneEighty[];
    highFinishes: HighFinish[];
    playerImages: { [key: string]: string };
    getBestCheckouts: (playerName: string) => number[];
    getLowestThreeCheckouts: () => number[];
}

const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? 
        `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase() : 
        name.substring(0, 2).toUpperCase();
};

export default function PlayerOverviewTab({
    selectedTeam,
    sortedPlayers,
    teamAverage,
    teamWinRate,
    matchAverages,
    matchReports,
    oneEightys,
    highFinishes,
    playerImages,
    getBestCheckouts,
    getLowestThreeCheckouts
}: PlayerOverviewTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible">
            {sortedPlayers.map((player) => {
                const playerAverages = matchAverages
                    .flatMap(match => ({
                        average: match.playerAverages.find(avg => avg.playerName === player.playerName)?.average || 0,
                        matchday: match.matchday,
                        opponent: match.opponent
                    }))
                    .filter(data => data.average > 0);
                
                const bestPerformance = playerAverages.reduce((best, current) => 
                    current.average > best.average ? current : best,
                    playerAverages[0] || { average: 0, matchday: 0, opponent: '-' }
                );
                
                const difference = bestPerformance.average - player.adjustedAverage;
                const oneEightyCount = oneEightys.find(x => x.playerName === player.playerName)?.count ?? 0;
                const highFinishList = highFinishes.find(x => x.playerName === player.playerName)?.finishes ?? [];
                
                // Calculate win rate from singles and doubles
                const singlesWon = player.singlesWon ?? parseInt(player.singles?.split('-')[0] || '0');
                const singlesLost = player.singlesLost ?? parseInt(player.singles?.split('-')[1] || '0');
                const doublesWon = player.doublesWon ?? parseInt(player.doubles?.split('-')[0] || '0');
                const doublesLost = player.doublesLost ?? parseInt(player.doubles?.split('-')[1] || '0');
                const totalWins = singlesWon + doublesWon;
                const totalGames = singlesWon + singlesLost + doublesWon + doublesLost;
                const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
                                    
                return (
                    <div key={player.playerName} 
                        className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible border border-gray-100"
                    >
                        {/* Subtle top accent line */}
                        <div className={`h-1 w-full bg-gradient-to-r ${
                            player.adjustedAverage > (teamAverage || 0) 
                                ? 'from-teal-400/40 to-teal-500/40'
                                : 'from-slate-400/30 to-slate-500/30'
                        }`} />

                        <div className="p-5 overflow-visible">
                            {/* Header Section with minimalist design */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4 sm:gap-0">
                                {/* Player Info Section */}
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="h-12 w-12 rounded-full bg-violet-50 border-2 border-white overflow-hidden flex items-center justify-center flex-shrink-0">
                                        {selectedTeam === 'DC Patron' && playerImages[player.playerName] ? (
                                            <img 
                                                src={playerImages[player.playerName]} 
                                                alt={player.playerName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-violet-700">
                                                {getInitials(player.playerName)}
                                            </span>
                                        )}
                                    </div>
                                    {/* Name and Stats */}
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-semibold text-gray-800">{player.playerName}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-md border border-gray-100 whitespace-nowrap">
                                                    {player.adjustedAverage === 0 ? '-' : `${player.adjustedAverage.toFixed(2)} avg`}
                                                </span>
                                                {difference > 0 && (
                                                    <div className="group/peak relative">
                                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-md border border-violet-100 whitespace-nowrap">
                                                            Peak: {bestPerformance.average.toFixed(2)}
                                                        </span>

                                                        {/* Peak Performance Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/peak:block z-[100]">
                                                            <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                                {bestPerformance.opponent}
                                                                <br />
                                                                {(() => {
                                                                    const matchWithPeak = matchReports[bestPerformance.matchday - 1];
                                                                    const playerGame = matchWithPeak?.details.singles.find(game => 
                                                                        game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                                    );
                                                                    const opponentPlayer = playerGame?.homePlayer === player.playerName 
                                                                        ? playerGame.awayPlayer 
                                                                        : playerGame?.homePlayer;
                                                                    const playerWon = playerGame ? 
                                                                        (playerGame.homePlayer === player.playerName && playerGame.homeScore > playerGame.awayScore) ||
                                                                        (playerGame.awayPlayer === player.playerName && playerGame.awayScore > playerGame.homeScore)
                                                                        : false;

                                                                    return (
                                                                        <>
                                                                            vs {opponentPlayer}
                                                                            <div className="mt-1">
                                                                                <span className="text-slate-400 italic">MD{bestPerformance.matchday}</span>
                                                                                <span className={`ml-1 ${playerWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                    {playerWon ? 'W' : 'L'}
                                                                                </span>
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 w-0 h-0 mx-auto"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Achievement Badges */}
                                <div className="flex gap-1.5 ml-14 sm:ml-0">
                                    {oneEightyCount > 0 && (
                                        <div className="relative group/badge">
                                            <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-amber-600">180</span>
                                            </div>
                                            <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-amber-600 text-[10px] flex items-center justify-center border border-amber-200 font-medium">
                                                {oneEightyCount}
                                            </div>
                                        </div>
                                    )}
                                    {highFinishList.length > 0 && (() => {
                                        const highestFinish = Math.max(...highFinishList);
                                        const highestFinishCount = highFinishList.filter(f => f === highestFinish).length;
                                        
                                        return (
                                            <div className="relative group/badge">
                                                <div className="h-7 w-auto min-w-[1.75rem] px-1.5 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center group-hover/badge:bg-rose-100 transition-colors">
                                                    <span className="text-[10px] font-bold text-rose-600">{highestFinish}</span>
                                                </div>
                                                {highestFinishCount > 1 && (
                                                    <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-rose-600 text-[10px] flex items-center justify-center border border-rose-200 font-medium">
                                                        +{highestFinishCount - 1}
                                                    </div>
                                                )}

                                            {/* Hover tooltip for high finishes */}
                                            <div className="absolute right-0 top-full mt-2 scale-0 group-hover/badge:scale-100 transition-transform origin-top-right z-[100]">
                                                <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-2 whitespace-nowrap">
                                                    <div className="text-[11px] font-medium text-slate-500 mb-1.5">High Finishes</div>
                                                    <div className="flex gap-1.5">
                                                        {highFinishList.map((finish, idx) => (
                                                            <span 
                                                                key={idx}
                                                                className="px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 rounded border border-rose-100"
                                                            >
                                                                {finish}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Arrow */}
                                                <div className="absolute -top-1 right-3 w-2 h-2 bg-white border-t border-l border-gray-100 transform -rotate-45"></div>
                                            </div>
                                        </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            
                            {/* Elegant stats grid */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="relative rounded-lg bg-slate-50/50 p-3 border border-slate-100 group hover:border-blue-200">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-lg"></div>
                                    <div className="relative z-10">
                                        <div className="text-[11px] text-blue-600 font-medium mb-1">Singles</div>
                                        <div className="flex items-baseline gap-1">
                                            {(() => {
                                                const singlesWon = player.singlesWon ?? parseInt(player.singles?.split('-')[0] || '0');
                                                const singlesLost = player.singlesLost ?? parseInt(player.singles?.split('-')[1] || '0');
                                                return (
                                                    <>
                                                        <span className="text-xl font-semibold text-slate-700">
                                                            {singlesWon}
                                                        </span>
                                                        <span className="text-sm text-slate-400">
                                                            /{singlesWon + singlesLost}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <User className="absolute bottom-1 right-1 h-8 w-8 text-blue-200" />
                                </div>
                                <div className="relative rounded-lg bg-slate-50/50 p-3 border border-slate-100 group hover:border-violet-200">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent rounded-lg"></div>
                                    <div className="relative z-10">
                                        <div className="text-[11px] text-violet-600 font-medium mb-1">Doubles</div>
                                        <div className="flex items-baseline gap-1">
                                            {(() => {
                                                const doublesWon = player.doublesWon ?? parseInt(player.doubles?.split('-')[0] || '0');
                                                const doublesLost = player.doublesLost ?? parseInt(player.doubles?.split('-')[1] || '0');
                                                return (
                                                    <>
                                                        <span className="text-xl font-semibold text-slate-700">
                                                            {doublesWon}
                                                        </span>
                                                        <span className="text-sm text-slate-400">
                                                            /{doublesWon + doublesLost}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <Users className="absolute bottom-1 right-1 h-8 w-8 text-violet-200" />
                                </div>
                            </div>

                            {/* Refined win rate bar */}
                            <div className="mb-5">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-medium text-slate-500">Win Rate</span>
                                    <span className="text-xs font-semibold text-slate-700">{winRate}%</span>
                                </div>
                                <div className="h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                                        style={{ width: `${winRate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Elegant checkouts display */}
                            {getBestCheckouts(player.playerName).length > 0 && (
                                <div className="flex flex-row items-center justify-between overflow-visible">
                                    <div className="flex flex-wrap gap-1.5 max-w-[75%]">
                                        {getBestCheckouts(player.playerName).map((checkout, idx) => {
                                            const lowestThree = getLowestThreeCheckouts();
                                            let checkoutStyle = "";
                                            
                                            if (checkout === lowestThree[0]) {
                                                checkoutStyle = "bg-amber-50 text-amber-700 border-amber-200";
                                            } else if (checkout === lowestThree[1]) {
                                                checkoutStyle = "bg-gray-100 text-gray-700 border-gray-200";
                                            } else if (checkout === lowestThree[2]) {
                                                checkoutStyle = "bg-orange-50 text-orange-700 border-orange-200";
                                            } else if (checkout <= 24) {
                                                checkoutStyle = "bg-blue-50 text-blue-700 border-blue-100";
                                            } else {
                                                checkoutStyle = "bg-slate-50 text-slate-600 border-slate-200";
                                            }

                                            const matchesWithCheckout = matchReports.filter(match => 
                                                match.checkouts.some(c => 
                                                    c.scores.startsWith(player.playerName) && 
                                                    c.scores.split(': ')[1].split(', ').includes(checkout.toString())
                                                )
                                            );

                                            const checkoutOccurrences = getBestCheckouts(player.playerName)
                                                .filter(c => c === checkout)
                                                .length;
                                            const currentCheckoutIndex = getBestCheckouts(player.playerName)
                                                .slice(0, idx + 1)
                                                .filter(c => c === checkout)
                                                .length - 1;

                                            const matchWithCheckout = matchesWithCheckout[currentCheckoutIndex];

                                            return (
                                                <div key={idx} 
                                                    className="group/checkout relative"
                                                >
                                                    <div className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs font-medium rounded-md border ${checkoutStyle}`}>
                                                        {checkout}
                                                    </div>

                                                    {/* Tooltip */}
                                                    {matchWithCheckout && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/checkout:block z-[100]">
                                                            <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                                {matchWithCheckout.opponent}
                                                                <br />
                                                                {(() => {
                                                                    const playerGame = matchWithCheckout.details.singles.find(game => 
                                                                        game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                                    );
                                                                    const opponentPlayer = playerGame?.homePlayer === player.playerName 
                                                                        ? playerGame.awayPlayer 
                                                                        : playerGame?.homePlayer;
                                                                    return `vs ${opponentPlayer}`;
                                                                })()}
                                                                <div className="mt-1">
                                                                    <span className="text-slate-400 italic">MD{matchReports.indexOf(matchWithCheckout) + 1}</span>
                                                                    {(() => {
                                                                        const playerGame = matchWithCheckout.details.singles.find(game => 
                                                                            game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                                        );
                                                                        const playerWon = playerGame ? 
                                                                            (playerGame.homePlayer === player.playerName && playerGame.homeScore > playerGame.awayScore) ||
                                                                            (playerGame.awayPlayer === player.playerName && playerGame.awayScore > playerGame.homeScore)
                                                                            : false;

                                                                        return (
                                                                            <span className={`ml-1 ${playerWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                {playerWon ? 'W' : 'L'}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                            <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 w-0 h-0 mx-auto"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Form Guide Circles */}
                                    <div className="flex items-center gap-2 overflow-visible flex-shrink-0">
                                        {(() => {
                                            const filteredMatches = [...matchReports]
                                                .reverse()
                                                .filter(match => match.details.singles.some(game => 
                                                    game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                ))
                                                .slice(0, 5);

                                            return (
                                                <>
                                                    <span className="text-xs text-gray-500 italic">
                                                        L{filteredMatches.length < 5 ? filteredMatches.length : 5}
                                                    </span>
                                                    <div className="flex gap-1.5 overflow-visible">
                                                        {filteredMatches.map((match, idx) => {
                                                            const playerGame = match.details.singles.find(game => 
                                                                game.homePlayer === player.playerName || game.awayPlayer === player.playerName
                                                            );
                                                            const playerWon = playerGame ? 
                                                                (playerGame.homePlayer === player.playerName && playerGame.homeScore > playerGame.awayScore) ||
                                                                (playerGame.awayPlayer === player.playerName && playerGame.awayScore > playerGame.homeScore)
                                                                : false;

                                                            const opponentPlayer = playerGame?.homePlayer === player.playerName 
                                                                ? playerGame.awayPlayer 
                                                                : playerGame?.homePlayer;

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="group/circle relative"
                                                                >
                                                                    <div
                                                                        className={`h-3 w-3 rounded-full ${
                                                                            playerWon 
                                                                                ? 'bg-emerald-400'
                                                                                : 'bg-rose-400'
                                                                        }`}
                                                                    />
                                                                    
                                                                    {/* Tooltip */}
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/circle:block z-[100]">
                                                                        <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                                            {match.opponent}
                                                                            <br />
                                                                            vs {opponentPlayer}
                                                                            <div className="mt-1 text-slate-400 italic">
                                                                                MD{matchReports.indexOf(match) + 1}
                                                                            </div>
                                                                        </div>
                                                                        <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 w-0 h-0 mx-auto"></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
