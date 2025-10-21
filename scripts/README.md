# Supabase Population Scripts

This directory contains scripts to populate and maintain your Supabase database with league data.

## 📋 Available Scripts

### 1. `populate-from-api.ts` - Initial Setup & Quick Sync
**Purpose:** Populate all basic league data + latest matchday details

**What it does:**
- ✅ Teams
- ✅ Players  
- ✅ All matchdays & matches (basic scores)
- ✅ Team averages
- ✅ Player statistics
- ✅ Future schedule
- ✅ Cup matches
- ✅ **Latest matchday ONLY** - detailed singles games

**Usage:**
```bash
npx tsx scripts/populate-from-api.ts
```

**When to use:**
- First time setup
- Quick daily sync for latest data
- After clicking the "Sync" button in the UI

---

### 2. `populate-all-matchdays.ts` - Historical Data Backfill
**Purpose:** Get detailed singles games for ALL past matchdays

**What it does:**
- ✅ Fetches detailed match data for **every matchday**
- ✅ Saves singles games with:
  - Player matchups
  - Scores (3-1, 3-2, etc.)
  - Averages per game
  - Checkouts per game
- ✅ Creates complete historical record

**Usage:**
```bash
npx tsx scripts/populate-all-matchdays.ts
```

**When to use:**
- After running `populate-from-api.ts` for the first time
- To backfill historical matchday details
- When you want complete data for all past matchdays

**Note:** This script requires the `/api/matchDetails` endpoint to exist, which fetches individual match data from your scraper.

---

## 🚀 Recommended Workflow

### Initial Setup (First Time):
```bash
# Step 1: Run your dev server
npm run dev

# Step 2: Populate basic data + latest matchday
npx tsx scripts/populate-from-api.ts

# Step 3: (Optional) Backfill all historical matchdays
npx tsx scripts/populate-all-matchdays.ts
```

### Regular Updates (Daily/Weekly):
```bash
# Option 1: Use the UI - click "Sync" button
# Option 2: Run the script manually
npx tsx scripts/populate-from-api.ts
```

---

## 📊 Data Flow

### Latest Matchday Only (populate-from-api.ts)
```
Scraper → leagueOverview API → Supabase
          ├─ Basic match scores (all matchdays)
          └─ Detailed singles games (latest matchday only)
```

### All Matchdays (populate-all-matchdays.ts)
```
For each matchday:
  Supabase (get matches) → matchDetails API → Detailed data → Supabase
```

---

## 🔧 API Endpoints Used

### By `populate-from-api.ts`:
- `GET /api/leagueOverview` - Gets all league data including latest matchday details

### By `populate-all-matchdays.ts`:
- `GET /api/matchDetails?homeTeam=X&awayTeam=Y&matchday=N` - Gets detailed data for a specific match

### By the UI Sync Button:
- `POST /api/sync` - Triggers populate-from-api logic

### For Reading Data:
- `GET /api/leagueData` - Fast read from Supabase (default: latest only)
- `GET /api/leagueData?allMatchdays=true` - Read ALL matchdays from Supabase

---

## 📁 What Gets Saved to Supabase

### Tables Populated:

| Table | Data | Script |
|-------|------|--------|
| `teams` | Team info | Both |
| `players` | Player profiles | Both |
| `matchdays` | Match rounds | Both |
| `matches` | Match results | Both |
| `team_averages` | Team stats | populate-from-api |
| `player_statistics` | Player stats | populate-from-api |
| `league_standings` | League table | populate-from-api |
| `future_schedule` | Upcoming games | populate-from-api |
| `cup_matches` | Cup games | populate-from-api |
| **`singles_games`** | **Detailed game data** | **Both** |
| `scrape_logs` | Sync history | Both |

---

## 🎯 Performance Notes

### populate-from-api.ts:
- **Speed:** ~20-30 seconds
- **Records:** ~150-200 records
- **API calls:** 1 (leagueOverview)

### populate-all-matchdays.ts:
- **Speed:** Varies (5-10 minutes for 5 matchdays × 3 matches each)
- **Records:** ~12 singles games per match × all matches
- **API calls:** 1 per match (15+ calls for full season)
- **Delay:** 500ms between matches to avoid overwhelming server

---

## ⚠️ Important Notes

1. **Run dev server first:** Both scripts need your Next.js server running
2. **Environment variables:** Ensure `.env.local` has Supabase credentials
3. **Order matters:** Run `populate-from-api.ts` before `populate-all-matchdays.ts`
4. **Idempotent:** Safe to re-run - uses upsert/delete+insert to avoid duplicates
5. **Logs saved:** All runs are logged in the `scrape_logs` table

---

## 🐛 Troubleshooting

### "Connection failed"
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify Supabase project is running

### "No matchdays found"
- Run `populate-from-api.ts` first to create matchdays

### "Error fetching match details"
- Ensure `/api/matchDetails` endpoint exists
- Check if detailed data is available for that match on the source website
- Some older matches might not have detailed data

### Script hangs/takes too long
- Normal for `populate-all-matchdays.ts` (5-10 min)
- Check server console for progress
- Verify no network issues

---

## 📈 Next Steps After Population

1. **View your data:**
   - Open Supabase dashboard
   - Go to Table Editor
   - Browse: teams, players, singles_games, etc.

2. **Use the data in your app:**
   - Call `GET /api/leagueData` for latest matchday
   - Call `GET /api/leagueData?allMatchdays=true` for all data
   - Data loads in < 1 second from Supabase!

3. **Keep it updated:**
   - Click "Sync" button in UI after each new matchday
   - Or run scripts manually

---

## 💡 Tips

- **Testing:** Use a test season/division first
- **Monitoring:** Check `scrape_logs` table for sync history
- **Cleanup:** Delete old seasons when no longer needed
- **Automation:** Set up cron job for weekly `populate-from-api.ts`

---

## 🎉 Success Indicators

After running scripts, you should have:
- ✅ 7 teams in database
- ✅ 50+ players
- ✅ 15+ matches
- ✅ Latest matchday with 12+ singles games
- ✅ Complete player statistics
- ✅ League standings calculated
- ✅ Future schedule populated

Check your app - everything should load instantly! 🚀
