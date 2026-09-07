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
import { ParticipantEditorModal } from './components/ParticipantEditorModal';
import { CertificateRecovery } from './components/CertificateRecovery';
import { CertificateVerification } from './components/CertificateVerification';
import { AdminToolsPanel } from './components/AdminToolsPanel';
import { AttendanceConfirmationModal } from './components/AttendanceConfirmationModal';
import {
  AttendanceRecord,
  ActiveNavTab,
  CertificateVerificationResult,
  EventRegistrationStatus,
  ImportParticipantInput,
  PublicAttendanceRecord,
  ToastState,
} from './types';
import {
  clearAttendance,
  deleteAttendanceRecord,
  getAttendanceCount,
  getEventRegistrationStatus,
  importAttendanceRows,
  isCurrentUserAdmin,
  listAttendance,
  listPublicAttendance,
  recoverCertificate,
  signInAdmin,
  signOutAdmin,
  submitAttendance,
  updateAttendanceRecord,
  updateEventRegistrationStatus,
  verifyCertificate,
} from './lib/supabase-api';
import { isSupabaseConfigured, supabase } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>(
    window.location.hash === '#unduh-ulang-sertifikat'
      ? 'unduh-ulang-sertifikat'
      : 'presensi-dan-unduh-sertifikat'
  );
  const [bottomTab, setBottomTab] = useState<'records' | 'guide'>('records');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instansi, setInstansi] = useState('');
  const [serial, setSerial] = useState('');
  const [issuedRecord, setIssuedRecord] = useState<AttendanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttendanceConfirmation, setShowAttendanceConfirmation] = useState(false);
  const submitInFlightRef = useRef(false);
  const date = '8 September 2026';

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [publicRecords, setPublicRecords] = useState<PublicAttendanceRecord[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [eventStatus, setEventStatus] = useState<EventRegistrationStatus>({ isOpen: false, accepting: false, opensAt: null, closesAt: null });
  const [verificationResult, setVerificationResult] = useState<CertificateVerificationResult | null>(null);
  const [hasVerificationRequest, setHasVerificationRequest] = useState(false);
  const [isVerifyingCertificate, setIsVerifyingCertificate] = useState(false);

  // Admin Auth State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false);
  const [managedParticipant, setManagedParticipant] = useState<AttendanceRecord | null>(null);
  const [isManagingParticipant, setIsManagingParticipant] = useState(false);
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
    const syncPageWithUrl = () => {
      setActiveTab((currentTab) => {
        if (window.location.hash === '#unduh-ulang-sertifikat') {
          return 'unduh-ulang-sertifikat';
        }
        return currentTab === 'unduh-ulang-sertifikat'
          ? 'presensi-dan-unduh-sertifikat'
          : currentTab;
      });
    };

    window.addEventListener('hashchange', syncPageWithUrl);
    window.addEventListener('popstate', syncPageWithUrl);
    return () => {
      window.removeEventListener('hashchange', syncPageWithUrl);
      window.removeEventListener('popstate', syncPageWithUrl);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const refresh = async () => {
      try {
        const [count, admin, registrationStatus] = await Promise.all([
          getAttendanceCount(),
          isCurrentUserAdmin(),
          getEventRegistrationStatus(),
        ]);
        setParticipantCount(count);
        setIsAdmin(admin);
        setEventStatus(registrationStatus);
        if (admin) {
          setRecords(await listAttendance());
          setPublicRecords([]);
        } else {
          setRecords([]);
          setPublicRecords(await listPublicAttendance());
        }
      } catch (error) {
        showToast('Koneksi Supabase Bermasalah', error instanceof Error ? error.message : 'Tidak dapat memuat data.', 'error');
      }
    };

    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void refresh(); });
    const statusTimer = window.setInterval(() => {
      void getEventRegistrationStatus().then(setEventStatus).catch(() => undefined);
    }, 30_000);
    return () => {
      listener.subscription.unsubscribe();
      window.clearInterval(statusTimer);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const params = new URLSearchParams(window.location.search);
    const verificationId = params.get('verify');
    const verificationSerial = params.get('serial');
    if (!verificationId || !verificationSerial) return;
    setHasVerificationRequest(true);
    setIsVerifyingCertificate(true);
    void verifyCertificate(verificationId, verificationSerial)
      .then(setVerificationResult)
      .catch(() => setVerificationResult(null))
      .finally(() => setIsVerifyingCertificate(false));
  }, []);

  const handleRequestSubmitPresensi = () => {
    setShowAttendanceConfirmation(true);
  };

  // Form submit: Kirim Presensi setelah data dikonfirmasi.
  const handleSubmitPresensi = async () => {
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const newRecord = await submitAttendance({
        name: name.trim(),
        institution: instansi.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setSerial(newRecord.serial);
      setIssuedRecord(newRecord);
      setShowAttendanceConfirmation(false);
      setParticipantCount((count) => count + 1);
      setPublicRecords((current) => [
        { id: newRecord.id, name: newRecord.name, instansi: newRecord.instansi, serial: newRecord.serial },
        ...current,
      ]);
      if (isAdmin) setRecords((current) => [newRecord, ...current]);
      showToast('Presensi KPU Terverifikasi', `${newRecord.name} berhasil terdaftar dengan nomor ${newRecord.serial}.`);
    } catch (error) {
      showToast('Presensi Gagal Disimpan', error instanceof Error ? error.message : 'Supabase menolak data presensi.', 'error');
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setInstansi('');
    setSerial('');
    setIssuedRecord(null);
    showToast('Form Direset', 'Formulir dikosongkan dan unduhan sertifikat dikunci kembali.', 'info');
  };

  const handleRecoverCertificate = async (recoveryEmail: string) => {
    const recovered = await recoverCertificate(recoveryEmail);
    setName(recovered.name);
    setEmail(recovered.email);
    setPhone(recovered.phone);
    setInstansi(recovered.instansi);
    setSerial(recovered.serial);
    setIssuedRecord(recovered);
    setActiveTab('presensi-dan-unduh-sertifikat');
    window.history.pushState({}, '', `${window.location.pathname}${window.location.search}`);
    showToast('Sertifikat Ditemukan', `Sertifikat ${recovered.name} siap diunduh kembali.`);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    return recovered;
  };

  const handleSaveEventStatus = async (status: EventRegistrationStatus) => {
    try {
      await updateEventRegistrationStatus(status);
      const refreshed = await getEventRegistrationStatus();
      setEventStatus(refreshed);
      showToast('Masa Presensi Diperbarui', refreshed.isOpen ? 'Formulir presensi sekarang dibuka.' : 'Formulir presensi sekarang ditutup.');
    } catch (error) {
      showToast('Pengaturan Gagal Disimpan', error instanceof Error ? error.message : 'Supabase menolak perubahan.', 'error');
    }
  };

  const handleImportParticipants = async (rows: ImportParticipantInput[]) => {
    const result = await importAttendanceRows(rows);
    const [adminRecords, count] = await Promise.all([listAttendance(), getAttendanceCount()]);
    setRecords(adminRecords);
    setParticipantCount(count);
    showToast('Impor Peserta Selesai', `${result.inserted} peserta ditambahkan dan ${result.skipped} baris dilewati.`);
    return result;
  };

  const updateDraft = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value);
    setIssuedRecord(null);
  };

  // Select a record from table to load onto canvas & form
  const handleSelectRecord = (record: AttendanceRecord) => {
    setName(record.name);
    setEmail(record.email);
    setPhone(record.phone);
    setInstansi(record.instansi);
    setSerial(record.serial);
    setIssuedRecord(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(
      'Memuat Data Peserta',
      `Sertifikat atas nama ${record.name} siap diunduh.`
    );
  };

  const handleUpdateParticipant = async (
    id: string,
    input: { name: string; institution: string; email: string; phone: string; status: AttendanceRecord['status'] }
  ) => {
    setIsManagingParticipant(true);
    try {
      const updated = await updateAttendanceRecord(id, input);
      setRecords((current) => current.map((record) => record.id === id ? updated : record));
      setIssuedRecord((current) => current?.id === id ? updated : current);
      setManagedParticipant(null);
      showToast('Data Peserta Diperbarui', `Perubahan untuk ${updated.name} telah disimpan di Supabase.`);
    } catch (error) {
      showToast('Gagal Memperbarui Peserta', error instanceof Error ? error.message : 'Supabase menolak perubahan data.', 'error');
    } finally {
      setIsManagingParticipant(false);
    }
  };

  const handleDeleteParticipant = async (record: AttendanceRecord) => {
    setIsManagingParticipant(true);
    try {
      await deleteAttendanceRecord(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setParticipantCount((count) => Math.max(0, count - 1));
      if (issuedRecord?.id === record.id) {
        setIssuedRecord(null);
        setSerial('');
      }
      setManagedParticipant(null);
      showToast('Peserta Dihapus', `Data ${record.name} telah dihapus dari Supabase.`, 'info');
    } catch (error) {
      showToast('Gagal Menghapus Peserta', error instanceof Error ? error.message : 'Supabase menolak penghapusan data.', 'error');
    } finally {
      setIsManagingParticipant(false);
    }
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
      'Instansi/Organisasi Asal',
      'Email',
      'No. HP',
      'No Seri Sertifikat',
      'Status',
    ];

    const escapeCSVCell = (value: string) =>
      `"${value.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

    const rows = data.map((r) => [
      // Hilangkan koma pemisah tanggal/jam agar Excel tidak menggeser kolom berikutnya.
      escapeCSVCell(r.timestamp.replace(/,\s*/g, ' ')),
      escapeCSVCell(r.name),
      escapeCSVCell(r.instansi),
      escapeCSVCell(r.email),
      escapeCSVCell(r.phone),
      escapeCSVCell(r.serial),
      escapeCSVCell(r.status),
    ]);
    const csvContent = '\uFEFF' +
      [headers.map(escapeCSVCell).join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', objectUrl);
    link.setAttribute(
      'download',
      `Rekap_Presensi_KPU_Konawe_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.click();
    URL.revokeObjectURL(objectUrl);
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
  const handleAdminLoginSuccess = async (adminUsername: string, password: string) => {
    await signInAdmin(adminUsername, password);
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
      'Anda telah keluar dari sesi Administrator KPU. Ekspor dan manajemen data peserta terkunci kembali.',
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
      setSerial('');
      setIssuedRecord(null);
      setShowConfirmResetModal(false);
      showToast('Data Presensi Dikosongkan', 'Seluruh riwayat presensi di Supabase telah dihapus oleh Administrator KPU.', 'info');
    } catch (error) {
      showToast('Reset Data Gagal', error instanceof Error ? error.message : 'Supabase menolak penghapusan data.', 'error');
    }
  };

  // Navigation tab handler
  const handleSelectTab = (tab: ActiveNavTab) => {
    setActiveTab(tab);
    const baseUrl = `${window.location.pathname}${window.location.search}`;
    if (tab === 'unduh-ulang-sertifikat') {
      window.history.pushState({}, '', `${baseUrl}#unduh-ulang-sertifikat`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'presensi-dan-unduh-sertifikat') {
      if (window.location.hash === '#unduh-ulang-sertifikat') {
        window.history.pushState({}, '', baseUrl);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'riwayat-kehadiran') {
      if (window.location.hash === '#unduh-ulang-sertifikat') {
        window.history.pushState({}, '', baseUrl);
      }
      setBottomTab('records');
      const el = document.getElementById('bottom-tab-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'informasi-kegiatan') {
      if (window.location.hash === '#unduh-ulang-sertifikat') {
        window.history.pushState({}, '', baseUrl);
      }
      setBottomTab('guide');
      const el = document.getElementById('bottom-tab-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbf9f9] text-[#201112] relative">
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
      <div className="lg:pl-64 relative z-10">
        <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-16 w-full max-w-[1600px] mx-auto">
          {!isSupabaseConfigured && (
            <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="alert">
              <p className="font-bold">Supabase belum terhubung</p>
              <p className="mt-1 text-xs">Tambahkan Project URL dan publishable key ke file <code>.env.local</code> untuk mengaktifkan presensi, login admin, dan Storage.</p>
            </div>
          )}
          {activeTab === 'unduh-ulang-sertifikat' ? (
            <div className="mx-auto w-full max-w-3xl py-4 sm:py-10">
              <button
                type="button"
                onClick={() => handleSelectTab('presensi-dan-unduh-sertifikat')}
                className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#5a0f18]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#5a0f18] shadow-sm transition-colors hover:bg-[#f6f1f1]"
              >
                <span className="material-symbols-outlined text-[19px]" aria-hidden="true">arrow_back</span>
                Kembali ke Presensi
              </button>
              <CertificateRecovery onRecover={handleRecoverCertificate} />
              <p className="mt-4 text-center text-sm leading-relaxed text-[#534344]">
                Setelah sertifikat ditemukan, Anda akan kembali ke halaman utama untuk mengunduh PDF atau JPG.
              </p>
            </div>
          ) : (
            <>
          {/* Hero Banner */}
          <HeroBanner attendeeCount={participantCount} />

          {/* 2-Column Split Workspace */}
          <div className={`grid grid-cols-1 gap-6 items-start ${issuedRecord ? 'xl:grid-cols-12' : 'mx-auto max-w-3xl'}`}>
            {/* Left Column (5 cols): Registration Form + Info Card */}
            <div className={`${issuedRecord ? 'xl:col-span-5' : ''} flex flex-col gap-6`}>
              <AttendanceForm
                name={name}
                setName={(value) => updateDraft(setName, value)}
                email={email}
                setEmail={(value) => updateDraft(setEmail, value)}
                phone={phone}
                setPhone={(value) => updateDraft(setPhone, value)}
                instansi={instansi}
                setInstansi={(value) => updateDraft(setInstansi, value)}
                serial={serial}
                setSerial={setSerial}
                date={date}
                isSubmitting={isSubmitting}
                registrationOpen={eventStatus.accepting}
                onSubmit={handleRequestSubmitPresensi}
                onReset={handleResetForm}
              />

              <EventInfoCard />
            </div>

            {/* Opsi unduh hanya muncul setelah presensi atau pemulihan berhasil. */}
            {issuedRecord && (
              <div className="xl:col-span-7 flex flex-col gap-6 sticky top-24">
                <CertificateCanvas
                  ref={certCanvasRef}
                  name={issuedRecord.name}
                  serial={issuedRecord.serial}
                  verificationId={issuedRecord.id}
                  canDownload
                  isAdmin={isAdmin}
                  onShowToast={showToast}
                  onOpenAdminLogin={handleOpenAdminLoginForAction}
                />
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="mt-8">
              <AdminToolsPanel
                eventStatus={eventStatus}
                onSaveEvent={handleSaveEventStatus}
                onImport={handleImportParticipants}
              />
            </div>
          )}

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
                Roster Data Presensi &amp; Rekap ({participantCount})
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
                records={records}
                publicRecords={publicRecords}
                isAdmin={isAdmin}
                onSelectRecord={handleSelectRecord}
                onManageRecord={setManagedParticipant}
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
            </>
          )}
        </main>
      </div>

      <AttendanceConfirmationModal
        isOpen={showAttendanceConfirmation}
        name={name.trim()}
        instansi={instansi.trim()}
        email={email.trim()}
        phone={phone.trim()}
        isSubmitting={isSubmitting}
        onClose={() => setShowAttendanceConfirmation(false)}
        onConfirm={handleSubmitPresensi}
      />

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

      <ParticipantEditorModal
        record={managedParticipant}
        isSaving={isManagingParticipant}
        onClose={() => setManagedParticipant(null)}
        onSave={handleUpdateParticipant}
        onDelete={handleDeleteParticipant}
      />

      <CertificateVerification
        isLoading={isVerifyingCertificate}
        result={verificationResult}
        hasVerificationRequest={hasVerificationRequest}
        onClose={() => {
          setHasVerificationRequest(false);
          const cleanUrl = `${window.location.pathname}${window.location.hash}`;
          window.history.replaceState({}, '', cleanUrl);
        }}
      />

      {/* Floating Toast Notification */}
      <Toast toast={toast} />
    </div>
  );
}
