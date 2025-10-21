import { Users, User, BarChart, Target, Calendar, Trophy, CheckCircle } from 'lucide-react';
import { NavigationItem } from '@/types/navigation';

/**
 * Navigation items for team detail pages
 */
export const teamNavigationItems: NavigationItem[] = [
    {
        id: 'matches',
        label: 'Matches',
        icon: Users,
    },
    {
        id: 'mergedStats',
        label: 'Player Overview',
        icon: User,
        mobileLabel: 'Players',
    },
    {
        id: 'pairs',
        label: 'Pairs',
        icon: Users,
    },
    {
        id: 'charts',
        label: 'Charts',
        icon: BarChart,
    },
    {
        id: 'details',
        label: 'Checkouts',
        icon: Target,
    },
    {
        id: 'schedule',
        label: 'Schedule',
        icon: Calendar,
    },
];

/**
 * Navigation items for league overview page
 */
export const leagueNavigationItems: NavigationItem[] = [
    {
        id: 'table',
        label: 'Table',
        icon: Trophy,
    },
    {
        id: 'latest',
        label: 'Latest',
        icon: CheckCircle,
    },
    {
        id: 'statistics',
        label: 'Statistics',
        icon: BarChart,
        mobileLabel: 'Stats',
    },
    {
        id: 'results',
        label: 'Results',
        icon: Calendar,
    },
    {
        id: 'schedule',
        label: 'Schedule',
        icon: Calendar,
    },
];

/**
 * Filter navigation items based on conditions
 * Used for conditional rendering (e.g., hide some items for certain teams)
 */
export function filterNavigationItems(
    items: NavigationItem[],
    condition: boolean
): NavigationItem[] {
    if (condition) {
        return items;
    }
    // Filter out conditional items (mergedStats and schedule for certain teams)
    return items.filter(item => item.id !== 'mergedStats' && item.id !== 'schedule');
}
