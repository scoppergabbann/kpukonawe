import React from 'react';

interface AttendanceConfirmationModalProps {
  isOpen: boolean;
  name: string;
  instansi: string;
  email: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AttendanceConfirmationModal: React.FC<AttendanceConfirmationModalProps> = ({
  isOpen,
  name,
  instansi,
  email,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const details = [
    { icon: 'person', label: 'Nama Lengkap + Gelar', value: name },
    { icon: 'account_balance', label: 'Institusi / Universitas', value: instansi },
    { icon: 'mail', label: 'Alamat Email', value: email },
  ];

  return (
    <div
      id="attendance-confirmation-modal"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-confirmation-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#5a0f18]/20 bg-white shadow-2xl">
        <div className="bg-[#5a0f18] px-6 py-5 text-white">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ffdcc3]">Konfirmasi Data Peserta</span>
          <h3 id="attendance-confirmation-title" className="mt-1 text-lg font-bold">Pastikan data sudah benar</h3>
          <p className="mt-1 text-xs text-white/80">Data berikut akan dipakai untuk presensi dan e-sertifikat.</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-start gap-3 rounded-xl border border-[#d5cbcd]/60 bg-[#fbf9f9] p-3.5">
                <span className="material-symbols-outlined text-[20px] text-[#5a0f18]">{detail.icon}</span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#75777d]">{detail.label}</span>
                  <span className="mt-0.5 block break-words text-sm font-semibold text-[#201112]">{detail.value}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[#534344]">Periksa kembali ejaan nama, gelar, institusi, dan email sebelum mengirim data.</p>
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#534344] hover:bg-[#f6f1f1] disabled:opacity-50">Perbaiki Data</button>
            <button id="btnConfirmAttendance" type="button" disabled={isSubmitting} onClick={onConfirm} className="inline-flex items-center gap-2 rounded-xl bg-[#5a0f18] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#3d080e] disabled:cursor-wait disabled:opacity-60">
              <span className={`material-symbols-outlined text-[18px] ${isSubmitting ? 'animate-spin' : ''}`}>{isSubmitting ? 'sync' : 'verified_user'}</span>
              <span>{isSubmitting ? 'Mengirim Presensi...' : 'Ya, Kirim Presensi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
