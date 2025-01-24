import axios from 'axios';
import * as cheerio from 'cheerio';
import { ClubVenue, MatchReport, Player, ComparisonData, TeamStandings } from './types';






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
        console.error(`Fehler beim Abrufen der URL: ${error}`);
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
        console.error(`Fehler beim Abrufen der URL: ${error}`);
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

        const firstTableRows = $('table.ranking').first().find('tbody tr');
        firstTableRows.each((_, element) => {
            const playerName = $(element).find('td:nth-child(2) a').text().trim();
            const averageText = $(element).find('td:nth-child(7)').text().trim();
            const average = parseFloat(averageText);

            if (playerName && !isNaN(average)) {
                const adjustedAverage = parseFloat((average * 3).toFixed(2)); // Lösung
                players.push({ playerName, adjustedAverage });
            }
        });

        return players;
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
        return [];
    }
}

// Fetch Match Report
export async function fetchMatchReport(id: string, teamName: string): Promise<MatchReport> {
    const url = `https://www.wdv-dart.at/_landesliga/_statistik/spielbericht.php?id=${id}&saison=2024/25`;
    
    try {
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
            }
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

            if (isHomeTeam && homeDarts.length > 0) {
                const playerName = matchReport.lineup[matchReport.lineup.length - 1];
                const playerPerformance = formatPlayerPerformance(playerName, homeDarts, homeRest);
                matchReport.checkouts.push({ scores: playerPerformance });
            } else if (isAwayTeam && awayDarts.length > 0) {
                const playerName = matchReport.lineup[matchReport.lineup.length - 1];
                const playerPerformance = formatPlayerPerformance(playerName, awayDarts, awayRest);
                matchReport.checkouts.push({ scores: playerPerformance });
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
        console.error('Fehler beim Abrufen des Spielberichts:', error);
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
        console.error('Fehler beim Abrufen der Tabellenposition:', error);
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
        console.error('Fehler beim Abrufen der Club-Adresse:', error);
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
        console.error('Error fetching team standings:', error);
        return null;
    }
}

// Add these new helper functions
function calculateAverage(darts: number[], rests: number[]): number {
    // Validate input data
    if (!Array.isArray(darts) || !Array.isArray(rests) || darts.length !== rests.length || 
        darts.length < 3 || darts.length > 5) {
        console.error('Invalid input data for average calculation');
        return 35;
    }

    // Filter out invalid data pairs but keep pairs where rest is 0
    const validPairs = darts.map((dart, index) => ({
        darts: dart,
        rest: rests[index]
    })).filter(pair => 
        pair.darts > 0 && 
        pair.darts <= 45 && // Maximum reasonable darts per leg
        pair.rest >= 0 && // Allow 0 rests
        pair.rest <= 501
    );

    if (validPairs.length < 3) {
        console.error('Need at least 3 valid dart/rest pairs');
        return 35;
    }

    const n = validPairs.length;
    const sumDarts = validPairs.reduce((acc, pair) => acc + pair.darts, 0);
    const sumRests = validPairs.reduce((acc, pair) => acc + pair.rest, 0);
    
    // Average = (501 x n - ∑ Rest) / (∑ Darts) * 3
    const average = ((501 * n - sumRests) / sumDarts) * 3;

    // Validate the calculated average
    if (isNaN(average) || average < 35 || average > 150) {
        console.error('Invalid average calculated:', average);
        return 35;
    }

    return Number(average.toFixed(2));
}

function extractPlayerData($: cheerio.CheerioAPI, playerRow: cheerio.Element, isHomeTeam: boolean) {
    const darts: number[] = [];
    const rests: number[] = [];
    
    if (!playerRow) {
        console.error('Invalid player row');
        return { darts: [], rests: [] };
    }

    // Find the darts row and rest row
    const dartsRow = $(playerRow).find('tr').eq(1);
    const restsRow = $(playerRow).find('tr').eq(2);
    
    if (!dartsRow.length || !restsRow.length) {
        console.error('Could not find darts or rests rows');
        return { darts: [], rests: [] };
    }

    // Process each cell in parallel to ensure matching darts and rests
    let validPairsFound = 0;
    dartsRow.find('td.t3').each((index, cell) => {
        if (validPairsFound >= 5) return; // Stop after 5 valid pairs

        const dartValue = $(cell).text().trim();
        const restValue = $(restsRow).find('td.t3').eq(index).text().trim();
        
        // Include pairs where dart is valid and rest is either valid or 0
        if (dartValue !== '-') {
            const dart = parseInt(dartValue);
            const rest = restValue === '-' ? 0 : parseInt(restValue);
            
            if (!isNaN(dart) && !isNaN(rest) && 
                dart > 0 && dart <= 45 && 
                rest >= 0 && rest <= 501) {
                darts.push(dart);
                rests.push(rest);
                validPairsFound++;
            }
        }
    });

    // Return data if we have at least 3 valid pairs
    if (darts.length >= 3 && darts.length === rests.length) {
        return { darts, rests };
    }

    return { darts: [], rests: [] };
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
                    const average = calculateAverage(validDarts, validRests);
                    playerAverages.push({ playerName, average });
                    totalTeamAverage += average;
                    playerCount++;
                }
            }
        });

        return {
            matchday: 0,
            teamAverage: playerCount > 0 ? Number((totalTeamAverage / playerCount).toFixed(2)) : 0,
            playerAverages
        };
    } catch (error) {
        console.error('Error fetching match averages:', error);
        return {
            matchday: 0,
            teamAverage: 0,
            playerAverages: []
        };
    }
}