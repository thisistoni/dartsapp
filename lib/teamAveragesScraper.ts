import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchTeamAverages(): Promise<Record<string, number>> {
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

  const averages: Record<string, number> = {};

  for (const team of teams) {
    try {
      const { data } = await axios.get(team.url);
      const $ = cheerio.load(data);
      let avg = 0;
      $('h4').each((_, elem) => {
        if ($(elem).text().includes('Average')) {
          const avgCell = $(elem)
            .next('div.ranking')
            .find('tfoot tr td')
            .eq(6)
            .text()
            .trim();
          if (avgCell) {
            avg = parseFloat(avgCell.replace(',', '.')) * 3;
          }
        }
      });
      averages[team.name] = Number(avg.toFixed(2));
      console.log(`Average for ${team.name}: ${avg.toFixed(2)}`);
    } catch (error) {
      console.error(`Error fetching average for ${team.name}:`, error);
      averages[team.name] = 0;
    }
  }

  return averages;
}
