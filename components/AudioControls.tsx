import React from 'react';
import { TTSState } from '../types';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, SettingsIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface AudioControlsProps {
  ttsState: TTSState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onSkip: (direction: 'backward' | 'forward') => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onOpenPlayerSettings: () => void;
  rate: number;
  onRateChange: (rate: number) => void;
  progress: number;
  onProgressChange: (newProgress: number) => void;
  currentTime: string;
  duration: string;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  ttsState,
  onPlay,
  onPause,
  onPrevChapter,
  onNextChapter,
  onSkip,
  canGoPrev,
  canGoNext,
  onOpenPlayerSettings,
  rate,
  onRateChange,
  progress,
  onProgressChange,
  currentTime,
  duration,
}) => {
  const isPlaying = ttsState === TTSState.PLAYING;
  const isLoading = ttsState === TTSState.LOADING;

  return (
    <div className="w-full max-w-3xl p-3 bg-gray-800/60 rounded-xl shadow-lg backdrop-blur-sm flex flex-col items-center gap-2 border border-gray-700/50 hc-bg hc-border z-40">
      {/* Progress Bar & Timestamps */}
      <div className="w-full flex items-center gap-3 px-1">
        <span className="text-xs font-mono text-gray-400 w-12 text-center">{currentTime}</span>
        <div className="w-full h-1.5 bg-gray-600/50 rounded-full relative group cursor-pointer" onClick={(e) => {
            if(ttsState === TTSState.IDLE) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newProgress = (clickX / rect.width) * 100;
            onProgressChange(newProgress);
        }}>
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full transition-all duration-150 group-hover:scale-110" style={{ left: `${progress}%` }}></div>
        </div>
        <span className="text-xs font-mono text-gray-400 w-12 text-center">{duration}</span>
      </div>

      {/* Player Controls */}
      <div className="w-full flex items-center justify-between gap-4 px-2">
        <div className="w-1/4 flex items-center justify-start">
          <button
            onClick={onOpenPlayerSettings}
            className="p-2 bg-gray-700/70 rounded-full text-white hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 flex items-center justify-center gap-2 active:scale-95"
            aria-label="Player Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-grow flex items-center justify-center gap-3">
          <button
            onClick={onPrevChapter}
            className="p-2 rounded-full text-white hover:bg-gray-700 transition-all duration-200 focus:outline-none disabled:opacity-50 active:scale-95"
            disabled={!canGoPrev || isLoading}
            aria-label="Previous Chapter"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => onSkip('backward')}
            className="p-2 rounded-full text-white hover:bg-gray-700 transition-all duration-200 focus:outline-none disabled:opacity-50 active:scale-95"
            disabled={ttsState === TTSState.IDLE || isLoading}
            aria-label="Previous Sentence"
          >
            <SkipBackIcon className="w-6 h-6" />
          </button>
          <button
            onClick={ttsState === TTSState.PLAYING ? onPause : onPlay}
            className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 hc-primary disabled:opacity-50 active:scale-95 mx-2"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={isLoading}
          >
            {isLoading ? (
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 pl-1" />}
          </button>
           <button
            onClick={() => onSkip('forward')}
            className="p-2 rounded-full text-white hover:bg-gray-700 transition-all duration-200 focus:outline-none disabled:opacity-50 active:scale-95"
            disabled={ttsState === TTSState.IDLE || isLoading}
            aria-label="Next Sentence"
          >
            <SkipForwardIcon className="w-6 h-6" />
          </button>
          <button
            onClick={onNextChapter}
            className="p-2 rounded-full text-white hover:bg-gray-700 transition-all duration-200 focus:outline-none disabled:opacity-50 active:scale-95"
            disabled={!canGoNext || isLoading}
            aria-label="Next Chapter"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="w-1/4 flex items-center justify-end">
             <div className='relative group w-24'>
                <span className="block text-center text-gray-300 hc-text text-sm w-full bg-gray-700/70 p-2 rounded-lg">{rate.toFixed(1)}x</span>
                <input id="rate" type="range" min="0.5" max="2" step="0.1" value={rate} onChange={e => onRateChange(parseFloat(e.target.value))} className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-[120px] h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 hc-accent-bg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"/>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AudioControls;