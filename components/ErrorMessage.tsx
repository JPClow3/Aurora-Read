
import React from 'react';

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="w-full max-w-2xl p-4 bg-red-900/50 border border-red-700 rounded-lg text-center" role="alert" aria-live="assertive">
    <p className="text-red-300 font-semibold">Error</p>
    <p className="text-red-400">{message}</p>
  </div>
);

export default ErrorMessage;
