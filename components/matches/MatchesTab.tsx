import React, { useMemo } from 'react';
import PlayerAvatar from './PlayerAvatar';
import MatchCard from './MatchCard';

interface Player {
    playerName: string;
    adjustedAverage: number;
}

interface MatchReport {
    opponent: string;
    lineup: string[];
    score: string;
    isHomeMatch?: boolean;
    seasonPrefix?: string;
    originalMatchday?: number;
    matchDate?: string;
    checkouts: Array<{ scores: string }>;
    details: {
        singles: Array<{
            homePlayer: string;
            awayPlayer: string;
            homeScore: number;
            awayScore: number;
        }>;
        doubles: Array<{
            homePlayers: string[];
            awayPlayers: string[];
            homeScore: number;
            awayScore: number;
        }>;
    };
}

interface MatchAverages {
    teamAverage: number;
    playerAverages: Array<{ playerName: string; average: number }>;
}

interface MatchesTabProps {
    matchReports: MatchReport[];
    matchAverages: MatchAverages[];
    sortedPlayers: Player[];
    playerImages: { [key: string]: string };
    selectedPlayerFilter: string;
    setSelectedPlayerFilter: (value: string) => void;
    selectedOpponentFilter: string;
    setSelectedOpponentFilter: (value: string) => void;
}

export default function MatchesTab({
    matchReports,
    matchAverages,
    sortedPlayers,
    playerImages,
    selectedPlayerFilter,
    setSelectedPlayerFilter,
    selectedOpponentFilter,
    setSelectedOpponentFilter
}: MatchesTabProps) {
    const getIsHomeTeam = (match: MatchReport) =>
        match.isHomeMatch !== undefined
            ? match.isHomeMatch
            : match.details.singles[0]?.homePlayer === match.lineup[0];

    const getMatchdayLabel = (match: MatchReport, fallbackIndex: number) =>
        match.seasonPrefix
            ? `${match.seasonPrefix}-${match.originalMatchday}`
            : (match.originalMatchday ?? fallbackIndex + 1);

    const orderedMatches = useMemo(() => {
        const entries = matchReports.map((matchday, reportIndex) => ({ matchday, reportIndex }));

        return entries.sort((a, b) => {
            const aSeason = Number(a.matchday.seasonPrefix || 0);
            const bSeason = Number(b.matchday.seasonPrefix || 0);
            if (aSeason !== bSeason) return bSeason - aSeason;

            const aRound = a.matchday.originalMatchday ?? -1;
            const bRound = b.matchday.originalMatchday ?? -1;
            if (aRound !== bRound) return bRound - aRound;

            return b.reportIndex - a.reportIndex;
        });
    }, [matchReports]);

    const opponentFilteredMatches = useMemo(() => {
        if (selectedOpponentFilter === 'all') return orderedMatches;
        return orderedMatches.filter(({ matchday }) => matchday.opponent === selectedOpponentFilter);
    }, [orderedMatches, selectedOpponentFilter]);

    const playerFilteredMatches = useMemo(() => {
        if (selectedPlayerFilter === 'all') return [];

        return opponentFilteredMatches
            .map(({ matchday, reportIndex }) => {
                const isHomeTeam = getIsHomeTeam(matchday);
                const playerSinglesGames = matchday.details.singles
                    .map((game, singlesIndex) => ({ game, singlesIndex }))
                    .filter(({ game }) =>
                        isHomeTeam
                            ? game.homePlayer === selectedPlayerFilter
                            : game.awayPlayer === selectedPlayerFilter
                    );

                if (playerSinglesGames.length === 0) return null;
                return { matchday, reportIndex, isHomeTeam, playerSinglesGames };
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    }, [opponentFilteredMatches, selectedPlayerFilter]);

    return (
        <div>
            {/* Filter Dropdowns */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                {/* Player Filter */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Filter by Player:</label>
                    <select
                        value={selectedPlayerFilter}
                        onChange={(e) => setSelectedPlayerFilter(e.target.value)}
                        className="appearance-none text-sm font-medium bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer min-w-[200px]"
                    >
                        <option value="all">All Players</option>
                        {(() => {
                            const players = new Set<string>();
                            orderedMatches.forEach(({ matchday }) => {
                                const isHomeTeam = getIsHomeTeam(matchday);
                                
                                matchday.details.singles.forEach(single => {
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

                {/* Opponent Filter */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Filter by Opponent:</label>
                    <select
                        value={selectedOpponentFilter}
                        onChange={(e) => setSelectedOpponentFilter(e.target.value)}
                        className="appearance-none text-sm font-medium bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer min-w-[200px]"
                    >
                        <option value="all">All Opponents</option>
                        {(() => {
                            const opponents = new Set<string>();
                            orderedMatches.forEach(({ matchday }) => {
                                if (matchday.opponent) opponents.add(matchday.opponent);
                            });
                            return Array.from(opponents).sort().map(opponent => (
                                <option key={opponent} value={opponent}>{opponent}</option>
                            ));
                        })()}
                    </select>
                </div>

                {/* Clear Filters Button */}
                {(selectedPlayerFilter !== "all" || selectedOpponentFilter !== "all") && (
                    <button
                        onClick={() => {
                            setSelectedPlayerFilter("all");
                            setSelectedOpponentFilter("all");
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Clear All Filters
                    </button>
                )}
            </div>

            {/* Player Singles View or Full View */}
            {selectedPlayerFilter !== "all" ? (
                <div className="space-y-4">
                    {/* Player Header */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-3">
                            <PlayerAvatar name={selectedPlayerFilter} imageUrl={playerImages[selectedPlayerFilter]} size="md" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedPlayerFilter}</h3>
                                <p className="text-sm text-gray-600">Singles Games</p>
                            </div>
                        </div>
                    </div>

                    {/* Player Match Cards - Simplified view showing only their singles games */}
                    <div>
                    {playerFilteredMatches.map(({ matchday, reportIndex, isHomeTeam, playerSinglesGames }, filteredIndex) => {
                        const isFirst = filteredIndex === 0;
                        const isLast = filteredIndex === playerFilteredMatches.length - 1;
                        const teamAverage = matchAverages[reportIndex]?.teamAverage;

                        return (
                            <div key={`player-view-${reportIndex}`} className={`bg-white border border-gray-200 shadow-sm p-3 sm:p-4 ${
                                isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'rounded-b-lg' : ''} ${!isFirst ? 'border-t-0' : ''}`}>
                                <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 border border-blue-100 text-sm sm:text-base font-bold text-blue-600">
                                                {getMatchdayLabel(matchday, reportIndex)}
                                            </span>
                                            <h3 className="text-base sm:text-lg font-bold text-gray-800">vs {matchday.opponent}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-1 text-sm font-medium rounded ${
                                                matchday.isHomeMatch ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                                                {matchday.isHomeMatch ? 'H' : 'A'}
                                            </span>
                                            <div className={`px-2 sm:px-3 py-0.5 sm:py-1 text-base sm:text-lg font-bold rounded border ${
                                                (() => {
                                                    const ourScore = parseInt(matchday.score.split(/[-:]/)[0]);
                                                    if (ourScore > 4) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                                    if (ourScore === 4) return 'bg-amber-50 text-amber-700 border-amber-200';
                                                    return 'bg-rose-50 text-rose-700 border-rose-200';
                                                })()
                                            }`}>
                                                {matchday.score}
                                            </div>
                                            <div className="px-2 sm:px-3 py-0.5 sm:py-1 text-sm sm:text-base font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded">
                                                {teamAverage !== undefined ? teamAverage.toFixed(2) : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {playerSinglesGames.map(({ game, singlesIndex }, idx) => {
                                        const match = game;
                                        const isWin = isHomeTeam ? match.homeScore > match.awayScore : match.awayScore > match.homeScore;
                                        const opponentName = isHomeTeam ? match.awayPlayer : match.homePlayer;
                                        const isWalkover = isHomeTeam ? match.awayPlayer.toLowerCase().includes('nicht angetreten') : match.homePlayer.toLowerCase().includes('nicht angetreten');
                                        const playerCheckouts = matchday.checkouts.filter(c => c.scores.startsWith(selectedPlayerFilter)).map(c => c.scores.split(': ')[1]).filter(c => c && c !== '-');
                                        const opponentCheckouts = matchday.checkouts.filter(c => c.scores.startsWith(opponentName)).map(c => c.scores.split(': ')[1]).filter(c => c && c !== '-');
                                        const matchdayAvg = matchAverages[reportIndex]?.playerAverages.find(pa => pa.playerName === selectedPlayerFilter)?.average;
                                        const runningAvg = sortedPlayers.find(p => p.playerName === selectedPlayerFilter)?.adjustedAverage ?? 0;
                                        const avgDiff = matchdayAvg ? matchdayAvg - runningAvg : 0;
                                        const playerScore = isHomeTeam ? match.homeScore : match.awayScore;
                                        const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;

                                        return (
                                            <div key={singlesIndex} className={`p-2 sm:p-3 ${idx === 0 ? 'border rounded-t-lg' : 'border-l border-r border-b'} ${
                                                idx === playerSinglesGames.length - 1 ? 'rounded-b-lg' : ''} ${isWin ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/30 border-gray-200'}`}>
                                                <div className="flex items-center gap-1.5 sm:gap-3">
                                                    <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                                        {playerImages[selectedPlayerFilter] && <div className="hidden sm:block"><PlayerAvatar name={selectedPlayerFilter} imageUrl={playerImages[selectedPlayerFilter]} size="md" /></div>}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-xs sm:text-sm text-gray-900 truncate">{selectedPlayerFilter}</div>
                                                            {matchdayAvg && !isWalkover && (
                                                                <div className="text-xs sm:text-sm text-gray-700 font-bold truncate">
                                                                    <span className="text-purple-600">{matchdayAvg.toFixed(2)}</span>
                                                                    {isLast ? <span className="ml-1 text-blue-500">-</span> : avgDiff !== 0 && (
                                                                        <span className={`ml-1 ${avgDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{avgDiff > 0 ? '▲' : '▼'}</span>
                                                                    )}
                                                                    {playerCheckouts.length > 0 && <span className="text-blue-600 ml-1">• {playerCheckouts.join(', ')}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${isWin ? 'text-green-600' : 'text-gray-400'}`}>{playerScore}</div>
                                                    </div>
                                                    <div className="flex-shrink-0 text-gray-300 font-bold text-base sm:text-xl">-</div>
                                                    <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                                        <div className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${!isWin ? 'text-red-600' : 'text-gray-400'}`}>{opponentScore}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-xs sm:text-sm text-gray-900 truncate text-right">{opponentName}</div>
                                                            {!isWalkover && (opponentCheckouts.length > 0 || matchdayAvg) && (
                                                                <div className="text-xs sm:text-sm text-gray-700 truncate text-right font-bold">
                                                                    {opponentCheckouts.length > 0 && <span className="text-blue-600">{opponentCheckouts.join(', ')}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {playerImages[opponentName] && <div className="hidden sm:block"><PlayerAvatar name={opponentName} imageUrl={playerImages[opponentName]} size="md" /></div>}
                                                    </div>
                                                    {isWalkover && <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded italic flex-shrink-0">w/o</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            ) : (
                /* Full Team Matches View */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {opponentFilteredMatches.map(({ matchday, reportIndex }) => (
                        <MatchCard
                            key={`match-card-${reportIndex}`}
                            matchday={matchday}
                            matchReports={matchReports}
                            reportIndex={reportIndex}
                            matchAverages={matchAverages}
                            sortedPlayers={sortedPlayers}
                            playerImages={playerImages}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
