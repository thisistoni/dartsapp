/**
 * List of all teams in the WDV Landesliga 5. Division A + DC Patron II & Fortunas Wölfe
 */
export const teams: string[] = [
    'Dartclub Twentytwo 4',
    'PSV Wien Darts 1',
    'TC Aspern 1',
    'Temmel Fundraising Darts Lions 2',
    'AS The Dart Side of the Moon II',
    'BSW Zwara Panier',
    'DC Patron',
    'Fortunas Wölfe',
    'DC Patron II',
];

/**
 * Special team identifier for league overview page
 */
export const LEAGUE_OVERVIEW = 'League Overview';

/**
 * All available options including league overview
 */
export const allTeamOptions = [LEAGUE_OVERVIEW, ...teams];
