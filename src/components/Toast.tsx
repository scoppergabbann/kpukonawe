import React from 'react';
import { ToastState } from '../types';

interface ToastProps {
  toast: ToastState;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast.show) return null;

  return (
    <div
      id="toastNotification"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#5a0f18] text-white rounded-2xl shadow-2xl transition-all duration-300 transform translate-y-0 border border-white/15"
    >
      <span className="material-symbols-outlined text-[#ffdcc3] text-[24px]">
        {toast.type === 'error'
          ? 'error'
          : toast.type === 'info'
          ? 'info'
          : 'check_circle'}
      </span>
      <div>
        <h4 className="text-sm font-bold text-white tracking-wide">{toast.title}</h4>
        <p className="text-sm text-[#ffdcc3] mt-0.5">{toast.message}</p>
      </div>
    </div>
  );
};
