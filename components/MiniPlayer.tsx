import React from 'react';
import { Book, TTSState } from '../types';
import { BookOpenIcon, PlayIcon, PauseIcon } from './Icons';

interface MiniPlayerProps {
  book: Book;
  onSelect: () => void;
  ttsState: TTSState | null;
  onTogglePlayPause: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ book, onSelect, ttsState, onTogglePlayPause }) => {
  const isPlaying = ttsState === TTSState.PLAYING || ttsState === TTSState.LOADING;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-30 p-2 sm:p-4"
    >
        <div 
          onClick={onSelect}
          className="w-full max-w-5xl mx-auto p-3 bg-gray-800/60 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-4 border border-gray-700/50 hc-bg hc-border cursor-pointer group hover:bg-gray-800/80 transition-colors duration-200 animate-slide-up"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
          aria-label={`Resume reading ${book.title}`}
          >
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-gray-700 overflow-hidden shadow-md">
                {book.cover ? (
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpenIcon className="w-6 h-6 text-gray-400" />
                    </div>
                )}
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-100 truncate hc-text">{book.title}</p>
                <p className='text-xs sm:text-sm text-gray-400 truncate hc-dim-text'>{book.author || 'Unknown Author'}</p>
                <div className="mt-2 w-full h-1 bg-gray-600/50 rounded-full">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 group-hover:bg-indigo-400" style={{ width: `${book.progress || 0}%` }}></div>
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlayPause();
                }}
                className="p-2 rounded-full text-white hover:bg-gray-700/80 transition-colors duration-200 focus:outline-none active:scale-95 ml-auto"
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7 pl-1" />}
            </button>
            <div className="text-sm font-semibold text-indigo-400 hc-accent-text hidden sm:block pr-2">
                Resume
            </div>
        </div>
    </div>
  );
};

export default MiniPlayer;