-- Create league_teams table to store teams for each league
CREATE TABLE IF NOT EXISTS league_teams (
    id SERIAL PRIMARY KEY,
    league_id INT NOT NULL,
    team_id INT NOT NULL,
    team_name TEXT NOT NULL,
    team_logo TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, team_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_league_teams_league_id ON league_teams(league_id);

-- Enable Row Level Security
ALTER TABLE league_teams ENABLE ROW LEVEL SECURITY;

-- Allow all users to read league teams
CREATE POLICY "Allow public read access" ON league_teams
    FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Allow authenticated users to manage" ON league_teams
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert Bundesliga teams
INSERT INTO league_teams (league_id, team_id, team_name, team_logo, display_order) VALUES
(78, 168, 'Bayer Leverkusen', 'https://media.api-sports.io/football/teams/168.png', 1),
(78, 172, 'VfB Stuttgart', 'https://media.api-sports.io/football/teams/172.png', 2),
(78, 157, 'Bayern Munich', 'https://media.api-sports.io/football/teams/157.png', 3),
(78, 165, 'Borussia Dortmund', 'https://media.api-sports.io/football/teams/165.png', 4),
(78, 160, 'Eintracht Frankfurt', 'https://media.api-sports.io/football/teams/160.png', 5),
(78, 167, 'VfL Wolfsburg', 'https://media.api-sports.io/football/teams/167.png', 6),
(78, 163, 'Borussia M.Gladbach', 'https://media.api-sports.io/football/teams/163.png', 7),
(78, 182, 'Union Berlin', 'https://media.api-sports.io/football/teams/182.png', 8),
(78, 162, 'Werder Bremen', 'https://media.api-sports.io/football/teams/162.png', 9),
(78, 169, 'RB Leipzig', 'https://media.api-sports.io/football/teams/169.png', 10)
ON CONFLICT (league_id, team_id) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    team_logo = EXCLUDED.team_logo,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();