import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Book, GeminiVoice, TTSState, ReaderSettings, DefaultReadingMode } from '../types';
import Modal from './Modal';
import { SlidersHorizontalIcon, StopIcon, Volume2Icon, BookOpenIcon } from './Icons';
import ReaderSettingsPanel from './ReaderSettingsPanel';
import { GEMINI_VOICES, synthesizeSpeech } from '../gemini';

const PlayerSettingsModal: React.FC<{
  onClose: () => void;
  book: Book;
  onUpdateBook: (book: Partial<Book> & { id: string }) => void;
  readerSettings: ReaderSettings;
  onReaderSettingsChange: (newSettings: ReaderSettings) => void;
  viewMode: DefaultReadingMode;
  onViewModeChange: (mode: DefaultReadingMode) => void;
}> = ({ onClose, book, onUpdateBook, readerSettings, onReaderSettingsChange, viewMode, onViewModeChange }) => {
  const [activeTab, setActiveTab] = useState('display');
  const [previewState, setPreviewState] = useState<{ voiceId: GeminiVoice | null; state: TTSState }>({ voiceId: null, state: TTSState.IDLE });
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewState({ voiceId: null, state: TTSState.IDLE });
  }, []);

  const handlePreviewVoice = useCallback(async (voice: typeof GEMINI_VOICES[0]) => {
    if (previewState.voiceId === voice.id && previewState.state === TTSState.PLAYING) {
      stopPreview();
      return;
    }
    stopPreview();
    setPreviewState({ voiceId: voice.id, state: TTSState.LOADING });
    try {
      const audioBase64 = await synthesizeSpeech(voice.sampleText, voice.id);
      const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
      previewAudioRef.current = new Audio(audioSrc);
      previewAudioRef.current.play().catch(() => stopPreview());
      setPreviewState({ voiceId: voice.id, state: TTSState.PLAYING });
      previewAudioRef.current.onended = stopPreview;
    } catch (e) {
      console.error("Preview synthesis failed", e);
      stopPreview();
    }
  }, [previewState.state, previewState.voiceId, stopPreview]);

  useEffect(() => {
    // Stop preview when modal is closed
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  return (
    <Modal onClose={onClose} title="Player Settings">
      <div className="flex flex-col">
        <div className="border-b border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('display')}
              className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'display' ? 'border-indigo-500 text-indigo-400 hc-accent-border hc-accent-text' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
            >
              <SlidersHorizontalIcon className="w-5 h-5" /> Display
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'voice' ? 'border-indigo-500 text-indigo-400 hc-accent-border hc-accent-text' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}
            >
              <Volume2Icon className="w-5 h-5" /> Voice
            </button>
          </nav>
        </div>
        <div>
          {activeTab === 'display' && (
            <div className="space-y-6">
                <div>
                    <label className="text-lg font-semibold text-gray-200 flex items-center gap-2"><BookOpenIcon className="w-5 h-5" /> View Mode</label>
                    <p className="text-sm text-gray-400 mt-1 mb-3">Switch between listening, reading, or both.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(['hybrid', 'karaoke', 'read_only', 'audio_only'] as DefaultReadingMode[]).map(mode => (
                            <button key={mode} onClick={() => onViewModeChange(mode)} className={`capitalize w-full p-2 rounded-md border-2 transition-colors text-sm ${viewMode === mode ? 'border-indigo-400 bg-indigo-900/30' : 'border-gray-600 hover:border-gray-500'}`}>
                                {mode.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                { (viewMode !== 'audio_only') && (
                    <div className="border-t border-gray-700/50 pt-6">
                        <ReaderSettingsPanel
                          settings={readerSettings}
                          onSettingsChange={onReaderSettingsChange}
                        />
                    </div>
                )}
            </div>
          )}
          {activeTab === 'voice' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {GEMINI_VOICES.map(voice => {
                const isSelected = (book.voice || 'nova') === voice.id;
                const isPreviewing = previewState.voiceId === voice.id;
                return (
                  <div key={voice.id} className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col justify-between ${isSelected ? 'bg-indigo-900/50 border-indigo-500 hc-accent-border' : 'bg-gray-700/80 border-gray-600 hover:border-gray-500'}`}>
                    <div>
                      <p className='text-lg font-semibold'>{voice.name} <span className="text-sm font-normal text-gray-400">- {voice.gender}</span></p>
                      <p className='text-sm text-gray-300 mt-1 mb-3'>{voice.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateBook({ id: book.id, voice: voice.id })} className={`w-full p-2 rounded-md text-sm font-semibold transition-colors active:scale-95 ${isSelected ? 'bg-indigo-600 text-white hc-primary' : 'bg-gray-600 hover:bg-gray-500'}`}>
                        {isSelected ? 'Selected' : 'Select Voice'}
                      </button>
                      <button onClick={() => handlePreviewVoice(voice)} className={`p-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors flex-shrink-0 active:scale-95 ${isPreviewing && previewState.state === TTSState.PLAYING ? 'animate-pulse-preview' : ''}`} aria-label={`Preview ${voice.name} voice`}>
                        {isPreviewing && previewState.state === TTSState.LOADING ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : isPreviewing && previewState.state === TTSState.PLAYING ? <StopIcon className="w-5 h-5" /> : <Volume2Icon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
};

export default PlayerSettingsModal;
