-- =====================================================
-- DARTS APP DATABASE SCHEMA
-- =====================================================
-- This schema stores all scraped darts league data
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    division TEXT,
    season TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club Venues Table
CREATE TABLE club_venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    opening_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    season TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, team_id, season)
);

-- =====================================================
-- MATCH DATA
-- =====================================================

-- Matchdays Table
CREATE TABLE matchdays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round INTEGER NOT NULL,
    date DATE NOT NULL,
    season TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(round, season)
);

-- Matches Table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matchday_id UUID REFERENCES matchdays(id) ON DELETE CASCADE,
    home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    home_sets INTEGER NOT NULL,
    away_sets INTEGER NOT NULL,
    home_legs INTEGER NOT NULL,
    away_legs INTEGER NOT NULL,
    season TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(matchday_id, home_team_id, away_team_id)
);

-- Singles Games Table
CREATE TABLE singles_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    home_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    away_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    home_average DECIMAL(5,2),
    away_average DECIMAL(5,2),
    home_checkouts TEXT,
    away_checkouts TEXT,
    game_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doubles Games Table
CREATE TABLE doubles_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    home_player1_id UUID REFERENCES players(id) ON DELETE CASCADE,
    home_player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
    away_player1_id UUID REFERENCES players(id) ON DELETE CASCADE,
    away_player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    game_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SCHEDULE DATA
-- =====================================================

-- Future Schedule Table
CREATE TABLE future_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round INTEGER NOT NULL,
    date DATE NOT NULL,
    home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    season TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(round, home_team_id, away_team_id, season)
);

-- Cup Matches Table
CREATE TABLE cup_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_name TEXT NOT NULL,
    date DATE NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    home_division TEXT,
    away_division TEXT,
    season TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(round_name, home_team, away_team, season)
);

-- =====================================================
-- STATISTICS TABLES
-- =====================================================

-- Team Averages Table
CREATE TABLE team_averages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    season TEXT NOT NULL,
    average DECIMAL(5,2),
    singles_won INTEGER DEFAULT 0,
    singles_lost INTEGER DEFAULT 0,
    doubles_won INTEGER DEFAULT 0,
    doubles_lost INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, season)
);

-- Player Statistics Table
CREATE TABLE player_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    season TEXT NOT NULL,
    average DECIMAL(5,2),
    singles_won INTEGER DEFAULT 0,
    singles_lost INTEGER DEFAULT 0,
    singles_percentage DECIMAL(5,2),
    doubles_won INTEGER DEFAULT 0,
    doubles_lost INTEGER DEFAULT 0,
    doubles_percentage DECIMAL(5,2),
    combined_percentage DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, season)
);

-- League Standings Table (computed/cached)
CREATE TABLE league_standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    season TEXT NOT NULL,
    position INTEGER NOT NULL,
    played INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    legs_for INTEGER DEFAULT 0,
    legs_against INTEGER DEFAULT 0,
    goal_diff INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, season)
);

-- =====================================================
-- SPECIAL ACHIEVEMENTS
-- =====================================================

-- 180s Table
CREATE TABLE one_eighties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    count INTEGER DEFAULT 1,
    season TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- High Finishes Table
CREATE TABLE high_finishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    finish_value INTEGER NOT NULL,
    season TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- METADATA & SCRAPING INFO
-- =====================================================

-- Scrape Log Table
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scrape_type TEXT NOT NULL, -- 'league_overview', 'team_detail', etc.
    season TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'error', 'partial'
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Team indexes
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_season ON teams(season);

-- Player indexes
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_season ON players(season);

-- Match indexes
CREATE INDEX idx_matches_matchday_id ON matches(matchday_id);
CREATE INDEX idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX idx_matches_season ON matches(season);

-- Matchday indexes
CREATE INDEX idx_matchdays_round ON matchdays(round);
CREATE INDEX idx_matchdays_season ON matchdays(season);
CREATE INDEX idx_matchdays_date ON matchdays(date);

-- Singles game indexes
CREATE INDEX idx_singles_games_match_id ON singles_games(match_id);
CREATE INDEX idx_singles_games_home_player_id ON singles_games(home_player_id);
CREATE INDEX idx_singles_games_away_player_id ON singles_games(away_player_id);

-- Statistics indexes
CREATE INDEX idx_player_statistics_player_id ON player_statistics(player_id);
CREATE INDEX idx_player_statistics_season ON player_statistics(season);
CREATE INDEX idx_team_averages_team_id ON team_averages(team_id);
CREATE INDEX idx_team_averages_season ON team_averages(season);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Latest Match Results
CREATE VIEW v_latest_matches AS
SELECT 
    m.id as match_id,
    md.round as matchday,
    md.date,
    ht.name as home_team,
    at.name as away_team,
    m.home_sets,
    m.away_sets,
    m.home_legs,
    m.away_legs,
    m.season
FROM matches m
JOIN matchdays md ON m.matchday_id = md.id
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
ORDER BY md.date DESC, md.round DESC;

-- View: Player Performance Summary
CREATE VIEW v_player_performance AS
SELECT 
    p.id as player_id,
    p.name as player_name,
    t.name as team_name,
    ps.season,
    ps.average,
    ps.singles_won,
    ps.singles_lost,
    ps.singles_percentage,
    ps.doubles_won,
    ps.doubles_lost,
    ps.doubles_percentage,
    ps.combined_percentage,
    (ps.singles_won + ps.doubles_won) as total_wins,
    (ps.singles_lost + ps.doubles_lost) as total_losses
FROM players p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN player_statistics ps ON p.id = ps.player_id
ORDER BY ps.combined_percentage DESC NULLS LAST;

-- View: Team Standings with Stats
CREATE VIEW v_team_standings AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    ls.position,
    ls.played,
    ls.points,
    ls.legs_for,
    ls.legs_against,
    ls.goal_diff,
    ta.average as team_average,
    ta.singles_won,
    ta.singles_lost,
    ta.doubles_won,
    ta.doubles_lost,
    ls.season
FROM teams t
JOIN league_standings ls ON t.id = ls.team_id
LEFT JOIN team_averages ta ON t.id = ta.team_id AND ls.season = ta.season
ORDER BY ls.position ASC;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_club_venues_updated_at BEFORE UPDATE ON club_venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matchdays_updated_at BEFORE UPDATE ON matchdays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_averages_updated_at BEFORE UPDATE ON team_averages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_statistics_updated_at BEFORE UPDATE ON player_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_league_standings_updated_at BEFORE UPDATE ON league_standings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (Optional - Enable if needed)
-- =====================================================

-- Enable RLS on tables (commented out by default)
-- ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Example policy (read-only for public)
-- CREATE POLICY "Public can read all teams" ON teams FOR SELECT USING (true);

-- =====================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- =====================================================

-- Uncomment to insert sample data
/*
INSERT INTO teams (name, division, season) VALUES
    ('Dartclub Twentytwo 4', '5', '2025/26'),
    ('PSV Wien Darts 1', '5', '2025/26'),
    ('TC Aspern 1', '5', '2025/26');
*/

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE teams IS 'Stores all team information';
COMMENT ON TABLE players IS 'Stores all player information with team associations';
COMMENT ON TABLE matches IS 'Stores match results';
COMMENT ON TABLE singles_games IS 'Stores individual singles game results within matches';
COMMENT ON TABLE doubles_games IS 'Stores doubles game results within matches';
COMMENT ON TABLE player_statistics IS 'Aggregated player statistics per season';
COMMENT ON TABLE team_averages IS 'Team performance metrics and averages';
COMMENT ON TABLE league_standings IS 'Current league table standings';
COMMENT ON TABLE scrape_logs IS 'Logs of all scraping operations for debugging';
