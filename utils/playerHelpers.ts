import { Player } from '@/lib/types';

/**
 * Sort players by specified column and direction
 * @param players - Array of players to sort
 * @param sortColumn - Column to sort by
 * @param sortDirection - Sort direction ('asc' or 'desc')
 * @returns Sorted array of players
 */
export function sortPlayers(
    players: Player[],
    sortColumn: string,
    sortDirection: 'asc' | 'desc'
): Player[] {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    return [...players].sort((a, b) => {
        switch (sortColumn) {
            case 'playerName':
                return direction * a.playerName.localeCompare(b.playerName);
            case 'average':
                return direction * (a.adjustedAverage - b.adjustedAverage);
            case 'singles': {
                const [aWins = 0] = a.singles?.split('-').map(Number) || [0];
                const [bWins = 0] = b.singles?.split('-').map(Number) || [0];
                return direction * (aWins - bWins);
            }
            case 'doubles': {
                const [aWins = 0] = a.doubles?.split('-').map(Number) || [0];
                const [bWins = 0] = b.doubles?.split('-').map(Number) || [0];
                return direction * (aWins - bWins);
            }
            case 'winRate':
                return direction * ((a.winRate || 0) - (b.winRate || 0));
            default:
                return 0;
        }
    });
}

/**
 * Get initials from a player name
 * @param name - Full player name
 * @returns Initials (2 characters)
 */
export function getInitials(name: string): string {
    const parts = name.split(' ');
    return parts.length > 1 
        ? `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
}
