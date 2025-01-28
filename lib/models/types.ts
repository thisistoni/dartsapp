import { Schema, model, models, Document } from 'mongoose';
import { Player, MatchReport, ClubVenue, ComparisonData, TeamStandings, MatchAverages, OneEighty, HighFinish } from '../types';

// Interface for team data document
export interface TeamDataDocument extends Document {
  teamName: string;
  lastUpdated: Date;
  players: Player[];
  matchReports: MatchReport[];
  leaguePosition: number;
  clubVenue: ClubVenue;
  comparisonData: ComparisonData[];
  teamStandings: TeamStandings;
  matchAverages: MatchAverages[];
  oneEightys: OneEighty[];
  highFinishes: HighFinish[];
}

// Schema for team data
const teamDataSchema = new Schema<TeamDataDocument>({
  teamName: { type: String, required: true, unique: true },
  lastUpdated: { type: Date, required: true },
  players: [{
    playerName: String,
    adjustedAverage: Number,
    singles: String,
    doubles: String,
    winRate: Number
  }],
  matchReports: [{
    lineup: [String],
    checkouts: [{
      scores: String
    }],
    opponent: String,
    score: String,
    details: {
      singles: [{
        homePlayer: String,
        awayPlayer: String,
        homeScore: Number,
        awayScore: Number
      }],
      doubles: [{
        homePlayers: [String],
        awayPlayers: [String],
        homeScore: Number,
        awayScore: Number
      }],
      totalLegs: {
        home: Number,
        away: Number
      },
      totalSets: {
        home: Number,
        away: Number
      }
    }
  }],
  leaguePosition: Number,
  clubVenue: {
    rank: String,
    teamName: String,
    clubName: String,
    venue: String,
    address: String,
    city: String,
    phone: String
  },
  comparisonData: [{
    opponent: String,
    firstRound: String,
    secondRound: String
  }],
  teamStandings: {
    wins: Number,
    draws: Number,
    losses: Number
  },
  matchAverages: [{
    matchday: Number,
    teamAverage: Number,
    playerAverages: [{
      playerName: String,
      average: Number
    }]
  }],
  oneEightys: [{
    playerName: String,
    count: Number
  }],
  highFinishes: [{
    playerName: String,
    finishes: [Number]
  }]
});

export const TeamData = models.TeamData || model<TeamDataDocument>('TeamData', teamDataSchema); 