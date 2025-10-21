import { useState, useCallback } from 'react';
import axios from 'axios';
import { TeamData } from '@/lib/types';

export function useComparisonData() {
    const [comparisonTeam, setComparisonTeam] = useState<string>('');
    const [comparisonTeamData, setComparisonTeamData] = useState<TeamData | null>(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);

    const fetchComparisonTeam = useCallback(async (teamName: string, season: string = '2025/26') => {
        setComparisonLoading(true);
        try {
            // Fetch from Supabase (fast!)
            console.log(`🔄 Fetching comparison team ${teamName} from Supabase...`);
            const response = await axios.get(`/api/teamDataSupabase?team=${encodeURIComponent(teamName)}&season=${season}`);
            const { data } = response.data;
            
            const teamData: TeamData = {
                players: data.players
            };
            setComparisonTeamData(teamData);
            console.log(`✅ Comparison team loaded from Supabase`);
        } catch (error) {
            console.error('Error fetching comparison team:', error);
            setComparisonTeamData(null);
        } finally {
            setComparisonLoading(false);
        }
    }, []);

    return {
        comparisonTeam,
        setComparisonTeam,
        comparisonTeamData,
        setComparisonTeamData,
        comparisonLoading,
        fetchComparisonTeam
    };
}
