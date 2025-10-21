import React from 'react';
import PlayerAvatar from './PlayerAvatar';

interface GameRowProps {
    isSinglesMatch: boolean;
    isHomeTeam: boolean;
    isWin: boolean;
    isWalkover: boolean;
    isFirstAppearance?: boolean;
    player: string;
    playerNames: string[];
    opponentName: string;
    opponentNames: string[];
    playerScore: number;
    opponentScore: number;
    matchdayAvg?: number;
    avgDiff: number;
    opponentMatchdayAvg?: number;
    opponentAvgDiff?: number;
    playerCheckouts: string[];
    opponentCheckouts: string[];
    playerImages: { [key: string]: string };
    dcPatronPlayersWithAvatars: string[];
}

export default function GameRow({
    isSinglesMatch,
    isHomeTeam,
    isWin,
    isWalkover,
    isFirstAppearance,
    player,
    playerNames,
    opponentName,
    opponentNames,
    playerScore,
    opponentScore,
    matchdayAvg,
    avgDiff,
    opponentMatchdayAvg,
    opponentAvgDiff,
    playerCheckouts,
    opponentCheckouts,
    playerImages,
    dcPatronPlayersWithAvatars
}: GameRowProps) {
    return (
        <div className={`rounded-lg p-2 sm:p-3 border ${
            isWin ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/30 border-gray-200'
        }`}>
            <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Your Player (Left Side) */}
                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                    {isSinglesMatch ? (
                        dcPatronPlayersWithAvatars.includes(player) && (
                            <div className="hidden sm:block">
                                <PlayerAvatar name={player} imageUrl={playerImages[player]} size="md" />
                            </div>
                        )
                    ) : (
                        (dcPatronPlayersWithAvatars.includes(playerNames[0]) || dcPatronPlayersWithAvatars.includes(playerNames[1])) && (
                            <div className="hidden sm:flex -space-x-2">
                                <div className="h-10 w-10 rounded-full bg-blue-50 border-2 border-white overflow-hidden flex items-center justify-center relative z-10">
                                    {playerImages[playerNames[0]] ? (
                                        <img src={playerImages[playerNames[0]]} alt={playerNames[0]} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-semibold text-blue-600">{playerNames[0]?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="h-10 w-10 rounded-full bg-purple-50 border-2 border-white overflow-hidden flex items-center justify-center">
                                    {playerImages[playerNames[1]] ? (
                                        <img src={playerImages[playerNames[1]]} alt={playerNames[1]} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-semibold text-purple-600">{playerNames[1]?.charAt(0)}</span>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                    <div className="flex-1 min-w-0">
                        {isSinglesMatch ? (
                            <>
                                <div className="font-bold text-xs sm:text-sm text-gray-900 truncate">{player}</div>
                                {matchdayAvg && !isWalkover && (
                                    <div className="text-xs sm:text-sm text-gray-700 font-bold truncate">
                                        <span className="text-purple-600">{matchdayAvg.toFixed(2)}</span>
                                        {isFirstAppearance ? (
                                            <span className="ml-1 text-blue-500">-</span>
                                        ) : avgDiff !== 0 && (
                                            <span className={`ml-1 ${avgDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {avgDiff > 0 ? '▲' : '▼'}
                                            </span>
                                        )}
                                        {playerCheckouts.length > 0 && (
                                            <span className="text-blue-600 ml-1">• {playerCheckouts.join(', ')}</span>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="font-bold text-xs sm:text-sm text-gray-900">
                                <div className="truncate">{playerNames[0]}</div>
                                <div className="truncate">{playerNames[1]}</div>
                            </div>
                        )}
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${isWin ? 'text-green-600' : 'text-gray-400'}`}>
                        {playerScore}
                    </div>
                </div>

                {/* Separator */}
                <div className="flex-shrink-0 text-gray-300 font-bold text-base sm:text-xl">-</div>

                {/* Opponent (Right Side) */}
                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                    <div className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${!isWin ? 'text-red-600' : 'text-gray-400'}`}>
                        {opponentScore}
                    </div>
                    <div className="flex-1 min-w-0">
                        {isSinglesMatch ? (
                            <>
                                <div className="font-bold text-xs sm:text-sm text-gray-900 truncate text-right">{opponentName}</div>
                                {!isWalkover && (opponentMatchdayAvg || opponentCheckouts.length > 0) && (
                                    <div className="text-xs sm:text-sm text-gray-700 truncate text-right font-bold">
                                        {opponentMatchdayAvg && (
                                            <>
                                                <span className="text-purple-600">{opponentMatchdayAvg.toFixed(2)}</span>
                                                {opponentAvgDiff !== undefined && opponentAvgDiff !== 0 && (
                                                    <span className={`ml-1 ${opponentAvgDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {opponentAvgDiff > 0 ? '▲' : '▼'}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {opponentCheckouts.length > 0 && (
                                            <span className="text-blue-600 ml-1">• {opponentCheckouts.join(', ')}</span>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="font-bold text-xs sm:text-sm text-gray-900 text-right">
                                <div className="truncate">{opponentNames[0]}</div>
                                <div className="truncate">{opponentNames[1]}</div>
                            </div>
                        )}
                    </div>
                    {isSinglesMatch ? (
                        dcPatronPlayersWithAvatars.includes(opponentName) && (
                            <div className="hidden sm:block">
                                <PlayerAvatar name={opponentName} imageUrl={playerImages[opponentName]} size="md" />
                            </div>
                        )
                    ) : (
                        (dcPatronPlayersWithAvatars.includes(opponentNames[0]) || dcPatronPlayersWithAvatars.includes(opponentNames[1])) && (
                            <div className="hidden sm:flex -space-x-2">
                                <div className="h-10 w-10 rounded-full bg-blue-50 border-2 border-white overflow-hidden flex items-center justify-center relative z-10">
                                    {playerImages[opponentNames[0]] ? (
                                        <img src={playerImages[opponentNames[0]]} alt={opponentNames[0]} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-semibold text-blue-600">{opponentNames[0]?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="h-10 w-10 rounded-full bg-purple-50 border-2 border-white overflow-hidden flex items-center justify-center">
                                    {playerImages[opponentNames[1]] ? (
                                        <img src={playerImages[opponentNames[1]]} alt={opponentNames[1]} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-semibold text-purple-600">{opponentNames[1]?.charAt(0)}</span>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Walkover indicator */}
                {isWalkover && (
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded italic flex-shrink-0">
                        w/o
                    </span>
                )}
            </div>
        </div>
    );
}
