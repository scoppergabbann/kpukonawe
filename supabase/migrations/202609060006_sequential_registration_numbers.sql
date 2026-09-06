-- Nomor awal sertifikat mengikuti urutan registrasi sukses: 001, 002, 003, dst.
-- Normalisasi data yang sudah ada terlebih dahulu tanpa mengekspos perubahan sementara.
do $$
declare
  participant record;
  registration_number bigint := 0;
  number_prefix text;
begin
  perform pg_advisory_xact_lock(hashtext('attendance_registration_serial'));

  update public.attendance_records
  set certificate_serial = 'TEMP/' || id::text;

  for participant in
    select id from public.attendance_records order by created_at, id
  loop
    registration_number := registration_number + 1;
    number_prefix := case
      when registration_number < 1000 then lpad(registration_number::text, 3, '0')
      else registration_number::text
    end;

    update public.attendance_records
    set certificate_serial = number_prefix || '/HM.07/7402/2/2026'
    where id = participant.id;
  end loop;
end;
$$;

create or replace function public.submit_attendance(p_name text, p_institution text, p_email text)
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

  -- Satu transaksi pada satu waktu menentukan nomor berikutnya. Jika insert gagal,
  -- angka tidak ikut terpakai sehingga urutan tidak meloncat.
  perform pg_advisory_xact_lock(hashtext('attendance_registration_serial'));

  if exists (
    select 1 from public.attendance_records
    where email = trim(lower(p_email))
  ) then
    raise exception 'Email ini sudah melakukan presensi dan tidak dapat didaftarkan kembali';
  end if;

  select coalesce(max(split_part(certificate_serial, '/', 1)::bigint), 0) + 1
  into next_number
  from public.attendance_records;

  number_prefix := case
    when next_number < 1000 then lpad(next_number::text, 3, '0')
    else next_number::text
  end;

  insert into public.attendance_records (name, institution, email, certificate_serial)
  values (
    trim(p_name),
    trim(p_institution),
    trim(lower(p_email)),
    number_prefix || '/HM.07/7402/2/2026'
  )
  returning * into new_record;

  return next new_record;
end;
$$;

revoke all on function public.submit_attendance(text, text, text) from public;
grant execute on function public.submit_attendance(text, text, text) to anon, authenticated;
