import React from 'react';

// Helper function to get player initials
const getPlayerInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

interface PlayerAvatarProps {
    name: string;
    imageUrl?: string;
    size?: 'sm' | 'md';
}

export default function PlayerAvatar({ name, imageUrl, size = 'sm' }: PlayerAvatarProps) {
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    const initials = getPlayerInitials(name);
    
    return (
        <div className={`${sizeClasses} rounded-full bg-violet-100 flex items-center justify-center overflow-hidden flex-shrink-0`}>
            {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
                <span className="font-bold text-violet-700">{initials}</span>
            )}
        </div>
    );
}
