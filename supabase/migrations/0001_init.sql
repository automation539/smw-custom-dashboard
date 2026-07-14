-- Profiles: one row per authenticated user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Clients: the tenant record. Every user owns exactly one client on signup.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists clients_owner_id_key on public.clients (owner_id);

alter table public.clients enable row level security;

create policy "Owners can view own client"
  on public.clients for select
  using (auth.uid() = owner_id);

create policy "Owners can update own client"
  on public.clients for update
  using (auth.uid() = owner_id);

-- Returns the client_id (tenant id) owned by the currently authenticated
-- user. Every future table must have a client_id column, scoped with an RLS
-- policy such as: using (client_id = public.current_client_id())
create or replace function public.current_client_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.clients where owner_id = auth.uid() limit 1;
$$;

-- On signup, auto-provision a profile and a client (tenant) for the new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  insert into public.clients (owner_id, company_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email) || '''s Workspace'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
