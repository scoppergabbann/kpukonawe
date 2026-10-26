import React, { useEffect, useState } from 'react';
import type { AttendanceRecord } from '../types';

interface ParticipantEditorModalProps {
  record: AttendanceRecord | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    input: { name: string; institution: string; email: string; phone: string; status: AttendanceRecord['status'] }
  ) => Promise<void>;
  onDelete: (record: AttendanceRecord) => Promise<void>;
}

export const ParticipantEditorModal: React.FC<ParticipantEditorModalProps> = ({
  record,
  isSaving,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<AttendanceRecord['status']>('Tervalidasi');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!record) return;
    setName(record.name);
    setInstitution(record.instansi);
    setEmail(record.email);
    setPhone(record.phone);
    setStatus(record.status);
    setConfirmDelete(false);
  }, [record]);

  if (!record) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave(record.id, { name, institution, email, phone, status });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="participant-editor-title">
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#5a0f18]/15 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#f0e6e7] p-5">
          <div>
            <p className="text-sm font-semibold tracking-wide text-[#5a0f18]">Manajemen Peserta</p>
            <h3 id="participant-editor-title" className="mt-1 text-lg font-bold text-[#201112]">Edit data dan status sertifikat</h3>
            <p className="mt-1 font-mono text-sm text-[#67585b]">{record.serial}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="Tutup" className="rounded-lg p-2 text-[#67585b] hover:bg-[#f6f1f1] disabled:opacity-50">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block text-base font-semibold text-[#201112]">
            Nama lengkap dan gelar
            <input required minLength={2} maxLength={150} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2.5 text-base focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20" />
          </label>
          <label className="block text-base font-semibold text-[#201112]">
            Instansi/Organisasi Asal
            <input required minLength={2} maxLength={180} value={institution} onChange={(event) => setInstitution(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2.5 text-base focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20" />
          </label>
          <div className="grid gap-5">
            <label className="block text-base font-semibold text-[#201112]">
              Email
              <input required type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2.5 text-base focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20" />
            </label>
            <label className="block text-base font-semibold text-[#201112]">
              No. HP
              <input required type="tel" autoComplete="tel" inputMode="numeric" pattern="[0-9]{8,15}" minLength={8} maxLength={15} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 15))} title="Masukkan 8 sampai 15 angka" className="mt-1.5 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2.5 text-base focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20" />
            </label>
          </div>
          <label className="block text-base font-semibold text-[#201112]">
            Status sertifikat
            <select value={status} onChange={(event) => setStatus(event.target.value as AttendanceRecord['status'])} className="mt-1.5 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2.5 text-base focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20">
              <option value="Tervalidasi">Tervalidasi — boleh diunduh</option>
              <option value="Menunggu">Menunggu — unduhan dikunci</option>
            </select>
          </label>

          {confirmDelete && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-base text-red-900">
              Hapus data <strong>{record.name}</strong> secara permanen?
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={isSaving} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#534344]">Batal</button>
                <button type="button" onClick={() => void onDelete(record)} disabled={isSaving} className="rounded-lg bg-[#ba1a1a] px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{isSaving ? 'Menghapus...' : 'Ya, Hapus Peserta'}</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e6e7] pt-4">
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={isSaving || confirmDelete} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-base font-bold text-[#ba1a1a] hover:bg-red-50 disabled:opacity-40">
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Hapus
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl px-4 py-2.5 text-base font-semibold text-[#534344] hover:bg-[#f6f1f1]">Batal</button>
              <button type="submit" disabled={isSaving || confirmDelete} className="inline-flex items-center gap-1.5 rounded-xl bg-[#5a0f18] px-5 py-2.5 text-base font-bold text-white hover:bg-[#3d080e] disabled:opacity-60">
                <span className={`material-symbols-outlined text-[18px] ${isSaving ? 'animate-spin' : ''}`}>{isSaving ? 'sync' : 'save'}</span>
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
