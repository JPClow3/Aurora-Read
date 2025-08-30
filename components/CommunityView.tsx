import React, { useState, useMemo } from 'react';
import { SharedQuote, Profile } from '../types';
import { HeartIcon, MessageSquareIcon } from './Icons';
import { generateAvatarSvg } from '../utils';

interface CommunityViewProps {
  quotes: SharedQuote[];
  onToggleLike: (quoteId: string) => void;
  likedQuoteIds: Set<string>;
  onComment: (quoteId: string, text: string) => void;
  profiles: Profile[];
  currentProfileId: string;
}

const CommunityView: React.FC<CommunityViewProps> = ({ quotes, onToggleLike, likedQuoteIds, onComment, profiles, currentProfileId }) => {
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const profileMap = useMemo(() => {
    return new Map(profiles.map(p => [p.id, p]));
  }, [profiles]);

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
  
  const handleCommentSubmit = (e: React.FormEvent, quoteId: string) => {
    e.preventDefault();
    const text = commentInputs[quoteId];
    if (text && text.trim()) {
        onComment(quoteId, text.trim());
        setCommentInputs(prev => ({ ...prev, [quoteId]: '' }));
    }
  };

  const toggleExpandedComments = (quoteId: string) => {
    setExpandedComments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(quoteId)) {
            newSet.delete(quoteId);
        } else {
            newSet.add(quoteId);
        }
        return newSet;
    });
  };

  if (quotes.length === 0) {
    return (
        <div className="w-full text-center py-20 px-6 bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-700/80 animate-fade-in">
            <MessageSquareIcon className="mx-auto w-16 h-16 text-gray-600 hc-dim-text" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-100 hc-text">It's quiet in here...</h3>
            <p className="mt-2 text-lg text-gray-400 hc-dim-text">Share a quote from a book to get the conversation started.</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6">
      {quotes.map((q, index) => {
        const likerNames = (q.likedBy || [])
          .map(id => profileMap.get(id)?.name)
          .filter(Boolean)
          .join(', ');

        const comments = q.comments || [];
        const isExpanded = expandedComments.has(q.id);

        return (
          <div key={q.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 hc-bg hc-border animate-slide-up" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}>
            <blockquote className="text-lg italic text-gray-200 border-l-4 border-indigo-500 pl-4 hc-accent-border hc-text">
              "{q.quote}"
            </blockquote>
            <div className="flex justify-between items-center mt-3 text-sm text-gray-400 hc-dim-text">
                <p>
                    from <strong>{q.bookTitle}</strong> &mdash; <span title={new Date(q.timestamp).toLocaleString()}>{timeAgo(q.timestamp)}</span>
                </p>
                <div className="flex items-center gap-3 text-gray-300">
                    <div className="flex items-center gap-2" title={likerNames}>
                      <button onClick={() => onToggleLike(q.id)} className="p-1.5 rounded-full text-pink-500 hover:bg-pink-500/10 transition-colors group" aria-label="Like quote">
                          <HeartIcon className={`w-5 h-5 transition-transform ${likedQuoteIds.has(q.id) ? 'scale-110' : 'scale-100 group-hover:scale-110'}`} filled={likedQuoteIds.has(q.id)} />
                      </button>
                      <span className="text-sm font-medium min-w-[1rem] text-left">{(q.likedBy || []).length > 0 ? (q.likedBy || []).length : ''}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <MessageSquareIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium min-w-[1rem] text-left">{comments.length > 0 ? comments.length : ''}</span>
                    </div>
                </div>
            </div>
            
            {/* Comments Section */}
            <div className="mt-4 pt-4 border-t border-gray-700/50">
                {comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                        {comments.slice(0, isExpanded ? comments.length : 1).map(comment => (
                            <div key={comment.id} className="flex items-start gap-3">
                                <img src={generateAvatarSvg(comment.profileAvatar)} alt={comment.profileName} className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                                <div className="flex-grow bg-gray-700/50 rounded-lg px-3 py-2">
                                    <div className="flex items-baseline gap-2">
                                      <p className="text-sm font-semibold text-white">{comment.profileName}</p>
                                      <p className="text-xs text-gray-400">{timeAgo(comment.timestamp)}</p>
                                    </div>
                                    <p className="text-sm text-gray-200 mt-1">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                        {comments.length > 1 && (
                            <button onClick={() => toggleExpandedComments(q.id)} className="text-sm text-indigo-400 hover:underline">
                                {isExpanded ? 'Show less comments' : `Show ${comments.length - 1} more comments`}
                            </button>
                        )}
                    </div>
                )}
                <form onSubmit={(e) => handleCommentSubmit(e, q.id)} className="flex items-center gap-3">
                    <img src={generateAvatarSvg(profileMap.get(currentProfileId)?.avatar || '')} alt="Your avatar" className="w-8 h-8 rounded-full" />
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInputs[q.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full bg-gray-700 text-white text-sm rounded-full py-2 px-4 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </form>
            </div>

          </div>
        )
      })}
    </div>
  );
};

export default CommunityView;