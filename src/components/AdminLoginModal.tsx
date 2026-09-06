import React, { useState } from 'react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string, password: string) => Promise<void>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onSubmit(username.trim().toLowerCase(), password);
      setUsername('');
      setPassword('');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Login administrator gagal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#5a0f18]/20 overflow-hidden">
        <div className="bg-gradient-to-r from-[#5a0f18] to-[#791421] text-white p-6 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20" aria-label="Tutup modal">×</button>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5"><img src="/kpu_logo.svg" alt="Logo KPU RI" className="w-full h-full object-contain" /></div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#ffdcc3] block font-bold">SUPABASE AUTH</span>
              <h3 id="admin-login-title" className="text-base font-bold">Autentikasi Administrator</h3>
              <p className="text-xs text-white/80">Masuk menggunakan akun admin KPU terdaftar</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="p-3 bg-[#fdf2f2] border border-[#5a0f18]/15 rounded-xl text-xs text-[#534344] leading-relaxed">Sesi dan hak akses diverifikasi oleh Supabase. Kata sandi tidak disimpan di website ini.</p>
          {errorMsg && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs" role="alert">{errorMsg}</div>}
          <div>
            <label htmlFor="admin-username-input" className="text-xs font-bold text-[#201112] block mb-1.5">Username Administrator</label>
            <input id="admin-username-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoComplete="username" autoFocus required className="w-full px-3 py-2.5 bg-[#fbf9f9] border border-[#d5cbcd] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/30" />
          </div>
          <div>
            <label htmlFor="admin-password-input" className="text-xs font-bold text-[#201112] block mb-1.5">Kata Sandi</label>
            <div className="relative">
              <input id="admin-password-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="w-full px-3 pr-12 py-2.5 bg-[#fbf9f9] border border-[#d5cbcd] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a0f18]/30" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75777d]" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}><span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span></button>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[#534344]">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-[#5a0f18] hover:bg-[#3d080e] text-white text-xs font-bold disabled:opacity-60">{isSubmitting ? 'Memverifikasi…' : 'Masuk Sebagai Admin'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
