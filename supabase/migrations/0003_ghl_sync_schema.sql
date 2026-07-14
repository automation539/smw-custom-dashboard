-- Reusable trigger to keep updated_at current on any row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ghl_users: team members / agents pulled from a GHL sub-account.
create table if not exists public.ghl_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  ghl_user_id text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  role text,
  permissions jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, ghl_user_id)
);

create index if not exists ghl_users_client_id_idx on public.ghl_users (client_id);

create trigger set_updated_at
  before update on public.ghl_users
  for each row execute function public.set_updated_at();

alter table public.ghl_users enable row level security;

create policy "Clients can view own GHL users"
  on public.ghl_users for select
  using (client_id = public.current_client_id());

create policy "Clients can insert own GHL users"
  on public.ghl_users for insert
  with check (client_id = public.current_client_id());

create policy "Clients can update own GHL users"
  on public.ghl_users for update
  using (client_id = public.current_client_id());

create policy "Clients can delete own GHL users"
  on public.ghl_users for delete
  using (client_id = public.current_client_id());

-- ghl_contacts: leads/contacts synced from GHL.
create table if not exists public.ghl_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  ghl_contact_id text not null,
  assigned_to uuid references public.ghl_users (id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  tags text[] not null default '{}'::text[],
  status text not null default 'new',
  first_contacted_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, ghl_contact_id)
);

create index if not exists ghl_contacts_client_id_idx on public.ghl_contacts (client_id);
create index if not exists ghl_contacts_client_status_idx on public.ghl_contacts (client_id, status);
create index if not exists ghl_contacts_assigned_to_idx on public.ghl_contacts (assigned_to);

create trigger set_updated_at
  before update on public.ghl_contacts
  for each row execute function public.set_updated_at();

alter table public.ghl_contacts enable row level security;

create policy "Clients can view own GHL contacts"
  on public.ghl_contacts for select
  using (client_id = public.current_client_id());

create policy "Clients can insert own GHL contacts"
  on public.ghl_contacts for insert
  with check (client_id = public.current_client_id());

create policy "Clients can update own GHL contacts"
  on public.ghl_contacts for update
  using (client_id = public.current_client_id());

create policy "Clients can delete own GHL contacts"
  on public.ghl_contacts for delete
  using (client_id = public.current_client_id());

-- ghl_opportunities: pipeline deals synced from GHL.
create table if not exists public.ghl_opportunities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  ghl_opportunity_id text not null,
  contact_id uuid references public.ghl_contacts (id) on delete set null,
  assigned_to uuid references public.ghl_users (id) on delete set null,
  pipeline_id text,
  pipeline_stage_id text,
  name text,
  status text not null default 'open',
  monetary_value numeric(12, 2),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, ghl_opportunity_id)
);

create index if not exists ghl_opportunities_client_id_idx on public.ghl_opportunities (client_id);
create index if not exists ghl_opportunities_client_status_idx on public.ghl_opportunities (client_id, status);
create index if not exists ghl_opportunities_assigned_to_idx on public.ghl_opportunities (assigned_to);
create index if not exists ghl_opportunities_contact_id_idx on public.ghl_opportunities (contact_id);

create trigger set_updated_at
  before update on public.ghl_opportunities
  for each row execute function public.set_updated_at();

alter table public.ghl_opportunities enable row level security;

create policy "Clients can view own GHL opportunities"
  on public.ghl_opportunities for select
  using (client_id = public.current_client_id());

create policy "Clients can insert own GHL opportunities"
  on public.ghl_opportunities for insert
  with check (client_id = public.current_client_id());

create policy "Clients can update own GHL opportunities"
  on public.ghl_opportunities for update
  using (client_id = public.current_client_id());

create policy "Clients can delete own GHL opportunities"
  on public.ghl_opportunities for delete
  using (client_id = public.current_client_id());

-- ghl_messages: conversation messages synced from GHL, used to compute
-- response-time metrics.
create table if not exists public.ghl_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  ghl_message_id text not null,
  contact_id uuid references public.ghl_contacts (id) on delete set null,
  conversation_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text,
  body text,
  status text,
  sent_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (client_id, ghl_message_id)
);

create index if not exists ghl_messages_client_id_idx on public.ghl_messages (client_id);
create index if not exists ghl_messages_contact_id_idx on public.ghl_messages (contact_id);
create index if not exists ghl_messages_client_sent_at_idx on public.ghl_messages (client_id, sent_at);

alter table public.ghl_messages enable row level security;

create policy "Clients can view own GHL messages"
  on public.ghl_messages for select
  using (client_id = public.current_client_id());

create policy "Clients can insert own GHL messages"
  on public.ghl_messages for insert
  with check (client_id = public.current_client_id());

create policy "Clients can update own GHL messages"
  on public.ghl_messages for update
  using (client_id = public.current_client_id());

create policy "Clients can delete own GHL messages"
  on public.ghl_messages for delete
  using (client_id = public.current_client_id());

-- ghl_sync_logs: observability for each sync run.
create table if not exists public.ghl_sync_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  sync_type text not null check (sync_type in ('users', 'contacts', 'opportunities', 'messages', 'full')),
  status text not null default 'pending' check (status in ('pending', 'running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_synced integer not null default 0,
  error_message text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ghl_sync_logs_client_id_idx on public.ghl_sync_logs (client_id);
create index if not exists ghl_sync_logs_client_status_idx on public.ghl_sync_logs (client_id, status);
create index if not exists ghl_sync_logs_started_at_idx on public.ghl_sync_logs (client_id, started_at desc);

create trigger set_updated_at
  before update on public.ghl_sync_logs
  for each row execute function public.set_updated_at();

alter table public.ghl_sync_logs enable row level security;

create policy "Clients can view own GHL sync logs"
  on public.ghl_sync_logs for select
  using (client_id = public.current_client_id());

create policy "Clients can insert own GHL sync logs"
  on public.ghl_sync_logs for insert
  with check (client_id = public.current_client_id());

create policy "Clients can update own GHL sync logs"
  on public.ghl_sync_logs for update
  using (client_id = public.current_client_id());

create policy "Clients can delete own GHL sync logs"
  on public.ghl_sync_logs for delete
  using (client_id = public.current_client_id());
