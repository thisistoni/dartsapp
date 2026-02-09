import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface MatchGame {
    matchday: number;
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
}

interface GroupedGames {
    [matchday: string]: MatchGame[];
}

interface MatchResultsProps {
    groupedFinishedGames: GroupedGames;
}

/**
 * Match results component
 * Displays all finished games grouped by matchday with color-coded scores
 */
export default function MatchResults({ groupedFinishedGames }: MatchResultsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-500" />
                    Match Results
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedFinishedGames)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([matchday, games]) => (
                            <div key={matchday} className="space-y-2">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <span className="text-sm font-bold text-green-600">MD {matchday}</span>
                                    {(games as any[])[0] && (
                                        <span className="text-xs text-gray-500">({(games as any[])[0].date})</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {(games as any[]).map((game: any, index: number) => {
                                        const [homeScore, awayScore] = game.score.split(/[-:]/);
                                        const homeScoreNum = Number(homeScore);
                                        const awayScoreNum = Number(awayScore);
                                        const isDraw = homeScore === awayScore;
                                        
                                        // Color logic: Draw = orange, >4 = green, <4 = red
                                        const getScoreColor = (score: number) => {
                                            if (isDraw) return 'text-orange-600';
                                            if (score > 4) return 'text-green-700';
                                            return 'text-red-700';
                                        };
                                        
                                        return (
                                            <div key={index} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                        <span className="font-medium text-gray-900 truncate" title={game.homeTeam}>{game.homeTeam}</span>
                                                        <span className={`font-bold flex-shrink-0 ${getScoreColor(homeScoreNum)}`}>
                                                            {homeScore}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 text-xs">
                                                        <span className="font-medium text-gray-900 truncate" title={game.awayTeam}>{game.awayTeam}</span>
                                                        <span className={`font-bold flex-shrink-0 ${getScoreColor(awayScoreNum)}`}>
                                                            {awayScore}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                </div>
            </CardContent>
        </Card>
    );
}
