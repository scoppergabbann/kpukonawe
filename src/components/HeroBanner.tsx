import React from 'react';

interface HeroBannerProps {
  attendeeCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ attendeeCount }) => {
  return (
    <div
      id="hero-event-banner"
      className="relative w-full rounded-2xl bg-white p-4 sm:p-8 shadow-sm overflow-hidden mb-6 border border-[#5a0f18]/10"
    >
      {/* Decorative ambient blurs */}
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#5a0f18]/5 blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 -bottom-20 w-64 h-64 rounded-full bg-[#ffdcc3]/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex min-w-0 flex-col gap-6">
        <div className="max-w-3xl">
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              id="badge-kpu-institution"
              className="text-sm px-2.5 py-1 rounded-full bg-[#5a0f18] text-white font-bold uppercase tracking-wider font-mono shadow-xs"
            >
              Komisi Pemilihan Umum
            </span>
            <span
              id="badge-status-active"
              className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full bg-[#f0e6e7] text-[#5a0f18] font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-[#5a0f18] animate-pulse" />
              Presensi Daring Aktif
            </span>
            <span className="text-sm text-[#534344] font-medium">
              Kabupaten Konawe
            </span>
          </div>

          {/* Main Title */}
          <h1
            id="event-main-title"
            className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#5a0f18] tracking-tight leading-tight"
          >
            Diskusi Kepemiluan: Komunikasi Politik di Era Digital —
            Pendekatan Praktis, Implementatif, dan Berbasis Lapangan
          </h1>

          {/* Subtitle Details */}
          <p className="text-base text-[#534344] mt-3 leading-relaxed">
            Penyelenggara:{' '}
            <strong className="text-[#201112] font-semibold">
              Komisi Pemilihan Umum Kabupaten Konawe
            </strong>{' '}
            • Tanggal: <span className="font-semibold text-[#5a0f18]">28 Oktober 2026</span> •
            Diterbitkan resmi untuk seluruh peserta yang telah mengisi presensi kehadiran.
          </p>
        </div>

        {/* Quick Stat Tiles */}
        <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4">
          <div
            id="stat-registered-attendees"
            className="min-w-0 p-4 bg-[#f6f1f1] rounded-xl flex items-center gap-3 border border-[#5a0f18]/10 shadow-xs"
          >
            <div className="w-11 h-11 shrink-0 rounded-lg bg-white flex items-center justify-center text-[#5a0f18] shadow-xs">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold leading-relaxed text-[#67585b] block">
                Peserta Terdaftar
              </span>
              <span
                id="totalAttendanceBadge"
                className="mt-1 block break-words text-xl leading-snug font-bold text-[#5a0f18] tracking-tight font-mono"
              >
                {attendeeCount}
              </span>
            </div>
          </div>

          <div
            id="stat-issuance-status"
            className="min-w-0 p-4 bg-[#5a0f18]/10 rounded-xl flex items-center gap-3 border border-[#5a0f18]/20 shadow-xs"
          >
            <div className="w-11 h-11 shrink-0 rounded-lg bg-white flex items-center justify-center text-[#5a0f18] shadow-xs">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold leading-relaxed text-[#5a0f18] block">
                Status Penerbitan
              </span>
              <span className="mt-1 block break-words text-xl leading-snug font-bold text-[#5a0f18] tracking-tight">
                Resmi KPU
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
