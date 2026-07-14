-- Speed to Lead / Intake Agent Performance analytics. All SECURITY INVOKER
-- (the default -- no "security definer"), so RLS on ghl_contacts,
-- ghl_messages, and ghl_users is enforced for whichever user calls them.
--
-- First Response Time = first outbound message/call timestamp minus the
-- contact's first_contacted_at (GHL's own "date added" for the lead --
-- NOT ghl_contacts.created_at, which is just when *we* inserted the row
-- during sync and carries no meaningful relationship to when the lead
-- actually came in).

-- Reusable base: one row per contact that has both a real lead-creation
-- timestamp and at least one outbound message, within an optional date
-- window on first_contacted_at (the "lead came in during this period"
-- filter used by every widget below).
create or replace function public.contact_first_response_times(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  contact_id uuid,
  assigned_to uuid,
  first_contacted_at timestamptz,
  first_response_at timestamptz,
  response_seconds numeric
)
language sql
stable
as $$
  select
    c.id as contact_id,
    c.assigned_to,
    c.first_contacted_at,
    m.first_response_at,
    extract(epoch from (m.first_response_at - c.first_contacted_at)) as response_seconds
  from public.ghl_contacts c
  join lateral (
    select min(sent_at) as first_response_at
    from public.ghl_messages msg
    where msg.contact_id = c.id
      and msg.direction = 'outbound'
  ) m on true
  where c.first_contacted_at is not null
    and m.first_response_at is not null
    and m.first_response_at >= c.first_contacted_at
    and (p_start is null or c.first_contacted_at >= p_start)
    and (p_end is null or c.first_contacted_at <= p_end);
$$;

revoke execute on function public.contact_first_response_times(timestamptz, timestamptz) from public;
grant execute on function public.contact_first_response_times(timestamptz, timestamptz) to authenticated;

create or replace function public.dashboard_response_time_stats(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  avg_seconds numeric,
  median_seconds numeric,
  min_seconds numeric,
  max_seconds numeric,
  sample_count bigint
)
language sql
stable
as $$
  select
    avg(response_seconds) as avg_seconds,
    percentile_cont(0.5) within group (order by response_seconds) as median_seconds,
    min(response_seconds) as min_seconds,
    max(response_seconds) as max_seconds,
    count(*) as sample_count
  from public.contact_first_response_times(p_start, p_end);
$$;

revoke execute on function public.dashboard_response_time_stats(timestamptz, timestamptz) from public;
grant execute on function public.dashboard_response_time_stats(timestamptz, timestamptz) to authenticated;

create or replace function public.dashboard_response_time_by_agent(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  avg_seconds numeric,
  median_seconds numeric,
  sample_count bigint
)
language sql
stable
as $$
  select
    u.id as user_id,
    u.first_name,
    u.last_name,
    avg(r.response_seconds) as avg_seconds,
    percentile_cont(0.5) within group (order by r.response_seconds) as median_seconds,
    count(*) as sample_count
  from public.contact_first_response_times(p_start, p_end) r
  join public.ghl_users u on u.id = r.assigned_to
  group by u.id, u.first_name, u.last_name
  order by avg_seconds asc nulls last;
$$;

revoke execute on function public.dashboard_response_time_by_agent(timestamptz, timestamptz) from public;
grant execute on function public.dashboard_response_time_by_agent(timestamptz, timestamptz) to authenticated;

create or replace function public.dashboard_response_time_by_day(
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (
  day date,
  avg_seconds numeric,
  median_seconds numeric,
  sample_count bigint
)
language sql
stable
as $$
  select
    date_trunc('day', first_contacted_at)::date as day,
    avg(response_seconds) as avg_seconds,
    percentile_cont(0.5) within group (order by response_seconds) as median_seconds,
    count(*) as sample_count
  from public.contact_first_response_times(p_start, p_end)
  group by date_trunc('day', first_contacted_at)::date
  order by day asc;
$$;

revoke execute on function public.dashboard_response_time_by_day(timestamptz, timestamptz) from public;
grant execute on function public.dashboard_response_time_by_day(timestamptz, timestamptz) to authenticated;
