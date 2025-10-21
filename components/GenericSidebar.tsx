import React from 'react';
import { Section, NavigationItem } from '@/types/navigation';

interface GenericSidebarProps {
    activeSection: Section;
    setActiveSection: (section: Section) => void;
    navigationItems: NavigationItem[];
}

/**
 * Generic collapsible sidebar navigation
 * Accepts navigation items as props for flexible content
 */
export default function GenericSidebar({
    activeSection,
    setActiveSection,
    navigationItems
}: GenericSidebarProps) {
    return (
        <aside className="hidden lg:block w-16 hover:w-64 flex-shrink-0 transition-all duration-300 group">
            <div className="sticky top-4 space-y-2">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                                activeSection === item.id
                                    ? 'bg-green-50 text-green-700 font-semibold border border-green-200'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            title={item.label}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}
