import axios from 'axios';
import * as cheerio from 'cheerio';

export interface PlayerStats {
  name: string;
  team: string;
  average: number;
  singlesWon: number;
  singlesLost: number;
  singlesPercentage: number;
  doublesWon: number;
  doublesLost: number;
  doublesPercentage: number;
  combinedPercentage: number;
}

export interface TeamStats {
  average: number;
  singles: string; // Format: "won-lost"
  doubles: string; // Format: "won-lost"
}

export interface ScraperResult {
  teamStats: Record<string, TeamStats>;
  playerStats: PlayerStats[];
}

export async function fetchTeamAverages(): Promise<ScraperResult> {
  const teams: { name: string; url: string }[] = [
    {
      name: 'DC Patron',
      url: 'https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=DC+Patron',
    },
    {
      name: 'Dartclub Twentytwo 4',
      url: 'https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=Dartclub+Twentytwo+4',
    },
    {
      name: 'PSV Wien Darts 1',
      url: 'https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=PSV+Wien+Darts+1',
    },
    {
      name: 'AS The Dart Side of the Moon II',
      url: 'https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=AS+The+Dart+Side+of+the+Moon+II',
    },
    {
      name: 'TC Aspern 1',
      url: 'https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=TC+Aspern+1',
    },
    {
      name: 'Temmel Fundraising Darts Lions 2',
      url: 'https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=Temmel+Fundraising+Darts+Lions+2',
    },
    {
      name: 'BSW Zwara Panier',
      url: 'https://www.wdv-dart.at/_landesliga/_statistik/mannschaft.php?start=1754042400&ende=1785578400&saison=2025/26&dartsldg=18&mannschaft=BSW+Zwara+Panier',
    },
  ];

  const teamStats: Record<string, TeamStats> = {};
  const playerStats: PlayerStats[] = [];

  for (const team of teams) {
    try {
      const { data } = await axios.get(team.url);
      const $ = cheerio.load(data);
      
      let avg = 0;
      let singles = '0-0';
      let doubles = '0-0';

      // Scrape Average and player averages
      $('h4').each((_, elem) => {
        const h4Text = $(elem).text().trim();
        
        if (h4Text.includes('Average')) {
          const container = $(elem).next('div.ranking');
          const table = container.find('table.ranking');
          
          // Team average from tfoot
          const avgCell = container
            .find('tfoot tr td')
            .eq(6)
            .text()
            .trim();
          if (avgCell) {
            avg = parseFloat(avgCell.replace(',', '.')) * 3;
          }

          // Scrape individual player averages
          table.find('tbody tr.ranking').each((_, row) => {
            const playerNameElement = $(row).find('td').eq(1).find('a');
            const playerName = playerNameElement.length > 0 ? playerNameElement.text().trim() : $(row).find('td').eq(1).text().trim();
            const legs = parseInt($(row).find('td').eq(3).text().trim()) || 0;
            const avgValue = parseFloat($(row).find('td').eq(6).text().trim().replace(',', '.')) || 0;
            
            if (playerName && avgValue > 0 && legs >= 3) { // Only include players with at least 3 legs
              const existingPlayer = playerStats.find(p => p.name === playerName && p.team === team.name);
              if (existingPlayer) {
                existingPlayer.average = avgValue * 3;
              } else {
                playerStats.push({
                  name: playerName,
                  team: team.name,
                  average: avgValue * 3,
                  singlesWon: 0,
                  singlesLost: 0,
                  singlesPercentage: 0,
                  doublesWon: 0,
                  doublesLost: 0,
                  doublesPercentage: 0,
                  combinedPercentage: 0,
                });
              }
            }
            console.log(`Player: ${playerName}, Legs: ${legs}, Avg: ${avgValue}`);
          });
        }
        
        // Scrape Singles (Einzel) - both team and player data
        if (h4Text === 'Einzel') {
          const table = $(elem).next('div.ranking').find('table.ranking');
          const won = table.find('tfoot tr td').eq(3).text().trim();
          const lost = table.find('tfoot tr td').eq(4).text().trim();
          if (won && lost) {
            singles = `${won}-${lost}`;
          }

          // Scrape individual player singles stats
          table.find('tbody tr.ranking').each((_, row) => {
            const playerNameElement = $(row).find('td').eq(1).find('a');
            const playerName = playerNameElement.length > 0 ? playerNameElement.text().trim() : $(row).find('td').eq(1).text().trim();
            const setsWon = parseInt($(row).find('td').eq(3).text().trim()) || 0;
            const setsLost = parseInt($(row).find('td').eq(4).text().trim()) || 0;
            
            if (playerName) {
              let player = playerStats.find(p => p.name === playerName && p.team === team.name);
              if (!player) {
                // Create player if they don't exist yet
                player = {
                  name: playerName,
                  team: team.name,
                  average: 0,
                  singlesWon: 0,
                  singlesLost: 0,
                  singlesPercentage: 0,
                  doublesWon: 0,
                  doublesLost: 0,
                  doublesPercentage: 0,
                  combinedPercentage: 0,
                };
                playerStats.push(player);
              }
              player.singlesWon = setsWon;
              player.singlesLost = setsLost;
              const total = setsWon + setsLost;
              player.singlesPercentage = total > 0 ? (setsWon / total) * 100 : 0;
              console.log(`Singles - ${playerName}: ${setsWon}-${setsLost}`);
            }
          });
        }
        
        // Scrape Doubles (Doppel) - both team and player data
        if (h4Text === 'Doppel') {
          const table = $(elem).next('div.ranking').find('table.ranking');
          const wonRaw = table.find('tfoot tr td').eq(3).text().trim();
          const lostRaw = table.find('tfoot tr td').eq(4).text().trim();
          if (wonRaw && lostRaw) {
            const won = Math.floor(parseInt(wonRaw) / 2);
            const lost = Math.floor(parseInt(lostRaw) / 2);
            doubles = `${won}-${lost}`;
          }

          // Scrape individual player doubles stats
          table.find('tbody tr.ranking').each((_, row) => {
            const playerNameElement = $(row).find('td').eq(1).find('a');
            const playerName = playerNameElement.length > 0 ? playerNameElement.text().trim() : $(row).find('td').eq(1).text().trim();
            const setsWon = parseInt($(row).find('td').eq(3).text().trim()) || 0;
            const setsLost = parseInt($(row).find('td').eq(4).text().trim()) || 0;
            
            if (playerName) {
              let player = playerStats.find(p => p.name === playerName && p.team === team.name);
              if (!player) {
                // Create player if they don't exist yet
                player = {
                  name: playerName,
                  team: team.name,
                  average: 0,
                  singlesWon: 0,
                  singlesLost: 0,
                  singlesPercentage: 0,
                  doublesWon: 0,
                  doublesLost: 0,
                  doublesPercentage: 0,
                  combinedPercentage: 0,
                };
                playerStats.push(player);
              }
              player.doublesWon = setsWon;
              player.doublesLost = setsLost;
              const total = setsWon + setsLost;
              player.doublesPercentage = total > 0 ? (setsWon / total) * 100 : 0;
              console.log(`Doubles - ${playerName}: ${setsWon}-${setsLost}`);
            }
          });
        }
      });

      teamStats[team.name] = {
        average: Number(avg.toFixed(2)),
        singles,
        doubles,
      };
      
      console.log(`Stats for ${team.name}: Avg ${avg.toFixed(2)}, Singles ${singles}, Doubles ${doubles}`);
    } catch (error) {
      console.error(`Error fetching stats for ${team.name}:`, error);
      teamStats[team.name] = {
        average: 0,
        singles: '0-0',
        doubles: '0-0',
      };
    }
  }

  // Calculate combined percentage for all players
  playerStats.forEach(player => {
    const totalGames = player.singlesWon + player.singlesLost + player.doublesWon + player.doublesLost;
    const totalWins = player.singlesWon + player.doublesWon;
    player.combinedPercentage = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  });

  console.log(`Total players scraped: ${playerStats.length}`);
  console.log('Sample player data:', playerStats.slice(0, 3));

  return { teamStats, playerStats };
}
