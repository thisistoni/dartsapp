# Supabase Setup Guide

This guide will help you set up Supabase to store all your scraped darts league data.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a New Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: DartsApp (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Run the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `schema.sql` from this directory
4. Paste it into the SQL Editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned" message

This will create:
- ✅ 15+ tables for all your darts data
- ✅ Indexes for fast queries
- ✅ Views for common data retrieval
- ✅ Triggers for automatic timestamp updates
- ✅ Functions for data management

## Step 3: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (different long string)

## Step 4: Configure Environment Variables

1. In your project root, create `.env.local` file (if it doesn't exist)
2. Copy the contents from `supabase/env-template.txt`
3. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

## Step 5: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

## Step 6: Verify Connection

Create a test file to verify your connection works:

```typescript
// test-supabase.ts
import { supabase } from './lib/supabase';

async function testConnection() {
    const { data, error } = await supabase.from('teams').select('count');
    
    if (error) {
        console.error('Connection failed:', error);
    } else {
        console.log('✅ Connected to Supabase!');
        console.log('Teams table exists and is accessible');
    }
}

testConnection();
```

Run it:
```bash
npx ts-node test-supabase.ts
```

## Database Schema Overview

### Core Tables

- **teams**: All team information
- **players**: Player data with team associations
- **club_venues**: Venue details for each team

### Match Data

- **matchdays**: Each round of matches
- **matches**: Match results (sets and legs)
- **singles_games**: Individual singles game details
- **doubles_games**: Doubles game details

### Statistics

- **team_averages**: Team performance metrics
- **player_statistics**: Individual player stats
- **league_standings**: Current league table

### Schedule

- **future_schedule**: Upcoming league matches
- **cup_matches**: Cup competition games

### Achievements

- **one_eighties**: 180 score records
- **high_finishes**: High checkout records

### Metadata

- **scrape_logs**: Track all scraping operations

## Using the Helper Functions

The `lib/supabase.ts` file provides helper functions for common operations:

### Example: Saving Scraped Match Data

```typescript
import { 
    upsertTeam, 
    upsertMatchday, 
    upsertMatch,
    logScrape 
} from '@/lib/supabase';

async function saveMatchData(scrapedData: any) {
    try {
        // 1. Create/update teams
        const homeTeam = await upsertTeam(
            scrapedData.homeTeam,
            '5',
            '2025/26'
        );
        
        const awayTeam = await upsertTeam(
            scrapedData.awayTeam,
            '5',
            '2025/26'
        );
        
        // 2. Create/update matchday
        const matchday = await upsertMatchday(
            scrapedData.round,
            scrapedData.date,
            '2025/26'
        );
        
        // 3. Create/update match
        const match = await upsertMatch({
            matchdayId: matchday.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            homeSets: scrapedData.homeSets,
            awaySets: scrapedData.awaySets,
            homeLegs: scrapedData.homeLegs,
            awayLegs: scrapedData.awayLegs,
            season: '2025/26'
        });
        
        // 4. Log the scrape
        await logScrape('match_result', '2025/26', 'success', 1);
        
        console.log('✅ Match data saved:', match.id);
    } catch (error) {
        console.error('Error saving match data:', error);
        await logScrape('match_result', '2025/26', 'error', 0, error.message);
    }
}
```

### Example: Retrieving Data

```typescript
import { 
    getLeagueStandings,
    getPlayerPerformance,
    getLatestMatches 
} from '@/lib/supabase';

async function displayData() {
    // Get current standings
    const standings = await getLeagueStandings('2025/26');
    console.log('League Table:', standings);
    
    // Get player stats
    const players = await getPlayerPerformance('2025/26');
    console.log('Top Players:', players.slice(0, 5));
    
    // Get recent matches
    const matches = await getLatestMatches('2025/26', 5);
    console.log('Recent Matches:', matches);
}
```

## Views Available

The schema creates several views for easy data access:

### v_latest_matches
All matches with team names, ordered by date

```sql
SELECT * FROM v_latest_matches WHERE season = '2025/26';
```

### v_player_performance
Complete player stats with team info

```sql
SELECT * FROM v_player_performance 
WHERE season = '2025/26' 
ORDER BY combined_percentage DESC 
LIMIT 10;
```

### v_team_standings
League table with all stats

```sql
SELECT * FROM v_team_standings 
WHERE season = '2025/26' 
ORDER BY position;
```

## Data Migration Strategy

### Option 1: Migrate Existing Data

If you have existing scraped data, create a migration script:

```typescript
// scripts/migrate-to-supabase.ts
import { supabase } from './lib/supabase';
import existingData from './data/existing-data.json';

async function migrateData() {
    console.log('Starting migration...');
    
    // Migrate teams
    for (const team of existingData.teams) {
        await upsertTeam(team.name, team.division, '2025/26');
    }
    
    // Migrate players
    // Migrate matches
    // etc...
    
    console.log('✅ Migration complete!');
}

migrateData();
```

### Option 2: Fresh Start

Simply start scraping and saving to Supabase going forward. The upsert functions will handle duplicates automatically.

## Backup and Recovery

### Backup Database

In Supabase Dashboard → Database → Backups:
- Free tier: Daily automated backups (7-day retention)
- Pro tier: Point-in-time recovery

### Manual Backup

```bash
# Export to SQL
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

## Performance Tips

1. **Use Indexes**: Already created in schema for common queries
2. **Use Views**: Faster than complex joins in application code
3. **Batch Operations**: Use Supabase batch inserts for multiple records
4. **Caching**: Cache frequently accessed data in your app

## Security Considerations

1. **RLS (Row Level Security)**: Currently disabled. Enable if you need user-specific data access
2. **API Keys**: 
   - Use `anon key` for client-side operations
   - Use `service_role key` only for server-side operations
3. **Never expose service_role key in client code**

## Troubleshooting

### Connection Errors

```
Error: Invalid API key
```
**Solution**: Check your .env.local file has correct keys

### Schema Errors

```
Error: relation "teams" does not exist
```
**Solution**: Re-run the schema.sql file in SQL Editor

### Unique Constraint Violations

```
Error: duplicate key value violates unique constraint
```
**Solution**: Use upsert functions instead of insert functions

## Next Steps

1. ✅ Schema created
2. ✅ Environment configured
3. ✅ Helper functions ready
4. 🔄 Modify your scraping scripts to save to Supabase
5. 🔄 Update API routes to read from Supabase
6. 🔄 Test the full flow

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- SQL Reference: https://www.postgresql.org/docs/

## Schema Visualization

```
teams ────┬──── club_venues
          ├──── players ──── player_statistics
          ├──── league_standings
          ├──── team_averages
          └──── matches ────┬──── singles_games
                             ├──── doubles_games
                             ├──── one_eighties
                             └──── high_finishes

matchdays ──── matches

future_schedule
cup_matches
scrape_logs
```
