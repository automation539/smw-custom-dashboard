-- Read-only dashboard aggregation functions. These are SECURITY INVOKER
-- (the default -- no "security definer" here), so each underlying table
-- reference enforces the calling user's own RLS policies automatically.
-- They exist purely to aggregate in Postgres rather than transferring
-- potentially thousands of rows to compute counts/groupings client-side.

create or replace function public.dashboard_stat_counts()
returns table (
  total_contacts bigint,
  total_opportunities bigint,
  open_opportunities bigint,
  won_opportunities bigint,
  lost_opportunities bigint,
  total_messages bigint,
  inbound_messages bigint,
  outbound_messages bigint,
  total_users bigint
)
language sql
stable
as $$
  select
    (select count(*) from public.ghl_contacts) as total_contacts,
    (select count(*) from public.ghl_opportunities) as total_opportunities,
    (select count(*) from public.ghl_opportunities where status = 'open') as open_opportunities,
    (select count(*) from public.ghl_opportunities where status = 'won') as won_opportunities,
    (select count(*) from public.ghl_opportunities where status = 'lost') as lost_opportunities,
    (select count(*) from public.ghl_messages) as total_messages,
    (select count(*) from public.ghl_messages where direction = 'inbound') as inbound_messages,
    (select count(*) from public.ghl_messages where direction = 'outbound') as outbound_messages,
    (select count(*) from public.ghl_users) as total_users;
$$;

revoke execute on function public.dashboard_stat_counts() from public;
grant execute on function public.dashboard_stat_counts() to authenticated;

-- Open opportunities grouped by pipeline/stage. Pipeline and stage names
-- aren't synced yet (only their GHL ids), so the UI labels these with a
-- shortened id -- a natural follow-up once a pipelines sync exists.
create or replace function public.dashboard_pipeline_summary()
returns table (
  pipeline_id text,
  pipeline_stage_id text,
  opportunity_count bigint,
  total_value numeric
)
language sql
stable
as $$
  select
    pipeline_id,
    pipeline_stage_id,
    count(*) as opportunity_count,
    coalesce(sum(monetary_value), 0) as total_value
  from public.ghl_opportunities
  where status = 'open'
  group by pipeline_id, pipeline_stage_id
  order by opportunity_count desc;
$$;

revoke execute on function public.dashboard_pipeline_summary() from public;
grant execute on function public.dashboard_pipeline_summary() to authenticated;

create or replace function public.dashboard_status_breakdown()
returns table (
  status text,
  opportunity_count bigint,
  total_value numeric
)
language sql
stable
as $$
  select
    status,
    count(*) as opportunity_count,
    coalesce(sum(monetary_value), 0) as total_value
  from public.ghl_opportunities
  group by status
  order by opportunity_count desc;
$$;

revoke execute on function public.dashboard_status_breakdown() from public;
grant execute on function public.dashboard_status_breakdown() to authenticated;

-- Top p_limit sources by contact count, with everything past that folded
-- into a single "Other" row rather than silently dropped.
create or replace function public.dashboard_contacts_by_source(p_limit int default 8)
returns table (
  source text,
  contact_count bigint
)
language sql
stable
as $$
  with grouped as (
    select coalesce(source, 'Unknown') as source, count(*) as contact_count
    from public.ghl_contacts
    group by coalesce(source, 'Unknown')
  ),
  ranked as (
    select *, row_number() over (order by contact_count desc) as rn
    from grouped
  ),
  top_n as (
    select source, contact_count from ranked where rn <= p_limit
  ),
  other as (
    select 'Other'::text as source, coalesce(sum(contact_count), 0) as contact_count
    from ranked
    where rn > p_limit
    having sum(contact_count) > 0
  ),
  combined as (
    select source, contact_count from top_n
    union all
    select source, contact_count from other
  )
  select source, contact_count
  from combined
  order by (source = 'Other'), contact_count desc;
$$;

revoke execute on function public.dashboard_contacts_by_source(int) from public;
grant execute on function public.dashboard_contacts_by_source(int) to authenticated;

create or replace function public.dashboard_messages_by_day(p_days_back int default 14)
returns table (
  day date,
  inbound_count bigint,
  outbound_count bigint
)
language sql
stable
as $$
  select
    date_trunc('day', sent_at)::date as day,
    count(*) filter (where direction = 'inbound') as inbound_count,
    count(*) filter (where direction = 'outbound') as outbound_count
  from public.ghl_messages
  where sent_at >= (now() - (p_days_back || ' days')::interval)
  group by date_trunc('day', sent_at)::date
  order by day asc;
$$;

revoke execute on function public.dashboard_messages_by_day(int) from public;
grant execute on function public.dashboard_messages_by_day(int) to authenticated;

create or replace function public.dashboard_agent_leaderboard()
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  total_contacts bigint,
  total_opportunities bigint,
  won_opportunities bigint,
  total_value numeric
)
language sql
stable
as $$
  select
    u.id as user_id,
    u.first_name,
    u.last_name,
    coalesce(c.contact_count, 0) as total_contacts,
    coalesce(o.opp_count, 0) as total_opportunities,
    coalesce(o.won_count, 0) as won_opportunities,
    coalesce(o.won_value, 0) as total_value
  from public.ghl_users u
  left join (
    select assigned_to, count(*) as contact_count
    from public.ghl_contacts
    where assigned_to is not null
    group by assigned_to
  ) c on c.assigned_to = u.id
  left join (
    select
      assigned_to,
      count(*) as opp_count,
      count(*) filter (where status = 'won') as won_count,
      coalesce(sum(monetary_value) filter (where status = 'won'), 0) as won_value
    from public.ghl_opportunities
    where assigned_to is not null
    group by assigned_to
  ) o on o.assigned_to = u.id
  order by total_opportunities desc, total_contacts desc;
$$;

revoke execute on function public.dashboard_agent_leaderboard() from public;
grant execute on function public.dashboard_agent_leaderboard() to authenticated;
