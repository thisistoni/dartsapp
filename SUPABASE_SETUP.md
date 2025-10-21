# ✅ Supabase Integration - Quick Start

## What's Been Created

### 1. Database Schema (`supabase/schema.sql`)
Complete PostgreSQL schema with:
- **15 tables** for all your darts data
- **Indexes** for fast queries
- **Views** for easy data access
- **Triggers** for automatic updates
- **Functions** for data management

### 2. Supabase Client (`lib/supabase.ts`)
TypeScript utilities with:
- Supabase client configuration
- Type definitions for all tables
- Helper functions for CRUD operations
- Query functions for common data retrieval

### 3. Migration Script (`scripts/save-to-supabase.ts`)
Example script to:
- Save scraped data to Supabase
- Handle teams, players, matches, statistics
- Log all operations
- Error handling

### 4. Documentation (`supabase/README.md`)
Complete guide with:
- Step-by-step setup instructions
- API examples
- Troubleshooting tips
- Schema visualization

## Quick Setup (5 Minutes)

### Step 1: Create Supabase Project
```
1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Choose name, password, region
5. Wait for project to initialize (~2 min)
```

### Step 2: Run Database Schema
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy all of supabase/schema.sql
4. Paste and click "Run"
```

### Step 3: Get API Keys
```
1. Go to Settings → API
2. Copy:
   - Project URL
   - anon/public key
```

### Step 4: Configure Environment
```bash
# Create .env.local file in project root
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Install Package
```bash
npm install @supabase/supabase-js
```

### Step 6: Test Connection
```typescript
import { supabase } from './lib/supabase';

const { data } = await supabase.from('teams').select('count');
console.log('✅ Connected!');
```

## Database Tables Overview

### Core Data
- `teams` - Team information
- `players` - Player profiles
- `club_venues` - Venue details

### Match Data
- `matchdays` - Match rounds
- `matches` - Match results
- `singles_games` - Singles game details
- `doubles_games` - Doubles game details

### Statistics  
- `player_statistics` - Player stats per season
- `team_averages` - Team performance metrics
- `league_standings` - League table

### Schedule
- `future_schedule` - Upcoming matches
- `cup_matches` - Cup games

### Achievements
- `one_eighties` - 180 records
- `high_finishes` - High checkout records

### Metadata
- `scrape_logs` - Scraping activity logs

## Usage Examples

### Save Match Data
```typescript
import { upsertTeam, upsertMatch, upsertMatchday } from '@/lib/supabase';

// Save a match
const homeTeam = await upsertTeam('Dartclub Twentytwo 4', '5', '2025/26');
const awayTeam = await upsertTeam('PSV Wien Darts 1', '5', '2025/26');
const matchday = await upsertMatchday(1, '2024-09-15', '2025/26');

await upsertMatch({
    matchdayId: matchday.id,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeSets: 7,
    awaySets: 2,
    homeLegs: 28,
    awayLegs: 12,
    season: '2025/26'
});
```

### Get League Standings
```typescript
import { getLeagueStandings } from '@/lib/supabase';

const standings = await getLeagueStandings('2025/26');
console.log(standings);
```

### Get Player Stats
```typescript
import { getPlayerPerformance } from '@/lib/supabase';

const topPlayers = await getPlayerPerformance('2025/26');
console.log(topPlayers.slice(0, 10)); // Top 10 players
```

## Migration Strategy

### Option A: Migrate Existing Data
Run the migration script to move existing JSON data to Supabase:
```bash
npx ts-node scripts/save-to-supabase.ts
```

### Option B: Fresh Start
Update your scraping scripts to save directly to Supabase going forward.

## Modify Your API Routes

### Before (reading from scraper):
```typescript
// api/leagueOverview/route.ts
export async function GET() {
    const data = await scrapeLeagueData();
    return Response.json(data);
}
```

### After (reading from Supabase):
```typescript
// api/leagueOverview/route.ts
import { getLeagueStandings, getLatestMatches } from '@/lib/supabase';

export async function GET() {
    const standings = await getLeagueStandings('2025/26');
    const matches = await getLatestMatches('2025/26');
    
    return Response.json({ standings, matches });
}
```

## Benefits of Supabase

✅ **No more scraping delays** - Data loads instantly  
✅ **Historical data** - Keep all seasons forever  
✅ **Real-time updates** - Supabase realtime subscriptions available  
✅ **Powerful queries** - PostgreSQL with views and joins  
✅ **Auto-scaling** - Handles traffic spikes  
✅ **Backups** - Automated daily backups  
✅ **Free tier** - Up to 500MB database, 2GB file storage  

## Next Steps

1. ✅ Create Supabase project
2. ✅ Run schema.sql
3. ✅ Configure environment variables
4. ✅ Install @supabase/supabase-js
5. 🔄 Migrate existing data (optional)
6. 🔄 Update API routes to use Supabase
7. 🔄 Update scraping scripts to save to Supabase
8. 🔄 Test the full flow

## Support Files

- `supabase/schema.sql` - Complete database schema
- `supabase/README.md` - Detailed setup guide
- `lib/supabase.ts` - Helper functions
- `scripts/save-to-supabase.ts` - Migration example
- `supabase/env-template.txt` - Environment template

## Common Issues

**Q: Connection refused**  
A: Check your Supabase URL and API keys in .env.local

**Q: Table doesn't exist**  
A: Re-run the schema.sql file in Supabase SQL Editor

**Q: Duplicate key errors**  
A: Use the upsert functions - they handle duplicates automatically

**Q: Slow queries**  
A: Indexes are already created. Check Supabase Dashboard → Database → Performance

## Resources

- 📚 Full docs: `supabase/README.md`
- 🗄️ Schema: `supabase/schema.sql`
- 🔧 Helpers: `lib/supabase.ts`
- 📝 Example: `scripts/save-to-supabase.ts`
- 🌐 Supabase Docs: https://supabase.com/docs
- 💬 Supabase Discord: https://discord.supabase.com
