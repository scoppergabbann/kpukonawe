import React from 'react';

interface HeroBannerProps {
  attendeeCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ attendeeCount }) => {
  return (
    <div
      id="hero-event-banner"
      className="relative w-full rounded-2xl bg-white p-6 sm:p-8 shadow-sm overflow-hidden mb-6 border border-[#5a0f18]/10"
    >
      {/* Decorative ambient blurs */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#5a0f18]/5 blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 -bottom-20 w-64 h-64 rounded-full bg-[#ffdcc3]/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-3xl">
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              id="badge-kpu-institution"
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#5a0f18] text-white font-bold uppercase tracking-wider font-mono shadow-xs"
            >
              Komisi Pemilihan Umum
            </span>
            <span
              id="badge-status-active"
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#f0e6e7] text-[#5a0f18] font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-[#5a0f18] animate-pulse" />
              Presensi Daring Aktif
            </span>
            <span className="text-[11px] text-[#534344] font-medium">
              Kabupaten Konawe • Durasi 2 Jam Pelajaran
            </span>
          </div>

          {/* Main Title */}
          <h1
            id="event-main-title"
            className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#5a0f18] tracking-tight leading-tight"
          >
            Bedah Buku Sistem Pemilu Indonesia: “Desain, Regulasi dan Tata Kelola
            Penyelenggaraan” Penataan Daerah Pemilihan (DAPIL)
          </h1>

          {/* Subtitle Details */}
          <p className="text-sm text-[#534344] mt-3 leading-relaxed">
            Penyelenggara:{' '}
            <strong className="text-[#201112] font-semibold">
              Komisi Pemilihan Umum Kabupaten Konawe
            </strong>{' '}
            • Tanggal: <span className="font-semibold text-[#5a0f18]">8 September 2026</span> •
            Diterbitkan resmi untuk seluruh peserta yang telah mengisi presensi kehadiran.
          </p>
        </div>

        {/* Quick Stat Tiles */}
        <div className="flex items-center gap-3 sm:gap-4 pt-2 lg:pt-0 shrink-0">
          <div
            id="stat-registered-attendees"
            className="p-3.5 bg-[#f6f1f1] rounded-xl flex items-center gap-3 border border-[#5a0f18]/10 shadow-xs"
          >
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#5a0f18] shadow-xs">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#75777d] block font-mono">
                Peserta Terdaftar
              </span>
              <span
                id="totalAttendanceBadge"
                className="text-xl font-bold text-[#5a0f18] tracking-tight font-mono"
              >
                {attendeeCount}
              </span>
            </div>
          </div>

          <div
            id="stat-issuance-status"
            className="p-3.5 bg-[#5a0f18]/10 rounded-xl flex items-center gap-3 border border-[#5a0f18]/20 shadow-xs"
          >
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#5a0f18] shadow-xs">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5a0f18] block font-mono">
                Status Penerbitan
              </span>
              <span className="text-xl font-bold text-[#5a0f18] tracking-tight">
                Resmi KPU
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
