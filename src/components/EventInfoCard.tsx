import React from 'react';

export const EventInfoCard: React.FC = () => {
  return (
    <div
      id="event-details-card"
      className="bg-white rounded-2xl p-6 shadow-sm border border-[#5a0f18]/10"
    >
      <div className="flex items-center gap-2.5 pb-3.5 mb-3.5 border-b border-[#f0e6e7]">
        <div
          id="event-book-icon"
          className="w-8 h-8 rounded-lg bg-[#5a0f18]/10 flex items-center justify-center text-[#5a0f18]"
        >
          <span className="material-symbols-outlined text-[20px]">menu_book</span>
        </div>
        <h3 className="text-sm font-bold text-[#5a0f18]">
          Tentang Bedah Buku &amp; Penyelenggara
        </h3>
      </div>

      <div className="space-y-3 text-xs text-[#534344]">
        <div className="p-3 rounded-xl bg-[#f6f1f1] flex items-start gap-3 border border-[#f0e6e7]">
          <span className="material-symbols-outlined text-[#5a0f18] text-[20px] shrink-0 mt-0.5">
            location_city
          </span>
          <div>
            <strong className="text-[#201112] block font-semibold text-xs">
              Komisi Pemilihan Umum Kabupaten Konawe
            </strong>
            <span className="text-[11px] text-[#534344] leading-relaxed">
              Penyelenggara resmi sosialisasi dan bedah regulasi kepemiluan nasional.
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#f6f1f1] flex items-start gap-3 border border-[#f0e6e7]">
          <span className="material-symbols-outlined text-[#5a0f18] text-[20px] shrink-0 mt-0.5">
            edit_document
          </span>
          <div>
            <strong className="text-[#201112] block font-semibold text-xs">
              Buku Referensi Pemilu
            </strong>
            <span className="text-[11px] text-[#534344] leading-relaxed">
              Sistem Pemilu Indonesia &quot;Desain, Regulasi dan Tata Kelola
              Penyelenggaraan&quot; - Penataan Daerah Pemilihan (Dapil)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#f6f1f1] flex items-start gap-3 border border-[#f0e6e7]">
          <span className="material-symbols-outlined text-[#5a0f18] text-[20px] shrink-0 mt-0.5">
            timer
          </span>
          <div>
            <strong className="text-[#201112] block font-semibold text-xs">
              Beban Pembelajaran Resmi
            </strong>
            <span className="text-[11px] text-[#534344] leading-relaxed">
              Setara 2 (dua) jam pelajaran bersertifikat resmi KPU Konawe ditandatangani
              Ketua KPU (Wike).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
