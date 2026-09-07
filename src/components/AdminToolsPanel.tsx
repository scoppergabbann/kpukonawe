import React, { useEffect, useState } from 'react';
import type { EventRegistrationStatus, ImportParticipantInput, ImportParticipantResult } from '../types';

interface AdminToolsPanelProps {
  eventStatus: EventRegistrationStatus;
  onSaveEvent: (status: EventRegistrationStatus) => Promise<void>;
  onImport: (rows: ImportParticipantInput[]) => Promise<ImportParticipantResult>;
}

const toLocalInput = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const normalizeHeader = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ');

export const AdminToolsPanel: React.FC<AdminToolsPanelProps> = ({ eventStatus, onSaveEvent, onImport }) => {
  const [isOpen, setIsOpen] = useState(eventStatus.isOpen);
  const [opensAt, setOpensAt] = useState(toLocalInput(eventStatus.opensAt));
  const [closesAt, setClosesAt] = useState(toLocalInput(eventStatus.closesAt));
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState<ImportParticipantInput[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(eventStatus.isOpen);
    setOpensAt(toLocalInput(eventStatus.opensAt));
    setClosesAt(toLocalInput(eventStatus.closesAt));
  }, [eventStatus]);

  const mapRows = (sheetRows: unknown[][]) => {
    if (sheetRows.length < 2) throw new Error('Berkas tidak memiliki baris peserta.');
    const headers = sheetRows[0].map(normalizeHeader);
    const nameIndex = headers.findIndex((header) => ['nama', 'nama peserta', 'nama lengkap', 'name'].includes(header));
    const institutionIndex = headers.findIndex((header) => ['instansi', 'institusi', 'afiliasi', 'institution', 'instansi/organisasi asal', 'organisasi asal'].includes(header));
    const emailIndex = headers.findIndex((header) => header === 'email' || header === 'alamat email');
    const phoneIndex = headers.findIndex((header) => ['no hp', 'nomor hp', 'phone', 'telepon', 'whatsapp', 'wa'].includes(header));
    if (nameIndex < 0 || institutionIndex < 0 || emailIndex < 0 || phoneIndex < 0) {
      throw new Error('Kolom wajib: Nama, Instansi/Organisasi Asal, Email, dan No. HP.');
    }
    return sheetRows.slice(1).map((row) => ({
      name: String(row[nameIndex] ?? '').trim(),
      institution: String(row[institutionIndex] ?? '').trim(),
      email: String(row[emailIndex] ?? '').trim().toLowerCase(),
      phone: String(row[phoneIndex] ?? '').replace(/\D/g, '').slice(0, 15),
    })).filter((row) => row.name || row.institution || row.email || row.phone);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImportMessage(null);
    setRows([]);
    setFileName(file.name);
    try {
      let parsedRows: unknown[][];
      if (file.name.toLowerCase().endsWith('.csv')) {
        const { default: Papa } = await import('papaparse');
        const result = Papa.parse<unknown[]>(await file.text(), { skipEmptyLines: true });
        if (result.errors.length) throw new Error(result.errors[0].message);
        parsedRows = result.data;
      } else {
        const { readSheet } = await import('read-excel-file/browser');
        parsedRows = await readSheet(file) as unknown[][];
      }
      const mapped = mapRows(parsedRows);
      if (mapped.length > 1000) throw new Error('Maksimal 1000 peserta per impor.');
      setRows(mapped);
      setImportMessage(`${mapped.length} baris siap diperiksa dan diimpor.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Berkas tidak dapat dibaca.');
    }
  };

  const saveEvent = async () => {
    setIsSaving(true);
    try {
      await onSaveEvent({
        isOpen,
        accepting: isOpen,
        opensAt: opensAt ? new Date(opensAt).toISOString() : null,
        closesAt: closesAt ? new Date(closesAt).toISOString() : null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const importRows = async () => {
    if (!rows.length) return;
    setIsImporting(true);
    try {
      const result = await onImport(rows);
      setImportMessage(`${result.inserted} peserta berhasil diimpor; ${result.skipped} baris dilewati karena tidak valid atau duplikat.`);
      setRows([]);
      setFileName('');
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Impor peserta gagal.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Peralatan administrator">
      <div className="rounded-2xl border border-[#5a0f18]/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3"><span className="material-symbols-outlined text-[#5a0f18]">event_available</span><div><h3 className="text-sm font-bold text-[#5a0f18]">Masa Presensi</h3><p className="text-xs text-[#534344]">Atur akses formulir untuk peserta.</p></div></div>
        <label className="mb-4 flex items-center justify-between rounded-xl bg-[#f6f1f1] p-3 text-sm font-semibold"><span>{isOpen ? 'Presensi dibuka' : 'Presensi ditutup'}</span><input type="checkbox" checked={isOpen} onChange={(event) => setIsOpen(event.target.checked)} className="h-5 w-5 accent-[#5a0f18]" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Mulai (opsional)<input type="datetime-local" value={opensAt} onChange={(event) => setOpensAt(event.target.value)} className="mt-1 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2 text-sm" /></label>
          <label className="text-xs font-semibold">Berakhir (opsional)<input type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} className="mt-1 w-full rounded-xl border border-[#d5cbcd] bg-[#fbf9f9] px-3 py-2 text-sm" /></label>
        </div>
        <button type="button" disabled={isSaving} onClick={() => void saveEvent()} className="mt-4 rounded-xl bg-[#5a0f18] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3d080e] disabled:opacity-60">{isSaving ? 'Menyimpan...' : 'Simpan Masa Presensi'}</button>
      </div>

      <div className="rounded-2xl border border-[#5a0f18]/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3"><span className="material-symbols-outlined text-[#5a0f18]">upload_file</span><div><h3 className="text-sm font-bold text-[#5a0f18]">Impor Peserta</h3><p className="text-xs text-[#534344]">Excel/CSV dengan kolom Nama, Instansi/Organisasi Asal, Email, dan No. HP.</p></div></div>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#5a0f18]/40 bg-[#fbf9f9] px-4 py-5 text-xs font-semibold text-[#5a0f18] hover:bg-[#f6f1f1]"><span className="material-symbols-outlined">attach_file</span>{fileName || 'Pilih file .xlsx atau .csv'}<input type="file" accept=".xlsx,.csv" onChange={(event) => void handleFile(event.target.files?.[0])} className="sr-only" /></label>
        {importMessage && <p className="mt-3 text-xs text-[#534344]" role="status">{importMessage}</p>}
        <button type="button" disabled={!rows.length || isImporting} onClick={() => void importRows()} className="mt-4 rounded-xl bg-[#5a0f18] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3d080e] disabled:cursor-not-allowed disabled:opacity-40">{isImporting ? 'Mengimpor...' : `Impor ${rows.length || ''} Peserta`}</button>
      </div>
    </section>
  );
};
