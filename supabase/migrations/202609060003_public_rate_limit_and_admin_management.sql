-- Batasi penyalahgunaan RPC presensi tanpa menyimpan alamat IP mentah.
create table if not exists public.attendance_rate_limits (
  id bigint generated always as identity primary key,
  fingerprint_hash text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists attendance_rate_limits_lookup_idx
on public.attendance_rate_limits (fingerprint_hash, attempted_at desc);

alter table public.attendance_rate_limits enable row level security;
revoke all on table public.attendance_rate_limits from anon, authenticated;

-- Admin hanya boleh mengubah kolom data peserta, bukan id, waktu, atau nomor sertifikat.
grant update (name, institution, email, status) on table public.attendance_records to authenticated;
drop policy if exists "Admins can update attendance" on public.attendance_records;
create policy "Admins can update attendance"
on public.attendance_records for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create or replace function public.submit_attendance(p_name text, p_institution text, p_email text)
returns setof public.attendance_records language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare
  new_record public.attendance_records;
  next_number bigint;
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

  -- Serialisasi pemeriksaan per fingerprint menutup celah request paralel.
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

  -- Pembersihan dibatasi agar tabel log tidak tumbuh tanpa batas.
  delete from public.attendance_rate_limits
  where id in (
    select id from public.attendance_rate_limits
    where attempted_at < now() - interval '1 day'
    order by attempted_at
    limit 100
  );

  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 150 then raise exception 'Nama peserta tidak valid'; end if;
  if char_length(trim(p_institution)) < 2 or char_length(trim(p_institution)) > 180 then raise exception 'Instansi tidak valid'; end if;
  if trim(lower(p_email)) !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception 'Alamat email tidak valid'; end if;

  next_number := nextval('public.attendance_serial_seq');
  begin
    insert into public.attendance_records (name, institution, email, certificate_serial)
    values (trim(p_name), trim(p_institution), trim(lower(p_email)), lpad(next_number::text, 3, '0') || '/HM.07/7402/2/2026')
    returning * into new_record;
  exception when unique_violation then
    raise exception 'Email ini sudah melakukan presensi dan tidak dapat didaftarkan kembali';
  end;

  return next new_record;
end;
$$;

revoke all on function public.submit_attendance(text, text, text) from public;
grant execute on function public.submit_attendance(text, text, text) to anon, authenticated;
