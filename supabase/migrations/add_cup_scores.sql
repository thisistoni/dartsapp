-- Add home_score and away_score to cup_matches if they don't exist
ALTER TABLE public.cup_matches 
ADD COLUMN IF NOT EXISTS home_score INTEGER,
ADD COLUMN IF NOT EXISTS away_score INTEGER;

-- Add unique constraint to prevent duplicate cup matches
ALTER TABLE public.cup_matches 
DROP CONSTRAINT IF EXISTS cup_matches_round_name_home_team_away_team_season_key;

ALTER TABLE public.cup_matches 
ADD CONSTRAINT cup_matches_round_name_home_team_away_team_season_key 
UNIQUE (round_name, home_team, away_team, season);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cup_matches_season_teams 
ON public.cup_matches(season, home_team, away_team);
