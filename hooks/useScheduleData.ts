import { useState, useEffect } from 'react';
import axios from 'axios';

interface ScheduleMatch {
    round: string;
    date: string;
    opponent: string;
    venue: string;
    address: string;
    location: string;
    matchType?: string;
}

export function useScheduleData(teamName: string, season: string = '2025/26') {
    const [scheduleData, setScheduleData] = useState<ScheduleMatch[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Don't fetch if no team selected or League Overview
        if (!teamName || teamName === 'League Overview') {
            setScheduleData([]);
            return;
        }

        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/schedule?team=${encodeURIComponent(teamName)}&season=${season}`);
                setScheduleData(response.data);
            } catch (error) {
                console.error('Error fetching schedule:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [teamName, season]);

    return { scheduleData, loading };
}
