-- ghl_pipelines / ghl_pipeline_stages: synced pipeline and stage metadata,
-- used to resolve human-readable names for the ghl_opportunities.pipeline_id
-- / pipeline_stage_id GHL id strings (which stay as-is -- no changes to the
-- opportunities table or its sync).

create table if not exists public.ghl_pipelines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  ghl_pipeline_id text not null,
  name text not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, ghl_pipeline_id)
);

create index if not exists ghl_pipelines_client_id_idx on public.ghl_pipelines (client_id);

create trigger set_updated_at
  before update on public.ghl_pipelines
  for each row execute function public.set_updated_at();

alter table public.ghl_pipelines enable row level security;

create policy "Clients can view own GHL pipelines"
  on public.ghl_pipelines for select
  using (client_id = public.current_client_id());

create policy "Clients can insert own GHL pipelines"
  on public.ghl_pipelines for insert
  with check (client_id = public.current_client_id());

create policy "Clients can update own GHL pipelines"
  on public.ghl_pipelines for update
  using (client_id = public.current_client_id());

create policy "Clients can delete own GHL pipelines"
  on public.ghl_pipelines for delete
  using (client_id = public.current_client_id());

create table if not exists public.ghl_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  pipeline_id uuid not null references public.ghl_pipelines (id) on delete cascade,
  ghl_stage_id text not null,
  name text not null,
  position integer,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, ghl_stage_id)
);

create index if not exists ghl_pipeline_stages_client_id_idx on public.ghl_pipeline_stages (client_id);
create index if not exists ghl_pipeline_stages_pipeline_id_idx on public.ghl_pipeline_stages (pipeline_id);

create trigger set_updated_at
  before update on public.ghl_pipeline_stages
  for each row execute function public.set_updated_at();

alter table public.ghl_pipeline_stages enable row level security;

create policy "Clients can view own GHL pipeline stages"
  on public.ghl_pipeline_stages for select
  using (client_id = public.current_client_id());

create policy "Clients can insert own GHL pipeline stages"
  on public.ghl_pipeline_stages for insert
  with check (client_id = public.current_client_id());

create policy "Clients can update own GHL pipeline stages"
  on public.ghl_pipeline_stages for update
  using (client_id = public.current_client_id());

create policy "Clients can delete own GHL pipeline stages"
  on public.ghl_pipeline_stages for delete
  using (client_id = public.current_client_id());

-- Required: ghl_sync_logs.sync_type's check constraint must allow
-- 'pipelines' so the new sync reuses the existing sync-log infrastructure.
alter table public.ghl_sync_logs drop constraint if exists ghl_sync_logs_sync_type_check;
alter table public.ghl_sync_logs add constraint ghl_sync_logs_sync_type_check
  check (sync_type in ('users', 'contacts', 'opportunities', 'messages', 'pipelines', 'full'));

-- Resolve human-readable pipeline/stage names for the Pipeline Summary
-- widget. Recreated (not CREATE OR REPLACE) because the output column set
-- is changing, which Postgres does not allow via REPLACE.
drop function if exists public.dashboard_pipeline_summary();

create function public.dashboard_pipeline_summary()
returns table (
  pipeline_id text,
  pipeline_stage_id text,
  pipeline_name text,
  stage_name text,
  opportunity_count bigint,
  total_value numeric
)
language sql
stable
as $$
  select
    o.pipeline_id,
    o.pipeline_stage_id,
    p.name as pipeline_name,
    s.name as stage_name,
    count(*) as opportunity_count,
    coalesce(sum(o.monetary_value), 0) as total_value
  from public.ghl_opportunities o
  left join public.ghl_pipelines p on p.ghl_pipeline_id = o.pipeline_id
  left join public.ghl_pipeline_stages s on s.ghl_stage_id = o.pipeline_stage_id
  where o.status = 'open'
  group by o.pipeline_id, o.pipeline_stage_id, p.name, s.name
  order by opportunity_count desc;
$$;

revoke execute on function public.dashboard_pipeline_summary() from public;
grant execute on function public.dashboard_pipeline_summary() to authenticated;
