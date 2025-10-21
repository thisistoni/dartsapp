import React from 'react';
import { Section, NavigationItem } from '@/types/navigation';

interface GenericMobileNavbarProps {
    activeSection: Section;
    setActiveSection: (section: Section) => void;
    navigationItems: NavigationItem[];
}

/**
 * Generic mobile bottom navigation bar
 * Accepts navigation items as props for flexible content
 */
export default function GenericMobileNavbar({
    activeSection,
    setActiveSection,
    navigationItems
}: GenericMobileNavbarProps) {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-[9999] pb-safe">
            <div className="flex justify-around items-center px-2 py-2">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation ${
                                activeSection === item.id
                                    ? 'text-green-600'
                                    : 'text-gray-600'
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs">{item.mobileLabel || item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
