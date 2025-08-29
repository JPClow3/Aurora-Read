
import React, { forwardRef } from 'react';

interface ShareQuoteCardProps {
    quote: string;
    bookTitle: string;
    author?: string;
}

const ShareQuoteCard = forwardRef<HTMLDivElement, ShareQuoteCardProps>(({ quote, bookTitle, author }, ref) => {
    return (
        <div ref={ref} className="w-[400px] h-[400px] bg-gradient-to-br from-gray-900 via-indigo-900 to-fuchsia-900 p-8 flex flex-col justify-between text-white font-['Lora']">
            <div>
                <p className="text-2xl italic leading-relaxed">
                    "{quote}"
                </p>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold">{bookTitle}</p>
                {author && <p className="text-md text-gray-300">{author}</p>}
                <p className="text-sm text-indigo-300 mt-2 font-['Inter']">Shared from Aurora Read</p>
            </div>
        </div>
    );
});

export default ShareQuoteCard;
