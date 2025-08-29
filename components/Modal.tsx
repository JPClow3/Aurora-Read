
import React, { useState, useCallback, useEffect } from 'react';
import { XIcon } from './Icons';

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; }> = ({ children, onClose, title }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Match animation duration
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'animate-fade-in'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full max-w-3xl bg-gray-800 border border-gray-700 rounded-2xl shadow-xl flex flex-col hc-bg hc-border transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-slide-up'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700 hc-border">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-100 hc-text">{title}</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors active:scale-95" aria-label="Close modal"><XIcon className="w-6 h-6 text-gray-400 hc-text" /></button>
        </header>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
