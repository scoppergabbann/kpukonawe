import React from 'react';
import { ActiveNavTab } from '../types';

interface SidebarProps {
  activeTab: ActiveNavTab;
  isAdmin?: boolean;
  onSelectTab: (tab: ActiveNavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, isAdmin, onSelectTab }) => {
  return (
    <aside
      id="main-sidebar"
      className="fixed left-0 top-20 bottom-0 w-64 bg-white border-r border-[#f0e6e7] shadow-[0_1px_8px_rgba(0,0,0,0.02)] z-40 hidden md:flex flex-col justify-between p-4"
    >
      <div className="flex flex-col gap-4">
        <div className="px-2 pt-1">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#75777d]">
            Menu Utama
          </span>
        </div>

        <nav id="sidebar-navigation" className="flex flex-col gap-1.5">
          <button
            id="sidebar-btn-presensi"
            type="button"
            onClick={() => onSelectTab('presensi-dan-unduh-sertifikat')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold text-left ${
              activeTab === 'presensi-dan-unduh-sertifikat'
                ? 'bg-[#5a0f18] text-white shadow-sm'
                : 'text-[#534344] hover:bg-[#f6f1f1] hover:text-[#201112]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">verified</span>
            <span>Presensi &amp; Unduh</span>
          </button>

          <button
            id="sidebar-btn-riwayat"
            type="button"
            onClick={() => onSelectTab('riwayat-kehadiran')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold text-left ${
              activeTab === 'riwayat-kehadiran'
                ? 'bg-[#5a0f18] text-white shadow-sm'
                : 'text-[#534344] hover:bg-[#f6f1f1] hover:text-[#201112]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">history_edu</span>
            <span>Roster Kehadiran</span>
          </button>

          <button
            id="sidebar-btn-detail"
            type="button"
            onClick={() => onSelectTab('informasi-kegiatan')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold text-left ${
              activeTab === 'informasi-kegiatan'
                ? 'bg-[#5a0f18] text-white shadow-sm'
                : 'text-[#534344] hover:bg-[#f6f1f1] hover:text-[#201112]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">info</span>
            <span>Detail Kegiatan</span>
          </button>
        </nav>
      </div>

      {/* Bottom Info Card */}
      <div
        id="sidebar-authority-card"
        className="p-3.5 rounded-xl bg-[#f6f1f1] border border-[#5a0f18]/15"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#5a0f18]">
            verified
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#5a0f18] font-bold font-mono">
            KPU Konawe
          </span>
        </div>
        <p className="text-xs text-[#534344] leading-relaxed">
          Verifikasi otomatis e-sertifikat peserta bedah buku kepemiluan.
        </p>

        {isAdmin && (
          <div className="mt-2.5 pt-2 border-t border-[#5a0f18]/10 flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Akses Admin KPU Aktif</span>
          </div>
        )}
      </div>
    </aside>
  );
};
