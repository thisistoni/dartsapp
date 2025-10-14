/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import * as cheerio from 'cheerio';
import axiosRetry from 'axios-retry';
import { ClubVenue, MatchReport, Player, ComparisonData, TeamStandings, OneEighty, HighFinish, LeagueResults, LeagueMatchday, LeagueMatch } from './types';

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
export async function fetchSpielberichteLink(customUrl?: string): Promise<string | null> {
    // Use custom URL if provided (for 2024/25), otherwise use default (2025/26)
    const url = customUrl || 'https://www.wdv-dart.at/_landesliga/_statistik/index.php?saison=2025/26&div=all';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Determine season from URL for correct <li> text matching
        const season = customUrl?.includes('2024/25') ? '2024/25' : '2025/26';
        const targetLi = $('li').filter((_, el) => $(el).text().includes(`Sonstiges 1/2 (${season}):`));
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
                if (teamName1 === teamName || teamName2 === teamName) {
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
    const url = `https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=${teamName}`;

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
        const processedPlayers = new Set<string>();
        const firstTableRows = $('table.ranking').first().find('tbody tr');
        
        firstTableRows.each((_, element) => {
            const playerName = $(element).find('td:nth-child(2) a').text().trim();
            const averageText = $(element).find('td:nth-child(7)').text().trim();
            const average = parseFloat(averageText);

            if (playerName && !isNaN(average)) {
                processedPlayers.add(playerName);
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

        // Add players who only played doubles (not in first table)
        doublesData.forEach((record, playerName) => {
            if (!processedPlayers.has(playerName)) {
                const totalWins = record.wins;
                const totalLosses = record.losses;
                const winRate = totalWins + totalLosses > 0 
                    ? Number(((totalWins / (totalWins + totalLosses)) * 100).toFixed(1))
                    : 0;

                players.push({
                    playerName,
                    adjustedAverage: 0, // No average available for doubles-only players
                    singles: '0-0',
                    doubles: `${record.wins}-${record.losses}`,
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

// Fetch Match Report
export async function fetchMatchReport(id: string, teamName: string): Promise<MatchReport> {
    const url = `https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${id}&saison=2025/26`;
    
    try {
        console.log(`Fetching match report for ID: ${id}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const matchReport: MatchReport = {
            lineup: [],
            checkouts: [],
            opponent: '',
            score: '',
            details: {
                singles: [],
                doubles: [],
                totalLegs: { home: 0, away: 0 },
                totalSets: { home: 0, away: 0 }
            },
            isHomeMatch: false
        };

        const headerRow = $('table.spielbericht thead tr');
        const homeTeam = headerRow.find('th').eq(1).text().trim().replace('Heim: ', '');
        const awayTeam = headerRow.find('th').eq(3).text().trim().replace('Gast: ', '');
        const isHomeTeam = homeTeam.includes(teamName);
        const isAwayTeam = awayTeam.includes(teamName);
        const opponentTeam = isHomeTeam ? awayTeam : homeTeam;

        if (!isHomeTeam && !isAwayTeam) {
            return matchReport;
        }

        matchReport.opponent = opponentTeam;
        matchReport.isHomeMatch = isHomeTeam;

        // Process each match row
        $('table.spielbericht tbody tr.spielbericht').each((index, element) => {
            const setNumber = Number($(element).find('td.t2 div b').text());
            
            // Process for match details
            if ([1,2,5,6].includes(setNumber)) {
                // Single matches
                const homePlayer = $(element).find('td:nth-child(2) table.set tr:first-child td.t2:first-child b').text();
                const homeScore = Number($(element).find('td:nth-child(2) table.set tr:first-child td.t2:last-child b').text());
                const awayPlayer = $(element).find('td:nth-child(4) table.set tr:first-child td.t2:last-child b').text();
                const awayScore = Number($(element).find('td:nth-child(4) table.set tr:first-child td.t2:first-child b').text());
                
                // Add to details
                matchReport.details.singles.push({
                    homePlayer,
                    awayPlayer,
                    homeScore,
                    awayScore
                });

                // Add to lineup
                if (isHomeTeam && homePlayer) {
                    matchReport.lineup.push(homePlayer);
                } else if (isAwayTeam && awayPlayer) {
                    matchReport.lineup.push(awayPlayer);
                }
            } else {
                // Double matches
                const homePlayers = [
                    $(element).find('td:nth-child(2) table.set tr td:nth-child(1) b').text(),
                    $(element).find('td:nth-child(2) table.set tr td:nth-child(2) b').text()
                ];
                const awayPlayers = [
                    $(element).find('td:nth-child(4) table.set tr td:nth-child(2) b').text(),
                    $(element).find('td:nth-child(4) table.set tr td:nth-child(3) b').text()
                ];
                const homeScore = Number($(element).find('td:nth-child(2) table.set tr td:last-child b').text());
                const awayScore = Number($(element).find('td:nth-child(4) table.set tr td:first-child b').text());
                
                // Add to details
                matchReport.details.doubles.push({
                    homePlayers,
                    awayPlayers,
                    homeScore,
                    awayScore
                });

                // Add to lineup
                if (isHomeTeam) {
                    matchReport.lineup.push(`${homePlayers[0]}, ${homePlayers[1]}`);
                } else if (isAwayTeam) {
                    matchReport.lineup.push(`${awayPlayers[0]}, ${awayPlayers[1]}`);
                }
            }

            // Process checkouts (keep existing checkout logic)
            const homeDarts = $(element).find('td:nth-child(2) .set tr:nth-child(2) td').map((i, el) => $(el).text().trim()).get().filter(dart => dart !== '-' && dart !== '');
            const homeRest = $(element).find('td:nth-child(2) .set tr:nth-child(3) td').map((i, el) => $(el).text().trim()).get().filter(rest => rest !== '-' && rest !== '');
            const awayDarts = $(element).find('td:nth-child(4) .set tr:nth-child(2) td').map((i, el) => $(el).text().trim()).get().filter(dart => dart !== '-' && dart !== '');
            const awayRest = $(element).find('td:nth-child(4) .set tr:nth-child(3) td').map((i, el) => $(el).text().trim()).get().filter(rest => rest !== '-' && rest !== '');

            const formatPlayerPerformance = (player: string, darts: string[], rests: string[]) => {
                const performance = darts.map((dart: string, index: number) => {
                    return rests[index] === '0' ? dart : '';
                }).filter((dart: string) => dart !== '').join(', ');
                return `${player}: ${performance.length > 0 ? `${performance}` : '-'}`;
            };

            // Save checkouts for both home and away teams
            if (homeDarts.length > 0) {
                let homePlayerName = '';
                if ([1,2,5,6].includes(setNumber)) {
                    // Singles match - get home player name
                    homePlayerName = $(element).find('td:nth-child(2) table.set tr:first-child td.t2:first-child b').text();
                } else {
                    // Doubles match - get home players
                    const homePlayers = [
                        $(element).find('td:nth-child(2) table.set tr td:nth-child(1) b').text(),
                        $(element).find('td:nth-child(2) table.set tr td:nth-child(2) b').text()
                    ];
                    homePlayerName = homePlayers.join(', ');
                }
                if (homePlayerName) {
                    const homePerformance = formatPlayerPerformance(homePlayerName, homeDarts, homeRest);
                    matchReport.checkouts.push({ scores: homePerformance });
                }
            }
            
            if (awayDarts.length > 0) {
                let awayPlayerName = '';
                if ([1,2,5,6].includes(setNumber)) {
                    // Singles match - get away player name
                    awayPlayerName = $(element).find('td:nth-child(4) table.set tr:first-child td.t2:last-child b').text();
                } else {
                    // Doubles match - get away players
                    const awayPlayers = [
                        $(element).find('td:nth-child(4) table.set tr td:nth-child(2) b').text(),
                        $(element).find('td:nth-child(4) table.set tr td:nth-child(3) b').text()
                    ];
                    awayPlayerName = awayPlayers.join(', ');
                }
                if (awayPlayerName) {
                    const awayPerformance = formatPlayerPerformance(awayPlayerName, awayDarts, awayRest);
                    matchReport.checkouts.push({ scores: awayPerformance });
                }
            }
        });

        // Get total legs (from the last row in tbody)
        const legsRow = $('table.spielbericht tbody tr:last');
        matchReport.details.totalLegs = {
            home: Number(legsRow.find('td.t2').eq(1).find('b').text().trim()),
            away: Number(legsRow.find('td.t2').eq(3).find('b').text().trim())
        };

        // Get total sets
        const setsRow = $('table.spielbericht tfoot tr');
        matchReport.details.totalSets = {
            home: Number(setsRow.find('td:nth-child(2) h3').text().trim()),
            away: Number(setsRow.find('td:nth-child(4) h3').text().trim())
        };

        // Get the final score from tfoot
        const homeScore = $('table.spielbericht tfoot tr td').eq(1).find('h3').text().trim();
        const awayScore = $('table.spielbericht tfoot tr td').eq(3).find('h3').text().trim();
        const score = isHomeTeam ? `${homeScore}-${awayScore}` : `${awayScore}-${homeScore}`;
        matchReport.score = score;

        return matchReport;
    } catch (error) {
        console.error(`Failed to fetch match report for ID ${id}:`, error);
        // Return empty match report structure on error
        return {
            lineup: [],
            checkouts: [],
            opponent: '',
            score: '',
            details: {
                singles: [],
                doubles: [],
                totalLegs: { home: 0, away: 0 },
                totalSets: { home: 0, away: 0 }
            }
        };
    }
}

// Fetch League Position
export async function fetchLeaguePosition(teamName: string): Promise<number> {
    const url = `https://www.wdv-dart.at/_landesliga/_liga/tabakt.php?div=5&saison=2025/26`;

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
    const url = `https://www.wdv-dart.at/_landesliga/_liga/teams.php?div=5&saison=2025/26`;

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
    const url = `https://www.wdv-dart.at/_landesliga/_liga/ergmann1.php?div=5&saison=2025/26&id=2142&mannschaft=${encodeURIComponent(teamName)}`;
    
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
    const url = 'https://www.wdv-dart.at/_landesliga/_liga/tabakt.php?div=5&saison=2025/26';
    
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
  const url = `https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=${encodeURIComponent(team)}`;
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

// Fetch League Results for Overview
export async function fetchLeagueResults(): Promise<LeagueResults> {
  const url = 'https://www.wdv-dart.at/_landesliga/_liga/ergebnisse.php?div=5&saison=2025/26';
  
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const matchdays: LeagueMatchday[] = [];

    // Find all h4 elements that contain "Runde" (Round)
    $('h4').each((_, elem) => {
      const headerText = $(elem).text().trim();
      const roundMatch = headerText.match(/Runde (\d+) - (\d{2}\.\d{2}\.\d{4})/);
      
      if (roundMatch) {
        const round = parseInt(roundMatch[1]);
        const date = roundMatch[2];
        
        // Get the next div.ranking table
        const table = $(elem).next('div.ranking').find('table.ranking');
        const matches: LeagueMatch[] = [];
        
        // Parse each match row
        table.find('tbody tr.ranking').each((_, row) => {
          const cells = $(row).find('td');
          
          const homeTeam = $(cells[0]).text().trim();
          const awayTeam = $(cells[1]).text().trim();
          const homeLegs = parseInt($(cells[2]).text().trim());
          const awayLegs = parseInt($(cells[4]).text().trim());
          const homeSets = parseInt($(cells[5]).find('b').text().trim());
          const awaySets = parseInt($(cells[7]).find('b').text().trim());
          
          // Extract match ID from the link
          const linkHref = $(row).find('a').attr('href') || '';
          const matchIdMatch = linkHref.match(/id=(\d+)/);
          const matchId = matchIdMatch ? matchIdMatch[1] : '';
          
          if (homeTeam && awayTeam && !isNaN(homeLegs) && !isNaN(awayLegs) && !isNaN(homeSets) && !isNaN(awaySets)) {
            matches.push({
              homeTeam,
              awayTeam,
              homeLegs,
              awayLegs,
              homeSets,
              awaySets,
              matchId
            });
          }
        });
        
        if (matches.length > 0) {
          matchdays.push({ round, date, matches });
        }
      }
    });

    return { matchdays };
  } catch (error) {
    console.error('❌ Error fetching league results:', error);
    return { matchdays: [] };
  }
}

// Helper function to get all match reports from the central page
async function getAllMatchReports() {
  try {
    const url = 'https://www.wdv-dart.at/_landesliga/_statistik/spielberichtmenue.php?start=1754042400&ende=1785578400&saison=2025/26';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const matches: Array<{ date: string; homeTeam: string; awayTeam: string; matchId: string }> = [];
    
    $('tr.ranking').each((_, element) => {
      const dateText = $(element).find('td').eq(0).text().trim();
      const homeTeam = $(element).find('td').eq(1).text().trim();
      const awayTeam = $(element).find('td').eq(2).text().trim();
      const onclick = $(element).attr('onclick');
      
      if (onclick) {
        const match = onclick.match(/id=(\d+)/);
        if (match && dateText && homeTeam && awayTeam) {
          matches.push({
            date: dateText,
            homeTeam,
            awayTeam,
            matchId: match[1]
          });
        }
      }
    });
    
    return matches;
  } catch (error) {
    console.error('Error fetching all match reports:', error);
    return [];
  }
}

// Fetch Latest Match Details (3 most recent matches with singles/doubles data)
export async function fetchLatestMatchDetails() {
  try {
    console.log('🔍 Fetching latest match details...');
    
    // Get league results to find the latest matchday
    const leagueResults = await fetchLeagueResults();
    console.log(`📊 League results fetched, matchdays: ${leagueResults.matchdays.length}`);
    
    if (leagueResults.matchdays.length === 0) {
      console.log('⚠️ No matchdays found');
      return [];
    }
    
    // Get the latest matchday
    const sortedMatchdays = leagueResults.matchdays.sort((a, b) => b.round - a.round);
    const latestMatchday = sortedMatchdays[0];
    console.log(`📅 Latest matchday: ${latestMatchday.round} on ${latestMatchday.date}`);
    console.log(`🏆 Matches in latest matchday: ${latestMatchday.matches.length}`);
    
    // Get all match reports from central page
    console.log('📥 Fetching all match reports from central page...');
    const allMatchReports = await getAllMatchReports();
    console.log(`✅ Found ${allMatchReports.length} total match reports`);
    
    const latestMatches: any[] = [];
    
    // Process all matches from the latest matchday
    for (const match of latestMatchday.matches) {
      try {
        console.log(`🔎 Looking for ${match.homeTeam} vs ${match.awayTeam} on ${latestMatchday.date}...`);
        
        // Find the match in the central list
        const matchReport = allMatchReports.find(m => 
          m.date === latestMatchday.date &&
          m.homeTeam === match.homeTeam &&
          m.awayTeam === match.awayTeam
        );
        
        if (matchReport) {
          console.log(`📥 Found match ID ${matchReport.matchId}, fetching details...`);
          
          const details = await fetchMatchReport(matchReport.matchId, match.homeTeam);
          const matchUrl = `https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${matchReport.matchId}&saison=2025/26`;
          const averagesData = await fetchMatchAverages(matchUrl, match.homeTeam);
          console.log(`✅ Match report fetched, singles: ${details.details.singles.length}, averages: ${averagesData.playerAverages.length}`);
          
          // Combine singles with averages and checkouts
          const singlesWithData = details.details.singles.map((single: any) => {
            // Find average for home player
            const homeAvg = averagesData.playerAverages.find(p => p.playerName === single.homePlayer);
            // Find average for away player (need to fetch away team averages too)
            
            // Find checkouts for both players
            const homeCheckout = details.checkouts.find(c => c.scores.startsWith(single.homePlayer));
            const awayCheckout = details.checkouts.find(c => c.scores.startsWith(single.awayPlayer));
            
            return {
              ...single,
              homeAverage: homeAvg?.average || 0,
              awayAverage: 0, // Will be calculated separately
              homeCheckouts: homeCheckout ? homeCheckout.scores.split(': ')[1] : '-',
              awayCheckouts: awayCheckout ? awayCheckout.scores.split(': ')[1] : '-'
            };
          });
          
          // Also fetch away team averages
          const awayAveragesData = await fetchMatchAverages(matchUrl, match.awayTeam);
          
          // Update away averages
          singlesWithData.forEach((single: any) => {
            const awayAvg = awayAveragesData.playerAverages.find(p => p.playerName === single.awayPlayer);
            single.awayAverage = awayAvg?.average || 0;
          });
          
          latestMatches.push({
            matchday: latestMatchday.round,
            date: latestMatchday.date,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            score: `${match.homeSets}-${match.awaySets}`,
            singles: singlesWithData,
            doubles: details.details.doubles
          });
        } else {
          console.log(`⚠️ Could not find match ID for ${match.homeTeam} vs ${match.awayTeam}`);
        }
      } catch (err) {
        console.error(`❌ Error processing match ${match.homeTeam} vs ${match.awayTeam}:`, err);
      }
    }
    
    console.log(`✅ Returning ${latestMatches.length} matches from matchday ${latestMatchday.round}`);
    return latestMatches;
  } catch (error) {
    console.error('❌ Error fetching latest match details:', error);
    return [];
  }
}

// Fetch Cup Round 2 matches for teams in our league
export async function fetchCupMatches(leagueTeams: string[]): Promise<{ homeTeam: string; awayTeam: string; date: string; round: string; homeDivision?: string; awayDivision?: string }[]> {
  const url = 'https://www.wdv-dart.at/_teamcup/_cup/index.php?saison=2025/26';
  
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const cupMatches: { homeTeam: string; awayTeam: string; date: string; round: string; homeDivision?: string; awayDivision?: string }[] = [];
    
    // Build division mapping - hardcoded from WDV data
    const teamDivisions = new Map<string, string>([
      ['an sporran 1', '1'], ['an sporran ahg', '2'], ['an sporran angels', '1'], ['an sporran c&s', '2'],
      ['an sporran chips', '4'], ['an sporran de oidn', '2'], ['as 404 double not found', '4'],
      ['as the dart side of the moon i', '4'], ['as the dart side of the moon ii', '5'], ['as the third side of the moon', '5'],
      ['babylon +-er', '1'], ['babylon bassdarts', '4'], ['babylon sackratten', '3'], ['babylon saloon daltons', '5'],
      ['babylon triple', '4'], ['babylon vienna bulls', '2'], ['bad boys buddies', '2'], ['bad boys bulls', '1'],
      ['bad boys fanatics', '1'], ['bad boys hot shots', '2'], ['bad boys lumberjacks', '4'], ['bad boys tornados', '5'],
      ['bad boys underground', '5'], ['bsw prater darter', '3'], ['bsw zwara panier', '5'], ['d-c arts of darts', '1'],
      ['d-c bawag show time', '1'], ['d-c dartcore', '1'], ['d-c darts-control', '1'], ['d-c flying squad', '5'],
      ['d-c jausngegner', '3'], ['d-c madhouse', '3'], ['d-c standart', '2'], ['d-c steelers', '2'],
      ['d-c steelers 1.80', '2'], ['dartclub twentytwo 1', '3'], ['dartclub twentytwo 2', '3'], ['dartclub twentytwo 3', '5'],
      ['dartclub twentytwo 4', '5'], ['dartons', '2'], ['darts artists', '3'], ['darts artists darteros', '2'],
      ['dc dartcabaret', '5'], ['dc favoriten rainbows', '3'], ['dc patron', '5'], ['dc patron ii', '5'],
      ['dc voltadolis steel', '4'], ['dilettanten', '2'], ['dlb vienna alligators', '3'], ['dsv nanog flying hellfish', '3'],
      ['dsv nanog zinsfabrik', '5'], ['fortunas wölfe', '5'], ['ldc martial darts 1', '1'], ['ldc martial darts 2', '1'],
      ['ldc martial darts 4ward', '4'], ['ldc martial darts fun legends', '4'], ['mafiosis', '3'], ['megasports-darts', '4'],
      ['mtb bully bullchecker', '5'], ['mtb simply the best 1', '1'], ['psv wien darts 1', '5'], ['relax one steel 1', '1'],
      ['relax one steel 2', '1'], ['relax one steel 3', '1'], ['relax one steel 4', '2'], ['relax one steel 5', '4'],
      ['relax one steel 6', '4'], ['rosa untier nein darters', '3'], ['rosa untier plumbatas', '5'],
      ['scheibenfreunde the clowns of dart', '3'], ['sfva bull\'s hit', '2'], ['sfva ccr', '3'], ['snakes', '2'],
      ['snakes ii', '4'], ['tc aspern 1', '5'], ['temmel fundraising darts lions 1', '3'], ['temmel fundraising darts lions 2', '5'],
      ['the expendables', '4'], ['vienna devils 1', '3'], ['vienna devils dartfathers', '4'], ['vienna devils the 9 darters', '5'],
      ['vienna tigers black dragons', '1'], ['vienna tigers double out', '2'], ['vienna tigers flying tigers', '4'], ['vienna tigers white tigers', '5']
    ]);
    
    // Find Round 2 section
    $('h4').each((_, h4Element) => {
      const headerText = $(h4Element).text().trim();
      if (headerText.includes('Runde 2')) {
        const date = headerText.match(/(\d{2}\.\d{2}\.\d{4})/)?.[1] || '06.11.2025';
        
        // Get the table following this header
        const table = $(h4Element).next('div').find('table.ranking');
        
        table.find('tbody tr.ranking').each((_, row) => {
          const homeTeam = $(row).find('td').eq(0).text().trim();
          const awayTeam = $(row).find('td').eq(1).text().trim();
          
          // Check if either team is in our league
          const homeInLeague = leagueTeams.some(team => 
            team.toLowerCase() === homeTeam.toLowerCase()
          );
          const awayInLeague = leagueTeams.some(team => 
            team.toLowerCase() === awayTeam.toLowerCase()
          );
          
          if (homeInLeague || awayInLeague) {
            const homeDivision = teamDivisions.get(homeTeam.toLowerCase());
            const awayDivision = teamDivisions.get(awayTeam.toLowerCase());
            
            cupMatches.push({
              homeTeam,
              awayTeam,
              date,
              round: 'Cup Round 2',
              homeDivision,
              awayDivision
            });
          }
        });
      }
    });
    
    console.log(`✅ Found ${cupMatches.length} Cup Round 2 matches with league teams`);
    return cupMatches;
  } catch (error) {
    console.error('❌ Error fetching Cup matches:', error);
    return [];
  }
}