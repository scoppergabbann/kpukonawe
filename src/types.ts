export interface AttendanceRecord {
  id: string;
  timestamp: string;
  name: string;
  instansi: string;
  email: string;
  serial: string;
  status: 'Tervalidasi' | 'Menunggu';
}

export interface PublicAttendanceRecord {
  id: string;
  name: string;
  instansi: string;
}

export interface ToastState {
  show: boolean;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export type ActiveNavTab = 'presensi-dan-unduh-sertifikat' | 'riwayat-kehadiran' | 'informasi-kegiatan';
