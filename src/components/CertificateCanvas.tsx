import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { jsPDF } from 'jspdf';
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
  isAdmin?: boolean;
  onShowToast: (title: string, msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onOpenAdminLogin?: (action?: 'upload_template' | 'reset_template') => void;
}

export const CertificateCanvas = React.forwardRef<CertificateCanvasHandle, CertificateCanvasProps>(({
  name,
  serial,
  isAdmin = false,
  onShowToast,
  onOpenAdminLogin,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [isCustomTemplate, setIsCustomTemplate] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Official high-res template image URL
  const DEFAULT_TEMPLATE_URL = '/certificate_template.jpg';
  const FALLBACK_REMOTE_URL =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBvE0XwcU4OB1A7X1BnVMlyLYql-X4H3agBMzJJBrSltP42E4tjE22f7SL1dqaYzItVLZzOx5mSnYwXI6aePKFtKqTV7XYma-4MIBHS22-xhd8uWV191mNIJqHQFYkAfN7j-pvDvig3z8tcDAs7FQ7DcWJfxLHq8KA_EOUNoeCOoCqLajgQNnOtddxVWiNxv5Psxq_8EJC5E37dKFGw_YlI7Umkp7VfSGFfrtgr8DcrFhxFbvDhikdvIpSi0ES76F-_vA';

  // Load template image (saved custom template or default HD asset)
  const loadTemplateFromSource = useCallback((src: string, isCustom = false, fileName = '') => {
    setTemplateLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      imageRef.current = img;
      setTemplateLoaded(true);
      setIsCustomTemplate(isCustom);
      if (isCustom && fileName) {
        setCustomTemplateName(fileName);
      }
    };
    img.onerror = () => {
      // Fallback to default
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.src = FALLBACK_REMOTE_URL;
      fallbackImg.onload = () => {
        imageRef.current = fallbackImg;
        setTemplateLoaded(true);
        setIsCustomTemplate(false);
      };
      fallbackImg.onerror = () => {
        setTemplateLoaded(true);
      };
    };
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
    void downloadCertificateTemplate().then((template) => {
      if (template) loadTemplateFromSource(template.url, true, template.name);
      else loadTemplateFromSource(DEFAULT_TEMPLATE_URL, false);
    });
  }, [loadTemplateFromSource]);

  // Master rendering engine: renders certificate onto any canvas at any target resolution
  const renderCertificateToCanvas = useCallback(
    (targetCanvas: HTMLCanvasElement, customWidth?: number, customHeight?: number) => {
      const ctx = targetCanvas.getContext('2d');
      if (!ctx) return;

      const img = imageRef.current;
      const naturalW = img?.naturalWidth || 1448;
      const naturalH = img?.naturalHeight || 1086;

      const w = customWidth || naturalW;
      const h = customHeight || naturalH;

      if (targetCanvas.width !== w || targetCanvas.height !== h) {
        targetCanvas.width = w;
        targetCanvas.height = h;
      }

      const scaleX = w / 1448;
      const scaleY = h / 1086;

      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        // Fallback official background
        ctx.fillStyle = '#fdfbfb';
        ctx.fillRect(0, 0, w, h);

        // Certificate decorative borders
        ctx.strokeStyle = '#5a0f18';
        ctx.lineWidth = Math.round(12 * scaleY);
        ctx.strokeRect(36 * scaleX, 36 * scaleY, w - 72 * scaleX, h - 72 * scaleY);

        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = Math.round(3 * scaleY);
        ctx.strokeRect(48 * scaleX, 48 * scaleY, w - 96 * scaleX, h - 96 * scaleY);

        // Header fallback text
        ctx.fillStyle = '#5a0f18';
        ctx.font = `bold ${Math.round(34 * scaleY)}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('KOMISI PEMILIHAN UMUM KABUPATEN KONAWE', w / 2, Math.round(170 * scaleY));

        ctx.font = `bold ${Math.round(64 * scaleY)}px "Playfair Display", serif`;
        ctx.fillText('SERTIFIKAT', w / 2, Math.round(310 * scaleY));

        ctx.font = `500 ${Math.round(20 * scaleY)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#534344';
        ctx.fillText('Diberikan kepada:', w / 2, Math.round(460 * scaleY));
      }

      // Precise typography overlay matching official Indonesian certificate layout
      const recipientName = name.trim() || 'Nama Lengkap Peserta, Gelar';
      const recipientSerial = serial.trim();

      ctx.save();
      ctx.textAlign = 'center';

      // 1. Dynamic Font Scaling for Recipient's Name
      let fontSize = Math.round(38 * scaleY);
      if (recipientName.length > 38) {
        fontSize = Math.round(28 * scaleY);
      } else if (recipientName.length > 28) {
        fontSize = Math.round(32 * scaleY);
      }

      // Official Deep Maroon/Burgundy matching the certificate identity
      ctx.font = `bold ${fontSize}px "Playfair Display", Georgia, serif`;
      ctx.fillStyle = '#520b12';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = Math.round(4 * scaleY);
      ctx.shadowOffsetY = Math.round(2 * scaleY);

      // Draw Recipient Name positioned directly above the gold line below "Diberikan Kepada"
      // The gold line is at y = 554 (scaled). Placing baseline at y = 538 provides precise optical alignment
      ctx.fillText(recipientName, w / 2, Math.round(538 * scaleY));
      ctx.restore();

      // 2. Serial Number Overlay - Dituliskan tepat setelah tulisan "Nomor :" yang berada di bawah tulisan "Sertifikat"
      // Sesuai instruksi: letakkan nomor registrasi sertifikat "xxx/HM.07/7402/2/2026" tepat setelah tulisan "Nomor :",
      // dan tidak perlu melakukan pengulangan menulis "Nomor :" di depannya
      if (recipientSerial) {
        ctx.save();
        let cleanSerial = recipientSerial.trim();
        // Bersihkan prefix jika pengguna atau form memasukkan "Nomor :" atau "No. :" secara manual
        if (/^(no\.?\s*reg\.?:?|nomor\s*:?|no\.?:?)\s*/i.test(cleanSerial)) {
          cleanSerial = cleanSerial.replace(/^(no\.?\s*reg\.?:?|nomor\s*:?|no\.?:?)\s*/i, '').trim();
        }

        ctx.font = `600 ${Math.round(18 * scaleY)}px "Plus Jakarta Sans", monospace, sans-serif`;
        ctx.fillStyle = '#1c1112';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Koordinat mengikuti template resmi panitia (rasio 4:3, basis 1448 x 1086).
        // Label "Nomor :" sudah tercetak, jadi hanya nomor registrasi yang ditambahkan.
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1c1112';
        ctx.fillText(cleanSerial, Math.round(663 * scaleX), Math.round(398 * scaleY));

        ctx.restore();
      }
    },
    [name, serial]
  );

  // Live on-screen preview rendering
  const drawCertificate = useCallback(() => {
    if (canvasRef.current) {
      renderCertificateToCanvas(canvasRef.current);
    }
  }, [renderCertificateToCanvas]);

  // Re-draw whenever inputs or template change
  useEffect(() => {
    drawCertificate();
  }, [name, serial, templateLoaded, drawCertificate]);

  // Handle Ultra-HD JPG Download (rendered at 2x master resolution)
  const handleDownloadJPG = () => {
    try {
      const img = imageRef.current;
      const naturalW = img?.naturalWidth || 1448;
      const naturalH = img?.naturalHeight || 1086;

      const exportW = Math.max(Math.round(naturalW * 2), 2896);
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
    if (isExportingPDF) return;
    setIsExportingPDF(true);

    onShowToast(
      'Merender PDF Ultra HD (300 DPI)...',
      'Sedang menyusun sertifikat vektor beresolusi tinggi untuk dicetak.',
      'info'
    );

    try {
      // Allow browser to flush toast state before CPU-intensive render
      await new Promise((resolve) => setTimeout(resolve, 40));

      const img = imageRef.current;
      const naturalW = img?.naturalWidth || 1448;
      const naturalH = img?.naturalHeight || 1086;

      // Render at print-ready resolution while preserving the original 4:3 artwork.
      const exportW = Math.max(Math.round(naturalW * 1.6), 3508);
      const exportH = Math.round(exportW * (naturalH / naturalW));

      // Offscreen ultra-high definition canvas
      const exportCanvas = document.createElement('canvas');
      renderCertificateToCanvas(exportCanvas, exportW, exportH);

      // Generate pristine quality image stream (JPEG 0.98 for fast, artifact-free high-density rendering)
      const imgData = exportCanvas.toDataURL('image/jpeg', 0.98);

      // Use a 4:3 PDF page so the supplied certificate fills the page without
      // cropping, distortion, or white margins.
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 222.75],
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
        keywords: 'sertifikat, kpu, konawe, bimtek, pemilu',
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
              Live Preview E-Sertifikat KPU
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
                <span>Template Resmi KPU Konawe HD</span>
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

            <span
              id="signature-officer-badge"
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#5a0f18]/10 text-[#5a0f18]"
            >
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>Tanda Tangan Ketua: Wike</span>
            </span>
          </div>
        </div>

        {/* The Viewport Stage */}
        <div
          id="certificate-canvas-stage"
          className="relative w-full rounded-xl bg-[#f6f1f1] overflow-hidden shadow-inner flex items-center justify-center p-2 border border-[#d5cbcd]/40"
        >
          <canvas
            ref={canvasRef}
            id="certCanvas"
            width={1448}
            height={1086}
            className="w-full h-auto max-w-full rounded shadow-xl transition-all duration-150"
          />
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btnDownloadPDF"
              type="button"
              disabled={isExportingPDF}
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5a0f18] hover:bg-[#3d080e] text-white text-xs font-semibold shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] text-[#ffdcc3] ${isExportingPDF ? 'animate-spin' : ''}`}>
                {isExportingPDF ? 'sync' : 'picture_as_pdf'}
              </span>
              <span>{isExportingPDF ? 'Memproses PDF HD...' : 'Unduh Sertifikat (PDF Ultra HD)'}</span>
            </button>

            <button
              id="btnDownloadJPG"
              type="button"
              onClick={handleDownloadJPG}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f6f1f1] hover:bg-[#ede4e4] text-[#201112] text-xs font-semibold transition-all border border-[#d5cbcd]/50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#5a0f18]">
                image
              </span>
              <span>Unduh Gambar (JPG HD)</span>
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

      {/* Quick Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          id="metric-export-res"
          className="p-3 bg-white rounded-xl shadow-xs flex items-center gap-3 border border-[#5a0f18]/10"
        >
          <div className="w-9 h-9 rounded-lg bg-[#f6f1f1] flex items-center justify-center text-[#5a0f18]">
            <span className="material-symbols-outlined text-[20px]">high_density</span>
          </div>
          <div>
            <span className="text-[10px] text-[#75777d] uppercase tracking-wider block font-mono">
              Resolusi Export PDF
            </span>
            <span className="text-xs font-bold text-[#5a0f18]">Ultra HD 300 DPI (3508px)</span>
          </div>
        </div>

        <div
          id="metric-institution"
          className="p-3 bg-white rounded-xl shadow-xs flex items-center gap-3 border border-[#5a0f18]/10"
        >
          <div className="w-9 h-9 rounded-lg bg-[#f6f1f1] flex items-center justify-center text-[#5a0f18]">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
          <div>
            <span className="text-[10px] text-[#75777d] uppercase tracking-wider block font-mono">
              Lembaga
            </span>
            <span className="text-xs font-bold text-[#5a0f18]">KPU Kab. Konawe</span>
          </div>
        </div>

        <div
          id="metric-duration"
          className="p-3 bg-white rounded-xl shadow-xs flex items-center gap-3 border border-[#5a0f18]/10"
        >
          <div className="w-9 h-9 rounded-lg bg-[#f6f1f1] flex items-center justify-center text-[#5a0f18]">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
          <div>
            <span className="text-[10px] text-[#75777d] uppercase tracking-wider block font-mono">
              Beban Kegiatan
            </span>
            <span className="text-xs font-bold text-[#5a0f18]">2 Jam Pelajaran</span>
          </div>
        </div>
      </div>

    </div>
  );
});

CertificateCanvas.displayName = 'CertificateCanvas';
