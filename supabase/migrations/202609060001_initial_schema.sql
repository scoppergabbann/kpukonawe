create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 150),
  institution text not null check (char_length(institution) between 2 and 180),
  email text not null unique check (email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  certificate_serial text not null unique,
  status text not null default 'Tervalidasi' check (status in ('Tervalidasi', 'Menunggu'))
);

create table if not exists public.certificate_email_log (
  id bigint generated always as identity primary key,
  attendance_id uuid not null references public.attendance_records(id) on delete cascade,
  recipient_email text not null,
  sent_at timestamptz not null default now(),
  provider_message_id text
);

create sequence if not exists public.attendance_serial_seq start 1;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.admin_users where user_id = (select auth.uid())); $$;

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

create or replace function public.attendance_count()
returns bigint language sql stable security definer set search_path = public, pg_temp
as $$ select count(*) from public.attendance_records; $$;

alter table public.admin_users enable row level security;
alter table public.attendance_records enable row level security;
alter table public.certificate_email_log enable row level security;
revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.attendance_records from anon, authenticated;
revoke all on table public.certificate_email_log from anon, authenticated;
grant select on table public.admin_users to authenticated;
grant select, delete on table public.attendance_records to authenticated;
grant select on table public.certificate_email_log to authenticated;
revoke all on function public.submit_attendance(text, text, text) from public;
revoke all on function public.attendance_count() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.submit_attendance(text, text, text) to anon, authenticated;
grant execute on function public.attendance_count() to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

create policy "Admin can verify own role" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));
create policy "Admins can read attendance" on public.attendance_records for select to authenticated using ((select public.is_admin()));
create policy "Admins can delete attendance" on public.attendance_records for delete to authenticated using ((select public.is_admin()));
create policy "Admins can read email log" on public.certificate_email_log for select to authenticated using ((select public.is_admin()));

insert into storage.buckets (id, name, public) values ('certificate-templates', 'certificate-templates', true)
on conflict (id) do update set public = excluded.public;
create policy "Public can read certificate template" on storage.objects for select to anon, authenticated using (bucket_id = 'certificate-templates');
create policy "Admins can upload certificate template" on storage.objects for insert to authenticated with check (bucket_id = 'certificate-templates' and (select public.is_admin()));
create policy "Admins can update certificate template" on storage.objects for update to authenticated using (bucket_id = 'certificate-templates' and (select public.is_admin())) with check (bucket_id = 'certificate-templates' and (select public.is_admin()));
create policy "Admins can delete certificate template" on storage.objects for delete to authenticated using (bucket_id = 'certificate-templates' and (select public.is_admin()));

-- Setelah membuat user admin melalui Supabase Auth, jalankan:
-- insert into public.admin_users (user_id) values ('UUID-USER-ADMIN');
