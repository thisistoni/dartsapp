interface Player {
    playerName: string;
}

interface TeamData {
    players: Player[];
}

interface PairMatch {
    matchday: number | string;
    opponent: string;
    isWin: boolean;
}

interface PairStats {
    [key: string]: {
        wins: number;
        losses: number;
        winRate: number;
        matches: PairMatch[];
    };
}

interface PairsTabProps {
    selectedPlayer: string;
    setSelectedPlayer: (value: string) => void;
    selectedTeam: string;
    selectedSeason: string;
    teamData: TeamData | null;
    pairStats: PairStats;
    playerImages: { [key: string]: string };
}

const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? 
        `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase() : 
        name.substring(0, 2).toUpperCase();
};

export default function PairsTab({
    selectedPlayer,
    setSelectedPlayer,
    selectedTeam,
    selectedSeason,
    teamData,
    pairStats,
    playerImages
}: PairsTabProps) {
    return (
        <div className="space-y-6">
            {/* Header with Filter */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Doubles Partnerships</h2>
                <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="team">All Pairs</option>
                    {selectedTeam === 'DC Patron' && selectedSeason === 'all' && (
                        <option value="active-players">Active Players</option>
                    )}
                    {teamData?.players.map((player) => (
                        <option key={player.playerName} value={player.playerName}>
                            {player.playerName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Partnerships Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(pairStats)
                    .filter(([pair]) => {
                        if (selectedPlayer === "team") return true;
                        if (selectedPlayer === "active-players") {
                            const activePlayers = [
                                'Marko Cvejic',
                                'Luca Schuckert',
                                'Muhamet Mahmutaj',
                                'Markus Hafner',
                                'Christoph Hafner',
                                'Dejan Stojadinovic'
                            ];
                            const players = pair.split(' & ');
                            return players.every(player => activePlayers.includes(player));
                        }
                        return pair.includes(selectedPlayer);
                    })
                    .sort(([, a], [, b]) => {
                        const aHasEnoughMatches = (a.wins + a.losses) >= 3;
                        const bHasEnoughMatches = (b.wins + b.losses) >= 3;
                        
                        // If one has enough matches and the other doesn't, prioritize the one with enough
                        if (aHasEnoughMatches !== bHasEnoughMatches) {
                            return aHasEnoughMatches ? -1 : 1;
                        }
                        
                        // If both have enough matches or both don't, sort by win rate
                        return b.winRate - a.winRate;
                    })
                    .map(([pair, stats]) => {
                        const totalMatches = stats.wins + stats.losses;
                        const hasEnoughMatches = totalMatches >= 3;

                        // Add visual distinction for pairs with fewer than 3 matches
                        const cardStyle = hasEnoughMatches 
                            ? "border-gray-100" 
                            : "border-gray-100 opacity-75";

                        return (
                            <div key={pair} 
                                className={`group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible border ${cardStyle}`}
                            >
                                {/* Accent line based on win rate and matches played */}
                                <div className={`h-1 w-full bg-gradient-to-r ${
                                    totalMatches < 3 
                                        ? 'from-blue-400/40 to-blue-500/40'
                                        : stats.winRate > 50
                                            ? 'from-emerald-400/40 to-emerald-500/40'
                                            : stats.winRate === 50
                                                ? 'from-amber-400/40 to-amber-500/40'
                                                : 'from-rose-400/40 to-rose-500/40'
                                }`} />

                                <div className="p-5">
                                    {/* Players Section */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-violet-50 border-2 border-white overflow-hidden flex items-center justify-center">
                                                    {selectedTeam === 'DC Patron' && playerImages[pair.split(' & ')[0]] ? (
                                                        <img 
                                                            src={playerImages[pair.split(' & ')[0]]} 
                                                            alt={pair.split(' & ')[0]}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-medium text-violet-700">
                                                            {getInitials(pair.split(' & ')[0])}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="h-10 w-10 rounded-full bg-violet-50 border-2 border-white overflow-hidden flex items-center justify-center">
                                                    {selectedTeam === 'DC Patron' && playerImages[pair.split(' & ')[1]] ? (
                                                        <img 
                                                            src={playerImages[pair.split(' & ')[1]]} 
                                                            alt={pair.split(' & ')[1]}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-medium text-violet-700">
                                                            {getInitials(pair.split(' & ')[1])}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-1">
                                                <div className="text-sm font-medium text-gray-900">{pair.split(' & ')[0]}</div>
                                                <div className="text-sm font-medium text-gray-900">{pair.split(' & ')[1]}</div>
                                            </div>
                                        </div>
                                        
                                        <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                            stats.winRate >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                            stats.winRate >= 50 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                            'bg-slate-50 text-slate-700 border border-slate-100'
                                        }`}>
                                            {stats.winRate}% Win Rate
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="relative rounded-lg bg-slate-50/50 p-2 border border-slate-100">
                                            <div className="text-[11px] text-slate-600 font-medium mb-0.5">Matches</div>
                                            <div className="text-lg font-semibold text-slate-700">{totalMatches}</div>
                                        </div>
                                        <div className="relative rounded-lg bg-emerald-50/50 p-2 border border-emerald-100">
                                            <div className="text-[11px] text-emerald-600 font-medium mb-0.5">Wins</div>
                                            <div className="text-lg font-semibold text-emerald-700">{stats.wins}</div>
                                        </div>
                                        <div className="relative rounded-lg bg-rose-50/50 p-2 border border-rose-100">
                                            <div className="text-[11px] text-rose-600 font-medium mb-0.5">Losses</div>
                                            <div className="text-lg font-semibold text-rose-700">{stats.losses}</div>
                                        </div>
                                    </div>

                                    {/* Match History */}
                                    <div className="space-y-2 overflow-visible">
                                        <div className="text-xs font-medium text-slate-500">Match History</div>
                                        <div className="flex flex-wrap gap-2 overflow-visible">
                                            {stats.matches.map((match, idx) => (
                                                <div key={idx} 
                                                    className={`relative h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-medium hover:scale-110 transition-transform duration-200 group/circle ${
                                                        match.isWin 
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' 
                                                            : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                                                    }`}
                                                >
                                                    <span>{match.matchday}</span>
                                                    
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/circle:block z-[100]">
                                                        <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                            {match.opponent}
                                                        </div>
                                                        <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-800 w-0 h-0 mx-auto"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
