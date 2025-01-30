import { Schema, model, models, Document } from 'mongoose';

export interface PlayerRanking {
  name: string;
  position: number;
  wins: number;
  losses: number;
  challengesLeft: number;
  challengedBy?: string[];
  average?: number;
}

export interface MonthlyTable extends Document {
  month: string; // Format: "YYYY-MM"
  players: PlayerRanking[];
  challenges: Challenge[];
}

export interface Challenge {
    challenger: string;
    defender: string;
    date: Date;
    isRematch: boolean;
    completed: boolean;
    result?: { winner: string };
}

const monthlyTableSchema = new Schema<MonthlyTable>({
  month: { type: String, required: true },
  players: [{
    name: { type: String, required: true },
    position: { type: Number, required: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    challengesLeft: { type: Number, default: 2 },
    challengedBy: [String]
  }],
  challenges: [{
    challenger: String,
    defender: String,
    date: Date,
    isRematch: Boolean,
    completed: Boolean,
    result: {
      challengerScore: Number,
      defenderScore: Number
    }
  }]
});

export const MonthlyTable = models.MonthlyTable || model<MonthlyTable>('MonthlyTable', monthlyTableSchema); 