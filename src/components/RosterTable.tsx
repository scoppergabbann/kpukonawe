import React, { useEffect, useMemo, useState } from 'react';
import { AttendanceRecord, PublicAttendanceRecord } from '../types';

const PUBLIC_PAGE_SIZE = 10;

const serialSequence = (serial: string) => {
  const value = Number.parseInt(serial.split('/')[0] || '', 10);
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
};

const orderBySerial = <T extends { serial: string; name: string }>(items: T[]) =>
  [...items].sort(
    (left, right) =>
      serialSequence(left.serial) - serialSequence(right.serial) ||
      left.name.localeCompare(right.name, 'id')
  );

interface RosterTableProps {
  records: AttendanceRecord[];
  publicRecords: PublicAttendanceRecord[];
  isAdmin: boolean;
  onSelectRecord: (record: AttendanceRecord) => void;
  onManageRecord: (record: AttendanceRecord) => void;
  onExportCSV: () => void;
  onClearRecords: () => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
}

export const RosterTable: React.FC<RosterTableProps> = ({
  records,
  publicRecords,
  isAdmin,
  onSelectRecord,
  onManageRecord,
  onExportCSV,
  onClearRecords,
  onOpenAdminLogin,
  onLogoutAdmin,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | AttendanceRecord['status']>('Semua');
  const [publicQuery, setPublicQuery] = useState('');
  const [publicPage, setPublicPage] = useState(1);

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orderBySerial(records.filter((record) => {
      const matchesQuery = !keyword || [record.name, record.instansi, record.email, record.serial]
        .some((value) => value.toLowerCase().includes(keyword));
      const matchesStatus = statusFilter === 'Semua' || record.status === statusFilter;
      return matchesQuery && matchesStatus;
    }));
  }, [query, records, statusFilter]);

  const filteredPublicRecords = useMemo(() => {
    const keyword = publicQuery.trim().toLowerCase();
    const matches = !keyword
      ? publicRecords
      : publicRecords.filter((record) =>
          [record.name, record.instansi, record.serial].some((value) => value.toLowerCase().includes(keyword))
        );
    return orderBySerial(matches);
  }, [publicQuery, publicRecords]);

  const publicPageCount = Math.max(1, Math.ceil(filteredPublicRecords.length / PUBLIC_PAGE_SIZE));
  const paginatedPublicRecords = useMemo(() => {
    const start = (publicPage - 1) * PUBLIC_PAGE_SIZE;
    return filteredPublicRecords.slice(start, start + PUBLIC_PAGE_SIZE);
  }, [filteredPublicRecords, publicPage]);

  useEffect(() => {
    setPublicPage((current) => Math.min(current, publicPageCount));
  }, [publicPageCount]);

  return (
    <div
      id="tabContentRecords"
      className="bg-white rounded-2xl p-6 shadow-sm border border-[#5a0f18]/10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#5a0f18]">
              Log Peserta &amp; Nomor Sertifikat
            </h3>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Admin Aktif
              </span>
            )}
          </div>
          <p className="text-xs text-[#534344]">
            Daftar peserta diurutkan berdasarkan nomor sertifikat, mulai dari 001.
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

      {isAdmin && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-3">
          <label className="relative">
            <span className="sr-only">Cari peserta</span>
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#75777d]">search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, instansi, email, atau nomor..."
              className="w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] py-2.5 pl-10 pr-3 text-sm focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20"
            />
          </label>
          <label>
            <span className="sr-only">Filter status sertifikat</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'Semua' | AttendanceRecord['status'])}
              className="w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2.5 text-sm focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20"
            >
              <option value="Semua">Semua status</option>
              <option value="Tervalidasi">Tervalidasi</option>
              <option value="Menunggu">Menunggu</option>
            </select>
          </label>
        </div>
      )}

      {!isAdmin && (
        <div className="mb-4">
          <label className="relative block">
            <span className="sr-only">Cari nama peserta atau instansi</span>
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#75777d]">search</span>
            <input
              type="search"
              value={publicQuery}
              onChange={(event) => {
                setPublicQuery(event.target.value);
                setPublicPage(1);
              }}
              placeholder="Cari nama, nomor sertifikat, atau institusi..."
              className="w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] py-2.5 pl-10 pr-3 text-sm focus:border-[#5a0f18] focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/20"
            />
          </label>
        </div>
      )}

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        {isAdmin ? (
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
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#75777d]">
                  {isAdmin
                    ? records.length === 0
                      ? 'Belum ada catatan presensi tersimpan di Supabase.'
                      : 'Tidak ada peserta yang cocok dengan pencarian atau filter.'
                    : ''}
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
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
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectRecord(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f6f1f1] hover:bg-[#5a0f18] hover:text-white text-[#5a0f18] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        <span>Tampilkan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onManageRecord(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">manage_accounts</span>
                        <span>Kelola</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        ) : (
          <table id="publicRosterTable" className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f6f1f1] text-[#75777d] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-lg">Nama Peserta</th>
                <th className="py-3 px-4">Nomor Sertifikat</th>
                <th className="py-3 px-4 rounded-r-lg">Asal Kampus / Universitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e6e7]">
              {paginatedPublicRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-[#75777d]">
                    {publicRecords.length === 0
                      ? 'Belum ada peserta yang tercatat.'
                      : 'Nama peserta atau instansi tidak ditemukan.'}
                  </td>
                </tr>
              ) : (
                paginatedPublicRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#f6f1f1]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#5a0f18] text-xs">{record.name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#5a0f18]">{record.serial}</td>
                    <td className="py-3.5 px-4 text-[#201112]">{record.instansi}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {!isAdmin && filteredPublicRecords.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[#f0e6e7] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#534344]">
            Menampilkan {(publicPage - 1) * PUBLIC_PAGE_SIZE + 1}–{Math.min(publicPage * PUBLIC_PAGE_SIZE, filteredPublicRecords.length)} dari {filteredPublicRecords.length} peserta
          </p>
          <nav className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:flex sm:w-auto sm:gap-2" aria-label="Paginasi daftar peserta">
            <button
              type="button"
              disabled={publicPage === 1}
              onClick={() => setPublicPage((page) => Math.max(1, page - 1))}
              className="inline-flex items-center justify-center gap-0.5 whitespace-nowrap rounded-lg border border-[#d5cbcd] bg-white px-2 py-2 text-[11px] font-semibold text-[#5a0f18] transition-colors hover:bg-[#f6f1f1] disabled:cursor-not-allowed disabled:opacity-40 sm:gap-1 sm:px-3 sm:text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              <span className="hidden min-[360px]:inline">Sebelumnya</span>
            </button>
            <span className="whitespace-nowrap text-center text-[11px] font-medium text-[#534344] sm:min-w-24 sm:text-xs">
              <span className="min-[360px]:hidden">{publicPage}/{publicPageCount}</span>
              <span className="hidden min-[360px]:inline">Halaman {publicPage} dari {publicPageCount}</span>
            </span>
            <button
              type="button"
              disabled={publicPage === publicPageCount}
              onClick={() => setPublicPage((page) => Math.min(publicPageCount, page + 1))}
              className="inline-flex items-center justify-center gap-0.5 whitespace-nowrap rounded-lg border border-[#d5cbcd] bg-white px-2 py-2 text-[11px] font-semibold text-[#5a0f18] transition-colors hover:bg-[#f6f1f1] disabled:cursor-not-allowed disabled:opacity-40 sm:gap-1 sm:px-3 sm:text-xs"
            >
              <span className="hidden min-[360px]:inline">Berikutnya</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </nav>
        </div>
      )}

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
