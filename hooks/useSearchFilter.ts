import { useState, useEffect, useRef } from 'react';

export function useSearchFilter(teams: string[]) {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Include all teams + League Overview
    const allOptions = ['League Overview', ...teams];
    
    // Filter teams based on search term
    const filteredTeams = searchTerm.trim() === '' 
        ? allOptions 
        : allOptions.filter((option) => {
            const searchLower = searchTerm.toLowerCase();
            const optionLower = option.toLowerCase();
            return optionLower.includes(searchLower);
        });

    // Handle click outside to close search dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return {
        searchTerm,
        setSearchTerm,
        filteredTeams,
        searchContainerRef
    };
}
