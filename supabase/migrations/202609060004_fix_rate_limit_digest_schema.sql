-- pgcrypto berada di schema extensions pada project Supabase.
-- Tambahkan schema tersebut ke search_path fungsi yang sudah diterapkan.
alter function public.submit_attendance(text, text, text)
set search_path = public, extensions, pg_temp;
