import React from 'react';
import GameRow from './GameRow';

interface MatchReport {
    opponent: string;
    lineup: string[];
    score: string;
    isHomeMatch?: boolean;
    seasonPrefix?: string;
    originalMatchday?: number;
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

interface Player {
    playerName: string;
    adjustedAverage: number;
}

interface MatchAverages {
    teamAverage: number;
    playerAverages: Array<{ playerName: string; average: number }>;
    opponentAverage?: number;
    opponentPlayerAverages?: Array<{ playerName: string; average: number }>;
}

interface MatchCardProps {
    matchday: MatchReport;
    matchReports: MatchReport[];
    index: number;
    matchAverages: MatchAverages[];
    sortedPlayers: Player[];
    playerImages: { [key: string]: string };
}

export default function MatchCard({
    matchday,
    matchReports,
    index,
    matchAverages,
    sortedPlayers,
    playerImages
}: MatchCardProps) {
    const isHomeTeam = matchday.isHomeMatch !== undefined 
        ? matchday.isHomeMatch 
        : matchday.details.singles[0].homePlayer === matchday.lineup[0];
    
    // Create array of all individual games in proper order
    const allGames: Array<{
        type: 'singles' | 'doubles';
        index: number;
        lineupIndex: number;
        match: any;
        player: string;
    }> = [];
    
    // S1, S2 - with safety checks
    if (matchday.details.singles[0]) {
        allGames.push({ type: 'singles', index: 0, lineupIndex: 0, match: matchday.details.singles[0], player: matchday.lineup[0] || '' });
    }
    if (matchday.details.singles[1]) {
        allGames.push({ type: 'singles', index: 1, lineupIndex: 1, match: matchday.details.singles[1], player: matchday.lineup[1] || '' });
    }
    
    // D1, D2
    if (matchday.details.doubles[0]) {
        allGames.push({ type: 'doubles', index: 0, lineupIndex: 2, match: matchday.details.doubles[0], player: matchday.lineup[2] || '' });
    }
    if (matchday.details.doubles[1]) {
        allGames.push({ type: 'doubles', index: 1, lineupIndex: 3, match: matchday.details.doubles[1], player: matchday.lineup[3] || '' });
    }
    
    // S3, S4
    if (matchday.details.singles[2]) {
        allGames.push({ type: 'singles', index: 2, lineupIndex: 4, match: matchday.details.singles[2], player: matchday.lineup[4] || '' });
    }
    if (matchday.details.singles[3]) {
        allGames.push({ type: 'singles', index: 3, lineupIndex: 5, match: matchday.details.singles[3], player: matchday.lineup[5] || '' });
    }
    
    // D3, D4 (if exists)
    if (matchday.details.doubles[2]) {
        allGames.push({ type: 'doubles', index: 2, lineupIndex: 6, match: matchday.details.doubles[2], player: matchday.lineup[6] || '' });
    }
    if (matchday.details.doubles[3]) {
        allGames.push({ type: 'doubles', index: 3, lineupIndex: 7, match: matchday.details.doubles[3], player: matchday.lineup[7] || '' });
    }

    const dcPatronPlayersWithAvatars = [
        'Muhamet Mahmutaj',
        'Marko Cvejic',
        'Markus Hafner',
        'Christoph Hafner',
        'Dejan Stojadinovic',
        'Luca Schuckert'
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
            {/* Matchday Header */}
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 border border-blue-100 text-sm sm:text-base font-bold text-blue-600">
                            {matchday.seasonPrefix ? `${matchday.seasonPrefix}-${matchday.originalMatchday}` : matchReports.length - index}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">vs {matchday.opponent}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 text-sm font-medium rounded ${
                            matchday.isHomeMatch 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
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
                            {matchAverages[matchReports.length - index - 1]?.teamAverage.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Games List */}
            <div className="space-y-1.5 sm:space-y-2">
                {allGames.map((game, gameIdx) => {
                    const isSinglesMatch = game.type === 'singles';
                    const match = game.match;
                    const player = game.player;
                    
                    // Safety check for scores
                    if (!match || match.homeScore === undefined || match.awayScore === undefined) {
                        return null;
                    }
                    
                    const isWin = isHomeTeam ? 
                        match.homeScore > match.awayScore : 
                        match.awayScore > match.homeScore;
                    
                    const opponentName = isHomeTeam ? 
                        (isSinglesMatch ? (match.awayPlayer || '') : (match.awayPlayers || []).join(' / ')) :
                        (isSinglesMatch ? (match.homePlayer || '') : (match.homePlayers || []).join(' / '));
                    
                    const isWalkover = isSinglesMatch ?
                        (isHomeTeam ? match.awayPlayer?.toLowerCase().includes('nicht angetreten') : match.homePlayer?.toLowerCase().includes('nicht angetreten')) :
                        (isHomeTeam ? match.awayPlayers?.some((p: string) => p?.toLowerCase().includes('nicht angetreten')) : match.homePlayers?.some((p: string) => p?.toLowerCase().includes('nicht angetreten')));
                    
                    const playerCheckouts = isSinglesMatch 
                        ? (matchday.checkouts || []).filter(c => c?.scores?.startsWith(player)).map(c => c.scores.split(': ')[1]).filter(c => c && c !== '-')
                        : [];
                    
                    const opponentCheckouts = isSinglesMatch
                        ? (matchday.checkouts || []).filter(c => c?.scores?.startsWith(opponentName)).map(c => c.scores.split(': ')[1]).filter(c => c && c !== '-')
                        : [];
                    
                    const matchdayAvg = isSinglesMatch ? 
                        matchAverages[matchReports.length - index - 1]?.playerAverages.find(pa => pa.playerName === player)?.average : undefined;
                    
                    const opponentMatchdayAvg = isSinglesMatch ? 
                        matchAverages[matchReports.length - index - 1]?.opponentPlayerAverages?.find(pa => pa.playerName === opponentName)?.average : undefined;
                    
                    const runningAvg = sortedPlayers.find(p => p.playerName === player)?.adjustedAverage ?? 0;
                    const avgDiff = matchdayAvg ? matchdayAvg - runningAvg : 0;
                    
                    // Calculate opponent trend relative to their team average for this match
                    const opponentTeamAvg = matchAverages[matchReports.length - index - 1]?.opponentAverage ?? 0;
                    const opponentAvgDiff = (opponentMatchdayAvg && opponentTeamAvg) ? opponentMatchdayAvg - opponentTeamAvg : undefined;
                    
                    const currentOriginalIndex = matchReports.length - index - 1;
                    const isFirstAppearance = isSinglesMatch && !matchReports.slice(0, currentOriginalIndex).some((prevMatch) => {
                        const prevIsHomeTeam = prevMatch.isHomeMatch !== undefined 
                            ? prevMatch.isHomeMatch 
                            : prevMatch.details.singles[0]?.homePlayer === prevMatch.lineup[0];
                        return prevMatch.details.singles.some(single => {
                            const prevPlayer = prevIsHomeTeam ? single.homePlayer : single.awayPlayer;
                            return prevPlayer === player;
                        });
                    });
                    
                    const playerScore = isHomeTeam ? match.homeScore : match.awayScore;
                    const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;
                    
                    const playerNames = isSinglesMatch ? [player] : (isHomeTeam ? match.homePlayers : match.awayPlayers);
                    const opponentNames = isSinglesMatch ? [opponentName] : (isHomeTeam ? match.awayPlayers : match.homePlayers);
                    
                    return (
                        <GameRow
                            key={gameIdx}
                            isSinglesMatch={isSinglesMatch}
                            isHomeTeam={isHomeTeam}
                            isWin={isWin}
                            isWalkover={isWalkover}
                            isFirstAppearance={isFirstAppearance}
                            player={player}
                            playerNames={playerNames}
                            opponentName={opponentName}
                            opponentNames={opponentNames}
                            playerScore={playerScore}
                            opponentScore={opponentScore}
                            matchdayAvg={matchdayAvg}
                            avgDiff={avgDiff}
                            opponentMatchdayAvg={opponentMatchdayAvg}
                            opponentAvgDiff={opponentAvgDiff}
                            playerCheckouts={playerCheckouts}
                            opponentCheckouts={opponentCheckouts}
                            playerImages={playerImages}
                            dcPatronPlayersWithAvatars={dcPatronPlayersWithAvatars}
                        />
                    );
                })}
            </div>

            {/* Result in Legs */}
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
                <div className="text-center">
                    <div className="text-xs text-gray-500 font-medium mb-1 sm:mb-2">Result in Legs</div>
                    <div className={`text-xl sm:text-2xl font-bold ${
                        (() => {
                            const [yourSingles, oppSingles] = matchday.details.singles.reduce((acc, match) => {
                                const yourScore = isHomeTeam ? match.homeScore : match.awayScore;
                                const oppScore = isHomeTeam ? match.awayScore : match.homeScore;
                                return [acc[0] + yourScore, acc[1] + oppScore];
                            }, [0, 0]);
                            const [yourDoubles, oppDoubles] = matchday.details.doubles.reduce((acc, match) => {
                                const yourScore = isHomeTeam ? match.homeScore : match.awayScore;
                                const oppScore = isHomeTeam ? match.awayScore : match.homeScore;
                                return [acc[0] + yourScore, acc[1] + oppScore];
                            }, [0, 0]);
                            const yourTotal = yourSingles + yourDoubles;
                            const oppTotal = oppSingles + oppDoubles;
                            return yourTotal > oppTotal ? 'text-green-600' : yourTotal < oppTotal ? 'text-red-600' : 'text-gray-600';
                        })()
                    }`}>
                        {(() => {
                            const [yourSingles, oppSingles] = matchday.details.singles.reduce((acc, match) => {
                                const yourScore = isHomeTeam ? match.homeScore : match.awayScore;
                                const oppScore = isHomeTeam ? match.awayScore : match.homeScore;
                                return [acc[0] + yourScore, acc[1] + oppScore];
                            }, [0, 0]);
                            const [yourDoubles, oppDoubles] = matchday.details.doubles.reduce((acc, match) => {
                                const yourScore = isHomeTeam ? match.homeScore : match.awayScore;
                                const oppScore = isHomeTeam ? match.awayScore : match.homeScore;
                                return [acc[0] + yourScore, acc[1] + oppScore];
                            }, [0, 0]);
                            return `${yourSingles + yourDoubles}-${oppSingles + oppDoubles}`;
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
