import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScheduleMatch {
    round: string;
    date: string;
    opponent: string;
    venue: string;
    address: string;
    location: string;
}

export async function GET() {
    try {
        // Fetch the HTML content
        const response = await axios.get('https://www.wdv-dart.at/_landesliga/_liga/termmann1.php?div=5&saison=2024/25&id=2015&mannschaft=DC+Patron');
        const html = response.data;

        // Load HTML into cheerio
        const $ = cheerio.load(html);

        // Parse the schedule table
        const scheduleData: ScheduleMatch[] = [];
        $('.ranking tbody tr').each((_, row) => {
            const $row = $(row);
            const columns = $row.find('td');

            scheduleData.push({
                round: $(columns[0]).text().trim(),
                date: $(columns[1]).text().trim(),
                opponent: $(columns[2]).text().trim(),
                venue: $(columns[3]).text().trim(),
                address: $(columns[4]).text().trim(),
                location: $(columns[5]).text().trim(),
            });
        });

        // Convert date format from DD.MM.YYYY to YYYY-MM-DD
        const formattedSchedule = scheduleData.map(match => ({
            ...match,
            date: match.date.split('.').reverse().join('-'),
        }));

        return Response.json(formattedSchedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return Response.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
} 