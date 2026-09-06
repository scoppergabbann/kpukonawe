import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HeroBanner } from './components/HeroBanner';
import { AttendanceForm } from './components/AttendanceForm';
import { EventInfoCard } from './components/EventInfoCard';
import { CertificateCanvas, CertificateCanvasHandle } from './components/CertificateCanvas';
import { RosterTable } from './components/RosterTable';
import { ActivityGuide } from './components/ActivityGuide';
import { Toast } from './components/Toast';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ConfirmResetModal } from './components/ConfirmResetModal';
import { AttendanceRecord, ActiveNavTab, ToastState } from './types';
import {
  clearAttendance,
  getAttendanceCount,
  isCurrentUserAdmin,
  listAttendance,
  signInAdmin,
  signOutAdmin,
  submitAttendance,
} from './lib/supabase-api';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export const formatCertSerial = (seq: number): string => {
  const padded = String(seq).padStart(3, '0');
  return `${padded}/HM.07/7402/2/2026`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>(
    'presensi-dan-unduh-sertifikat'
  );
  const [bottomTab, setBottomTab] = useState<'records' | 'guide'>('records');

  // Form states
  const [name, setName] = useState('Dr. Budi Santoso, M.Kom.');
  const [email, setEmail] = useState('budi.santoso@univ-tech.ac.id');
  const [instansi, setInstansi] = useState('Universitas Indonesia');
  const [serial, setSerial] = useState(() => formatCertSerial(1));
  const date = '8 September 2026';

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  // Admin Auth State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<
    'export_csv' | 'reset' | 'upload_template' | 'reset_template' | null
  >(null);
  const certCanvasRef = useRef<CertificateCanvasHandle | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastState>({
    show: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showToast = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    setToast({ show: true, title, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const refresh = async () => {
      try {
        const [count, admin] = await Promise.all([getAttendanceCount(), isCurrentUserAdmin()]);
        setParticipantCount(count);
        setSerial(formatCertSerial(count + 1));
        setIsAdmin(admin);
        setRecords(admin ? await listAttendance() : []);
      } catch (error) {
        showToast('Koneksi Supabase Bermasalah', error instanceof Error ? error.message : 'Tidak dapat memuat data.', 'error');
      }
    };

    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void refresh(); });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Form submit: Kirim Presensi
  const handleSubmitPresensi = async () => {
    try {
      const newRecord = await submitAttendance({ name: name.trim(), institution: instansi.trim(), email: email.trim() });
      setSerial(newRecord.serial);
      setParticipantCount((count) => count + 1);
      if (isAdmin) setRecords((current) => [newRecord, ...current]);
      showToast('Presensi KPU Terverifikasi', `${newRecord.name} berhasil terdaftar dengan nomor ${newRecord.serial}.`);
    } catch (error) {
      showToast('Presensi Gagal Disimpan', error instanceof Error ? error.message : 'Supabase menolak data presensi.', 'error');
    }
  };

  // Reset form
  const handleResetForm = () => {
    setName('Dr. Budi Santoso, M.Kom.');
    setEmail('budi.santoso@univ-tech.ac.id');
    setInstansi('Universitas Indonesia');
    setSerial(formatCertSerial(participantCount + 1));
    showToast('Form Direset', 'Data input telah dikembalikan ke nomor urut berikutnya.');
  };

  // Select a record from table to load onto canvas & form
  const handleSelectRecord = (record: AttendanceRecord) => {
    setName(record.name);
    setEmail(record.email);
    setInstansi(record.instansi);
    setSerial(record.serial);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(
      'Memuat Data Peserta',
      `Sertifikat atas nama ${record.name} kini ditampilkan di Live Preview.`
    );
  };

  // Execute Export CSV
  const executeExportCSV = (data: AttendanceRecord[] = records) => {
    if (data.length === 0) {
      showToast(
        'Data Kosong',
        'Tidak ada riwayat log presensi untuk diekspor ke format CSV.',
        'info'
      );
      return;
    }
    const headers = [
      'Waktu Masuk',
      'Nama Peserta',
      'Instansi',
      'Email',
      'No Seri Sertifikat',
      'Status',
    ];
    const rows = data.map((r) => [
      `"${r.timestamp}"`,
      `"${r.name}"`,
      `"${r.instansi}"`,
      `"${r.email}"`,
      `"${r.serial}"`,
      `"${r.status}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Presensi_KPU_Konawe_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.click();
    showToast(
      'Ekspor CSV Selesai',
      'Data presensi berhasil diunduh dalam format spreadsheet CSV.'
    );
  };

  // Protected Export CSV Handler
  const handleRequestExportCSV = () => {
    if (!isAdmin) {
      setPendingAdminAction('export_csv');
      setShowAdminLoginModal(true);
      showToast(
        'Akses Terproteksi',
        'Fitur Ekspor CSV memerlukan autentikasi login Administrator KPU.',
        'warning'
      );
    } else {
      executeExportCSV();
    }
  };

  // Admin Login Handlers
  const handleAdminLoginSuccess = async (adminEmail: string, password: string) => {
    await signInAdmin(adminEmail, password);
    const adminRecords = await listAttendance();
    setRecords(adminRecords);
    setIsAdmin(true);
    setShowAdminLoginModal(false);

    if (pendingAdminAction === 'export_csv') {
      setPendingAdminAction(null);
      showToast(
        'Login Admin Berhasil',
        'Autentikasi Administrator KPU terverifikasi. Mengunduh data CSV...',
        'success'
      );
      executeExportCSV(adminRecords);
    } else if (pendingAdminAction === 'reset') {
      setPendingAdminAction(null);
      showToast(
        'Login Admin Berhasil',
        'Hak akses Administrator KPU telah diverifikasi. Silakan konfirmasi reset.',
        'success'
      );
      setShowConfirmResetModal(true);
    } else if (pendingAdminAction === 'upload_template') {
      setPendingAdminAction(null);
      showToast(
        'Login Admin Berhasil',
        'Hak akses Administrator KPU terverifikasi. Membuka dialog unggah template baru...',
        'success'
      );
      setTimeout(() => {
        certCanvasRef.current?.triggerUpload();
      }, 150);
    } else if (pendingAdminAction === 'reset_template') {
      setPendingAdminAction(null);
      showToast(
        'Login Admin Berhasil',
        'Hak akses Administrator KPU terverifikasi. Mengembalikan template e-sertifikat ke versi resmi default...',
        'success'
      );
      certCanvasRef.current?.resetTemplate();
    } else {
      setPendingAdminAction(null);
      showToast(
        'Login Admin Berhasil',
        'Hak akses Administrator KPU telah aktif.',
        'success'
      );
    }
  };

  const handleAdminLogout = async () => {
    await signOutAdmin();
    setIsAdmin(false);
    setRecords([]);
    setPendingAdminAction(null);
    showToast(
      'Sesi Admin Berakhir',
      'Anda telah keluar dari sesi Administrator KPU. Fitur ekspor CSV, reset data, dan konfigurasi server terkunci kembali.',
      'info'
    );
  };

  // Protected Action Trigger for CertificateCanvas
  const handleOpenAdminLoginForAction = (action?: 'upload_template' | 'reset_template') => {
    if (action) {
      setPendingAdminAction(action);
    }
    setShowAdminLoginModal(true);
  };

  // Protected Clear Records Trigger
  const handleRequestClearRecords = () => {
    if (!isAdmin) {
      setPendingAdminAction('reset');
      setShowAdminLoginModal(true);
      showToast(
        'Akses Terproteksi',
        'Fitur Reset memerlukan autentikasi Administrator KPU.',
        'warning'
      );
    } else {
      setShowConfirmResetModal(true);
    }
  };

  const handleConfirmClearRecords = async () => {
    try {
      await clearAttendance();
      setRecords([]);
      setParticipantCount(0);
      setSerial(formatCertSerial(1));
      setShowConfirmResetModal(false);
      showToast('Data Presensi Dikosongkan', 'Seluruh riwayat presensi di Supabase telah dihapus oleh Administrator KPU.', 'info');
    } catch (error) {
      showToast('Reset Data Gagal', error instanceof Error ? error.message : 'Supabase menolak penghapusan data.', 'error');
    }
  };

  // Navigation tab handler
  const handleSelectTab = (tab: ActiveNavTab) => {
    setActiveTab(tab);
    if (tab === 'presensi-dan-unduh-sertifikat') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'riwayat-kehadiran') {
      setBottomTab('records');
      const el = document.getElementById('bottom-tab-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'informasi-kegiatan') {
      setBottomTab('guide');
      const el = document.getElementById('bottom-tab-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f9] text-[#201112] relative">
      {/* Watermark Logo KPU RI dengan transparency 60% */}
      <div
        id="kpu-watermark-bg"
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <img
          src="/kpu_logo.svg"
          alt="Watermark Logo KPU RI"
          className="w-[480px] sm:w-[640px] lg:w-[820px] max-w-[85vw] max-h-[85vh] object-contain select-none pointer-events-none filter drop-shadow-sm"
          style={{ opacity: 0.6 }}
        />
      </div>

      {/* Fixed Header */}
      <Header
        activeTab={activeTab}
        isAdmin={isAdmin}
        onSelectTab={handleSelectTab}
        onOpenAdminLogin={() => {
          setPendingAdminAction(null);
          setShowAdminLoginModal(true);
        }}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Fixed Sidebar for desktop */}
      <Sidebar
        activeTab={activeTab}
        isAdmin={isAdmin}
        onSelectTab={handleSelectTab}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 relative z-10">
        <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16 w-full max-w-[1600px] mx-auto">
          {!isSupabaseConfigured && (
            <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
              <p className="font-bold">Supabase belum terhubung</p>
              <p className="mt-1 text-xs">Tambahkan Project URL dan publishable key ke file <code>.env.local</code> untuk mengaktifkan presensi, login admin, Storage, dan pengiriman email.</p>
            </div>
          )}
          {/* Hero Banner */}
          <HeroBanner attendeeCount={participantCount} />

          {/* 2-Column Split Workspace */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Column (5 cols): Registration Form + Info Card */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              <AttendanceForm
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                instansi={instansi}
                setInstansi={setInstansi}
                serial={serial}
                setSerial={setSerial}
                date={date}
                onSubmit={handleSubmitPresensi}
                onReset={handleResetForm}
              />

              <EventInfoCard />
            </div>

            {/* Right Column (7 cols): Live Certificate Canvas + Quick Metrics */}
            <div className="xl:col-span-7 flex flex-col gap-6 sticky top-24">
              <CertificateCanvas
                ref={certCanvasRef}
                name={name}
                serial={serial}
                isAdmin={isAdmin}
                onShowToast={showToast}
                onOpenAdminLogin={handleOpenAdminLoginForAction}
              />
            </div>
          </div>

          {/* Bottom Tabs Section: Roster Table & Activity Guide */}
          <div id="bottom-tab-section" className="mt-12 flex flex-col gap-4">
            {/* Tab switcher buttons */}
            <div className="flex items-center gap-2">
              <button
                id="tabBtnRecords"
                type="button"
                onClick={() => setBottomTab('records')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  bottomTab === 'records'
                    ? 'bg-[#5a0f18] text-white shadow-sm'
                    : 'bg-white text-[#534344] hover:text-[#201112] border border-[#f0e6e7]'
                }`}
              >
                Roster Data Presensi &amp; Rekap ({records.length})
              </button>

              <button
                id="tabBtnDocs"
                type="button"
                onClick={() => setBottomTab('guide')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  bottomTab === 'guide'
                    ? 'bg-[#5a0f18] text-white shadow-sm'
                    : 'bg-white text-[#534344] hover:text-[#201112] border border-[#f0e6e7]'
                }`}
              >
                Panduan &amp; Informasi Kegiatan
              </button>
            </div>

            {/* Tab Panes */}
            {bottomTab === 'records' ? (
              <RosterTable
                records={isAdmin ? records : []}
                isAdmin={isAdmin}
                onSelectRecord={handleSelectRecord}
                onExportCSV={handleRequestExportCSV}
                onClearRecords={handleRequestClearRecords}
                onOpenAdminLogin={() => {
                  setPendingAdminAction(null);
                  setShowAdminLoginModal(true);
                }}
                onLogoutAdmin={handleAdminLogout}
              />
            ) : (
              <ActivityGuide />
            )}
          </div>
        </main>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSubmit={handleAdminLoginSuccess}
      />

      {/* Confirm Reset Modal */}
      <ConfirmResetModal
        isOpen={showConfirmResetModal}
        recordCount={records.length}
        onClose={() => setShowConfirmResetModal(false)}
        onConfirm={handleConfirmClearRecords}
      />

      {/* Floating Toast Notification */}
      <Toast toast={toast} />
    </div>
  );
}
