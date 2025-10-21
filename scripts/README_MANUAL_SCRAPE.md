# Manual Scraping Scripts

These scripts let you manually scrape and upload 180s, High Finishes, and Club Venues to Supabase.

## 🧪 Step 1: Test if scraping works

First, test if the scraper can actually get the data:

```bash
npx tsx scripts/test-scrape-stats.ts
```

This will scrape **DC Patron** and show you what data it finds. You should see:
```
🧪 Testing scrape for: DC Patron

🎯 Fetching 180s and High Finishes...

📊 180s Found:
  ✅ Marko Cvejic: 5x 180s
  ✅ Muhamet Mahmutaj: 3x 180s
  ...

🔥 High Finishes Found:
  ✅ Marko Cvejic: 140, 120, 116
  ...

🏠 Fetching Club Venue...
  ✅ Club: DC Patron
     Address: ...
     Phone: ...
```

**If this works**, proceed to Step 2.  
**If you get errors or no data**, let me know what the output says.

---

## 🚀 Step 2: Upload all data to Supabase

Once the test works, run the full script to upload data for ALL teams:

```bash
npx tsx scripts/scrape-special-stats.ts
```

This will:
1. Scrape 180s, High Finishes, and Club Venues for all 7 teams
2. Upload everything to Supabase
3. Show progress for each team

Expected output:
```
🚀 Starting manual scrape of 180s, High Finishes, and Club Venues

📍 Processing DC Patron...
  🎯 Scraping 180s and High Finishes...
    ✅ Saved 5 players with 180s, 8 players with high finishes
  🏠 Scraping club venue...
    ✅ Saved venue: DC Patron

📍 Processing PSV Wien Darts 1...
  ...

==================================================
🎉 Scraping complete!

📊 Summary:
   - 180s saved: 45
   - High finishes saved: 120
   - Venues saved: 7
==================================================
```

---

## ⏱️ How long does it take?

- **Test script**: ~5-10 seconds (1 team)
- **Full script**: ~2-3 minutes (7 teams)

---

## 🔍 Verify the data

After running the full script, check your Supabase tables:
- `one_eighties` - Should have ~40-50 rows
- `high_finishes` - Should have ~100-150 rows
- `club_venues` - Should have 7 rows

Then refresh your app and check a team page - the 180s and high finishes should show in TopPerformersCard!
