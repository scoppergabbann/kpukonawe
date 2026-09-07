drop function if exists public.recover_certificate(text, text);

create or replace function public.recover_certificate(p_email text)
returns setof public.attendance_records
language sql stable security definer set search_path = public, pg_temp
as $$
  select r.*
  from public.attendance_records r
  where r.email = trim(lower(p_email))
  order by r.created_at desc
  limit 1;
$$;

revoke all on function public.recover_certificate(text) from public;
grant execute on function public.recover_certificate(text) to anon, authenticated;

drop function if exists public.list_public_attendance();

create function public.list_public_attendance()
returns table (id uuid, name text, institution text, certificate_serial text)
language sql stable security definer set search_path = public, pg_temp
as $$
  select r.id, r.name, r.institution, r.certificate_serial
  from public.attendance_records r
  order by split_part(r.certificate_serial, '/', 1)::bigint asc, r.created_at asc;
$$;

revoke all on function public.list_public_attendance() from public;
grant execute on function public.list_public_attendance() to anon, authenticated;
