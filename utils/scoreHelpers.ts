import { ComparisonData } from '@/lib/types';

/**
 * Calculate the difference between two round scores
 * @param first - First round score (e.g., "5-3")
 * @param second - Second round score (e.g., "4-4")
 * @returns The difference (second - first)
 */
export function calculateDifference(first: string, second: string): number {
    if (!first || !second) return 0;
    
    // Get only the first number from each score (before the dash)
    const firstScore = parseInt(first.split('-')[0]);
    const secondScore = parseInt(second.split('-')[0]);
    
    return secondScore - firstScore;
}

/**
 * Calculate total difference across all comparison matches
 * @param data - Array of comparison data
 * @returns Total difference
 */
export function calculateTotalDifference(data: ComparisonData[]): number {
    return data.reduce((total, match) => {
        if (match.firstRound && match.secondRound) {
            return total + calculateDifference(match.firstRound, match.secondRound);
        }
        return total;
    }, 0);
}

/**
 * Get TailwindCSS classes for score color based on win/loss/draw
 * @param score - Match score (e.g., "5-3")
 * @returns TailwindCSS color classes
 */
export function getScoreColor(score: string): string {
    if (!score) return '';
    const [home, away] = score.split('-').map(Number);
    if (home > away) return 'bg-green-100 text-green-800';
    if (home < away) return 'bg-red-100 text-red-800';
    return 'bg-orange-100 text-orange-800';
}
