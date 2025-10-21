// Define interfaces for your data structures
export interface Player {
    playerName: string;
    adjustedAverage: number;
    singles?: string;    // W-L format (legacy)
    doubles?: string;    // W-L format (legacy)
    singlesWon?: number;    // From Supabase
    singlesLost?: number;   // From Supabase
    doublesWon?: number;    // From Supabase
    doublesLost?: number;   // From Supabase
    winRate?: number;    // Percentage
    average?: number;    // Player average
    totalGames?: number; // Total games played
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
    lineup: string[];
    checkouts: Checkout[];
    opponent: string;
    score: string;
    details: DetailedMatchReport;
    isHomeMatch?: boolean;
    seasonPrefix?: string;
    originalMatchday?: number;
}

// Define the interface for Club Venue
export interface ClubVenue {
    rank?: string;
    teamName?: string;
    clubName?: string;
    name?: string;        // From Supabase
    venue?: string;
    address: string;
    city?: string;
    phone?: string;
    zipcode?: string;     // From Supabase
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
    seasonPrefix?: string;
    originalMatchday?: number;
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

// League Overview Types
export interface LeagueMatch {
  homeTeam: string;
  awayTeam: string;
  homeLegs: number;
  awayLegs: number;
  homeSets: number;
  awaySets: number;
  matchId?: string;
}

export interface LeagueMatchday {
  round: number;
  date: string;
  matches: LeagueMatch[];
}

export interface LeagueResults {
  matchdays: LeagueMatchday[];
}

