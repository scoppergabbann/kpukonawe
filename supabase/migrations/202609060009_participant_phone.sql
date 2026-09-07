alter table public.attendance_records
add column if not exists phone text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'attendance_records_phone_digits'
      and conrelid = 'public.attendance_records'::regclass
  ) then
    alter table public.attendance_records
    add constraint attendance_records_phone_digits
    check (phone is null or phone ~ '^[0-9]{8,15}$');
  end if;
end;
$$;

-- No. HP termasuk data privat dan hanya ikut terbaca lewat tabel admin.
grant update (phone) on table public.attendance_records to authenticated;

drop function if exists public.submit_attendance(text, text, text);

create function public.submit_attendance(
  p_name text,
  p_institution text,
  p_email text,
  p_phone text
)
returns setof public.attendance_records
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  new_record public.attendance_records;
  next_number bigint;
  number_prefix text;
  request_headers jsonb := '{}'::jsonb;
  client_identifier text;
  client_fingerprint text;
begin
  begin
    request_headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  exception when others then
    request_headers := '{}'::jsonb;
  end;

  client_identifier := coalesce(
    nullif(request_headers ->> 'cf-connecting-ip', ''),
    nullif(split_part(request_headers ->> 'x-forwarded-for', ',', 1), ''),
    nullif(request_headers ->> 'x-real-ip', ''),
    'email:' || trim(lower(p_email))
  );
  client_fingerprint := encode(digest(trim(client_identifier), 'sha256'), 'hex');

  perform pg_advisory_xact_lock(hashtext(client_fingerprint));

  if exists (
    select 1 from public.attendance_rate_limits
    where fingerprint_hash = client_fingerprint
      and attempted_at > now() - interval '2 seconds'
  ) then
    raise exception 'Permintaan terlalu cepat. Tunggu beberapa detik lalu coba kembali';
  end if;

  if (
    select count(*) from public.attendance_rate_limits
    where fingerprint_hash = client_fingerprint
      and attempted_at > now() - interval '5 minutes'
  ) >= 20 then
    raise exception 'Batas percobaan presensi tercapai. Coba kembali dalam beberapa menit';
  end if;

  insert into public.attendance_rate_limits (fingerprint_hash) values (client_fingerprint);

  delete from public.attendance_rate_limits
  where id in (
    select id from public.attendance_rate_limits
    where attempted_at < now() - interval '1 day'
    order by attempted_at
    limit 100
  );

  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 150 then
    raise exception 'Nama peserta tidak valid';
  end if;
  if char_length(trim(p_institution)) < 2 or char_length(trim(p_institution)) > 180 then
    raise exception 'Instansi tidak valid';
  end if;
  if trim(lower(p_email)) !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Alamat email tidak valid';
  end if;
  if trim(p_phone) !~ '^[0-9]{8,15}$' then
    raise exception 'Nomor HP harus terdiri dari 8 sampai 15 angka';
  end if;

  perform pg_advisory_xact_lock(hashtext('attendance_registration_serial'));

  if exists (
    select 1 from public.attendance_records
    where email = trim(lower(p_email))
  ) then
    raise exception 'Email ini sudah melakukan presensi dan tidak dapat didaftarkan kembali';
  end if;

  select coalesce(max(split_part(certificate_serial, '/', 1)::bigint), 0) + 1
  into next_number from public.attendance_records;

  number_prefix := case
    when next_number < 1000 then lpad(next_number::text, 3, '0')
    else next_number::text
  end;

  insert into public.attendance_records (name, institution, email, phone, certificate_serial)
  values (
    trim(p_name), trim(p_institution), trim(lower(p_email)), trim(p_phone),
    number_prefix || '/HM.07/7402/2/2026'
  ) returning * into new_record;

  return next new_record;
end;
$$;

revoke all on function public.submit_attendance(text, text, text, text) from public;
grant execute on function public.submit_attendance(text, text, text, text) to anon, authenticated;

-- Pemulihan publik tidak mengembalikan No. HP; data ini hanya tersedia lewat akses tabel admin.
drop function if exists public.recover_certificate(text);

create function public.recover_certificate(p_email text)
returns table (
  id uuid,
  created_at timestamptz,
  name text,
  institution text,
  email text,
  certificate_serial text,
  status text
)
language sql stable security definer set search_path = public, pg_temp
as $$
  select r.id, r.created_at, r.name, r.institution, r.email, r.certificate_serial, r.status
  from public.attendance_records r
  where r.email = trim(lower(p_email))
  order by r.created_at desc
  limit 1;
$$;

revoke all on function public.recover_certificate(text) from public;
grant execute on function public.recover_certificate(text) to anon, authenticated;

create or replace function public.import_attendance_rows(p_rows jsonb)
returns table (inserted_count integer, skipped_count integer)
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare
  item jsonb;
  item_name text;
  item_institution text;
  item_email text;
  item_phone text;
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
    item_phone := regexp_replace(trim(coalesce(item ->> 'phone', '')), '[^0-9]', '', 'g');

    if char_length(item_name) < 2 or char_length(item_name) > 150
      or char_length(item_institution) < 2 or char_length(item_institution) > 180
      or item_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or item_phone !~ '^[0-9]{8,15}$'
      or exists (select 1 from public.attendance_records r where r.email = item_email)
    then
      skipped_total := skipped_total + 1;
      continue;
    end if;

    select coalesce(max(split_part(r.certificate_serial, '/', 1)::bigint), 0) + 1
    into next_number from public.attendance_records r;
    number_prefix := case when next_number < 1000 then lpad(next_number::text, 3, '0') else next_number::text end;

    insert into public.attendance_records (name, institution, email, phone, certificate_serial)
    values (item_name, item_institution, item_email, item_phone, number_prefix || '/HM.07/7402/2/2026');
    inserted_total := inserted_total + 1;
  end loop;

  return query select inserted_total, skipped_total;
end;
$$;

revoke all on function public.import_attendance_rows(jsonb) from public;
grant execute on function public.import_attendance_rows(jsonb) to authenticated;
