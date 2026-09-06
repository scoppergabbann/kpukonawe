create table if not exists public.event_registration_settings (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default true,
  opens_at timestamptz,
  closes_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.event_registration_settings (id, is_open)
values (1, true)
on conflict (id) do nothing;

alter table public.event_registration_settings enable row level security;
revoke all on table public.event_registration_settings from anon, authenticated;

create or replace function public.get_event_registration_status()
returns table (is_open boolean, accepting boolean, opens_at timestamptz, closes_at timestamptz)
language sql stable security definer set search_path = public, pg_temp
as $$
  select
    s.is_open,
    s.is_open
      and (s.opens_at is null or now() >= s.opens_at)
      and (s.closes_at is null or now() <= s.closes_at),
    s.opens_at,
    s.closes_at
  from public.event_registration_settings s
  where s.id = 1;
$$;

create or replace function public.update_event_registration_status(
  p_is_open boolean,
  p_opens_at timestamptz default null,
  p_closes_at timestamptz default null
)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Akses administrator diperlukan'; end if;
  if p_opens_at is not null and p_closes_at is not null and p_opens_at >= p_closes_at then
    raise exception 'Waktu penutupan harus setelah waktu pembukaan';
  end if;
  update public.event_registration_settings
  set is_open = p_is_open, opens_at = p_opens_at, closes_at = p_closes_at,
      updated_at = now(), updated_by = auth.uid()
  where id = 1;
end;
$$;

create or replace function public.enforce_registration_window()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare allowed boolean;
begin
  if public.is_admin() then return new; end if;
  select s.is_open
    and (s.opens_at is null or now() >= s.opens_at)
    and (s.closes_at is null or now() <= s.closes_at)
  into allowed
  from public.event_registration_settings s where s.id = 1;
  if not coalesce(allowed, false) then
    raise exception 'Masa presensi sedang ditutup oleh panitia';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_registration_window_trigger on public.attendance_records;
create trigger enforce_registration_window_trigger
before insert on public.attendance_records
for each row execute function public.enforce_registration_window();

create or replace function public.recover_certificate(p_email text, p_serial text)
returns setof public.attendance_records
language sql stable security definer set search_path = public, pg_temp
as $$
  select r.* from public.attendance_records r
  where r.email = trim(lower(p_email))
    and upper(r.certificate_serial) = trim(upper(p_serial))
  limit 1;
$$;

create or replace function public.verify_certificate(p_id uuid, p_serial text)
returns table (
  id uuid,
  name text,
  institution text,
  certificate_serial text,
  status text,
  issued_at timestamptz
)
language sql stable security definer set search_path = public, pg_temp
as $$
  select r.id, r.name, r.institution, r.certificate_serial, r.status, r.created_at
  from public.attendance_records r
  where r.id = p_id and upper(r.certificate_serial) = trim(upper(p_serial))
  limit 1;
$$;

create or replace function public.import_attendance_rows(p_rows jsonb)
returns table (inserted_count integer, skipped_count integer)
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare
  item jsonb;
  item_name text;
  item_institution text;
  item_email text;
  next_number bigint;
  number_prefix text;
  inserted_total integer := 0;
  skipped_total integer := 0;
begin
  if not public.is_admin() then raise exception 'Akses administrator diperlukan'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'Format impor tidak valid'; end if;
  if jsonb_array_length(p_rows) > 1000 then raise exception 'Maksimal 1000 peserta per impor'; end if;

  perform pg_advisory_xact_lock(hashtext('attendance_registration_serial'));

  for item in select value from jsonb_array_elements(p_rows) loop
    item_name := trim(coalesce(item ->> 'name', ''));
    item_institution := trim(coalesce(item ->> 'institution', ''));
    item_email := trim(lower(coalesce(item ->> 'email', '')));

    if char_length(item_name) < 2 or char_length(item_name) > 150
      or char_length(item_institution) < 2 or char_length(item_institution) > 180
      or item_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or exists (select 1 from public.attendance_records r where r.email = item_email)
    then
      skipped_total := skipped_total + 1;
      continue;
    end if;

    select coalesce(max(split_part(r.certificate_serial, '/', 1)::bigint), 0) + 1
    into next_number from public.attendance_records r;
    number_prefix := case when next_number < 1000 then lpad(next_number::text, 3, '0') else next_number::text end;

    insert into public.attendance_records (name, institution, email, certificate_serial)
    values (item_name, item_institution, item_email, number_prefix || '/HM.07/7402/2/2026');
    inserted_total := inserted_total + 1;
  end loop;

  return query select inserted_total, skipped_total;
end;
$$;

revoke all on function public.get_event_registration_status() from public;
revoke all on function public.update_event_registration_status(boolean, timestamptz, timestamptz) from public;
revoke all on function public.recover_certificate(text, text) from public;
revoke all on function public.verify_certificate(uuid, text) from public;
revoke all on function public.import_attendance_rows(jsonb) from public;
grant execute on function public.get_event_registration_status() to anon, authenticated;
grant execute on function public.update_event_registration_status(boolean, timestamptz, timestamptz) to authenticated;
grant execute on function public.recover_certificate(text, text) to anon, authenticated;
grant execute on function public.verify_certificate(uuid, text) to anon, authenticated;
grant execute on function public.import_attendance_rows(jsonb) to authenticated;
