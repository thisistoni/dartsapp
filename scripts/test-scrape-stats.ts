/**
 * Test script to see what data can be scraped (without uploading)
 * 
 * Usage: npx tsx scripts/test-scrape-stats.ts
 */

import { fetch180sAndHighFinishes, fetchClubVenue } from '../lib/scraper';

const TEST_TEAM = 'DC Patron';

async function testScraping() {
    console.log(`🧪 Testing scrape for: ${TEST_TEAM}\n`);
    
    try {
        // Test 180s and High Finishes
        console.log('🎯 Fetching 180s and High Finishes...');
        const { oneEightys, highFinishes } = await fetch180sAndHighFinishes(TEST_TEAM);
        
        console.log('\n📊 180s Found:');
        if (oneEightys.length === 0) {
            console.log('  ❌ No 180s found!');
        } else {
            oneEightys.forEach(player => {
                console.log(`  ✅ ${player.playerName}: ${player.count}x 180s`);
            });
        }
        
        console.log('\n🔥 High Finishes Found:');
        if (highFinishes.length === 0) {
            console.log('  ❌ No high finishes found!');
        } else {
            highFinishes.forEach(player => {
                console.log(`  ✅ ${player.playerName}: ${player.finishes.join(', ')}`);
            });
        }
        
        // Test Club Venue
        console.log('\n🏠 Fetching Club Venue...');
        const venue = await fetchClubVenue(TEST_TEAM);
        
        if (!venue) {
            console.log('  ❌ No venue found!');
        } else {
            console.log(`  ✅ Club: ${venue.clubName}`);
            console.log(`     Address: ${venue.address}`);
            console.log(`     Phone: ${venue.phone || 'N/A'}`);
        }
        
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

testScraping();
