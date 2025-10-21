import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, ChevronDown } from 'lucide-react';

interface PlayerAvatarProps {
    name: string;
    imageUrl?: string;
    size?: 'sm' | 'md';
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, imageUrl, size = 'sm' }) => {
    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getColorFromName = (name: string) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
        ];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const initials = getInitials(name);
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name}
                className={`${sizeClasses} rounded-full object-cover flex-shrink-0`}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                }}
            />
        );
    }

    return (
        <div className={`${sizeClasses} rounded-full ${getColorFromName(name)} text-white font-bold flex items-center justify-center flex-shrink-0`}>
            {initials}
        </div>
    );
};

interface LatestMatchDetailsProps {
    leagueData: any;
    loading: boolean;
    playerImages: { [key: string]: string };
}

/**
 * Latest match details component
 * Shows detailed singles results and weekly highlights from any matchday
 */
export default function LatestMatchDetails({
    leagueData,
    loading,
    playerImages
}: LatestMatchDetailsProps) {
    // Get available matchdays from the data
    const availableMatchdays = useMemo(() => {
        if (!leagueData?.latestMatches || leagueData.latestMatches.length === 0) return [];
        
        const matchdaySet = new Set<number>();
        leagueData.latestMatches.forEach((match: any) => {
            matchdaySet.add(match.matchday);
        });
        
        return Array.from(matchdaySet).sort((a, b) => b - a); // Sort descending (latest first)
    }, [leagueData?.latestMatches]);

    // Default to latest matchday
    const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null);
    
    // Update selected matchday when data changes
    React.useEffect(() => {
        if (availableMatchdays.length > 0 && selectedMatchday === null) {
            setSelectedMatchday(availableMatchdays[0]); // Select latest matchday
        }
    }, [availableMatchdays, selectedMatchday]);

    // Filter matches by selected matchday
    const filteredMatches = useMemo(() => {
        if (!leagueData?.latestMatches || selectedMatchday === null) return [];
        return leagueData.latestMatches.filter((match: any) => match.matchday === selectedMatchday);
    }, [leagueData?.latestMatches, selectedMatchday]);

    // Get date for selected matchday
    const selectedMatchdayDate = filteredMatches.length > 0 ? filteredMatches[0].date : '';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        Match Details
                    </div>
                    
                    {/* Matchday Selector */}
                    {availableMatchdays.length > 0 && (
                        <div className="relative">
                            <select
                                value={selectedMatchday || ''}
                                onChange={(e) => setSelectedMatchday(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                            >
                                {availableMatchdays.map((md) => (
                                    <option key={md} value={md}>
                                        Matchday {md}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Match Details */}
                    {filteredMatches && filteredMatches.length > 0 ? (
                        <>
                            {/* Main Title */}
                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-gray-800">
                                    Matchday {selectedMatchday} - {selectedMatchdayDate}
                                </h2>
                            </div>
                            
                            {filteredMatches.map((match: any, matchIndex: number) => (
                                <div key={matchIndex}>
                                    <div className="mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700">
                                            {match.homeTeam} <span className="text-blue-600 font-bold">{match.homeSets}-{match.awaySets}</span> {match.awayTeam}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {match.singles && match.singles.map((single: any, singleIndex: number) => {
                                            const homeWon = single.homeScore > single.awayScore;
                                            const awayWon = single.awayScore > single.homeScore;
                                            
                                            return (
                                                <div key={singleIndex} className={`rounded-lg p-3 border ${
                                                    homeWon ? 'bg-gradient-to-br from-green-50 to-white border-green-200' :
                                                    awayWon ? 'bg-gradient-to-br from-red-50 to-white border-red-200' :
                                                    'bg-gray-50 border-gray-200'
                                                }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <PlayerAvatar name={single.homePlayer} imageUrl={playerImages[single.homePlayer]} size="sm" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm truncate ${homeWon ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                                    {single.homePlayer}
                                                                </div>
                                                                {single.homeAverage > 0 && (
                                                                    <div className="text-xs text-gray-700 font-medium">
                                                                        {single.homeAverage.toFixed(2)} • {
                                                                            Array.isArray(single.homeCheckouts) 
                                                                                ? single.homeCheckouts.join(', ') || '-'
                                                                                : single.homeCheckouts || '-'
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-lg font-bold ${homeWon ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {single.homeScore}
                                                            </div>
                                                            {homeWon && <div className="text-xs text-gray-400">Win</div>}
                                                        </div>
                                                    </div>
                                                    <div className={`flex items-center justify-between pt-2 border-t ${
                                                        homeWon ? 'border-green-100' : awayWon ? 'border-red-100' : 'border-gray-100'
                                                    }`}>
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <PlayerAvatar name={single.awayPlayer} imageUrl={playerImages[single.awayPlayer]} size="sm" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm truncate ${awayWon ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                                    {single.awayPlayer}
                                                                </div>
                                                                {single.awayAverage > 0 && (
                                                                    <div className="text-xs text-gray-600">
                                                                        {single.awayAverage.toFixed(2)} • {
                                                                            Array.isArray(single.awayCheckouts) 
                                                                                ? single.awayCheckouts.join(', ') || '-'
                                                                                : single.awayCheckouts || '-'
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-lg font-bold ${awayWon ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {single.awayScore}
                                                            </div>
                                                            {awayWon && <div className="text-xs text-gray-400">Win</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            
                            {/* Matchday Highlights - Best Average & Best Checkout */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="text-base font-bold text-gray-800 mb-4">Matchday Highlights</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Best Average */}
                                    {(() => {
                                        let bestAvg = { player: '', team: '', average: 0 };
                                        filteredMatches.forEach((match: any) => {
                                            match.singles?.forEach((single: any) => {
                                                if (single.homeAverage > bestAvg.average) {
                                                    bestAvg = { 
                                                        player: single.homePlayer, 
                                                        team: match.homeTeam, 
                                                        average: single.homeAverage 
                                                    };
                                                }
                                                if (single.awayAverage > bestAvg.average) {
                                                    bestAvg = { 
                                                        player: single.awayPlayer, 
                                                        team: match.awayTeam, 
                                                        average: single.awayAverage 
                                                    };
                                                }
                                            });
                                        });
                                        
                                        return bestAvg.average > 0 ? (
                                            <div className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-300 rounded-lg p-4">
                                                <div className="flex items-center gap-3">
                                                    <PlayerAvatar 
                                                        name={bestAvg.player} 
                                                        imageUrl={playerImages[bestAvg.player]} 
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-xs font-medium text-yellow-600 uppercase tracking-wide mb-1">
                                                            🏆 Best Average
                                                        </div>
                                                        <div className="font-bold text-gray-900 text-lg">{bestAvg.player}</div>
                                                        <div className="text-sm text-gray-600">{bestAvg.team}</div>
                                                        <div className="text-2xl font-bold text-yellow-600 mt-1">
                                                            {bestAvg.average.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                    
                                    {/* Best Leg */}
                                    {(() => {
                                        let bestLeg = { player: '', team: '', checkout: Infinity, checkouts: '' };
                                        filteredMatches.forEach((match: any) => {
                                            match.singles?.forEach((single: any) => {
                                                // Parse home checkouts (handle both string and array)
                                                if (single.homeCheckouts && single.homeCheckouts !== '-') {
                                                    let checkouts: number[];
                                                    if (Array.isArray(single.homeCheckouts)) {
                                                        // Already an array from Supabase API
                                                        checkouts = single.homeCheckouts.map((c: any) => parseInt(c)).filter((n: number) => !isNaN(n));
                                                    } else {
                                                        // String from old scraper API
                                                        checkouts = single.homeCheckouts.split(',').map((c: string) => parseInt(c.trim())).filter((n: number) => !isNaN(n));
                                                    }
                                                    
                                                    if (checkouts.length > 0) {
                                                        const minCheckout = Math.min(...checkouts);
                                                        if (minCheckout < bestLeg.checkout && minCheckout > 0) {
                                                            bestLeg = {
                                                                player: single.homePlayer,
                                                                team: match.homeTeam,
                                                                checkout: minCheckout,
                                                                checkouts: Array.isArray(single.homeCheckouts) 
                                                                    ? single.homeCheckouts 
                                                                    : single.homeCheckouts.split(',').map((c: string) => c.trim())
                                                            };
                                                        }
                                                    }
                                                }
                                                // Parse away checkouts (handle both string and array)
                                                if (single.awayCheckouts && single.awayCheckouts !== '-') {
                                                    let checkouts: number[];
                                                    if (Array.isArray(single.awayCheckouts)) {
                                                        // Already an array from Supabase API
                                                        checkouts = single.awayCheckouts.map((c: any) => parseInt(c)).filter((n: number) => !isNaN(n));
                                                    } else {
                                                        // String from old scraper API
                                                        checkouts = single.awayCheckouts.split(',').map((c: string) => parseInt(c.trim())).filter((n: number) => !isNaN(n));
                                                    }
                                                    
                                                    if (checkouts.length > 0) {
                                                        const minCheckout = Math.min(...checkouts);
                                                        if (minCheckout < bestLeg.checkout && minCheckout > 0) {
                                                            bestLeg = {
                                                                player: single.awayPlayer,
                                                                team: match.awayTeam,
                                                                checkout: minCheckout,
                                                                checkouts: Array.isArray(single.awayCheckouts) 
                                                                    ? single.awayCheckouts 
                                                                    : single.awayCheckouts.split(',').map((c: string) => c.trim())
                                                            };
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                        
                                        return bestLeg.checkout !== Infinity ? (
                                            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-lg p-4">
                                                <div className="flex items-center gap-3">
                                                    <PlayerAvatar 
                                                        name={bestLeg.player} 
                                                        imageUrl={playerImages[bestLeg.player]} 
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                                                            🎯 Best Leg
                                                        </div>
                                                        <div className="font-bold text-gray-900 text-lg">{bestLeg.player}</div>
                                                        <div className="text-sm text-gray-600">{bestLeg.team}</div>
                                                        <div className="text-2xl font-bold text-green-600 mt-1">
                                                            {bestLeg.checkout}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-gray-500 p-4">
                            {loading ? 'Loading latest matches...' : 'No recent match data available. Check console for details.'}
                            {!loading && (
                                <div className="mt-2 text-xs">
                                    Debug: latestMatches = {JSON.stringify(leagueData?.latestMatches)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
