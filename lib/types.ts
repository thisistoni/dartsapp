// Define interfaces for your data structures
export interface Player {
    playerName: string;
    adjustedAverage: number;
    // Add other properties if necessary
}

export interface TeamData {
    players: Player[];
    // Add other properties if necessary
}

export interface Checkout {
    scores: string;
}

export interface MatchReport {
    lineup: string[];
    checkouts: Checkout[];
    opponent: string;
    // Add other properties if necessary
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

