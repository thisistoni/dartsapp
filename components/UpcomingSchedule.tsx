import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface ScheduleGame {
    round: number;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeDivision?: string;
    awayDivision?: string;
}

interface CupMatch {
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeDivision?: string;
    awayDivision?: string;
}

interface TeamStanding {
    team: string;
    [key: string]: any;
}

interface UpcomingScheduleProps {
    futureSchedule: ScheduleGame[];
    cupMatches: CupMatch[];
    leagueStandings: TeamStanding[];
}

/**
 * Upcoming schedule component
 * Displays future league games and cup matches
 */
export default function UpcomingSchedule({ 
    futureSchedule, 
    cupMatches, 
    leagueStandings 
}: UpcomingScheduleProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-orange-500" />
                    Upcoming Schedule
                </CardTitle>
            </CardHeader>
            <CardContent>
                {futureSchedule.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4">No future games scheduled.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(() => {
                            // Group by round, then inject Cup Round 2 between 6 and 7
                            const grouped = futureSchedule.reduce((acc: any, game: any) => {
                                if (!acc[game.round]) acc[game.round] = [];
                                acc[game.round].push(game);
                                return acc;
                            }, {});
                            
                            // Insert Cup Round 2 after round 6 (if we have Cup matches)
                            const rounds = Object.keys(grouped).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
                            const output: Array<[string, any[]]> = [];
                            
                            for (let i = 0; i < rounds.length; ++i) {
                                output.push([rounds[i].toString(), grouped[rounds[i]]]);
                                if (rounds[i] === 6 && cupMatches.length > 0) {
                                    output.push(['Cup Round 2', cupMatches]);
                                }
                            }
                            
                            return output.map(([round, games]) => {
                                // Count unique teams from our league in Cup Round 2
                                let leagueTeamsInCup = 0;
                                if (round === 'Cup Round 2') {
                                    const uniqueLeagueTeams = new Set<string>();
                                    (games as any[]).forEach((game: any) => {
                                        const homeInLeague = leagueStandings.some((team: any) => 
                                            team.team.toLowerCase() === game.homeTeam.toLowerCase()
                                        );
                                        const awayInLeague = leagueStandings.some((team: any) => 
                                            team.team.toLowerCase() === game.awayTeam.toLowerCase()
                                        );
                                        if (homeInLeague) uniqueLeagueTeams.add(game.homeTeam.toLowerCase());
                                        if (awayInLeague) uniqueLeagueTeams.add(game.awayTeam.toLowerCase());
                                    });
                                    leagueTeamsInCup = uniqueLeagueTeams.size;
                                }
                                
                                return (
                                    <div key={round} className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                            <span className={`text-sm font-bold ${round === 'Cup Round 2' ? 'text-pink-700' : 'text-blue-700'}`}>
                                                {round === 'Cup Round 2' ? 'Cup R2' : `MD ${round}`}
                                            </span>
                                            {(games as any[])[0] && (
                                                <span className="text-xs text-gray-500">
                                                    ({(games as any[])[0].date})
                                                    {round === 'Cup Round 2' && leagueTeamsInCup > 0 && (
                                                        <span className="ml-1 font-semibold text-pink-600">{leagueTeamsInCup}/7 active</span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            {(games as any[]).map((game: any, idx: number) => {
                                                // Check if teams are in our league (Division 5)
                                                const homeInLeague = leagueStandings.some((team: any) => 
                                                    team.team.toLowerCase() === game.homeTeam.toLowerCase()
                                                );
                                                const awayInLeague = leagueStandings.some((team: any) => 
                                                    team.team.toLowerCase() === game.awayTeam.toLowerCase()
                                                );
                                                
                                                return (
                                                    <div key={idx} className={`rounded-lg p-2 border ${round === 'Cup Round 2' ? 'bg-pink-50/50 border-pink-200' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                                <span className="font-medium text-gray-900 truncate" title={game.homeTeam}>
                                                                    {game.homeTeam}
                                                                    {!homeInLeague && game.homeDivision && (
                                                                        <span className="text-gray-500 ml-1">({game.homeDivision}. Div)</span>
                                                                    )}
                                                                </span>
                                                                <span className={`text-xs flex-shrink-0 ${round === 'Cup Round 2' ? 'text-pink-600' : 'text-gray-500'}`}>
                                                                    {round === 'Cup Round 2' ? 'Cup' : 'vs'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                                <span className="font-medium text-gray-900 truncate" title={game.awayTeam}>
                                                                    {game.awayTeam}
                                                                    {!awayInLeague && game.awayDivision && (
                                                                        <span className="text-gray-500 ml-1">({game.awayDivision}. Div)</span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
