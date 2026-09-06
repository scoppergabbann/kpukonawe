import type { AttendanceRecord, PublicAttendanceRecord } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

type AttendanceRow = {
  id: string;
  created_at: string;
  name: string;
  institution: string;
  email: string;
  certificate_serial: string;
  status: 'Tervalidasi' | 'Menunggu';
};

const requireConfiguration = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
};

const mapAttendance = (row: AttendanceRow): AttendanceRecord => ({
  id: row.id,
  timestamp: new Date(row.created_at).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Makassar',
  }),
  name: row.name,
  instansi: row.institution,
  email: row.email,
  serial: row.certificate_serial,
  status: row.status,
});

export async function submitAttendance(input: { name: string; institution: string; email: string }) {
  requireConfiguration();
  const { data, error } = await supabase.rpc('submit_attendance', {
    p_name: input.name, p_institution: input.institution, p_email: input.email,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as AttendanceRow | null;
  if (!row) throw new Error('Supabase tidak mengembalikan data presensi.');
  return mapAttendance(row);
}

export async function getAttendanceCount() {
  requireConfiguration();
  const { data, error } = await supabase.rpc('attendance_count');
  if (error) throw error;
  return Number(data || 0);
}

export async function listAttendance() {
  requireConfiguration();
  const { data, error } = await supabase
    .from('attendance_records')
    .select('id, created_at, name, institution, email, certificate_serial, status')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data || []) as AttendanceRow[]).map(mapAttendance);
}

export async function listPublicAttendance(): Promise<PublicAttendanceRecord[]> {
  requireConfiguration();
  const { data, error } = await supabase.rpc('list_public_attendance');
  if (error) throw error;
  return ((data || []) as Array<{ id: string; name: string; institution: string }>).map((row) => ({
    id: row.id,
    name: row.name,
    instansi: row.institution,
  }));
}

export async function clearAttendance() {
  requireConfiguration();
  const { error } = await supabase.from('attendance_records').delete().not('id', 'is', null);
  if (error) throw error;
}

export async function updateAttendanceRecord(
  id: string,
  input: { name: string; institution: string; email: string; status: AttendanceRecord['status'] }
) {
  requireConfiguration();
  const { data, error } = await supabase
    .from('attendance_records')
    .update({
      name: input.name.trim(),
      institution: input.institution.trim(),
      email: input.email.trim().toLowerCase(),
      status: input.status,
    })
    .eq('id', id)
    .select('id, created_at, name, institution, email, certificate_serial, status')
    .single();
  if (error) throw error;
  return mapAttendance(data as AttendanceRow);
}

export async function deleteAttendanceRecord(id: string) {
  requireConfiguration();
  const { error } = await supabase.from('attendance_records').delete().eq('id', id);
  if (error) throw error;
}

export async function signInAdmin(username: string, password: string) {
  requireConfiguration();
  const normalizedUsername = username.trim().toLowerCase();
  const email = normalizedUsername.includes('@')
    ? normalizedUsername
    : `${normalizedUsername}@kpukonawe.local`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: admin, error: adminError } = await supabase
    .from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (adminError || !admin) {
    await supabase.auth.signOut();
    throw new Error('Akun ini tidak memiliki hak akses Administrator KPU.');
  }
}

export async function isCurrentUserAdmin() {
  if (!isSupabaseConfigured) return false;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return false;
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  return !error && Boolean(data);
}

export async function signOutAdmin() { await supabase.auth.signOut(); }

export async function downloadCertificateTemplate(): Promise<{ url: string; name: string } | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.storage.from('certificate-templates').download('current-template');
  if (error || !data) return null;
  return { url: URL.createObjectURL(data), name: 'Template Supabase' };
}

export async function uploadCertificateTemplate(blob: Blob) {
  requireConfiguration();
  const { error } = await supabase.storage.from('certificate-templates').upload('current-template', blob, {
    upsert: true, contentType: blob.type || 'image/jpeg', cacheControl: '0',
  });
  if (error) throw error;
}

export async function resetCertificateTemplate() {
  requireConfiguration();
  const { error } = await supabase.storage.from('certificate-templates').remove(['current-template']);
  if (error && !/not found/i.test(error.message)) throw error;
}
