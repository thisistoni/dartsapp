import React, { useState } from 'react';
import { Target, Search, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface TeamDetailHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredTeams: string[];
    setSelectedTeam: (team: string) => void;
    searchContainerRef: React.RefObject<HTMLDivElement>;
    onSyncComplete?: () => void;
}

export default function TeamDetailHeader({
    searchTerm,
    setSearchTerm,
    filteredTeams,
    setSelectedTeam,
    searchContainerRef,
    onSyncComplete
}: TeamDetailHeaderProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage('Syncing...');
        
        try {
            const response = await axios.post('/api/sync');
            setSyncMessage(`✓ ${response.data.recordsUpdated} records updated`);
            
            // Call the callback if provided
            if (onSyncComplete) {
                onSyncComplete();
            }
            
            // Clear message after 3 seconds
            setTimeout(() => setSyncMessage(''), 3000);
        } catch (error) {
            setSyncMessage('✗ Sync failed');
            setTimeout(() => setSyncMessage(''), 3000);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">WDV Landesliga</h1>
                    <span className="text-sm font-medium text-gray-500">5. Division A</span>
                </div>
            </div>

            {/* Sync Button and Search */}
            <div className="flex items-center gap-3">
                {/* Sync Button */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                            transition-all duration-200
                            ${isSyncing 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                            }
                        `}
                        title="Sync latest data from web"
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                    {syncMessage && (
                        <span className="text-xs mt-1 text-gray-600">{syncMessage}</span>
                    )}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64" ref={searchContainerRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search team..."
                    className="w-full pl-10 pr-4 py-2.5 text-[16px] sm:text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                {searchTerm && filteredTeams.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-100 shadow-lg overflow-hidden z-50">
                        <div className="max-h-[48rem] overflow-y-auto">
                            {filteredTeams.map((team) => (
                                <button
                                    key={team}
                                    onClick={() => {
                                        setSelectedTeam(team);
                                        setSearchTerm('');
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-gray-700 cursor-pointer transition-colors duration-150"
                                >
                                    {team}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
