import React from 'react';
import type { CertificateVerificationResult } from '../types';

interface CertificateVerificationProps {
  isLoading: boolean;
  result: CertificateVerificationResult | null;
  hasVerificationRequest: boolean;
  onClose: () => void;
}

export const CertificateVerification: React.FC<CertificateVerificationProps> = ({
  isLoading,
  result,
  hasVerificationRequest,
  onClose,
}) => {
  if (!hasVerificationRequest) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="verification-title">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-full ${result ? 'bg-emerald-100 text-emerald-700' : 'bg-[#5a0f18]/10 text-[#5a0f18]'}`}>{isLoading ? 'sync' : result ? 'verified' : 'gpp_bad'}</span>
            <div>
              <h2 id="verification-title" className="text-lg font-bold text-[#5a0f18]">Verifikasi Sertifikat</h2>
              <p className="text-base text-[#534344]">KPU Kabupaten Konawe</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup verifikasi" className="rounded-lg p-1.5 text-[#67585b] hover:bg-[#f6f1f1]"><span className="material-symbols-outlined">close</span></button>
        </div>
        {isLoading ? (
          <p className="mt-6 text-base text-[#534344]">Memeriksa keaslian sertifikat...</p>
        ) : result ? (
          <dl className="mt-6 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-base">
            <div><dt className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Status</dt><dd className="mt-0.5 font-bold text-emerald-900">Sertifikat Sah · {result.status}</dd></div>
            <div><dt className="text-sm text-[#534344]">Nama Peserta</dt><dd className="font-bold text-[#201112]">{result.name}</dd></div>
            <div><dt className="text-sm text-[#534344]">Instansi</dt><dd className="font-medium text-[#201112]">{result.instansi}</dd></div>
            <div><dt className="text-sm text-[#534344]">Nomor Registrasi</dt><dd className="font-mono font-bold text-[#5a0f18]">{result.serial}</dd></div>
          </dl>
        ) : (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-900">Sertifikat tidak ditemukan atau kode verifikasinya tidak valid.</div>
        )}
      </div>
    </div>
  );
};
