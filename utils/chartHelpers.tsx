import React from 'react';
import { MatchAverages, MatchReport } from '@/lib/types';

interface DotProps {
    cx?: number;
    cy?: number;
    payload?: {
        value: number;
        matchday: number | string;
        opponent: string;
    };
}

interface MatchDataPoint {
    matchday: number | string;
    average: number;
    opponent: string;
    originalMatchday?: number;
    numericMatchday?: number;
}

interface RunningAveragePoint extends MatchDataPoint {
    runningAverage: number;
}

/**
 * Calculate chart domain with padding
 * @param data - Array of running average data points
 * @returns Tuple of [min, max] values for chart domain
 */
export function getChartDomain(data: RunningAveragePoint[]): [number, number] {
    if (data.length === 0) return [30, 50];  // fallback if no data
    
    const allValues = data.flatMap(d => [d.average, d.runningAverage].filter(v => v !== undefined));
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    // Add 5-10% padding and round to nearest 5
    const padding = (maxValue - minValue) * 0.1;
    const min = Math.floor((minValue - padding) / 5) * 5;
    const max = Math.ceil((maxValue + padding) / 5) * 5;
    
    return [min, max];
}

/**
 * Process match averages into chart data
 * @param matchAverages - Array of match averages
 * @param selectedPlayer - Selected player name or "team"
 * @returns Array of match data points
 */
export function processMatchData(
    matchAverages: MatchAverages[],
    selectedPlayer: string
): MatchDataPoint[] {
    return matchAverages.map((match) => {
        // Create display matchday with season prefix if available
        const displayMatchday = match.seasonPrefix 
            ? `${match.seasonPrefix}-${match.originalMatchday}` 
            : match.matchday;
            
        if (selectedPlayer === "team") {
            return {
                matchday: displayMatchday,
                average: match.teamAverage,
                opponent: match.opponent || '',
                originalMatchday: match.matchday,
                numericMatchday: match.matchday
            };
        } else {
            const playerAvg = match.playerAverages.find(p => p.playerName === selectedPlayer)?.average;
            if (playerAvg) {
                return {
                    matchday: displayMatchday,
                    average: playerAvg,
                    opponent: match.opponent || '',
                    originalMatchday: match.matchday,
                    numericMatchday: match.matchday
                };
            }
            return null;
        }
    }).filter((data): data is NonNullable<typeof data> => data !== null);
}

/**
 * Calculate running averages from match data
 * @param matchData - Array of match data points
 * @returns Array of match data points with running averages
 */
export function calculateRunningAverages(matchData: MatchDataPoint[]): RunningAveragePoint[] {
    return matchData.map((_, index) => {
        const previousMatches = matchData.slice(0, index + 1);
        const sum = previousMatches.reduce((acc, curr) => acc + curr.average, 0);
        return {
            ...matchData[index],
            runningAverage: Number((sum / previousMatches.length).toFixed(2))
        };
    });
}

/**
 * Render custom dot for chart based on match result
 * @param props - Dot properties from Recharts
 * @param selectedPlayer - Selected player name or "team"
 * @param matchReports - Array of match reports
 * @param matchData - Array of processed match data
 * @returns SVG element for the dot
 */
export function renderMatchDot(
    props: DotProps,
    selectedPlayer: string,
    matchReports: MatchReport[],
    matchData: MatchDataPoint[]
): JSX.Element {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) {
        return <svg width={0} height={0}></svg>;
    }

    // Find the match report for this matchday
    let matchReport;
    const matchday = payload.matchday as number | string;
    if (typeof matchday === 'string' && matchday.includes('-')) {
        // For "all seasons" mode with prefix like "1-5"
        const matchDataEntry = matchData.find(m => m.matchday === matchday);
        if (matchDataEntry && matchDataEntry.numericMatchday) {
            matchReport = matchReports[matchDataEntry.numericMatchday - 1];
        }
    } else {
        // For single season mode
        const numericMatchday = typeof matchday === 'number' ? matchday : parseInt(matchday);
        matchReport = matchReports[numericMatchday - 1];
    }
    
    if (!matchReport) {
        return <svg width={0} height={0}></svg>;
    }

    // For team average, check the match score
    if (selectedPlayer === "team") {
        const [homeScore, awayScore] = matchReport.score.split('-').map(Number);
        let color;
        if (homeScore > awayScore) {
            color = "#22c55e";  // green for win
        } else if (homeScore < awayScore) {
            color = "#ef4444";  // red for loss
        } else {
            color = "#f59e0b";  // amber for draw
        }

        return (
            <svg key={`dot-${cx}-${cy}`} x={cx - 6} y={cy - 6} width={12} height={12} fill="none">
                <path
                    d="M1 1L11 11M1 11L11 1"
                    stroke={color}
                    strokeWidth={2}
                />
            </svg>
        );
    }

    // For player average, find their result in the lineup
    const playerIndex = matchReport.lineup.indexOf(selectedPlayer);
    if (playerIndex === -1) {
        return <svg width={0} height={0}></svg>;
    }

    // Check if player won their matches
    const playerWon = matchReport.details.singles.some(match => 
        (match.homePlayer === selectedPlayer && match.homeScore > match.awayScore) ||
        (match.awayPlayer === selectedPlayer && match.awayScore > match.homeScore)
    );

    const color = playerWon ? "#22c55e" : "#ef4444";  // green for win, red for loss

    return (
        <svg key={`dot-${cx}-${cy}`} x={cx - 6} y={cy - 6} width={12} height={12} fill="none">
            <path
                d="M1 1L11 11M1 11L11 1"
                stroke={color}
                strokeWidth={2}
            />
        </svg>
    );
}
