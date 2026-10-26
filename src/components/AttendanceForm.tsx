import React, { useState } from 'react';

interface AttendanceFormProps {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  instansi: string;
  setInstansi: (val: string) => void;
  serial: string;
  setSerial: (val: string) => void;
  date: string;
  isSubmitting: boolean;
  registrationOpen: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  instansi,
  setInstansi,
  serial,
  setSerial,
  date,
  isSubmitting,
  registrationOpen,
  onSubmit,
  onReset,
}) => {
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Format email belum sesuai (gunakan format: nama@domain.com)');
      return;
    }
    setEmailError(null);
    onSubmit();
  };

  return (
    <div
      id="attendance-form-card"
      className="bg-white rounded-2xl p-4 sm:p-7 shadow-sm border border-[#5a0f18]/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#f0e6e7]">
        <div className="flex items-center gap-3">
          <div
            id="form-icon-container"
            className="w-12 h-12 shrink-0 rounded-xl bg-[#5a0f18] flex items-center justify-center text-white shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          </div>
          <div>
            <h2 className="text-xl leading-snug font-bold text-[#5a0f18]">
              Formulir Kehadiran Peserta
            </h2>
            <span className="text-sm leading-relaxed text-[#534344]">
              Lengkapi data untuk cetak otomatis e-sertifikat
            </span>
          </div>
        </div>
        <span
          id="online-status-pill"
          className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#5a0f18]/10 text-[#5a0f18] font-mono"
        >
          {registrationOpen ? 'DIBUKA' : 'DITUTUP'}
        </span>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-[#534344]">Isi kolom bertanda <span className="font-semibold text-[#ba1a1a]">*</span>. Periksa nama dan gelar karena akan tercetak pada sertifikat.</p>

      <form id="attendanceForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label
            htmlFor="inputName"
            className="block text-base font-semibold text-[#201112] mb-2"
          >
            Nama Lengkap &amp; Gelar Akademik <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#675456] text-[22px]">
              person
            </span>
            <input
              id="inputName"
              name="name"
              autoComplete="name"
              aria-describedby="nameHint"
              type="text"
              required
              disabled={!registrationOpen}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dr. Budi Santoso, M.Kom."
              className="w-full min-h-14 pl-12 pr-4 py-3.5 text-base leading-6 rounded-xl bg-white placeholder:text-[#77686a] disabled:bg-[#f6f1f1] disabled:text-[#675456] text-[#201112] focus:bg-white focus:ring-4 focus:ring-[#5a0f18]/15 border border-[#b6a5a8] focus:border-[#5a0f18] focus:outline-none transition-all shadow-2xs"
            />
          </div>
          <p id="nameHint" className="mt-2 text-sm leading-relaxed text-[#534344]">Tulis nama lengkap beserta gelar, jika ada.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label
              htmlFor="inputEmail"
              className="block text-base font-semibold text-[#201112] mb-2"
            >
              Alamat Email Aktif <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#675456] text-[22px]">
                mail
              </span>
              <input
                id="inputEmail"
                name="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "emailHint emailError" : "emailHint"}
                type="email"
                required
                disabled={!registrationOpen}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="nama@institusi.ac.id"
                className={`w-full min-h-14 pl-12 pr-4 py-3.5 text-base leading-6 rounded-xl bg-white placeholder:text-[#77686a] disabled:bg-[#f6f1f1] disabled:text-[#675456] text-[#201112] focus:bg-white focus:ring-4 focus:ring-[#5a0f18]/15 border ${
                  emailError ? 'border-[#ba1a1a]' : 'border-[#b6a5a8]'
                } focus:border-[#5a0f18] focus:outline-none transition-all shadow-2xs`}
              />
            </div>
            <p id="emailHint" className="mt-2 text-sm leading-relaxed text-[#534344]">Gunakan email yang bisa Anda akses untuk mengunduh ulang sertifikat.</p>
            {emailError && (
              <p role="alert" id="emailError" className="text-sm text-[#ba1a1a] mt-2 leading-relaxed font-medium">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="inputPhone" className="block text-base font-semibold text-[#201112] mb-2">
              No. HP <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#675456] text-[22px]">
                phone
              </span>
              <input
                id="inputPhone"
                name="tel"
                autoComplete="tel"
                aria-describedby="phoneHint"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{8,15}"
                minLength={8}
                maxLength={15}
                required
                disabled={!registrationOpen}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="Contoh: 081234567890"
                title="Masukkan 8 sampai 15 angka tanpa spasi atau tanda baca"
                className="w-full min-h-14 pl-12 pr-4 py-3.5 text-base leading-6 rounded-xl bg-white placeholder:text-[#77686a] disabled:bg-[#f6f1f1] disabled:text-[#675456] text-[#201112] focus:bg-white focus:ring-4 focus:ring-[#5a0f18]/15 border border-[#b6a5a8] focus:border-[#5a0f18] focus:outline-none transition-all shadow-2xs"
              />
            </div>
            <p id="phoneHint" className="mt-2 text-sm leading-relaxed text-[#534344]">Masukkan 8–15 angka, tanpa spasi atau tanda baca.</p>
          </div>
        </div>

        <div>
          <label
            htmlFor="inputInstansi"
            className="block text-base font-semibold text-[#201112] mb-2"
          >
            Instansi/Organisasi Asal <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#675456] text-[22px]">
              account_balance
            </span>
            <input
              id="inputInstansi"
              name="organization"
              autoComplete="organization"
              type="text"
              required
              disabled={!registrationOpen}
              value={instansi}
              onChange={(e) => setInstansi(e.target.value)}
              placeholder="Contoh: KPU Kabupaten Konawe"
              className="w-full min-h-14 pl-12 pr-4 py-3.5 text-base leading-6 rounded-xl bg-white placeholder:text-[#77686a] disabled:bg-[#f6f1f1] disabled:text-[#675456] text-[#201112] focus:bg-white focus:ring-4 focus:ring-[#5a0f18]/15 border border-[#b6a5a8] focus:border-[#5a0f18] focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="inputSerial"
                className="block text-base font-semibold text-[#201112]"
              >
                Nomor Registrasi Sertifikat
              </label>
            </div>
            <input
              id="inputSerial"
              type="text"
              readOnly
              value={serial}
              placeholder="Terisi otomatis setelah presensi"
              tabIndex={-1}
              className="w-full min-h-14 px-4 py-3.5 text-base rounded-xl bg-[#f6f1f1] text-[#534344] font-medium border border-[#d5cbcd] focus:outline-none cursor-default"
            />
            <span className="text-sm leading-relaxed text-[#534344] mt-2 flex items-start gap-2">
              <span className="material-symbols-outlined text-[13px] text-[#75777d]">info</span>
              <span>Nomor sertifikat akan dibuat otomatis setelah presensi berhasil.</span>
            </span>
          </div>

          <div>
            <label
              htmlFor="inputDate"
              className="block text-base font-semibold text-[#201112] mb-2"
            >
              Tanggal Kegiatan
            </label>
            <input
              id="inputDate"
              type="text"
              readOnly
              value={date}
              className="w-full min-h-14 px-4 py-3.5 text-base rounded-xl bg-[#f6f1f1] text-[#201112] font-semibold border border-[#b6a5a8] focus:outline-none cursor-default"
            />
          </div>
        </div>

        <div className="pt-2 flex items-stretch gap-3">
          <button
            id="btnSubmitPresensi"
            type="submit"
            disabled={isSubmitting || !registrationOpen}
            className="flex-1 flex items-center justify-center gap-2 min-h-14 py-3.5 px-4 bg-[#5a0f18] hover:bg-[#3d080e] text-white rounded-xl text-base font-bold leading-snug focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5a0f18]/25 shadow-sm transition-all hover:shadow-md cursor-pointer disabled:cursor-wait disabled:opacity-65"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSubmitting ? 'animate-spin' : ''}`}>
              {isSubmitting ? 'sync' : 'verified_user'}
            </span>
            <span>{!registrationOpen ? 'Masa Presensi Ditutup' : isSubmitting ? 'Menyimpan Presensi...' : 'Periksa & Kirim Presensi'}</span>
          </button>

          <button
            id="btnResetForm"
            type="button"
            onClick={onReset}
            disabled={isSubmitting}
            title="Reset Form"
            aria-label="Kosongkan formulir"
            className="min-h-14 min-w-14 shrink-0 py-3.5 px-4 bg-[#f6f1f1] hover:bg-[#ede4e4] text-[#201112] rounded-xl text-xs font-semibold transition-all border border-[#b6a5a8]/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </form>
    </div>
  );
};
