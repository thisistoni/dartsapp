import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { TeamData, MatchReport, ClubVenue, ComparisonData, TeamStandings, MatchAverages, OneEighty, HighFinish } from '@/lib/types';

interface ScheduleMatch {
    round: string;
    date: string;
    opponent: string;
    venue: string;
    address: string;
    location: string;
    matchType?: string;
}

interface UseTeamDataReturn {
    teamData: TeamData | null;
    matchReports: MatchReport[];
    leaguePosition: number | null;
    clubVenue: ClubVenue | null;
    comparisonData: ComparisonData[];
    teamStandings: TeamStandings | null;
    matchAverages: MatchAverages[];
    oneEightys: OneEighty[];
    highFinishes: HighFinish[];
    scheduleData: ScheduleMatch[];
    teamAverage: number | null;
    dataSource: 'database' | 'scraped' | null;
    loading: boolean;
    isInitialLoad: boolean;
}

export function useTeamData(selectedTeam: string, selectedSeason: string, refreshTrigger?: number): UseTeamDataReturn {
    const [teamData, setTeamData] = useState<TeamData | null>(null);
    const [matchReports, setMatchReports] = useState<MatchReport[]>([]);
    const [leaguePosition, setLeaguePosition] = useState<number | null>(null);
    const [clubVenue, setClubVenue] = useState<ClubVenue | null>(null);
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
    const [teamStandings, setTeamStandings] = useState<TeamStandings | null>(null);
    const [matchAverages, setMatchAverages] = useState<MatchAverages[]>([]);
    const [oneEightys, setOneEightys] = useState<OneEighty[]>([]);
    const [highFinishes, setHighFinishes] = useState<HighFinish[]>([]);
    const [scheduleData, setScheduleData] = useState<ScheduleMatch[]>([]);
    const [teamAverage, setTeamAverage] = useState<number | null>(null);
    const [dataSource, setDataSource] = useState<'database' | 'scraped' | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const updateTimeoutRef = useRef<NodeJS.Timeout>();
    const retryTimeoutRef = useRef<NodeJS.Timeout>();
    const currentTeamRef = useRef<string>('');

    useEffect(() => {
        if (selectedTeam) {
            // Skip data fetching for League Overview
            if (selectedTeam === 'League Overview') {
                setIsInitialLoad(false);
                return;
            }
            
            setLoading(true);
            setIsInitialLoad(true);
            currentTeamRef.current = selectedTeam;

            // Clear existing timeouts
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }

            // Function to fetch data
            const fetchData = async (forceUpdate = false) => {
                const requestedTeam = currentTeamRef.current;
                try {
                    const seasonParam = selectedSeason || '2025/26';
                    let response;
                    let source: 'database' | 'scraped' = 'database';
                    
                    if (forceUpdate) {
                        // Only scrape when explicitly forced (Sync button)
                        console.log(`🔄 Force scraping ${requestedTeam}...`);
                        response = await axios.get(`/api/teamData?team=${encodeURIComponent(requestedTeam)}&season=${seasonParam}`);
                        source = 'scraped';
                    } else {
                        // Always use Supabase for normal loads
                        console.log(`📊 Loading ${requestedTeam} from Supabase...`);
                        response = await axios.get(`/api/teamDataSupabase?team=${encodeURIComponent(requestedTeam)}&season=${seasonParam}`);
                    }
                    
                    const { data } = response.data;

                    // Only update state if we're still on the same team
                    if (requestedTeam === currentTeamRef.current) {
                        setDataSource(source);
                        setMatchReports(data.matchReports);
                        setLeaguePosition(data.leaguePosition);
                        setClubVenue(data.clubVenue);
                        setComparisonData(data.comparisonData);
                        setTeamStandings(data.teamStandings);
                        setMatchAverages(data.matchAverages);
                        setOneEightys(data.oneEightys);
                        setHighFinishes(data.highFinishes);
                        setScheduleData(data.scheduleData || []);

                        const teamData = {
                            players: data.players
                        };
                        setTeamData(teamData);
                        
                        // Calculate team average from match reports
                        const matchAvgs = data.matchAverages || [];
                        if (matchAvgs.length > 0) {
                            const avgSum = matchAvgs.reduce((sum: number, match: MatchAverages) => 
                                sum + match.teamAverage, 0);
                            setTeamAverage(avgSum / matchAvgs.length);
                        } else {
                            setTeamAverage(null);
                        }

                        // ✅ REMOVED: No automatic scraping - only manual sync via button
                        setIsInitialLoad(false);
                        setLoading(false);
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                    if (requestedTeam === currentTeamRef.current) {
                        setIsInitialLoad(false);
                        setLoading(false);
                    }
                }
            };

            fetchData();
        }

        // Cleanup function
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [selectedTeam, selectedSeason, refreshTrigger]);

    return {
        teamData,
        matchReports,
        leaguePosition,
        clubVenue,
        comparisonData,
        teamStandings,
        matchAverages,
        oneEightys,
        highFinishes,
        scheduleData,
        teamAverage,
        dataSource,
        loading,
        isInitialLoad
    };
}
