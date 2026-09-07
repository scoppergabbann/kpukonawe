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
      className="bg-white rounded-2xl p-6 shadow-sm border border-[#5a0f18]/10"
    >
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#f0e6e7]">
        <div className="flex items-center gap-3">
          <div
            id="form-icon-container"
            className="w-9 h-9 rounded-lg bg-[#5a0f18] flex items-center justify-center text-white shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#5a0f18]">
              Formulir Kehadiran Peserta
            </h2>
            <span className="text-xs text-[#75777d]">
              Lengkapi data untuk cetak otomatis e-sertifikat
            </span>
          </div>
        </div>
        <span
          id="online-status-pill"
          className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#5a0f18]/10 text-[#5a0f18] font-mono"
        >
          {registrationOpen ? 'DIBUKA' : 'DITUTUP'}
        </span>
      </div>

      <form id="attendanceForm" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label
            htmlFor="inputName"
            className="block text-xs font-semibold text-[#201112] mb-1"
          >
            Nama Lengkap &amp; Gelar Akademik <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#75777d] text-[18px]">
              person
            </span>
            <input
              id="inputName"
              type="text"
              required
              disabled={!registrationOpen}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dr. Budi Santoso, M.Kom."
              className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-[#fbf9f9] text-[#201112] focus:bg-white focus:ring-2 focus:ring-[#5a0f18]/25 border border-[#d5cbcd] focus:border-[#5a0f18] focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="inputEmail"
              className="block text-xs font-semibold text-[#201112] mb-1"
            >
              Alamat Email Aktif <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#75777d] text-[18px]">
                mail
              </span>
              <input
                id="inputEmail"
                type="email"
                required
                disabled={!registrationOpen}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="nama@institusi.ac.id"
                className={`w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-[#fbf9f9] text-[#201112] focus:bg-white focus:ring-2 focus:ring-[#5a0f18]/25 border ${
                  emailError ? 'border-[#ba1a1a]' : 'border-[#d5cbcd]'
                } focus:border-[#5a0f18] focus:outline-none transition-all shadow-2xs`}
              />
            </div>
            {emailError && (
              <p id="emailError" className="text-xs text-[#ba1a1a] mt-1 font-medium">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="inputPhone" className="block text-xs font-semibold text-[#201112] mb-1">
              No. HP <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#75777d] text-[18px]">
                phone
              </span>
              <input
                id="inputPhone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{8,15}"
                minLength={8}
                maxLength={15}
                required
                disabled={!registrationOpen}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="081234567890"
                title="Masukkan 8 sampai 15 angka tanpa spasi atau tanda baca"
                className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-[#fbf9f9] text-[#201112] focus:bg-white focus:ring-2 focus:ring-[#5a0f18]/25 border border-[#d5cbcd] focus:border-[#5a0f18] focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="inputInstansi"
            className="block text-xs font-semibold text-[#201112] mb-1"
          >
            Instansi/Organisasi Asal <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#75777d] text-[18px]">
              account_balance
            </span>
            <input
              id="inputInstansi"
              type="text"
              required
              disabled={!registrationOpen}
              value={instansi}
              onChange={(e) => setInstansi(e.target.value)}
              placeholder="Contoh: Universitas Indonesia / KPU Provinsi / Bawaslu"
              className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-[#fbf9f9] text-[#201112] focus:bg-white focus:ring-2 focus:ring-[#5a0f18]/25 border border-[#d5cbcd] focus:border-[#5a0f18] focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="inputSerial"
                className="block text-xs font-semibold text-[#201112]"
              >
                Nomor Registrasi Sertifikat
              </label>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#5a0f18] bg-[#5a0f18]/10 px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[11px]">lock</span>
                Read-only
              </span>
            </div>
            <input
              id="inputSerial"
              type="text"
              readOnly
              value={serial}
              placeholder="001/HM.07/7402/2/2026"
              tabIndex={-1}
              className="w-full px-3 py-2 font-mono text-xs rounded-xl bg-[#f0e6e7]/40 text-[#5a0f18] font-bold border border-[#d5cbcd] focus:outline-none cursor-not-allowed select-none shadow-inner"
            />
            <span className="text-[10px] text-[#75777d] mt-1 block font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-[#75777d]">info</span>
              <span>Ditetapkan otomatis sesuai nomor urut presensi resmi</span>
            </span>
          </div>

          <div>
            <label
              htmlFor="inputDate"
              className="block text-xs font-semibold text-[#201112] mb-1"
            >
              Tanggal Kegiatan
            </label>
            <input
              id="inputDate"
              type="text"
              readOnly
              value={date}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#f6f1f1] text-[#201112] font-semibold border border-[#d5cbcd] focus:outline-none cursor-default"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button
            id="btnSubmitPresensi"
            type="submit"
            disabled={isSubmitting || !registrationOpen}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#5a0f18] hover:bg-[#3d080e] text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:shadow-md cursor-pointer disabled:cursor-wait disabled:opacity-65"
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
            className="py-2.5 px-3 bg-[#f6f1f1] hover:bg-[#ede4e4] text-[#201112] rounded-xl text-xs font-semibold transition-all border border-[#d5cbcd]/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </form>
    </div>
  );
};
