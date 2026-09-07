export interface AttendanceRecord {
  id: string;
  timestamp: string;
  name: string;
  instansi: string;
  email: string;
  phone: string;
  serial: string;
  status: 'Tervalidasi' | 'Menunggu';
}

export interface PublicAttendanceRecord {
  id: string;
  name: string;
  instansi: string;
  serial: string;
}

export interface EventRegistrationStatus {
  isOpen: boolean;
  accepting: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

export interface CertificateVerificationResult {
  id: string;
  name: string;
  instansi: string;
  serial: string;
  status: 'Tervalidasi' | 'Menunggu';
  issuedAt: string;
}

export interface ImportParticipantInput {
  name: string;
  institution: string;
  email: string;
  phone: string;
}

export interface ImportParticipantResult {
  inserted: number;
  skipped: number;
}

export interface ToastState {
  show: boolean;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export type ActiveNavTab =
  | 'presensi-dan-unduh-sertifikat'
  | 'unduh-ulang-sertifikat'
  | 'riwayat-kehadiran'
  | 'informasi-kegiatan';
