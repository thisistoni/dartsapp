import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Clock, Calendar } from 'lucide-react';

interface MatchGame {
    matchday: number;
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
}

interface PendingGame {
    round: number;
    homeTeam: string;
    awayTeam: string;
}

interface LatestResultsProps {
    latestMatchday: number;
    latestMatchdayGames: MatchGame[];
    pendingLatestMatchdayGames: PendingGame[];
    byeTeam: string | undefined;
    teamsWithMissingData: Set<string>;
}

/**
 * Latest matchday results component
 * Displays finished games, pending games, and teams with a bye
 */
export default function LatestResults({
    latestMatchday,
    latestMatchdayGames,
    pendingLatestMatchdayGames,
    byeTeam,
    teamsWithMissingData
}: LatestResultsProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Latest Results
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <span className="text-sm font-bold text-green-600">Matchday {latestMatchday}</span>
                        {latestMatchdayGames.length > 0 && (
                            <span className="text-xs text-gray-500">({latestMatchdayGames[0].date})</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        {/* Finished games */}
                        {latestMatchdayGames.map((game, index) => {
                            const [homeScore, awayScore] = game.score.split('-');
                            const homeScoreNum = Number(homeScore);
                            const awayScoreNum = Number(awayScore);
                            const isDraw = homeScore === awayScore;
                            const hasMissingData = teamsWithMissingData.has(game.homeTeam) || teamsWithMissingData.has(game.awayTeam);
                            
                            // Color logic: Draw = orange, >4 = green, <4 = red
                            const getScoreColor = (score: number) => {
                                if (isDraw) return 'text-orange-600';
                                if (score > 4) return 'text-green-700';
                                return 'text-red-700';
                            };
                            
                            return (
                                <div key={index} className={`bg-gray-50 rounded-lg p-3 border ${hasMissingData ? 'border-red-300 bg-red-50/50' : ''}`}>
                                    {hasMissingData && (
                                        <div className="flex items-center gap-1 mb-2">
                                            <AlertTriangle className="h-3 w-3 text-red-600" />
                                            <span className="text-xs text-red-700 font-medium">Game details pending</span>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                                            <span className="font-medium text-gray-900 truncate" title={game.homeTeam}>{game.homeTeam}</span>
                                            <span className={`font-bold flex-shrink-0 ${getScoreColor(homeScoreNum)}`}>
                                                {homeScore}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                                            <span className="font-medium text-gray-900 truncate" title={game.awayTeam}>{game.awayTeam}</span>
                                            <span className={`font-bold flex-shrink-0 ${getScoreColor(awayScoreNum)}`}>
                                                {awayScore}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Pending games from the latest matchday */}
                        {pendingLatestMatchdayGames.map((game, index) => (
                            <div key={`pending-${index}`} className="bg-amber-50/50 rounded-lg p-3 border border-amber-200 border-dashed">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-3 w-3 text-amber-600" />
                                        <span className="text-xs text-amber-700 font-medium">Result pending</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                                        <span className="font-medium text-gray-700 truncate" title={game.homeTeam}>{game.homeTeam}</span>
                                        <span className="text-xs text-gray-500 flex-shrink-0">vs</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                                        <span className="font-medium text-gray-700 truncate" title={game.awayTeam}>{game.awayTeam}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Team with bye */}
                        {byeTeam && (
                            <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900">{byeTeam}</span>
                                        <p className="text-xs text-gray-500 mt-0.5">Free this matchday</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
