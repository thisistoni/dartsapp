import mongoose, { Schema } from 'mongoose';

const MatchReportSchema = new Schema({
  matchId: String,
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
      homePlayer: String,
      awayPlayer: String,
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
});

const TeamDataSchema = new Schema({
  teamName: String,
  matchReports: [MatchReportSchema],
  lastUpdated: Date
});

export default mongoose.models.TeamData || mongoose.model('TeamData', TeamDataSchema); 