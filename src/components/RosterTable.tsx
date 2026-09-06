import React from 'react';
import { AttendanceRecord } from '../types';

interface RosterTableProps {
  records: AttendanceRecord[];
  isAdmin: boolean;
  onSelectRecord: (record: AttendanceRecord) => void;
  onExportCSV: () => void;
  onClearRecords: () => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
}

export const RosterTable: React.FC<RosterTableProps> = ({
  records,
  isAdmin,
  onSelectRecord,
  onExportCSV,
  onClearRecords,
  onOpenAdminLogin,
  onLogoutAdmin,
}) => {
  return (
    <div
      id="tabContentRecords"
      className="bg-white rounded-2xl p-6 shadow-sm border border-[#5a0f18]/10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#5a0f18]">
              Log Presensi Peserta &amp; Status Sertifikat
            </h3>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Admin Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                Mode Tamu
              </span>
            )}
          </div>
          <p className="text-xs text-[#534344]">
            Daftar kehadiran peserta webinar bedah buku sistem pemilu penataan daerah pemilihan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Protected Reset Button with Admin Gatekeeper */}
          <button
            id="btnClearRecords"
            type="button"
            onClick={onClearRecords}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isAdmin
                ? 'text-[#ba1a1a] bg-[#ffdad6]/40 hover:bg-[#ffdad6]/80 border border-[#ba1a1a]/30 shadow-2xs'
                : 'text-[#ba1a1a] bg-[#ffdad6]/20 hover:bg-[#ffdad6]/40 border border-[#ba1a1a]/20'
            }`}
            title={
              isAdmin
                ? 'Kosongkan riwayat presensi (Akses Admin Aktif)'
                : 'Akses dilindungi: Masuk sebagai admin untuk mereset log kehadiran'
            }
          >
            <span className="material-symbols-outlined text-[17px]">
              {isAdmin ? 'delete_sweep' : 'lock'}
            </span>
            <span>Reset</span>
            {!isAdmin && (
              <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[#ba1a1a]/15 text-[#ba1a1a] font-bold">
                Admin
              </span>
            )}
          </button>

          {/* Admin Toggle / Status */}
          {isAdmin ? (
            <button
              id="btnLogoutAdminRoster"
              type="button"
              onClick={onLogoutAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f6f1f1] hover:bg-[#fee2e2] text-[#75777d] hover:text-[#ba1a1a] text-xs font-medium transition-all cursor-pointer border border-[#f0e6e7]"
              title="Keluar dari sesi Administrator"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              <span className="hidden sm:inline">Keluar Admin</span>
            </button>
          ) : (
            <button
              id="btnLoginAdminRoster"
              type="button"
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#5a0f18]/10 hover:bg-[#5a0f18]/20 text-[#5a0f18] text-xs font-semibold transition-all cursor-pointer border border-[#5a0f18]/20"
              title="Buka dialog login administrator KPU"
            >
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              <span className="hidden sm:inline">Login Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table id="rosterTable" className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#f6f1f1] text-[#75777d] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-lg">Waktu Masuk</th>
              <th className="py-3 px-4">Nama Peserta</th>
              <th className="py-3 px-4">Instansi</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">No. Registrasi Sertifikat</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right rounded-r-lg">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody id="rosterTableBody" className="divide-y divide-[#f0e6e7]">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#75777d]">
                  {isAdmin
                    ? 'Belum ada catatan presensi tersimpan di Supabase.'
                    : 'Data pribadi peserta hanya dapat dilihat oleh Administrator KPU.'}
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-[#f6f1f1]/60 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#75777d]">
                    {rec.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#5a0f18] text-xs">
                    {rec.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#201112]">{rec.instansi}</td>
                  <td className="py-3.5 px-4 text-[#534344] font-mono text-[11px]">
                    {rec.email}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#5a0f18]">
                    {rec.serial}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#5a0f18]/10 text-[#5a0f18] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5a0f18]" />
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectRecord(rec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f6f1f1] hover:bg-[#5a0f18] hover:text-white text-[#5a0f18] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        visibility
                      </span>
                      <span>Tampilkan</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Card Ekspor CSV pada Bagian Log Presensi Peserta */}
      <div
        id="card-export-log-csv"
        className="mt-6 pt-5 border-t border-[#f0e6e7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#fbf9f9] border border-[#d5cbcd]/40"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#5a0f18]/10 text-[#5a0f18] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <span className="material-symbols-outlined text-[22px]">table_view</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-[#201112]">
                Ekspor Log Presensi Peserta (.CSV)
              </h4>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Admin Terverifikasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  Proteksi Admin
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#534344] mt-0.5">
              Unduh seluruh riwayat rekap presensi ({records.length} peserta) ke dalam format berkas spreadsheet CSV.
            </p>
          </div>
        </div>

        <button
          id="btnCardExportCSV"
          type="button"
          onClick={onExportCSV}
          className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isAdmin
              ? 'bg-[#5a0f18] hover:bg-[#3d080e] text-white'
              : 'bg-white hover:bg-[#f6f1f1] text-[#5a0f18] border border-[#5a0f18]/30 shadow-2xs'
          }`}
          title={
            isAdmin
              ? 'Unduh seluruh log presensi peserta dalam format CSV (Akses Admin Aktif)'
              : 'Akses dilindungi: Masuk dengan akun admin untuk mengunduh berkas CSV'
          }
        >
          <span className="material-symbols-outlined text-[17px]">
            {isAdmin ? 'download' : 'lock'}
          </span>
          <span>Ekspor CSV</span>
          {!isAdmin && (
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#5a0f18]/15 text-[#5a0f18] font-bold">
              Admin
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
