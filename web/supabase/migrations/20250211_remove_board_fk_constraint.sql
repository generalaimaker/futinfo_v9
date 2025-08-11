-- Remove foreign key constraint from posts.board_id to allow dynamic team boards
-- This allows creating posts for team boards that don't exist in the boards table

-- First, drop the existing foreign key constraint
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_board_id_fkey;

-- Add a check constraint to ensure board_id follows the correct format
ALTER TABLE public.posts 
ADD CONSTRAINT posts_board_id_check 
CHECK (
  board_id ~ '^(all|news|match|transfer|team_[0-9]+)$'
);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON public.posts(board_id);