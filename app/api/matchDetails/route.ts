/**
 * API Endpoint to get detailed match data for a specific match
 * Used by the populate-all-matchdays.ts script to backfill historical data
 * 
 * GET /api/matchDetails?homeTeam=X&awayTeam=Y&matchday=N
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.dart.at';

interface SingleGame {
    homePlayer: string;
    awayPlayer: string;
    homeScore: number;
    awayScore: number;
    homeAverage: number;
    awayAverage: number;
    homeCheckouts: string[];
    awayCheckouts: string[];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const homeTeam = searchParams.get('homeTeam');
        const awayTeam = searchParams.get('awayTeam');
        const matchday = searchParams.get('matchday');

        if (!homeTeam || !awayTeam || !matchday) {
            return NextResponse.json({
                error: 'Missing required parameters: homeTeam, awayTeam, matchday'
            }, { status: 400 });
        }

        console.log(`🔍 Fetching match details: ${homeTeam} vs ${awayTeam} (MD ${matchday})`);

        // Fetch the league overview page to find the match link
        const overviewUrl = `${BASE_URL}/wdv/liga/spieltag/5A/2025_26/`;
        const overviewResponse = await axios.get(overviewUrl);
        const $overview = cheerio.load(overviewResponse.data);

        // Find the specific match link
        let matchLink = '';
        $overview('.matchday').each((_, mdElement) => {
            const round = $overview(mdElement).find('.round').first().text().trim();
            
            if (round === matchday) {
                $overview(mdElement).find('.match').each((_, matchElement) => {
                    const homeText = $overview(matchElement).find('.home').text().trim();
                    const awayText = $overview(matchElement).find('.away').text().trim();
                    
                    if (homeText === homeTeam && awayText === awayTeam) {
                        const link = $overview(matchElement).find('a').attr('href');
                        if (link) {
                            matchLink = link.startsWith('http') ? link : `${BASE_URL}${link}`;
                        }
                    }
                });
            }
        });

        if (!matchLink) {
            return NextResponse.json({
                error: 'Match not found',
                message: `Could not find match: ${homeTeam} vs ${awayTeam} on matchday ${matchday}`
            }, { status: 404 });
        }

        // Fetch the detailed match page
        console.log(`📄 Fetching match page: ${matchLink}`);
        const matchResponse = await axios.get(matchLink);
        const $ = cheerio.load(matchResponse.data);

        const singles: SingleGame[] = [];

        // Parse singles games
        $('.singles-game, .match-single').each((_, gameElement) => {
            const homePlayer = $(gameElement).find('.home-player, .player-home').text().trim();
            const awayPlayer = $(gameElement).find('.away-player, .player-away').text().trim();
            
            const homeScoreText = $(gameElement).find('.home-score, .score-home').text().trim();
            const awayScoreText = $(gameElement).find('.away-score, .score-away').text().trim();
            
            const homeScore = parseInt(homeScoreText) || 0;
            const awayScore = parseInt(awayScoreText) || 0;
            
            const homeAverageText = $(gameElement).find('.home-average, .average-home').text().trim();
            const awayAverageText = $(gameElement).find('.away-average, .average-away').text().trim();
            
            const homeAverage = parseFloat(homeAverageText) || 0;
            const awayAverage = parseFloat(awayAverageText) || 0;
            
            const homeCheckoutsText = $(gameElement).find('.home-checkouts, .checkouts-home').text().trim();
            const awayCheckoutsText = $(gameElement).find('.away-checkouts, .checkouts-away').text().trim();
            
            const homeCheckouts = homeCheckoutsText ? homeCheckoutsText.split(',').map(c => c.trim()).filter(Boolean) : [];
            const awayCheckouts = awayCheckoutsText ? awayCheckoutsText.split(',').map(c => c.trim()).filter(Boolean) : [];

            if (homePlayer && awayPlayer) {
                singles.push({
                    homePlayer,
                    awayPlayer,
                    homeScore,
                    awayScore,
                    homeAverage,
                    awayAverage,
                    homeCheckouts,
                    awayCheckouts
                });
            }
        });

        if (singles.length === 0) {
            console.log('⚠️  No singles games found - match might not have detailed data yet');
        }

        const result = {
            homeTeam,
            awayTeam,
            matchday: parseInt(matchday),
            singles,
            _meta: {
                source: 'web_scraper',
                url: matchLink,
                timestamp: new Date().toISOString()
            }
        };

        console.log(`✅ Found ${singles.length} singles games`);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error fetching match details:', error.message);
        return NextResponse.json({
            error: 'Failed to fetch match details',
            message: error.message
        }, { status: 500 });
    }
}
