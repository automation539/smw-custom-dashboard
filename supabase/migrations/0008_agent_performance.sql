-- Agent performance (list + drill-down). All SECURITY INVOKER (the
-- default), so RLS on ghl_users, ghl_contacts, ghl_opportunities, and
-- ghl_messages is enforced for whichever user calls them.
--
-- "Qualified opportunities" = total opportunities assigned to the agent
-- (our schema has no distinct "qualified" status -- this is the standard
-- proxy: a lead that progressed far enough to become an opportunity).
--
-- Assigned/contacted/qualified/won/lost/win-rate/total-won-value are
-- lifetime totals, NOT date-filtered: ghl_opportunities has no reliable
-- "created in GHL" timestamp (only our own sync created_at, which -- as
-- established for contacts/messages -- doesn't reflect when anything
-- actually happened). Only avg/median response time (which does have a
-- reliable anchor, first_contacted_at) respect p_start/p_end.

create or replace function public.agent_performance_stats(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_user_id uuid default null
)
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  assigned_leads bigint,
  contacted_leads bigint,
  qualified_opportunities bigint,
  won_opportunities bigint,
  lost_opportunities bigint,
  win_rate numeric,
  avg_response_seconds numeric,
  median_response_seconds numeric,
  total_won_value numeric
)
language sql
stable
as $$
  select
    u.id as user_id,
    u.first_name,
    u.last_name,
    coalesce(c.assigned_leads, 0) as assigned_leads,
    coalesce(c.contacted_leads, 0) as contacted_leads,
    coalesce(o.qualified_opportunities, 0) as qualified_opportunities,
    coalesce(o.won_opportunities, 0) as won_opportunities,
    coalesce(o.lost_opportunities, 0) as lost_opportunities,
    case
      when coalesce(o.won_opportunities, 0) + coalesce(o.lost_opportunities, 0) = 0 then null
      else round(100.0 * o.won_opportunities / (o.won_opportunities + o.lost_opportunities), 1)
    end as win_rate,
    r.avg_seconds as avg_response_seconds,
    r.median_seconds as median_response_seconds,
    coalesce(o.total_won_value, 0) as total_won_value
  from public.ghl_users u
  left join (
    select
      c.assigned_to,
      count(*) as assigned_leads,
      count(*) filter (where exists (
        select 1 from public.ghl_messages m
        where m.contact_id = c.id and m.direction = 'outbound'
      )) as contacted_leads
    from public.ghl_contacts c
    where c.assigned_to is not null
    group by c.assigned_to
  ) c on c.assigned_to = u.id
  left join (
    select
      assigned_to,
      count(*) as qualified_opportunities,
      count(*) filter (where status = 'won') as won_opportunities,
      count(*) filter (where status = 'lost') as lost_opportunities,
      coalesce(sum(monetary_value) filter (where status = 'won'), 0) as total_won_value
    from public.ghl_opportunities
    where assigned_to is not null
    group by assigned_to
  ) o on o.assigned_to = u.id
  left join public.dashboard_response_time_by_agent(p_start, p_end) r on r.user_id = u.id
  where (p_user_id is null or u.id = p_user_id)
  order by assigned_leads desc nulls last;
$$;

revoke execute on function public.agent_performance_stats(timestamptz, timestamptz, uuid) from public;
grant execute on function public.agent_performance_stats(timestamptz, timestamptz, uuid) to authenticated;

-- Drill-down response-time trend for one agent (same date-window semantics
-- as dashboard_response_time_by_day, filtered to a single assigned agent).
create or replace function public.agent_response_time_by_day(
  p_user_id uuid,
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
  where assigned_to = p_user_id
  group by date_trunc('day', first_contacted_at)::date
  order by day asc;
$$;

revoke execute on function public.agent_response_time_by_day(uuid, timestamptz, timestamptz) from public;
grant execute on function public.agent_response_time_by_day(uuid, timestamptz, timestamptz) to authenticated;

-- Drill-down recent activity: messages for contacts assigned to one agent.
create or replace function public.agent_recent_activity(
  p_user_id uuid,
  p_limit int default 20
)
returns table (
  message_id uuid,
  contact_id uuid,
  contact_first_name text,
  contact_last_name text,
  direction text,
  message_type text,
  body text,
  sent_at timestamptz
)
language sql
stable
as $$
  select
    m.id as message_id,
    m.contact_id,
    c.first_name as contact_first_name,
    c.last_name as contact_last_name,
    m.direction,
    m.message_type,
    m.body,
    m.sent_at
  from public.ghl_messages m
  join public.ghl_contacts c on c.id = m.contact_id
  where c.assigned_to = p_user_id
  order by m.sent_at desc nulls last
  limit p_limit;
$$;

revoke execute on function public.agent_recent_activity(uuid, int) from public;
grant execute on function public.agent_recent_activity(uuid, int) to authenticated;
