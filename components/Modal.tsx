import React, { useCallback, useEffect } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    title: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="modal-title" className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" aria-label="Close modal">
            <XIcon className="w-6 h-6 text-gray-400" />
          </button>
        </header>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;