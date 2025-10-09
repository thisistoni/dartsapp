import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LeagueScheduleMatch {
  round: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
}

export async function fetchLeagueSchedule(): Promise<LeagueScheduleMatch[]> {
  const url = 'https://www.wdv-dart.at/_landesliga/_liga/termine.php?div=5&saison=2025/26';
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const schedule: LeagueScheduleMatch[] = [];

    // Find all h4 elements that contain "Runde"
    $('h4').each((_, elem) => {
      const headerText = $(elem).text().trim();
      const roundMatch = headerText.match(/Runde (\d+) - (\d{2}\.\d{2}\.\d{4})/);
      if (roundMatch) {
        const round = parseInt(roundMatch[1]);
        const date = roundMatch[2];
        // Get the next div.ranking table
        const table = $(elem).next('div.ranking').find('table.ranking');
        table.find('tbody tr.ranking').each((_, row) => {
          const cells = $(row).find('td');
          const homeTeam = $(cells[0]).text().trim();
          const awayTeam = $(cells[1]).text().trim();
          if (homeTeam && awayTeam) {
            schedule.push({ round, date, homeTeam, awayTeam });
          }
        });
      }
    });
    return schedule;
  } catch (error) {
    console.error('❌ Error fetching league schedule:', error);
    return [];
  }
}
