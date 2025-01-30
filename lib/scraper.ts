import axios from 'axios';
import * as cheerio from 'cheerio';
import axiosRetry from 'axios-retry';
import { ClubVenue, MatchReport, Player, ComparisonData, TeamStandings, OneEighty, HighFinish } from './types';

// Configure axios with retry logic
axiosRetry(axios, { 
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 1000; // Wait 1s, 2s, 3s between retries
    },
    retryCondition: (error) => {
        // Retry on network errors and 5xx responses
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               error.code === 'ECONNRESET';
    }
});

// Fetch Spielberichte-Link
export async function fetchSpielberichteLink(): Promise<string | null> {
    const url = 'https://www.wdv-dart.at/_landesliga/_statistik/index.php?saison=2024/25&div=all';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const targetLi = $('li').filter((_, el) => $(el).text().includes('Sonstiges 1/2 (2024/25):'));
        if (targetLi.length === 0) {
            console.error('Das Ziel <li> wurde nicht gefunden.');
            return null;
        }

        const linkElement = targetLi.next('li').find('a');
        return linkElement.length > 0 ? linkElement.attr('href') || null : null;
    } catch (error) {
        console.error('❌ Critical error fetching data:', error);
        return null;
    }
}

// Fetch Dart-IDs
export async function fetchDartIds(url: string, teamName: string): Promise<string[]> {
    try {
        console.log('fetchDartIds URL: ', url);
        const { data } = await axios.get('https://www.wdv-dart.at/_landesliga/_statistik/' + url);
        const $ = cheerio.load(data);
        const ids: string[] = [];
        const today = new Date();

        $('tr.ranking').each((_, element) => {
            const dateText = $(element).find('td').eq(0).text().trim();
            const teamName1 = $(element).find('td').eq(1).text().trim();
            const teamName2 = $(element).find('td').eq(2).text().trim();
            const idMatch = $(element).attr('onclick');

            const [day, month, year] = dateText.split('.').map(Number);
            const matchDate = new Date(year, month - 1, day);

            if (matchDate <= today) {
                if (teamName1.includes(teamName) || teamName2.includes(teamName)) {
                    const match = idMatch?.match(/id=(\d+)/);
                    if (match) {
                        ids.push(match[1]);
                    }
                }
            }
        });

        return ids;
    } catch (error) {
        console.error('❌ Critical error fetching data:', error);
        return [];
    }
}

// Fetch Team Players Average
export async function fetchTeamPlayersAverage(teamName: string): Promise<Player[]> {
    const url = `https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1722506400&ende=1754042400&saison=2024/25&dartsldg=18&mannschaft=${teamName}`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const players: Player[] = [];

        // Get singles data first
        const singlesData = new Map<string, { wins: number, losses: number }>();
        $('h4:contains("Einzel") + div table.ranking tbody tr.ranking').each((_, element) => {
            const playerName = $(element).find('td:nth-child(2) a').text().trim();
            const wins = parseInt($(element).find('td:nth-child(4)').text().trim());
            const losses = parseInt($(element).find('td:nth-child(5)').text().trim());
            singlesData.set(playerName, { wins, losses });
        });

        // Get doubles data
        const doublesData = new Map<string, { wins: number, losses: number }>();
        $('h4:contains("Doppel") + div table.ranking tbody tr.ranking').each((_, element) => {
            const playerName = $(element).find('td:nth-child(2) a').text().trim();
            const wins = parseInt($(element).find('td:nth-child(4)').text().trim());
            const losses = parseInt($(element).find('td:nth-child(5)').text().trim());
            doublesData.set(playerName, { wins, losses });
        });

        // Process player averages and combine with singles/doubles data
        const firstTableRows = $('table.ranking').first().find('tbody tr');
        firstTableRows.each((_, element) => {
            const playerName = $(element).find('td:nth-child(2) a').text().trim();
            const averageText = $(element).find('td:nth-child(7)').text().trim();
            const average = parseFloat(averageText);

            if (playerName && !isNaN(average)) {
                const singlesRecord = singlesData.get(playerName);
                const doublesRecord = doublesData.get(playerName);
                
                const singles = singlesRecord ? `${singlesRecord.wins}-${singlesRecord.losses}` : '0-0';
                const doubles = doublesRecord ? `${doublesRecord.wins}-${doublesRecord.losses}` : '0-0';
                
                // Calculate overall win rate
                const totalWins = (singlesRecord?.wins || 0) + (doublesRecord?.wins || 0);
                const totalLosses = (singlesRecord?.losses || 0) + (doublesRecord?.losses || 0);
                const winRate = totalWins + totalLosses > 0 
                    ? Number(((totalWins / (totalWins + totalLosses)) * 100).toFixed(1))
                    : 0;

                const adjustedAverage = parseFloat((average * 3).toFixed(2));
                players.push({ 
                    playerName, 
                    adjustedAverage,
                    singles,
                    doubles,
                    winRate
                });
            }
        });

        return players;
    } catch (error) {
        console.error('❌ Critical error fetching data:', error);
        return [];
    }
}

// Add default values for match data
const DEFAULT_MATCH_PLAYER = {
    homePlayer: '-',
    awayPlayer: '-',
    homeScore: 0,
    awayScore: 0
};

const DEFAULT_MATCH_REPORT = {
    lineup: [],
    checkouts: [],
    opponent: 'Unknown',
    score: '0-0',
    details: {
        singles: Array(4).fill({ ...DEFAULT_MATCH_PLAYER }),
        doubles: Array(4).fill({ ...DEFAULT_MATCH_PLAYER }),
        totalLegs: { home: 0, away: 0 },
        totalSets: { home: 0, away: 0 }
    }
};

// Fetch Match Report
export async function fetchMatchReport(id: string, teamName: string): Promise<MatchReport> {
    const url = `https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${id}&saison=2024/25`;
    
    try {
        console.log(`Fetching match report for ID: ${id}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        // Get the match score first to determine if it's an empty match
        const score = $('.ergebnis').first().text().trim() || '0-0';
        
        // If it's a 0-0 match, return a safely structured empty match report
        if (score === '0-0') {
            return {
                lineup: [],
                checkouts: [],
                opponent: $('.gegner').first().text().trim() ,
                score: '0-0',
                details: {
                    singles: Array(4).fill({
                        homePlayer: '-',
                        awayPlayer: '-',
                        homeScore: 0,
                        awayScore: 0
                    }),
                    doubles: Array(4).fill({
                        homePlayer: '-',
                        awayPlayer: '-',
                        homeScore: 0,
                        awayScore: 0
                    }),
                    totalLegs: { home: 0, away: 0 },
                    totalSets: { home: 0, away: 0 }
                }
            };
        }

        // For non-empty matches, process normally but ensure safe parsing
        const matchReport: MatchReport = {
            lineup: $('.spieler')
                .map((_, el) => $(el).text().trim())
                .get(),
            checkouts: $('.checkout')
                .map((_, el) => ({
                    scores: $(el).text().trim()
                }))
                .get(),
            opponent: $('.gegner').first().text().trim(),
            score: score,
            details: {
                singles: $('.einzel')
                    .map((_, el) => ({
                        homePlayer: $(el).find('.home-player').text().trim(),
                        awayPlayer: $(el).find('.away-player').text().trim(),
                        homeScore: parseInt($(el).find('.home-score').text()) || 0,
                        awayScore: parseInt($(el).find('.away-score').text()) || 0
                    }))
                    .get(),
                doubles: $('.doppel')
                    .map((_, el) => ({
                        homePlayer: $(el).find('.home-player').text().trim(),
                        awayPlayer: $(el).find('.away-player').text().trim(),
                        homeScore: parseInt($(el).find('.home-score').text()) || 0,
                        awayScore: parseInt($(el).find('.away-score').text()) || 0
                    }))
                    .get(),
                totalLegs: { home: 0, away: 0 },
                totalSets: { home: 0, away: 0 }
            }
        };

        // Safely calculate totals
        const allMatches = [...matchReport.details.singles, ...matchReport.details.doubles];
        matchReport.details.totalLegs = {
            home: allMatches.reduce((sum, match) => sum + (match.homeScore || 0), 0),
            away: allMatches.reduce((sum, match) => sum + (match.awayScore || 0), 0)
        };

        matchReport.details.totalSets = {
            home: allMatches.filter(match => (match.homeScore || 0) > (match.awayScore || 0)).length,
            away: allMatches.filter(match => (match.awayScore || 0) > (match.homeScore || 0)).length
        };

        // Ensure all required fields exist and are of correct type before returning
        return {
            matchId: id,
            lineup: matchReport.lineup || [],
            checkouts: matchReport.checkouts || [],
            opponent: matchReport.opponent || 'Unknown Opponent',
            score: matchReport.score || '0-0',
            details: {
                singles: matchReport.details.singles || [],
                doubles: matchReport.details.doubles || [],
                totalLegs: matchReport.details.totalLegs,
                totalSets: matchReport.details.totalSets
            }
        };

    } catch (error) {
        console.error(`Failed to fetch match report for ID ${id}:`, error);
        // Return a safely structured empty match report on error
        return {
            lineup: [],
            checkouts: [],
            opponent: 'Error Loading Match',
            score: '0-0',
            details: {
                singles: Array(4).fill({
                    homePlayer: '-',
                    awayPlayer: '-',
                    homeScore: 0,
                    awayScore: 0
                }),
                doubles: Array(4).fill({
                    homePlayer: '-',
                    awayPlayer: '-',
                    homeScore: 0,
                    awayScore: 0
                }),
                totalLegs: { home: 0, away: 0 },
                totalSets: { home: 0, away: 0 }
            }
        };
    }
}

// Fetch League Position
export async function fetchLeaguePosition(teamName: string): Promise<number> {
    const url = `https://www.wdv-dart.at/_landesliga/_liga/tabakt.php?div=5&saison=2024/25`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let teamPosition = -1;

        $('div.ranking').first().find('table tbody tr.ranking').each((_, element) => {
            const team = $(element).find('td').eq(1).text().trim();
            if (team.includes(teamName)) {
                teamPosition = parseInt($(element).find('td').eq(0).text().trim(), 10);
            }
        });

        return teamPosition;
    } catch (error) {
        console.error('❌ Critical error fetching data:', error);
        return -1;
    }
}

// Fetch Club Venue
export async function fetchClubVenue(teamName: string): Promise<ClubVenue | null> {
    const url = `https://www.wdv-dart.at/_landesliga/_liga/teams.php?div=5&saison=2024/25`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let clubData: ClubVenue | null = null;

        $('table.ranking tbody tr').each((_, element) => {
            const rowTeamName = $(element).find('td').eq(1).text().trim();

            if (rowTeamName === teamName) {
                clubData = {
                    rank: $(element).find('td').eq(0).text().trim(),
                    teamName: rowTeamName,
                    clubName: $(element).find('td').eq(2).text().trim(),
                    venue: $(element).find('td').eq(3).text().trim(),
                    address: $(element).find('td').eq(4).text().trim(),
                    city: $(element).find('td').eq(5).text().trim(),
                    phone: $(element).find('td').eq(6).text().trim(),
                };
                return false; // Exit loop
            }
        });

        return clubData;
    } catch (error) {
        console.error('❌ Critical error fetching data:', error);
        return null;
    }
}

export async function fetchComparisonData(teamName: string): Promise<ComparisonData[]> {
    const url = `https://www.wdv-dart.at/_landesliga/_liga/ergmann1.php?div=5&saison=2024/25&id=2015&mannschaft=${encodeURIComponent(teamName)}`;
    
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const matches: ComparisonData[] = [];
    const processedTeams = new Set();

    $('table.ranking tr.ranking').each((_, row) => {
        const round = Number($(row).find('td').eq(0).text().trim());
        const homeTeam = $(row).find('td').eq(2).text().trim();
        const awayTeam = $(row).find('td').eq(3).text().trim();
        const homeSets = Number($(row).find('td').eq(7).find('b').text().trim());
        const awaySets = Number($(row).find('td').eq(9).find('b').text().trim());
        
        const opponent = homeTeam === teamName ? awayTeam : homeTeam;
        const score = homeTeam === teamName ? `${homeSets}-${awaySets}` : `${awaySets}-${homeSets}`;
        
        if (!processedTeams.has(opponent)) {
            matches.push({
                opponent,
                firstRound: round <= 13 ? score : null,
                secondRound: round > 13 ? score : null
            });
            processedTeams.add(opponent);
        } else {
            const existingMatch = matches.find(m => m.opponent === opponent);
            if (existingMatch) {
                existingMatch.secondRound = score;
            }
        }
    });

    return matches;
}

export async function fetchTeamStandings(teamName: string): Promise<TeamStandings | null> {
    const url = 'https://www.wdv-dart.at/_landesliga/_liga/tabakt.php?div=5&saison=2024/25';
    
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        let standings: TeamStandings | null = null;
        
        $('div.ranking table tbody tr.ranking').each((_, element) => {
            const team = $(element).find('td').eq(1).text().trim();
            if (team === teamName) {
                standings = {
                    wins: parseInt($(element).find('td').eq(3).text().trim()),    // S column
                    draws: parseInt($(element).find('td').eq(4).text().trim()),   // U column
                    losses: parseInt($(element).find('td').eq(5).text().trim()),  // N column
                };
                return false; // Exit loop once found
            }
        });
        
        return standings;
    } catch (error) {
        console.error('❌ Critical error fetching data:', error);
        return null;
    }
}

// Add these new helper functions
function calculateAverage(darts: number[], rests: number[], playerName: string): number {
    // Validate input data
    if (!Array.isArray(darts) || !Array.isArray(rests) || darts.length !== rests.length || 
        darts.length < 3 || darts.length > 5) {
        console.error(`Invalid input data for average calculation for player: ${playerName}`);
        return 35;
    }

    // Filter out invalid data pairs but keep pairs where rest is 0
    const validPairs = darts.map((dart, index) => ({
        darts: dart,
        rest: rests[index]
    })).filter(pair => 
        pair.darts > 0 && 
        pair.darts <= 145 && // Maximum reasonable darts per leg
        pair.rest >= 0 && // Allow 0 rests
        pair.rest <= 501
    );

    if (validPairs.length < 3) {
        console.error(`Need at least 3 valid dart/rest pairs for player: ${playerName}`);
        return 35;
    }

    const n = validPairs.length;
    const sumDarts = validPairs.reduce((acc, pair) => acc + pair.darts, 0);
    const sumRests = validPairs.reduce((acc, pair) => acc + pair.rest, 0);
    
    // Average = (501 x n - ∑ Rest) / (∑ Darts) * 3
    const average = ((501 * n - sumRests) / sumDarts) * 3;

    // Validate the calculated average
    if (isNaN(average) || average < 5 || average > 150) {
        console.error(`Invalid average (${average}) calculated for player: ${playerName}`);
        return 35;
    }

    return Number(average.toFixed(2));
}

export async function fetchMatchAverages(url: string, teamName: string): Promise<{
    matchday: number;
    teamAverage: number;
    playerAverages: { playerName: string; average: number; }[];
}> {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        // Find which side is our team (home or away)
        const homeTeam = $('thead tr th').eq(1).text().replace('Heim: ', '').trim();
        const awayTeam = $('thead tr th').eq(3).text().replace('Gast: ', '').trim();
        const isHomeTeam = homeTeam.includes(teamName);
        const isAwayTeam = awayTeam.includes(teamName);

        if (!isHomeTeam && !isAwayTeam) {
            console.error('Team not found in match');
            return {
                matchday: 0,
                teamAverage: 0,
                playerAverages: []
            };
        }

        const playerAverages: { playerName: string; average: number; }[] = [];
        let totalTeamAverage = 0;
        let playerCount = 0;

        // Process singles matches (positions 1,2,5,6)
        $('tr.spielbericht').each((index, element) => {
            if ([0,1,4,5].includes(index)) {
                const darts = isHomeTeam 
                    ? $(element).find('td:nth-child(2) .set tr:nth-child(2) td.t3').map((i, el) => $(el).text().trim()).get()
                    : $(element).find('td:nth-child(4) .set tr:nth-child(2) td.t3').map((i, el) => $(el).text().trim()).get();

                const rests = isHomeTeam
                    ? $(element).find('td:nth-child(2) .set tr:nth-child(3) td.t3').map((i, el) => $(el).text().trim()).get()
                    : $(element).find('td:nth-child(4) .set tr:nth-child(3) td.t3').map((i, el) => $(el).text().trim()).get();

                const playerName = isHomeTeam
                    ? $(element).find('td:nth-child(2) table.set tr:first-child td.t2:first-child b').text()
                    : $(element).find('td:nth-child(4) table.set tr:first-child td.t2:last-child b').text();

                const validDarts = darts
                    .filter(d => d !== '-')
                    .map(Number);
                const validRests = rests
                    .filter((_, i) => darts[i] !== '-')
                    .map(r => r === '-' ? '0' : r)
                    .map(Number);

                if (validDarts.length >= 3) {
                    const average = calculateAverage(validDarts, validRests, playerName);
                    playerAverages.push({ playerName, average });
                    totalTeamAverage += average;
                    playerCount++;
                }
            }
        });

        // Add this log at the end, just before the return statement
        if (!playerAverages.some(p => p.average === 35)) {
            console.log(`All averages calculated successfully for match at: ${url}`);
        }

        return {
            matchday: 0,
            teamAverage: playerCount > 0 ? Number((totalTeamAverage / playerCount).toFixed(2)) : 0,
            playerAverages
        };
    } catch (error) {
        console.error('❌ Critical error fetching data:', error);
        return {
            matchday: 0,
            teamAverage: 0,
            playerAverages: []
        };
    }
}

export async function fetch180sAndHighFinishes(team: string): Promise<{oneEightys: OneEighty[], highFinishes: HighFinish[]}> {
  const url = `https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1722506400&ende=1754042400&saison=2024/25&dartsldg=18&mannschaft=${encodeURIComponent(team)}`;
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract 180s
  const oneEightys: OneEighty[] = [];
  $('h4:contains("180s")').next('.ranking').find('tbody tr').each((_, elem) => {
    const playerName = $(elem).find('td:nth-child(2)').text().trim();
    const count = parseInt($(elem).find('td:nth-child(4)').text().trim());
    if (playerName && !isNaN(count)) {
      oneEightys.push({ playerName, count });
    }
  });

  // Extract High Finishes
  const highFinishes: HighFinish[] = [];
  $('h4:contains("High Finish")').next('.ranking').find('tbody tr').each((_, elem) => {
    const playerName = $(elem).find('td:nth-child(2)').text().trim();
    const finishesStr = $(elem).find('td:nth-child(5)').text().trim();
    if (playerName && finishesStr) {
      const finishes = finishesStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      highFinishes.push({ playerName, finishes });
    }
  });

  return { oneEightys, highFinishes };
}