-- Daftar publik hanya mengekspos nama dan instansi. Email dan data sertifikat tetap privat.
create or replace function public.list_public_attendance()
returns table (id uuid, name text, institution text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select attendance_records.id, attendance_records.name, attendance_records.institution
  from public.attendance_records
  order by attendance_records.created_at desc;
$$;

revoke all on function public.list_public_attendance() from public;
grant execute on function public.list_public_attendance() to anon, authenticated;
