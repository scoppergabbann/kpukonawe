import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  downloadCertificateTemplate,
  resetCertificateTemplate,
  uploadCertificateTemplate,
} from '../lib/supabase-api';

export interface CertificateCanvasHandle {
  triggerUpload: () => void;
  resetTemplate: () => void;
}

interface CertificateCanvasProps {
  name: string;
  serial: string;
  verificationId?: string;
  canDownload?: boolean;
  isAdmin?: boolean;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onOpenAdminLogin?: (action?: 'upload_template' | 'reset_template') => void;
}

export const CertificateCanvas = React.forwardRef<CertificateCanvasHandle, CertificateCanvasProps>(({
  name,
  serial,
  verificationId,
  canDownload = false,
  isAdmin = false,
  onShowToast,
  onOpenAdminLogin,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [isCustomTemplate, setIsCustomTemplate] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isQrReady, setIsQrReady] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const qrImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const DEFAULT_TEMPLATE_URL = '/certificate-diskusi-kepemiluan-2026-10-28.jpg';

  const loadTemplateFromSource = useCallback((src: string, isCustom = false, fileName = '') => {
    setTemplateLoaded(false);
    imageRef.current = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setIsCustomTemplate(isCustom);
      setCustomTemplateName(isCustom ? fileName : '');
      setTemplateLoaded(true);
    };
    img.onerror = () => {
      if (src !== DEFAULT_TEMPLATE_URL) {
        loadTemplateFromSource(DEFAULT_TEMPLATE_URL);
      } else {
        console.error('Template sertifikat resmi tidak dapat dimuat.');
      }
    };
    img.src = src;
  }, []);

  // Upload custom template (PDF or Image)
  const handleTemplateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so user can pick same file again if desired
    e.target.value = '';

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      onShowToast(
        'Format File Tidak Didukung',
        'Silakan unggah file template dalam format PDF atau Gambar (JPG/PNG).',
        'error'
      );
      return;
    }

    onShowToast(
      'Memproses File Template...',
      `Sedang memproses "${file.name}" menjadi template sertifikat...`,
      'info'
    );

    if (isImage) {
      try {
        await uploadCertificateTemplate(file);
        loadTemplateFromSource(URL.createObjectURL(file), true, file.name);
        onShowToast('Template Berhasil Diperbarui', `Template "${file.name}" tersimpan di Supabase Storage.`, 'success');
      } catch (error) {
        onShowToast('Gagal Mengunggah Template', error instanceof Error ? error.message : 'Supabase Storage menolak unggahan.', 'error');
      }
    } else if (isPdf) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        // Render page 1 at high resolution (300 DPI equivalent: scale 2.5)
        const viewport = page.getViewport({ scale: 2.5 });
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        if (offscreenCtx) {
          await page.render({ canvas: offscreenCanvas, canvasContext: offscreenCtx, viewport }).promise;
          const blob = await new Promise<Blob>((resolve, reject) => {
            offscreenCanvas.toBlob((result) => result ? resolve(result) : reject(new Error('Konversi PDF gagal.')), 'image/jpeg', 0.95);
          });
          await uploadCertificateTemplate(blob);
          loadTemplateFromSource(URL.createObjectURL(blob), true, file.name);
          onShowToast(
            'Template PDF Berhasil Dimuat',
            `Halaman 1 dari "${file.name}" berhasil diterapkan sebagai template sertifikat.`,
            'success'
          );
        }
      } catch (pdfErr) {
        console.error('PDF render error:', pdfErr);
        onShowToast(
          'Gagal Membaca PDF',
          'Tidak dapat memproses file PDF. Anda juga dapat mengonversi PDF ke JPG/PNG lalu mengunggahnya.',
          'error'
        );
      }
    }
  };

  const handleResetToDefaultTemplate = async () => {
    try {
      await resetCertificateTemplate();
      loadTemplateFromSource(DEFAULT_TEMPLATE_URL, false);
      onShowToast('Template Resmi Default Aktif', 'Template Supabase dihapus dan versi bawaan kembali digunakan.', 'info');
    } catch (error) {
      onShowToast('Gagal Mereset Template', error instanceof Error ? error.message : 'Supabase Storage menolak perubahan.', 'error');
    }
  };

  // Expose imperative handle to parent component (e.g. for triggering after admin login)
  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      fileInputRef.current?.click();
    },
    resetTemplate: () => { void handleResetToDefaultTemplate(); },
  }));

  // Protected trigger for uploading new template (requires admin)
  const handleTriggerUpload = () => {
    if (!isAdmin) {
      onShowToast(
        'Akses Terproteksi Admin',
        'Fitur unggah template baru memerlukan autentikasi login Administrator resmi KPU Kabupaten Konawe.',
        'warning'
      );
      if (onOpenAdminLogin) {
        onOpenAdminLogin('upload_template');
      }
      return;
    }
    fileInputRef.current?.click();
  };

  // Protected trigger for resetting template (requires admin)
  const handleTriggerResetTemplate = () => {
    if (!isAdmin) {
      onShowToast(
        'Akses Terproteksi Admin',
        'Fitur reset template ke bawaan resmi memerlukan hak akses Administrator KPU.',
        'warning'
      );
      if (onOpenAdminLogin) {
        onOpenAdminLogin('reset_template');
      }
      return;
    }
    void handleResetToDefaultTemplate();
  };

  useEffect(() => {
    let active = true;
    loadTemplateFromSource(DEFAULT_TEMPLATE_URL);
    void downloadCertificateTemplate().then((template) => {
      if (active && template) loadTemplateFromSource(template.url, true, template.name);
    }).catch(() => {
      // The bundled official template stays available if Storage cannot be reached.
    });
    return () => { active = false; };
  }, [loadTemplateFromSource]);

  // All overlays use the 1152 x 768 coordinate space of the supplied PDF.
  const renderCertificateToCanvas = useCallback(
    (targetCanvas: HTMLCanvasElement, customWidth?: number, customHeight?: number) => {
      const ctx = targetCanvas.getContext('2d');
      const img = imageRef.current;
      if (!ctx || !img?.complete || !img.naturalWidth) return;
      const w = customWidth || img.naturalWidth;
      const h = customHeight || img.naturalHeight;
      targetCanvas.width = w;
      targetCanvas.height = h;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.save();
      ctx.scale(w / 1152, h / 768);

      const recipientName = name.trim() || 'Nama Lengkap Peserta, Gelar';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#520b12';
      // Fit the measured name between the ends of the gold rule, including long titles.
      let fontSize = 30;
      ctx.font = `bold ${fontSize}px Georgia, serif`;
      while (ctx.measureText(recipientName).width > 490 && fontSize > 10) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px Georgia, serif`;
      }
      ctx.fillText(recipientName, 576, 377, 490);

      const cleanSerial = serial.trim().replace(/^(no\.?\s*reg\.?:?|nomor\s*:?|no\.?:?)\s*/i, '').trim();
      if (cleanSerial) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1c1112';
        ctx.font = '500 18px Arial, sans-serif';
        // The label "Nomor :" is part of the artwork; add only its value.
        ctx.fillText(cleanSerial, 498, 286, 290);
      }

      const qrImage = qrImageRef.current;
      if (qrImage && cleanSerial) {
        // Clear area to the right of the signature, above the decorative lower edge.
        const qrX = 805;
        const qrY = 592;
        const qrSize = 76;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 24);
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = '#520b12';
        ctx.font = 'bold 8px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VERIFIKASI', qrX + qrSize / 2, qrY + qrSize + 13);
      }
      ctx.restore();
    },
    [name, serial]
  );

  // Live on-screen preview rendering
  const drawCertificate = useCallback(() => {
    if (canvasRef.current) {
      renderCertificateToCanvas(canvasRef.current);
    }
  }, [renderCertificateToCanvas]);

  useEffect(() => {
    if (!verificationId || !serial) {
      qrImageRef.current = null;
      setIsQrReady(false);
      drawCertificate();
      return;
    }
    setIsQrReady(false);
    const verificationUrl = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(verificationId)}&serial=${encodeURIComponent(serial)}`;
    void QRCode.toDataURL(verificationUrl, { width: 360, margin: 1, errorCorrectionLevel: 'M' }).then((dataUrl) => {
      const qrImage = new Image();
      qrImage.onload = () => {
        qrImageRef.current = qrImage;
        setIsQrReady(true);
        drawCertificate();
      };
      qrImage.src = dataUrl;
    });
  }, [drawCertificate, verificationId, serial]);

  // Re-draw whenever inputs or template change
  useEffect(() => {
    drawCertificate();
  }, [name, serial, templateLoaded, drawCertificate]);

  // Handle Ultra-HD JPG Download (rendered at 2x master resolution)
  const handleDownloadJPG = () => {
    if (!canDownload || !isQrReady || !templateLoaded) {
      onShowToast('Sertifikat Belum Tersedia', 'Selesaikan presensi terlebih dahulu agar unduhan JPG dapat dibuka.', 'warning');
      return;
    }

    try {
      const img = imageRef.current;
      const naturalW = img?.naturalWidth || 1152;
      const naturalH = img?.naturalHeight || 768;

      const exportW = Math.max(naturalW, 3508);
      const exportH = Math.round(exportW * (naturalH / naturalW));

      const exportCanvas = document.createElement('canvas');
      renderCertificateToCanvas(exportCanvas, exportW, exportH);

      const link = document.createElement('a');
      const safeName = (name || 'Peserta').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Sertifikat_KPU_Konawe_${safeName}.jpg`;
      link.href = exportCanvas.toDataURL('image/jpeg', 0.98);
      link.click();
      onShowToast(
        'Unduhan Gambar HD Siap',
        `File gambar sertifikat KPU ultra-HD (${exportW}x${exportH}px) untuk ${name || 'peserta'} berhasil diunduh.`,
        'success'
      );
    } catch {
      onShowToast('Gagal Mengunduh Gambar', 'Terjadi kendala saat mengekspor gambar.', 'error');
    }
  };

  // Handle True 300 DPI Ultra-HD PDF Generation & Direct Download
  const handleDownloadPDF = async () => {
    if (isExportingPDF || !canDownload || !isQrReady || !templateLoaded) {
      if (!canDownload || !isQrReady || !templateLoaded) {
        onShowToast('Sertifikat Belum Tersedia', 'Selesaikan presensi terlebih dahulu agar unduhan PDF dapat dibuka.', 'warning');
      }
      return;
    }
    setIsExportingPDF(true);

    onShowToast(
      'Merender PDF Ultra HD (300 DPI)...',
      'Sedang menyusun sertifikat beresolusi tinggi untuk dicetak.',
      'info'
    );

    try {
      // Allow browser to flush toast state before CPU-intensive render
      await new Promise((resolve) => setTimeout(resolve, 40));

      const img = imageRef.current;
      const naturalW = img?.naturalWidth || 1152;
      const naturalH = img?.naturalHeight || 768;

      // Render at print-ready resolution while preserving the original artwork.
      const exportW = Math.max(naturalW, 3508);
      const exportH = Math.round(exportW * (naturalH / naturalW));

      // Offscreen ultra-high definition canvas
      const exportCanvas = document.createElement('canvas');
      renderCertificateToCanvas(exportCanvas, exportW, exportH);

      // Generate pristine quality image stream (JPEG 0.98 for fast, artifact-free high-density rendering)
      const imgData = exportCanvas.toDataURL('image/jpeg', 0.98);

      // Preserve the loaded artwork ratio (3:2 for the latest official PDF).
      const doc = new jsPDF({
        orientation: naturalW >= naturalH ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [297, 297 * naturalH / naturalW],
        compress: true,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Embed high-resolution certificate into PDF
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

      // Set official metadata
      doc.setProperties({
        title: `Sertifikat KPU Konawe - ${name || 'Peserta'}`,
        subject: 'Sertifikat Resmi Komisi Pemilihan Umum Kabupaten Konawe',
        author: 'KPU Kabupaten Konawe',
        keywords: 'sertifikat, kpu, konawe, diskusi kepemiluan, komunikasi politik',
        creator: 'Sistem Cetak E-Sertifikat KPU Konawe',
      });

      const safeName = (name || 'Peserta').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Sertifikat_KPU_Konawe_${safeName}.pdf`);

      onShowToast(
        'Sertifikat PDF HD Siap',
        `File PDF Ultra-HD (${exportW}x${exportH}px ~300 DPI) telah langsung diunduh ke perangkat Anda.`,
        'success'
      );
    } catch (err) {
      console.error('PDF export error:', err);
      onShowToast('Gagal Mengunduh PDF', 'Terjadi kesalahan saat memproses file PDF HD.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas Card */}
      <div
        id="certificate-preview-card"
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-[#5a0f18]/10"
      >
        {/* Card Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-[#f0e6e7]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5a0f18]" />
            <h3 className="text-sm sm:text-base font-bold text-[#5a0f18]">
              E-Sertifikat Berhasil Diterbitkan
            </h3>
            {isCustomTemplate ? (
              <span
                id="custom-template-badge"
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
              >
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>Template PDF KPU HD ({customTemplateName || 'Aktif'})</span>
              </span>
            ) : (
              <span
                id="template-resolution-badge"
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#f6f1f1] text-[#534344] font-semibold font-mono"
              >
                <span className="material-symbols-outlined text-[14px] text-[#5a0f18]">verified</span>
                <span>Diskusi Kepemiluan · 28 Oktober 2026</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleTemplateFileUpload}
            />

            <button
              id="btnUploadTemplate"
              type="button"
              onClick={handleTriggerUpload}
              title={
                isAdmin
                  ? 'Unggah template sertifikat baru (PDF atau Gambar JPG/PNG)'
                  : 'Akses Terproteksi Admin: Unggah template sertifikat baru'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer shadow-2xs ${
                isAdmin
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-[#f6f1f1] hover:bg-[#ede4e4] text-[#5a0f18] border-[#d5cbcd]/60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Unggah Template Baru</span>
              {!isAdmin ? (
                <span
                  className="material-symbols-outlined text-[13px] text-amber-700 ml-0.5"
                  title="Memerlukan Login Administrator KPU"
                >
                  lock
                </span>
              ) : (
                <span
                  className="material-symbols-outlined text-[13px] text-emerald-700 ml-0.5"
                  title="Akses Administrator Terverifikasi"
                >
                  verified
                </span>
              )}
            </button>

            {isCustomTemplate && (
              <button
                id="btnResetTemplate"
                type="button"
                onClick={handleTriggerResetTemplate}
                title={
                  isAdmin
                    ? 'Kembalikan ke template resmi KPU bawaan'
                    : 'Akses Terproteksi Admin: Kembalikan ke template resmi bawaan'
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f6f1f1] hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-all border border-rose-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span>Reset Default</span>
                {!isAdmin && (
                  <span className="material-symbols-outlined text-[12px] text-amber-700">lock</span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-700">task_alt</span>
            <div>
              <p className="text-sm font-bold text-emerald-950">Sertifikat siap diunduh</p>
              <p className="mt-1 text-xs text-emerald-900">{name} • {serial}</p>
            </div>
          </div>
        </div>

        {/* Canvas dirender tersembunyi hanya untuk menghasilkan PDF/JPG. */}
        <canvas ref={canvasRef} id="certCanvas" width={1152} height={768} className="hidden" />

        {/* Action Buttons Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btnDownloadPDF"
              type="button"
              disabled={isExportingPDF || !canDownload || !isQrReady || !templateLoaded}
              onClick={handleDownloadPDF}
              title={canDownload ? 'Unduh sertifikat dalam format PDF' : 'Kirim presensi terlebih dahulu untuk membuka unduhan'}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5a0f18] hover:bg-[#3d080e] text-white text-xs font-semibold shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[18px] text-[#ffdcc3] ${isExportingPDF ? 'animate-spin' : ''}`}>
                {isExportingPDF ? 'sync' : 'picture_as_pdf'}
              </span>
              <span>{isExportingPDF ? 'Memproses PDF...' : canDownload && (!isQrReady || !templateLoaded) ? 'Menyiapkan sertifikat...' : canDownload ? 'PDF' : 'PDF Terkunci'}</span>
            </button>

            <button
              id="btnDownloadJPG"
              type="button"
              disabled={!canDownload || !isQrReady || !templateLoaded}
              onClick={handleDownloadJPG}
              title={canDownload ? 'Unduh sertifikat dalam format JPG' : 'Kirim presensi terlebih dahulu untuk membuka unduhan'}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f6f1f1] hover:bg-[#ede4e4] text-[#201112] text-xs font-semibold transition-all border border-[#d5cbcd]/50 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px] text-[#5a0f18]">
                image
              </span>
              <span>{canDownload && (!isQrReady || !templateLoaded) ? 'Menyiapkan sertifikat...' : canDownload ? 'JPG' : 'JPG Terkunci'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#75777d]">
            <span className="material-symbols-outlined text-[15px] text-[#5a0f18]">
              verified
            </span>
            <span>Format Resmi KPU Kab. Konawe</span>
          </div>
        </div>
      </div>
    </div>
  );
});

CertificateCanvas.displayName = 'CertificateCanvas';
