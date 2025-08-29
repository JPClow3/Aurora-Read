import React from 'react';
import { SharedQuote } from '../types';
import { HeartIcon } from './Icons';

interface CommunityViewProps {
  quotes: SharedQuote[];
  onToggleLike: (quoteId: string) => void;
  likedQuoteIds: Set<string>;
}

const CommunityView: React.FC<CommunityViewProps> = ({ quotes, onToggleLike, likedQuoteIds }) => {
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };
  
  if (quotes.length === 0) {
    return <div className="text-center text-gray-400 hc-dim-text">The community feed is empty. Be the first to share a quote!</div>;
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4">
      {quotes.map((q, index) => (
        <div key={q.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 hc-bg hc-border animate-slide-up" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}>
          <blockquote className="text-lg italic text-gray-200 border-l-4 border-indigo-500 pl-4 hc-accent-border hc-text">
            "{q.quote}"
          </blockquote>
          <div className="flex justify-between items-center mt-3 text-sm text-gray-400 hc-dim-text">
              <p>
                  from <strong>{q.bookTitle}</strong> &mdash; <span title={new Date(q.timestamp).toLocaleString()}>{timeAgo(q.timestamp)}</span>
              </p>
              <div className="flex items-center gap-2 text-gray-300">
                  <button onClick={() => onToggleLike(q.id)} className="p-1.5 rounded-full text-pink-500 hover:bg-pink-500/10 transition-colors group" aria-label="Like quote">
                      <HeartIcon className={`w-5 h-5 transition-transform ${likedQuoteIds.has(q.id) ? 'scale-110' : 'scale-100 group-hover:scale-110'}`} filled={likedQuoteIds.has(q.id)} />
                  </button>
                  <span className="text-sm font-medium min-w-[1rem] text-left">{q.likes > 0 ? q.likes : ''}</span>
              </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommunityView;