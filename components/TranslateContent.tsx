
import React, { useState } from 'react';
import ErrorMessage from './ErrorMessage';

const TranslateContent: React.FC<{
    onTranslate: (lang: string) => void;
    isLoading: boolean;
    error: string | null;
    translatedText: string | null;
}> = ({ onTranslate, isLoading, error, translatedText }) => {
    const [targetLang, setTargetLang] = useState('Spanish');
    const languages = ["Spanish", "French", "German", "Japanese", "Mandarin", "Russian"];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="flex-grow bg-gray-700 text-white text-base rounded-md p-2 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                    {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
                <button onClick={() => onTranslate(targetLang)} disabled={isLoading} className="px-4 py-2 bg-indigo-600 rounded-lg hc-primary disabled:opacity-50 flex items-center justify-center min-w-[110px] transition-colors active:scale-95">
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Translate'}
                </button>
            </div>
            {error && <ErrorMessage message={error} />}
            {translatedText && !isLoading && (
                <div className="p-4 bg-gray-900/50 rounded-lg max-h-96 overflow-y-auto border border-gray-700">
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed hc-text">{translatedText}</p>
                </div>
            )}
        </div>
    );
};

export default TranslateContent;
