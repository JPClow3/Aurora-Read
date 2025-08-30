import React from 'react';
import { TTSState } from '../types';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon } from './Icons';

interface AudioControlsProps {
  ttsState: TTSState;
  onPlay: () => void;
  onPause: () => void;
  onSkip: (direction: 'backward' | 'forward') => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  ttsState,
  onPlay,
  onPause,
  onSkip,
}) => {
  const isPlaying = ttsState === TTSState.PLAYING;
  const isLoading = ttsState === TTSState.LOADING;

  return (
    <div className="w-full max-w-sm p-3 rounded-xl shadow-lg bg-gray-800/70 backdrop-blur-sm flex items-center justify-center gap-6">
        <button
            onClick={() => onSkip('backward')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            disabled={isLoading || ttsState === TTSState.IDLE}
            aria-label="Previous Sentence"
        >
            <SkipBackIcon className="w-6 h-6" />
        </button>
        <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={isLoading}
        >
            {isLoading ? (
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
            ) : isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 pl-1" />}
        </button>
        <button
            onClick={() => onSkip('forward')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            disabled={isLoading || ttsState === TTSState.IDLE}
            aria-label="Next Sentence"
        >
            <SkipForwardIcon className="w-6 h-6" />
        </button>
    </div>
  );
};

export default AudioControls;