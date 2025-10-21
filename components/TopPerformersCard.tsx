import React from 'react';
import { Trophy } from 'lucide-react';
import { TeamData, OneEighty, HighFinish, Player } from '@/lib/types';

interface TopPerformersCardProps {
    selectedTeam: string;
    selectedSeason: string;
    teamData: TeamData | null;
    playerImages: { [key: string]: string };
    oneEightys: OneEighty[];
    highFinishes: HighFinish[];
}

const medalColors: { [key: number]: string } = {
    0: 'from-amber-400/40 to-amber-500/40',
    1: 'from-slate-400/40 to-slate-500/40',
    2: 'from-orange-400/40 to-orange-500/40'
};

const getInitials = (name: string): string => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    return parts.length >= 2 
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

export default function TopPerformersCard({
    selectedTeam,
    selectedSeason,
    teamData,
    playerImages,
    oneEightys,
    highFinishes
}: TopPerformersCardProps) {
    // Hide for old seasons and certain teams
    if ((selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') ||
        selectedTeam === 'Fortunas Wölfe' ||
        selectedTeam === 'DC Patron II') {
        return null;
    }

    return (
        <div className="mb-8 bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-amber-400/40 to-amber-500/40" />
            <div className="p-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-amber-500" />
                    </div>
                    <span className="text-base font-medium text-gray-900">Top Performers</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {teamData && teamData.players
                        .filter((player: Player) => player && player.playerName) // Filter valid players
                        .slice(0, 3)
                        .map((player: Player, index: number) => (
                        <div key={player.playerName} 
                            className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                        >
                            <div className={`h-1.5 w-full bg-gradient-to-r ${medalColors[index]}`} />
                            <div className="p-5">
                                <div className="flex items-center gap-3">
                                    {/* Player Avatar */}
                                    <div className="relative">
                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-50 to-blue-50 border-3 border-white shadow-md overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {selectedTeam === 'DC Patron' && playerImages[player.playerName] ? (
                                                <img 
                                                    src={playerImages[player.playerName]} 
                                                    alt={player.playerName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-2xl font-bold text-violet-700">
                                                    {getInitials(player.playerName)}
                                                </span>
                                            )}
                                        </div>
                                        {/* Medal Badge on Avatar */}
                                        <div className={`absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${
                                            index === 0 
                                                ? 'bg-amber-400 text-white'
                                                : index === 1
                                                    ? 'bg-slate-400 text-white'
                                                    : 'bg-orange-400 text-white'
                                        }`}>
                                            <span className="text-xs font-bold">{index + 1}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Player Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{player.playerName}</h3>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            <span className="px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 rounded-md border border-violet-100">
                                                {!player.adjustedAverage || player.adjustedAverage === 0 ? '-' : `${player.adjustedAverage.toFixed(2)}`}
                                            </span>
                                            {player.singles && player.singles !== '0-0' && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                                                    {player.singles}
                                                </span>
                                            )}
                                            {(() => {
                                                const player180 = oneEightys.find(x => x.playerName === player.playerName);
                                                const playerHiFi = highFinishes.find(x => x.playerName === player.playerName);
                                                const hifiList = playerHiFi?.finishes && playerHiFi.finishes.length > 0 
                                                    ? playerHiFi.finishes.join(', ')
                                                    : null;
                                                
                                                return (
                                                    <>
                                                        {player180 && player180.count > 0 && (
                                                            <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-50 text-yellow-700 rounded-md border border-yellow-100">
                                                                {player180.count}x180
                                                            </span>
                                                        )}
                                                        {hifiList && (
                                                            <span className="px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded-md border border-red-100">
                                                                {hifiList}
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
