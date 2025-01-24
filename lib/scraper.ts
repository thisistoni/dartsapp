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
    console.log("FETCH MATCH REPORT ENTERED");
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const matchReport: MatchReport = { lineup: [], checkouts: [], opponent: '' };

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

        $('table.spielbericht tbody tr.spielbericht').each((index, element) => {
            console.log('Processing row:', index);

            const homePlayer = $(element).find('td').find('table.set').eq(0).find('b').first().text().trim();
            const awayPlayer = $(element).find('td').find('table.set').eq(1).find('b').last().text().trim();

            // Check if it's a duo match or a single match
            const duoPlayersHome = $(element).find('td').eq(1).find('b');
            const duoPlayersAway = $(element).find('td').eq(6).find('b');

            if (duoPlayersHome.length === 3 && duoPlayersAway.length === 3) {
                // Duo-Match gefunden
                if (isHomeTeam) {
                    const player1 = duoPlayersHome.eq(0).text().trim();
                    const player2 = duoPlayersHome.eq(1).text().trim();
                    matchReport.lineup.push(`${player1}, ${player2}`);
                }
                if (isAwayTeam) {
                    const player1 = duoPlayersAway.eq(1).text().trim();
                    const player2 = duoPlayersAway.eq(2).text().trim();
                    matchReport.lineup.push(`${player1}, ${player2}`);
                }
            } else {
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


                if (isHomeTeam) {
                    if (homePlayer) {
                        matchReport.lineup.push(homePlayer);
                        const playerPerformance = formatPlayerPerformance(homePlayer, homeDarts, homeRest);
                        matchReport.checkouts.push({ scores: playerPerformance });
                    }
                } else if (isAwayTeam) {
                    if (awayPlayer) {
                        matchReport.lineup.push(awayPlayer);
                        const playerPerformance = formatPlayerPerformance(awayPlayer, awayDarts, awayRest);
                        matchReport.checkouts.push({ scores: playerPerformance });
                    }
                }
            }
        });

        return matchReport;
    } catch (error) {
        console.error('Fehler beim Abrufen des Spielberichts:', error);
        return { lineup: [], checkouts: [], opponent: '' };
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
        
        let opponent = homeTeam === teamName ? awayTeam : homeTeam;
        let score = homeTeam === teamName ? `${homeSets}-${awaySets}` : `${awaySets}-${homeSets}`;
        
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