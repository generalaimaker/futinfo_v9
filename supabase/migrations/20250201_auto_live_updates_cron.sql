-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store project URL and anon key in Vault for secure access
select vault.create_secret('https://uutmymaxkkytibuiiaax.supabase.co', 'project_url');
select vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM', 'anon_key');

-- Create a function to update live matches
create or replace function update_live_matches()
returns void
language plpgsql
security definer
as $$
declare
  project_url text;
  anon_key text;
begin
  -- Get secrets from vault
  select decrypted_secret into project_url 
  from vault.decrypted_secrets 
  where name = 'project_url';
  
  select decrypted_secret into anon_key 
  from vault.decrypted_secrets 
  where name = 'anon_key';
  
  -- Call the Edge Function to update live matches
  perform net.http_post(
    url := project_url || '/functions/v1/unified-football-api',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'path', '/fixtures/live',
      'method', 'GET'
    ),
    timeout_milliseconds := 30000 -- 30 seconds timeout
  );
end;
$$;

-- Schedule the function to run every 30 seconds during match hours
-- This covers typical match times (morning to late night)
select cron.schedule(
  'update-live-matches-30s',
  '30 seconds', -- Using interval syntax for sub-minute scheduling
  $$
  -- Only run during typical match hours (8 AM to 11 PM UTC)
  SELECT CASE 
    WHEN EXTRACT(hour FROM now()) BETWEEN 8 AND 23 THEN
      update_live_matches()
    ELSE
      NULL
  END;
  $$
);

-- Also create a less frequent job for off-hours (every 5 minutes)
select cron.schedule(
  'update-live-matches-offhours',
  '*/5 * * * *', -- Every 5 minutes
  $$
  -- Only run during off-hours (midnight to 8 AM UTC)
  SELECT CASE 
    WHEN EXTRACT(hour FROM now()) NOT BETWEEN 8 AND 23 THEN
      update_live_matches()
    ELSE
      NULL
  END;
  $$
);

-- Create a function to check and clean up finished matches
create or replace function cleanup_finished_matches()
returns void
language plpgsql
as $$
begin
  -- Delete matches that have been finished for more than 2 hours
  delete from live_matches
  where status_short in ('FT', 'AET', 'PEN')
  and last_updated < now() - interval '2 hours';
  
  -- Also delete any matches that haven't been updated in 4 hours
  -- (likely means they're no longer being tracked)
  delete from live_matches
  where last_updated < now() - interval '4 hours';
end;
$$;

-- Schedule cleanup every hour
select cron.schedule(
  'cleanup-finished-matches',
  '0 * * * *', -- Every hour at minute 0
  'SELECT cleanup_finished_matches()'
);

-- Create monitoring functions
create or replace function get_cron_job_status()
returns table (
  jobname text,
  schedule text,
  active boolean,
  last_run timestamptz
)
language sql
as $$
  select 
    jobname,
    schedule,
    active,
    (select max(start_time) from cron.job_run_details where jobid = cron.job.jobid) as last_run
  from cron.job
  where jobname like 'update-live-matches%' or jobname = 'cleanup-finished-matches';
$$;

-- Create a function to manually trigger live match updates (for testing)
create or replace function trigger_live_match_update()
returns void
language plpgsql
security definer
as $$
begin
  perform update_live_matches();
end;
$$;

-- Grant necessary permissions
grant execute on function update_live_matches() to postgres;
grant execute on function cleanup_finished_matches() to postgres;
grant execute on function get_cron_job_status() to authenticated;
grant execute on function trigger_live_match_update() to authenticated;

-- Add comments for documentation
comment on function update_live_matches() is 'Calls the Edge Function to update live match data from API-Football';
comment on function cleanup_finished_matches() is 'Removes finished matches and stale data from live_matches table';
comment on function get_cron_job_status() is 'Returns the status of all cron jobs related to live match updates';
comment on function trigger_live_match_update() is 'Manually trigger a live match update (for testing)';