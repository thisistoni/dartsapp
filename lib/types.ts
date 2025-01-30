// Define interfaces for your data structures
export interface Player {
    playerName: string;
    adjustedAverage: number;
    singles?: string;    // W-L format
    doubles?: string;    // W-L format
    winRate?: number;    // Percentage
    // Add other properties if necessary
}

export interface TeamData {
    players: Player[];
    // Add other properties if necessary
}

export interface Checkout {
    scores: string;
}

interface SingleMatch {
    homePlayer: string;
    awayPlayer: string;
    homeScore: number;
    awayScore: number;
}

interface DoubleMatch {
    homePlayers: string[];
    awayPlayers: string[];
    homeScore: number;
    awayScore: number;
}

export interface DetailedMatchReport {
    singles: SingleMatch[];    // For matches 1,2,5,6
    doubles: DoubleMatch[];    // For matches 3,4,7,8
    totalLegs: {
        home: number;
        away: number;
    };
    totalSets: {
        home: number;
        away: number;
    };
}

export interface MatchReport {
    matchId: string;
    lineup: string[];
    checkouts: Checkout[];
    opponent: string;
    score: string;
    details: DetailedMatchReport;
}

// Define the interface for Club Venue
export interface ClubVenue {
    rank: string;
    teamName: string;
    clubName: string;
    venue: string;
    address: string;
    city: string;
    phone: string;
}

// Add new type
export interface ComparisonData {
    opponent: string;
    firstRound: string | null;
    secondRound: string | null;
}

export interface TeamStandings {
    wins: number;
    draws: number;
    losses: number;
}

// Add these new types
export interface MatchAverages {
    matchday: number;
    teamAverage: number;
    playerAverages: PlayerMatchAverage[];
    opponent: string;
}

export interface PlayerMatchAverage {
    playerName: string;
    average: number;
}

export interface PlayerBestPerformance {
    playerName: string;
    currentAverage: number;
    bestAverage: number;
    bestMatchday: number;
    difference: number;
}

// Add these interfaces
export interface OneEighty {
  playerName: string;
  count: number;
}

export interface HighFinish {
  playerName: string;
  finishes: number[];
}

