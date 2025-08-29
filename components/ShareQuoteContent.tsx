
import React, { useState } from 'react';

const ShareQuoteContent: React.FC<{ quote: string; bookTitle: string; onShare: () => void; }> = ({ quote, bookTitle, onShare }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(`"${quote}" - from ${bookTitle}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-lg italic text-gray-200 hc-text">
                "{quote}"
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                 <button onClick={handleCopy} className="flex-1 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors active:scale-95">
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button onClick={onShare} className="flex-1 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors hc-primary active:scale-95">
                    Share to Community
                </button>
            </div>
        </div>
    );
};

export default ShareQuoteContent;
