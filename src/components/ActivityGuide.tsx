import React from 'react';

export const ActivityGuide: React.FC = () => {
  return (
    <div
      id="tabContentDocs"
      className="bg-white rounded-2xl p-6 shadow-sm border border-[#5a0f18]/10 flex flex-col gap-6"
    >
      <div>
        <h3 className="text-lg font-bold text-[#5a0f18]">
          Informasi Kegiatan &amp; Tata Tertib E-Sertifikat
        </h3>
        <p className="text-sm text-[#534344] mt-1">
          Ketentuan resmi penerbitan dan pengunduhan e-sertifikat peserta diskusi kepemiluan KPU
          Kabupaten Konawe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div
          id="guide-step-1"
          className="p-4 rounded-xl bg-[#f6f1f1] flex flex-col gap-2 border border-[#f0e6e7]"
        >
          <div className="flex items-center gap-2 text-[#5a0f18] font-bold text-sm font-mono">
            <span className="w-5 h-5 rounded-full bg-[#5a0f18] text-white flex items-center justify-center text-sm">
              1
            </span>
            <span>PENGISIAN DATA RESMI</span>
          </div>
          <h4 className="text-base font-bold text-[#5a0f18]">Nama &amp; Gelar Lengkap</h4>
          <p className="text-sm text-[#534344] leading-relaxed">
            Pastikan nama yang diinputkan telah menyertakan gelar lengkap dan instansi. Nama
            ini akan langsung dicetak pada template sertifikat resmi KPU Kabupaten Konawe tanpa
            pengeditan manual lanjutan.
          </p>
          <div className="p-2 mt-auto rounded bg-white text-sm font-mono text-[#67585b] border border-[#f0e6e7]">
            Format: Nama Lengkap beserta Gelar Akademik
          </div>
        </div>

        {/* Step 2 */}
        <div
          id="guide-step-2"
          className="p-4 rounded-xl bg-[#f6f1f1] flex flex-col gap-2 border border-[#f0e6e7]"
        >
          <div className="flex items-center gap-2 text-[#5a0f18] font-bold text-sm font-mono">
            <span className="w-5 h-5 rounded-full bg-[#5a0f18] text-white flex items-center justify-center text-sm">
              2
            </span>
            <span>PENYELENGGARA RESMI</span>
          </div>
          <h4 className="text-base font-bold text-[#5a0f18]">KPU Kabupaten Konawe</h4>
          <p className="text-sm text-[#534344] leading-relaxed">
            Sertifikat ini disahkan secara institusional oleh Ketua KPU Kabupaten Konawe
            (Wike) atas partisipasi aktif dalam diskusi komunikasi politik di era digital.
          </p>
          <div className="p-2 mt-auto rounded bg-white text-sm font-mono text-[#67585b] border border-[#f0e6e7]">
            Otoritas: Komisi Pemilihan Umum Kab. Konawe
          </div>
        </div>

        {/* Step 3 */}
        <div
          id="guide-step-3"
          className="p-4 rounded-xl bg-[#f6f1f1] flex flex-col gap-2 border border-[#f0e6e7]"
        >
          <div className="flex items-center gap-2 text-[#5a0f18] font-bold text-sm font-mono">
            <span className="w-5 h-5 rounded-full bg-[#5a0f18] text-white flex items-center justify-center text-sm">
              3
            </span>
            <span>VALIDITAS &amp; DOKUMEN</span>
          </div>
          <h4 className="text-base font-bold text-[#5a0f18]">Format PDF &amp; Gambar HD</h4>
          <p className="text-sm text-[#534344] leading-relaxed">
            Peserta dapat langsung mencetak dalam format PDF atau mengunduh gambar
            beresolusi tinggi (JPG HD) untuk portofolio maupun pelaporan kedinasan/akademik.
          </p>
          <div className="p-2 mt-auto rounded bg-white text-sm font-mono text-[#67585b] border border-[#f0e6e7]">
            Validitas: Surat Keputusan / Agenda Resmi KPU
          </div>
        </div>
      </div>
    </div>
  );
};
