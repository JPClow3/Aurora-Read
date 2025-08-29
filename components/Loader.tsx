
import React from 'react';

const Loader: React.FC<{ message: string, onCancel?: () => void }> = ({ message, onCancel }) => (
  <div className="flex flex-col items-center justify-center space-y-4 text-center p-8 hc-bg" role="status" aria-live="polite">
    <svg className="animate-spin h-10 w-10 text-indigo-400 hc-accent-stroke" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8_0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg text-gray-300 hc-text">{message}</p>
    {onCancel && (
      <button onClick={onCancel} className="mt-4 px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors active:scale-95">
        Cancel
      </button>
    )}
  </div>
);

export default Loader;
