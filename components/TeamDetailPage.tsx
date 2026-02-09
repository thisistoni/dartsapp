import React from 'react';
import { Section } from '@/types/navigation';
import { TeamData, TeamStandings, ClubVenue, OneEighty, HighFinish, MatchReport, Player, MatchAverages } from '@/lib/types';
import GenericSidebar from './GenericSidebar';
import GenericMobileNavbar from './GenericMobileNavbar';
import { teamNavigationItems, filterNavigationItems } from '@/constants';
import TeamDashboardCard from './TeamDashboardCard';
import TopPerformersCard from './TopPerformersCard';
import MatchesTab from './matches/MatchesTab';
import ChartsTab from './ChartsTab';
import CheckoutsTab from './CheckoutsTab';
import ScheduleTab from './ScheduleTab';
import PairsTab from './PairsTab';
import PlayerOverviewTab from './PlayerOverviewTab';

interface TeamDetailPageProps {
    // Navigation
    activeSection: Section;
    setActiveSection: (section: Section) => void;
    
    // Team & Season
    selectedTeam: string;
    selectedSeason: string;
    setSelectedSeason: (season: '2025/26' | '2024/25' | 'all') => void;
    
    // Team Data
    teamData: TeamData | null;
    teamStandings: TeamStandings | null;
    leaguePosition: number | null;
    teamAverage: number | null;
    clubVenue: ClubVenue | null;
    
    // Performance Data
    oneEightys: OneEighty[];
    highFinishes: HighFinish[];
    sortedPlayers: Player[];
    teamWinRate: number;
    
    // Match Data
    matchReports: MatchReport[];
    matchAverages: MatchAverages[];
    scheduleData: any;
    
    // Comparison
    teams: string[];
    comparisonTeam: string;
    setComparisonTeam: (team: string) => void;
    fetchComparisonTeam: (team: string, season?: string) => void;
    comparisonLoading: boolean;
    comparisonTeamData: TeamData | null;
    setComparisonTeamData: React.Dispatch<React.SetStateAction<TeamData | null>>;
    
    // Player Selection
    selectedPlayer: string;
    setSelectedPlayer: (player: string) => void;
    selectedPlayerFilter: string;
    setSelectedPlayerFilter: (filter: string) => void;
    selectedOpponentFilter: string;
    setSelectedOpponentFilter: (filter: string) => void;
    checkoutPlayerFilter: string;
    setCheckoutPlayerFilter: (filter: string) => void;
    
    // Charts Data
    runningAverages: any;
    matchData: any;
    pairStats: any;
    
    // Utility Functions
    playerImages: { [key: string]: string };
    getBestCheckouts: (playerName: string, isTeam?: boolean) => number[];
    getLowestThreeCheckouts: () => number[];
}

export default function TeamDetailPage({
    activeSection,
    setActiveSection,
    selectedTeam,
    selectedSeason,
    setSelectedSeason,
    teamData,
    teamStandings,
    leaguePosition,
    teamAverage,
    clubVenue,
    oneEightys,
    highFinishes,
    sortedPlayers,
    teamWinRate,
    matchReports,
    matchAverages,
    scheduleData,
    teams,
    comparisonTeam,
    setComparisonTeam,
    fetchComparisonTeam,
    comparisonLoading,
    comparisonTeamData,
    setComparisonTeamData,
    selectedPlayer,
    setSelectedPlayer,
    selectedPlayerFilter,
    setSelectedPlayerFilter,
    selectedOpponentFilter,
    setSelectedOpponentFilter,
    checkoutPlayerFilter,
    setCheckoutPlayerFilter,
    runningAverages,
    matchData,
    pairStats,
    playerImages,
    getBestCheckouts,
    getLowestThreeCheckouts
}: TeamDetailPageProps) {
    const inverseMatchReports = React.useMemo(() => [...matchReports].reverse(), [matchReports]);
    const inverseMatchAverages = React.useMemo(() => [...matchAverages].reverse(), [matchAverages]);

    // Determine which navigation items to show based on team and season
    const showConditionalSections = !(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                                    selectedTeam !== 'Fortunas Wölfe' && 
                                    selectedTeam !== 'DC Patron II';
    
    const navigationItems = filterNavigationItems(teamNavigationItems, showConditionalSections);
    
    return (
        <div className="flex gap-6 relative pb-20 lg:pb-0">
            {/* Desktop Sidebar */}
            <GenericSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                navigationItems={navigationItems}
            />
            
            {/* Mobile Bottom Navbar */}
            <GenericMobileNavbar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                navigationItems={navigationItems}
            />
            
            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                {/* Team Dashboard Card */}
                <TeamDashboardCard
                    selectedTeam={selectedTeam}
                    selectedSeason={selectedSeason}
                    setSelectedSeason={setSelectedSeason}
                    leaguePosition={leaguePosition}
                    teamAverage={teamAverage}
                    oneEightys={oneEightys}
                    highFinishes={highFinishes}
                    clubVenue={clubVenue}
                    teamData={teamData}
                    teamStandings={teamStandings}
                    teams={teams}
                    comparisonTeam={comparisonTeam}
                    setComparisonTeam={setComparisonTeam}
                    fetchComparisonTeam={fetchComparisonTeam}
                    comparisonLoading={comparisonLoading}
                    comparisonTeamData={comparisonTeamData}
                    setComparisonTeamData={setComparisonTeamData}
                />

                {/* Top Performers Card */}
                <TopPerformersCard
                    selectedTeam={selectedTeam}
                    selectedSeason={selectedSeason}
                    teamData={teamData}
                    playerImages={playerImages}
                    oneEightys={oneEightys}
                    highFinishes={highFinishes}
                />

                {activeSection === 'matches' && (
                    <MatchesTab
                        matchReports={matchReports}
                        matchAverages={matchAverages}
                        sortedPlayers={sortedPlayers}
                        playerImages={playerImages}
                        selectedPlayerFilter={selectedPlayerFilter}
                        setSelectedPlayerFilter={setSelectedPlayerFilter}
                        selectedOpponentFilter={selectedOpponentFilter}
                        setSelectedOpponentFilter={setSelectedOpponentFilter}
                    />
                )}
        
                {activeSection === 'charts' && (
                    <ChartsTab
                        selectedPlayer={selectedPlayer}
                        setSelectedPlayer={setSelectedPlayer}
                        teamData={teamData}
                        runningAverages={runningAverages}
                        matchData={matchData}
                        matchReports={inverseMatchReports}
                    />
                )}

                {activeSection === 'details' && (
                    <CheckoutsTab
                        matchReports={matchReports}
                        checkoutPlayerFilter={checkoutPlayerFilter}
                        setCheckoutPlayerFilter={setCheckoutPlayerFilter}
                    />
                )}

                {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                 selectedTeam !== 'Fortunas Wölfe' && 
                 selectedTeam !== 'DC Patron II' && activeSection === 'schedule' && (
                    <ScheduleTab
                        selectedTeam={selectedTeam}
                        scheduleData={scheduleData}
                    />
                )}

                {activeSection === 'pairs' && (
                    <PairsTab
                        selectedPlayer={selectedPlayer}
                        setSelectedPlayer={setSelectedPlayer}
                        selectedTeam={selectedTeam}
                        selectedSeason={selectedSeason}
                        teamData={teamData}
                        pairStats={pairStats}
                        playerImages={playerImages}
                    />
                )}

                {!(selectedTeam === 'DC Patron' && selectedSeason !== '2025/26') && 
                 selectedTeam !== 'Fortunas Wölfe' && 
                 selectedTeam !== 'DC Patron II' && activeSection === 'mergedStats' && (
                    <PlayerOverviewTab
                        selectedTeam={selectedTeam}
                        sortedPlayers={sortedPlayers}
                        teamAverage={teamAverage}
                        teamWinRate={teamWinRate}
                        matchAverages={inverseMatchAverages}
                        matchReports={inverseMatchReports}
                        oneEightys={oneEightys}
                        highFinishes={highFinishes}
                        playerImages={playerImages}
                        getBestCheckouts={getBestCheckouts}
                        getLowestThreeCheckouts={getLowestThreeCheckouts}
                    />
                )}
            </div>
        </div>
    );
}
