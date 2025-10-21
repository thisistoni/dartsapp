import React from 'react';

export type Section = 'matches' | 'mergedStats' | 'pairs' | 'charts' | 'details' | 'schedule' | 'table' | 'latest' | 'statistics' | 'results';

export interface NavigationItem {
    id: Section;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    mobileLabel?: string; // Optional shorter label for mobile
}
