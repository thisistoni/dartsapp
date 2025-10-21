import { Calendar, MapPin, Navigation } from 'lucide-react';

interface ScheduleMatch {
    round: string;
    date: string;
    opponent: string;
    venue: string;
    address: string;
    location: string;
    matchType?: string;
}

interface ScheduleTabProps {
    selectedTeam: string;
    scheduleData: ScheduleMatch[];
}

export default function ScheduleTab({
    selectedTeam,
    scheduleData
}: ScheduleTabProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    const upcomingMatches = scheduleData
        .filter(match => {
            const matchDate = new Date(match.date);
            matchDate.setHours(0, 0, 0, 0); // Set to start of day
            return matchDate >= today;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const matchesByMonth = upcomingMatches.reduce((acc, match) => {
        const monthYear = new Date(match.date).toLocaleDateString('de-AT', {
            month: 'long',
            year: 'numeric'
        });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(match);
        return acc;
    }, {} as Record<string, typeof upcomingMatches>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Upcoming Matches</h2>
                <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                    Season 2025/26
                </div>
            </div>

            {scheduleData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Matches</h3>
                    <p className="text-gray-500 max-w-md">
                        There are no upcoming matches scheduled for {selectedTeam}.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(matchesByMonth).map(([monthYear, matches]) => (
                        <div key={monthYear} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{monthYear}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {matches.map((match) => (
                                    <div key={`${match.round}-${match.date}`} 
                                        className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-visible border border-gray-100"
                                    >
                                        <div className={`h-1 w-full bg-gradient-to-r ${
                                            match.matchType === 'Cup'
                                                ? 'from-amber-400/40 to-amber-500/40'
                                                : match.venue === 'Home' 
                                                    ? 'from-blue-400/40 to-blue-500/40' 
                                                    : 'from-orange-400/40 to-orange-500/40'
                                        }`} />
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className={`h-10 w-10 rounded-full ${
                                                    match.matchType === 'Cup' ? 'bg-amber-50' :
                                                    match.venue === 'Home' ? 'bg-blue-50' : 'bg-orange-50'
                                                } flex items-center justify-center`}>
                                                    <span className={`text-base font-bold ${
                                                        match.matchType === 'Cup' ? 'text-amber-600' :
                                                        match.venue === 'Home' ? 'text-blue-600' : 'text-orange-600'
                                                    }`}>
                                                        {new Date(match.date).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="text-xs text-gray-500">
                                                        {match.matchType === 'Cup' ? '🏆 Cup' : `Round ${match.round}`}
                                                    </div>
                                                    <div className="font-medium text-gray-900">{match.opponent}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {match.matchType === 'Cup' && (
                                                        <span className="text-xs px-2 py-1 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                            Cup
                                                        </span>
                                                    )}
                                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                        match.venue === 'Home' 
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                                                    }`}>
                                                        {match.venue === 'Home' ? 'H' : 'A'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {match.address && match.address.trim() !== '' && (
                                                <>
                                                    <div className="flex items-center gap-2 text-gray-600 mb-2 mt-3 pt-3 border-t border-gray-100">
                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm">{match.address}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs text-gray-500">
                                                            {match.location}
                                                        </div>
                                                        <a 
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                `${match.address}, ${match.location}`
                                                            )}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
                                                        >
                                                            <Navigation className="h-3 w-3 mr-1" />
                                                            Directions
                                                        </a>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
