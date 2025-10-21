import { MatchReport } from '@/lib/types';

/**
 * Get the best (highest) checkouts from match reports
 * @param matchReports - Array of match reports
 * @param playerName - Name of the player to filter by
 * @param isTeam - Whether to get team checkouts (all players)
 * @param count - Number of checkouts to return (default 5)
 * @returns Array of checkout values sorted ascending
 */
export function getBestCheckouts(
    matchReports: MatchReport[],
    playerName: string,
    isTeam: boolean = false,
    count: number = 5
): number[] {
    const allCheckouts = matchReports.flatMap(report => 
        report.checkouts
            .filter(c => isTeam ? true : c.scores.startsWith(playerName))
            .map(c => {
                const scores = c.scores.split(': ')[1];
                return scores === '-' ? [] : scores.split(', ').map(Number);
            })
            .flat()
    );
    
    return allCheckouts
        .filter(c => !isNaN(c))
        .sort((a, b) => a - b)
        .slice(0, count);
}

/**
 * Get the lowest three checkouts from all match reports
 * @param matchReports - Array of match reports
 * @returns Array of three lowest checkout values
 */
export function getLowestThreeCheckouts(matchReports: MatchReport[]): number[] {
    const allCheckouts = matchReports.flatMap(report => 
        report.checkouts
            .map(c => {
                const scores = c.scores.split(': ')[1];
                return scores === '-' ? [] : scores.split(', ').map(Number);
            })
            .flat()
    ).filter(c => !isNaN(c));

    return allCheckouts.sort((a, b) => a - b).slice(0, 3);
}
