-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_team_ids INTEGER[] DEFAULT '{}',
  favorite_league_ids INTEGER[] DEFAULT '{}',
  notification_settings JSONB DEFAULT '{
    "matchStart": true,
    "goals": true,
    "matchEnd": true,
    "news": true,
    "communityReplies": true
  }'::jsonb,
  language VARCHAR(5) DEFAULT 'ko',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_favorite_teams ON public.user_preferences USING GIN(favorite_team_ids);
CREATE INDEX idx_user_preferences_favorite_leagues ON public.user_preferences USING GIN(favorite_league_ids);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON public.user_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();