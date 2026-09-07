import React from 'react';
import { ActiveNavTab } from '../types';

interface HeaderProps {
  activeTab: ActiveNavTab;
  isAdmin: boolean;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isAdmin,
  onSelectTab,
  onOpenAdminLogin,
  onLogoutAdmin,
}) => {
  return (
    <header
      id="main-header"
      className="fixed top-0 w-full z-50 bg-[#ffffff]/95 backdrop-blur-xl border-b border-[#f0e6e7] shadow-[0_1px_8px_rgba(90,15,24,0.05)]"
    >
      <div className="h-20 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Left */}
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-3">
            <div
              id="kpu-logo-icon"
              className="w-10 h-10 rounded-xl bg-white border border-[#5a0f18]/20 flex items-center justify-center shadow-sm p-1 transition-transform hover:scale-105"
            >
              <img
                src="/kpu_logo.svg"
                alt="Logo KPU RI"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-[#5a0f18]">
                  KPU Konawe
                </span>
                <span className="hidden text-base font-normal text-[#534344] sm:inline">
                  &amp; E-Sertifikat
                </span>
              </div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#75777d] block font-mono">
                Portal Presensi Resmi
              </span>
            </div>
          </div>

          {/* Active Event Indicator */}
          <div
            id="event-ticker-badge"
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f6f1f1] border border-[#f0e6e7]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5a0f18] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5a0f18]"></span>
            </span>
            <span className="text-xs font-medium text-[#201112] truncate max-w-sm">
              Sistem Pemilu Indonesia &quot;Desain, Regulasi dan Tata Kelola Penyelenggaraan&quot; - Penataan Daerah Pemilihan (Dapil)
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#5a0f18]/10 text-[#5a0f18]">
              KPU
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav
          id="top-nav-bar"
          className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-[#f6f1f1] border border-[#f0e6e7]"
        >
          <button
            id="nav-btn-presensi"
            type="button"
            onClick={() => onSelectTab('presensi-dan-unduh-sertifikat')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'presensi-dan-unduh-sertifikat'
                ? 'bg-[#5a0f18] text-white shadow-sm'
                : 'text-[#534344] hover:text-[#201112] hover:bg-white/60'
            }`}
          >
            Presensi &amp; Unduh Sertifikat
          </button>
          <button
            id="nav-btn-riwayat"
            type="button"
            onClick={() => onSelectTab('riwayat-kehadiran')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'riwayat-kehadiran'
                ? 'bg-[#5a0f18] text-white shadow-sm'
                : 'text-[#534344] hover:text-[#201112] hover:bg-white/60'
            }`}
          >
            Riwayat Kehadiran
          </button>
          <button
            id="nav-btn-info"
            type="button"
            onClick={() => onSelectTab('informasi-kegiatan')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'informasi-kegiatan'
                ? 'bg-[#5a0f18] text-white shadow-sm'
                : 'text-[#534344] hover:text-[#201112] hover:bg-white/60'
            }`}
          >
            Informasi Kegiatan
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btnHeaderCertificateRecovery"
            type="button"
            onClick={() => onSelectTab('unduh-ulang-sertifikat')}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all sm:px-3 ${
              activeTab === 'unduh-ulang-sertifikat'
                ? 'border-[#5a0f18] bg-[#5a0f18] text-white shadow-sm'
                : 'border-[#5a0f18]/20 bg-white text-[#5a0f18] hover:bg-[#5a0f18]/10'
            }`}
            title="Unduh ulang sertifikat"
            aria-label="Buka halaman unduh ulang sertifikat"
          >
            <span className="material-symbols-outlined block text-[19px] leading-none" aria-hidden="true">download_for_offline</span>
            <span className="hidden xl:inline">Unduh Ulang</span>
          </button>
          <div
            id="date-display-badge"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f6f1f1] text-[#534344] border border-[#f0e6e7] text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[16px] text-[#5a0f18]">
              calendar_today
            </span>
            <span>8 September 2026</span>
          </div>
          {/* Admin Auth Badge / Action */}
          {isAdmin ? (
            <div
              id="admin-active-status"
              className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#f0e6e7]"
            >
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono"
                title="Sesi Administrator KPU Aktif"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="hidden sm:inline">Admin KPU</span>
              </div>
              <button
                id="btnHeaderLogoutAdmin"
                type="button"
                onClick={onLogoutAdmin}
                className="p-1.5 rounded-lg text-[#75777d] hover:text-[#ba1a1a] hover:bg-[#fee2e2] transition-colors cursor-pointer"
                title="Keluar dari sesi Admin"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button
              id="btnHeaderLoginAdmin"
              type="button"
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f6f1f1] hover:bg-[#5a0f18]/10 text-[#5a0f18] border border-[#5a0f18]/25 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Masuk sebagai Administrator KPU"
            >
              <span className="material-symbols-outlined text-[17px]">lock</span>
              <span className="hidden sm:inline">Login Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
