import React from 'react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  recordCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
  isOpen,
  recordCount,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-reset-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#ba1a1a]/20 max-h-[90dvh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div>
              <span className="text-sm uppercase font-mono tracking-wider text-[#ba1a1a] font-bold">
                Tindakan Berisiko
              </span>
              <h3 className="text-base font-bold text-[#201112]">
                Konfirmasi Reset Log Presensi
              </h3>
              <p className="text-sm text-[#534344] mt-1 leading-relaxed">
                Anda akan menghapus seluruh data kehadiran sebanyak{' '}
                <span className="font-bold text-[#ba1a1a]">{recordCount} peserta</span> dari Supabase.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#fbf9f9] border border-[#d5cbcd]/50 rounded-xl text-sm text-[#67585b]">
            <p>
              💡 <b>Tips KPU:</b> Pastikan Anda telah mengunduh cadangan data melalui tombol <b>Ekspor CSV</b> sebelum mengosongkan tabel.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#534344] hover:bg-[#f6f1f1] transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btnConfirmClearData"
              type="button"
              onClick={onConfirm}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              <span>Ya, Kosongkan Semua Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
