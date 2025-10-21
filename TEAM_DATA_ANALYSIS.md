# Team Detail Page - Database Integration Analysis

## 📊 Current State

### What TeamDetailPage Scrapes:
1. **Match Reports** - lineup, checkouts, opponent, score, match details (singles/doubles)
2. **League Position** - team's current position in standings
3. **Club Venue** - address, meeting time, contact
4. **Comparison Data** - team comparison statistics
5. **Team Standings** - full league table
6. **Match Averages** - team & player averages per matchday
7. **180s** - who scored 180s and how many
8. **High Finishes** - high checkout scores per player

---

## ✅ What We ALREADY Have in Supabase

From LeagueOverviewPage scraping, we already store:

### Core Match Data:
- ✅ `teams` - All teams with division
- ✅ `players` - All players with team association
- ✅ `matchdays` - All matchday dates
- ✅ `matches` - All match results (home_team, away_team, home_sets, away_sets)
- ✅ `singles_games` - All singles with players, scores, averages, checkouts
- ✅ `doubles_games` - All doubles with players, scores
- ✅ `club_venues` - Club venue information
- ✅ `future_schedule` - Upcoming matches
- ✅ `cup_matches` - Cup competition matches

### Aggregated Data:
- ✅ `player_statistics` - Player-level stats (average, singles won/lost, doubles won/lost)
- ✅ `team_averages` - Team-level averages

---

## ❌ What's MISSING from Database

### 1. **Match-Level Data We Can Calculate:**
- League standings/position (can calculate from matches)
- Team standings table (can calculate from matches)
- Match averages per matchday (can calculate from singles_games)

### 2. **Data That Might Exist But Needs Verification:**
- 180s - Schema has `one_eighties` table
- High Finishes - Schema has `high_finishes` table

### 3. **Data We Don't Store (might not need to):**
- Comparison data - Not clear what this is, may be calculated

---

## 🎯 Solution Strategy

### Phase 1: Reuse Existing Data (90% coverage)

**Create `/api/teamData/supabase` endpoint:**

```typescript
GET /api/teamData/supabase?team=TeamName&season=2025/26

Returns:
{
  players: [...],           // FROM: player_statistics filtered by team
  matchReports: [...],      // FROM: matches + singles_games + doubles_games
  leaguePosition: 3,        // CALCULATED: from matches
  clubVenue: {...},         // FROM: club_venues
  comparisonData: [...],    // CALCULATED: from team_averages
  teamStandings: {...},     // CALCULATED: from matches
  matchAverages: [...],     // CALCULATED: from singles_games grouped by match
  oneEightys: [...],        // FROM: one_eighties (if populated)
  highFinishes: [...],      // FROM: high_finishes (if populated)
  source: 'database'
}
```

### Phase 2: Enhance Sync to Store Missing Data

**Update `/api/sync` to:**
1. Store 180s in `one_eighties` table
2. Store high finishes in `high_finishes` table
3. Ensure club venues are updated

---

## 📋 Implementation Plan

### Step 1: Create Supabase-based TeamData API
- Read from existing tables
- Calculate standings/position from matches
- Aggregate match averages from singles_games
- Return team-specific data

### Step 2: Update Sync Process
- When syncing latest matchday:
  - Extract 180s and store in `one_eighties`
  - Extract high finishes and store in `high_finishes`
  - Update club venues if changed

### Step 3: Update TeamDetailPage Hook
- Try Supabase endpoint first
- Only scrape if data missing or stale
- Cache results

---

## 🔄 Data Flow

### Current (Slow):
```
TeamDetailPage → /api/teamData → Scrapes dart.at → Returns data
⏱️ ~3-5 seconds per team
```

### Optimized (Fast):
```
TeamDetailPage → /api/teamData/supabase → Supabase → Returns data
⏱️ ~200-400ms per team
```

### Sync (Once per week):
```
Sync Button → /api/sync → Scrapes latest matchday → Updates Supabase
⏱️ ~10-15 seconds for all teams
```

---

## 💾 Required Database Changes

### None! 

All tables already exist:
- ✅ `one_eighties` (just need to populate)
- ✅ `high_finishes` (just need to populate)
- ✅ All other tables already in use

---

## 🚀 Benefits

1. **Speed**: 200ms instead of 3-5s per team load
2. **Reliability**: No scraping failures
3. **Efficiency**: Sync once, serve many times
4. **Offline**: Works even if dart.at is down
