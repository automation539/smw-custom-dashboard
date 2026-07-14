-- Supabase Vault stores the encrypted secret; usually already enabled on
-- hosted projects, but ensured here for idempotency.
create extension if not exists supabase_vault cascade;

-- One GoHighLevel connection per tenant. The Private Integration Token is
-- never stored in this table directly -- only a reference to an encrypted
-- secret in vault.secrets.
create table if not exists public.ghl_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  location_id text not null,
  token_secret_id uuid not null references vault.secrets (id) on delete cascade,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ghl_connections_client_id_key
  on public.ghl_connections (client_id);

alter table public.ghl_connections enable row level security;

create policy "Clients can view own GHL connection"
  on public.ghl_connections for select
  using (client_id = public.current_client_id());

create policy "Clients can insert own GHL connection"
  on public.ghl_connections for insert
  with check (client_id = public.current_client_id());

create policy "Clients can update own GHL connection"
  on public.ghl_connections for update
  using (client_id = public.current_client_id());

create policy "Clients can delete own GHL connection"
  on public.ghl_connections for delete
  using (client_id = public.current_client_id());

-- Creates or rotates the tenant's GHL connection. The token is handed
-- straight to Vault for encryption and never persisted in plain text.
create or replace function public.save_ghl_connection(p_location_id text, p_token text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_client_id uuid;
  v_existing_secret_id uuid;
begin
  v_client_id := public.current_client_id();

  if v_client_id is null then
    raise exception 'No client found for current user';
  end if;

  select token_secret_id into v_existing_secret_id
  from public.ghl_connections
  where client_id = v_client_id;

  if v_existing_secret_id is not null then
    perform vault.update_secret(v_existing_secret_id, p_token);

    update public.ghl_connections
    set location_id = p_location_id,
        updated_at = now()
    where client_id = v_client_id;
  else
    insert into public.ghl_connections (client_id, location_id, token_secret_id)
    values (
      v_client_id,
      p_location_id,
      vault.create_secret(p_token, 'ghl_token_' || v_client_id::text)
    );
  end if;
end;
$$;

revoke execute on function public.save_ghl_connection(text, text) from public;
grant execute on function public.save_ghl_connection(text, text) to authenticated;

-- Removes the tenant's GHL connection and its encrypted secret.
create or replace function public.disconnect_ghl_connection()
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_client_id uuid;
  v_secret_id uuid;
begin
  v_client_id := public.current_client_id();

  select token_secret_id into v_secret_id
  from public.ghl_connections
  where client_id = v_client_id;

  delete from public.ghl_connections where client_id = v_client_id;

  if v_secret_id is not null then
    delete from vault.secrets where id = v_secret_id;
  end if;
end;
$$;

revoke execute on function public.disconnect_ghl_connection() from public;
grant execute on function public.disconnect_ghl_connection() to authenticated;
