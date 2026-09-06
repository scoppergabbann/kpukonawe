-- Terapkan setelah migration awal untuk memastikan satu email hanya memperoleh
-- satu nomor sertifikat pada kegiatan ini.
create unique index if not exists attendance_records_email_unique
on public.attendance_records (email);

create or replace function public.submit_attendance(p_name text, p_institution text, p_email text)
returns setof public.attendance_records language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  new_record public.attendance_records;
  next_number bigint;
begin
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
