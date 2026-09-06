import React, { useState } from 'react';
import type { AttendanceRecord } from '../types';

interface CertificateRecoveryProps {
  onRecover: (email: string, serial: string) => Promise<AttendanceRecord>;
}

export const CertificateRecovery: React.FC<CertificateRecoveryProps> = ({ onRecover }) => {
  const [email, setEmail] = useState('');
  const [serial, setSerial] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSearching(true);
    setMessage(null);
    try {
      const record = await onRecover(email, serial);
      setMessage(`Sertifikat ${record.name} berhasil ditemukan dan siap diunduh.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sertifikat tidak ditemukan.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#5a0f18]/10 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="recovery-title">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5a0f18] text-white shadow-sm" aria-hidden="true">
          <span className="material-symbols-outlined block text-[24px] leading-none">download_for_offline</span>
        </div>
        <div>
          <h1 id="recovery-title" className="text-xl font-bold text-[#5a0f18] sm:text-2xl">Unduh Ulang Sertifikat</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#534344]">Masukkan email dan nomor registrasi yang digunakan saat presensi.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#201112]">
          Email
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@institusi.ac.id" className="mt-1 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2.5 text-sm focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20" />
        </label>
        <label className="text-sm font-semibold text-[#201112]">
          Nomor Registrasi
          <input required value={serial} onChange={(event) => setSerial(event.target.value)} placeholder="001/HM.07/7402/2/2026" className="mt-1 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2.5 font-mono text-sm uppercase focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20" />
        </label>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
          <button disabled={isSearching} type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5a0f18] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3d080e] disabled:cursor-wait disabled:opacity-60">
            <span className={`material-symbols-outlined text-[18px] ${isSearching ? 'animate-spin' : ''}`}>{isSearching ? 'sync' : 'search'}</span>
            {isSearching ? 'Mencari...' : 'Cari Sertifikat Saya'}
          </button>
          {message && <p className="text-sm text-[#534344]" role="status">{message}</p>}
        </div>
      </form>
    </section>
  );
};
