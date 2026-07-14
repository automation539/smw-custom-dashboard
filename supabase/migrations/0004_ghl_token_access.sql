-- Returns the decrypted Private Integration Token for a given tenant.
-- service_role only -- this must never be callable by authenticated/anon,
-- since it is the only path that ever returns the plaintext token.
create or replace function public.get_ghl_token(p_client_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_secret_id uuid;
  v_token text;
begin
  select token_secret_id into v_secret_id
  from public.ghl_connections
  where client_id = p_client_id;

  if v_secret_id is null then
    return null;
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where id = v_secret_id;

  return v_token;
end;
$$;

revoke execute on function public.get_ghl_token(uuid) from public;
revoke execute on function public.get_ghl_token(uuid) from authenticated;
grant execute on function public.get_ghl_token(uuid) to service_role;
