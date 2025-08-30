import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Book, TTSState, ReaderSettings, ViewMode, ChapterAnalysis, HighlightCategory, AiHighlight, Flashcard, FlashcardReview, CharacterProfile } from '../types';
import { splitSentences } from '../utils';
import { synthesizeSpeech, analyzeChapter, generateFlashcardsForChapter, analyzeCharactersInBook } from '../gemini';
import { DEFAULT_READER_SETTINGS } from '../constants';
import { ChevronLeftIcon, SettingsIcon, BookOpenIcon, MicIcon, BookMarkedIcon, ClockIcon, SparklesIcon, DownloadIcon, CheckIcon, UsersIcon, ListIcon } from './Icons';
import ReaderView from './ReaderView';
import AudioControls from './AudioControls';
import PlayerSettingsModal from './PlayerSettingsModal';
import SleepTimerModal from './SleepTimerModal';
import AiToolsModal from './AiToolsModal';
import CharacterTrackerModal from './CharacterTrackerModal';
import TableOfContentsModal from './TableOfContentsModal';

interface PlayerViewProps {
    book: Book;
    onBack: () => void;
    onBookUpdate: (updatedBook: Book) => void;
}

const AUDIO_CACHE_LIMIT = 50; // Limit the number of cached audio sentences to prevent memory leaks.

const PlayerView: React.FC<PlayerViewProps> = ({ book, onBack, onBookUpdate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('reading');
  const [ttsState, setTtsState] = useState<TTSState>(TTSState.IDLE);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(book.lastChapterIndex || 0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(book.lastSentenceIndex || 0);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(book.readerSettings || DEFAULT_READER_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | undefined>();
  
  // New states for caching and AI features
  const [isCaching, setIsCaching] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCache, setAnalysisCache] = useState<Map<number, ChapterAnalysis>>(new Map());
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeAiCategories, setActiveAiCategories] = useState<Set<HighlightCategory>>(new Set());
  const [isTocOpen, setIsTocOpen] = useState(false);

  // State for flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>(book.flashcards || []);
  const [flashcardReviews, setFlashcardReviews] = useState<Record<string, FlashcardReview>>(book.flashcardReviews || {});

  // State for Character Tracker
  const [characterProfiles, setCharacterProfiles] = useState<CharacterProfile[] | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef(new Map<string, string>());
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const sleepTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const chapterIndexRef = useRef(currentChapterIndex);
  const sentenceIndexRef = useRef(currentSentenceIndex);

  const currentChapter = book.chapters?.[currentChapterIndex];
  const sentences = useMemo(() => {
    const content = currentChapter?.content || '';
    if (book.fileType === 'epub') {
      const div = document.createElement('div');
      div.innerHTML = content;
      return splitSentences(div.textContent || '');
    }
    return splitSentences(content);
  }, [currentChapter, book.fileType]);
  
  const analysisResult = analysisCache.get(currentChapterIndex);

  useEffect(() => {
    chapterIndexRef.current = currentChapterIndex;
    sentenceIndexRef.current = currentSentenceIndex;
  }, [currentChapterIndex, currentSentenceIndex]);
  
  useEffect(() => {
    // Save progress when component unmounts or book changes
    return () => {
        onBookUpdate({
            ...book,
            lastChapterIndex: chapterIndexRef.current,
            lastSentenceIndex: sentenceIndexRef.current,
            readerSettings,
            flashcards,
            flashcardReviews,
        });
    };
  }, [book, readerSettings, flashcards, flashcardReviews, onBookUpdate]);


  useEffect(() => {
    setIsCaching(false);
    setIsCached(false);
    setAnalysisError(null);
  }, [currentChapterIndex]);
  
  const handleAudioEnd = useCallback(() => {
    const nextSentence = sentenceIndexRef.current + 1;

    if (nextSentence < sentences.length) {
        setCurrentSentenceIndex(nextSentence);
    } else {
        setTtsState(TTSState.IDLE);
    }
  }, [sentences]);
  
  useEffect(() => {
      if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.addEventListener('ended', handleAudioEnd);
      }
      return () => {
          audioRef.current?.removeEventListener('ended', handleAudioEnd);
          if (sleepTimerId.current) {
            clearTimeout(sleepTimerId.current);
          }
      }
  }, [handleAudioEnd]);

  const playAudio = useCallback((src: string) => {
    if (audioRef.current) {
        if (audioRef.current.src !== src) {
            audioRef.current.src = src;
        }
        audioRef.current.play().catch(e => {
            console.error("Audio play failed:", e);
            setTtsState(TTSState.IDLE);
        });
    }
  }, []);

  const fetchAndPlay = useCallback(async () => {
    const sentenceText = sentences[currentSentenceIndex];

    if (!sentenceText?.trim()) {
      handleAudioEnd(); // Skip empty sentences
      return;
    }

    const cacheKey = `${currentChapterIndex}-${currentSentenceIndex}`;
    let audioSrc = audioCache.current.get(cacheKey);

    if (audioSrc) {
        playAudio(audioSrc);
    } else {
        setTtsState(TTSState.LOADING);
        try {
            const audioBase64 = await synthesizeSpeech(sentenceText.trim());
            audioSrc = `data:audio/mp3;base64,${audioBase64}`;
            audioCache.current.set(cacheKey, audioSrc);

            if (audioCache.current.size > AUDIO_CACHE_LIMIT) {
                const oldestKey = audioCache.current.keys().next().value;
                audioCache.current.delete(oldestKey);
            }

            playAudio(audioSrc);
            setTtsState(TTSState.PLAYING);
        } catch (e) {
            console.error(e);
            setTtsState(TTSState.IDLE);
        }
    }
  }, [sentences, currentChapterIndex, currentSentenceIndex, playAudio, handleAudioEnd]);
  
  useEffect(() => {
    if (ttsState === TTSState.PLAYING) {
        fetchAndPlay();
    }
  }, [ttsState, currentChapterIndex, currentSentenceIndex, fetchAndPlay]);
  
  const handlePlay = useCallback(() => {
    if (ttsState === TTSState.PAUSED && audioRef.current) {
       audioRef.current.play();
       setTtsState(TTSState.PLAYING);
    } else if (ttsState === TTSState.IDLE) {
       setTtsState(TTSState.PLAYING);
    }
  }, [ttsState]);
  
  const handlePause = useCallback(() => {
    if(audioRef.current) audioRef.current.pause();
    setTtsState(TTSState.PAUSED);
  }, []);
  
  const handleSkip = (direction: 'backward' | 'forward') => {
    const newIndex = currentSentenceIndex + (direction === 'forward' ? 1 : -1);
    if (newIndex >= 0 && newIndex < sentences.length) {
      setCurrentSentenceIndex(newIndex);
    }
  };
  
  const handleSentenceClick = (index: number) => {
    setCurrentSentenceIndex(index);
    if (viewMode !== 'reading') {
        setTtsState(TTSState.PLAYING);
    }
  };

  const handleClearSleepTimer = useCallback(() => {
    if (sleepTimerId.current) {
        clearTimeout(sleepTimerId.current);
        sleepTimerId.current = null;
    }
    setSleepTimerEndsAt(undefined);
  }, []);

  const handleSetSleepTimer = useCallback((durationMinutes: number) => {
      handleClearSleepTimer();
      
      const durationMs = durationMinutes * 60 * 1000;
      const endsAt = Date.now() + durationMs;
      setSleepTimerEndsAt(endsAt);

      sleepTimerId.current = setTimeout(() => {
          handlePause();
          handleClearSleepTimer();
      }, durationMs);
  }, [handleClearSleepTimer, handlePause]);

  const handleCacheChapter = useCallback(async () => {
    setIsCaching(true);
    try {
      for (let i = 0; i < sentences.length; i++) {
        const sentenceText = sentences[i];
        if (!sentenceText?.trim()) continue;

        const cacheKey = `${currentChapterIndex}-${i}`;
        if (!audioCache.current.has(cacheKey)) {
          const audioBase64 = await synthesizeSpeech(sentenceText.trim());
          const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
          audioCache.current.set(cacheKey, audioSrc);
        }
      }
      setIsCached(true);
    } catch (error) {
      console.error("Failed to cache chapter audio:", error);
    } finally {
      setIsCaching(false);
    }
  }, [sentences, currentChapterIndex]);
  
  const handleAnalyzeChapter = useCallback(async () => {
      if (!currentChapter?.content || analysisCache.has(currentChapterIndex)) return;
      setIsAnalyzing(true);
      setAnalysisError(null);
      try {
          const result = await analyzeChapter(currentChapter.content, sentences);
          setAnalysisCache(prev => new Map(prev).set(currentChapterIndex, result));
      } catch (err: any) {
          console.error("Chapter analysis failed:", err);
          setAnalysisError(err.message || "Failed to analyze chapter.");
      } finally {
          setIsAnalyzing(false);
      }
  }, [currentChapter, sentences, currentChapterIndex, analysisCache]);

    const handleGenerateFlashcards = useCallback(async () => {
        if (!currentChapter?.content) return;
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const generated = await generateFlashcardsForChapter(currentChapter.content);
            const newFlashcards = generated.map(fc => ({...fc, id: crypto.randomUUID() }));
            setFlashcards(prev => [...prev, ...newFlashcards]);
        } catch (err: any) {
            console.error("Flashcard generation failed:", err);
            setAnalysisError(err.message || "Failed to generate flashcards.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [currentChapter]);
  
  const handleToggleAiCategory = (category: HighlightCategory) => {
      setActiveAiCategories(prev => {
          const newSet = new Set(prev);
          if (newSet.has(category)) {
              newSet.delete(category);
          } else {
              newSet.add(category);
          }
          return newSet;
      });
  };

  const aiHighlights = useMemo((): AiHighlight[] => {
    if (!analysisResult) return [];
    const highlights: AiHighlight[] = [];
    if (activeAiCategories.has('plot')) {
        highlights.push(...analysisResult.keyPlotPoints.map(i => ({ sentenceIndex: i, category: 'plot' as HighlightCategory })));
    }
    if (activeAiCategories.has('character')) {
        highlights.push(...analysisResult.characterIntroductions.map(i => ({ sentenceIndex: i, category: 'character' as HighlightCategory })));
    }
    if (activeAiCategories.has('foreshadowing')) {
        highlights.push(...analysisResult.foreshadowing.map(i => ({ sentenceIndex: i, category: 'foreshadowing' as HighlightCategory })));
    }
    return highlights;
  }, [analysisResult, activeAiCategories]);

  const handleSelectChapter = (index: number) => {
    if (index !== currentChapterIndex) {
        setCurrentChapterIndex(index);
        setCurrentSentenceIndex(0); // Reset sentence index when changing chapters
    }
    setIsTocOpen(false);
  };

  return (
    <div className="w-full max-w-7xl h-[95vh] flex flex-col items-center animate-fade-in">
        <header className="w-full flex justify-between items-center mb-4 p-2">
            <button onClick={onBack} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors">
                <ChevronLeftIcon className="w-6 h-6" />
                <span className="text-lg font-semibold hidden sm:block">Library</span>
            </button>
            <div className="text-center">
                <h1 className="text-xl font-bold truncate max-w-xs sm:max-w-md md:max-w-lg">{book.title}</h1>
                {book.fileType === 'epub' && (
                    <h2 className="text-sm text-gray-400 truncate max-w-xs sm:max-w-md md:max-w-lg">
                        {currentChapter?.title}
                    </h2>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('reading')} className={`p-2 rounded-lg transition-colors ${viewMode === 'reading' ? 'bg-indigo-600' : 'hover:bg-white/10'}`} title="Immersive Reading"><BookOpenIcon className="w-6 h-6" /></button>
                <button onClick={() => setViewMode('karaoke')} className={`p-2 rounded-lg transition-colors ${viewMode === 'karaoke' ? 'bg-indigo-600' : 'hover:bg-white/10'}`} title="Karaoke Mode"><MicIcon className="w-6 h-6" /></button>
                <button onClick={() => setViewMode('hybrid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'hybrid' ? 'bg-indigo-600' : 'hover:bg-white/10'}`} title="Hybrid Mode"><BookMarkedIcon className="w-6 h-6" /></button>
                {book.fileType === 'epub' && <button onClick={() => setIsTocOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Table of Contents"><ListIcon className="w-6 h-6" /></button>}
                <button onClick={() => setIsAiModalOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="AI Analysis"><SparklesIcon className="w-6 h-6" /></button>
                <button onClick={() => setIsCharacterModalOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Character Tracker"><UsersIcon className="w-6 h-6" /></button>
                <button onClick={handleCacheChapter} disabled={isCaching || isCached} className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50" title="Download chapter audio">
                  {isCaching ? (
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  ) : isCached ? <CheckIcon className="w-6 h-6 text-green-400" /> : <DownloadIcon className="w-6 h-6" />}
                </button>
                <button onClick={() => setIsSleepTimerOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors relative" title="Sleep Timer">
                    <ClockIcon className="w-6 h-6" />
                    {sleepTimerEndsAt && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-indigo-400 ring-2 ring-gray-900" />}
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Display Settings"><SettingsIcon className="w-6 h-6" /></button>
            </div>
        </header>
        <main className="w-full flex-grow bg-gray-800/50 rounded-2xl shadow-inner overflow-hidden relative">
           {currentChapter ? (
                <ReaderView
                    book={book}
                    currentChapterIndex={currentChapterIndex}
                    currentSentenceIndex={currentSentenceIndex}
                    onSentenceClick={handleSentenceClick}
                    settings={readerSettings}
                    viewMode={viewMode}
                    aiHighlights={aiHighlights}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Chapter not found.</div>
            )}
        </main>
        {(viewMode === 'karaoke' || viewMode === 'hybrid') && (
            <footer className="w-full flex justify-center mt-4">
                <AudioControls
                    ttsState={ttsState}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSkip={handleSkip}
                />
            </footer>
        )}
        {isSettingsOpen && (
            <PlayerSettingsModal
                onClose={() => setIsSettingsOpen(false)}
                settings={readerSettings}
                onSettingsChange={setReaderSettings}
            />
        )}
        {isSleepTimerOpen && (
            <SleepTimerModal
                onClose={() => setIsSleepTimerOpen(false)}
                onSetTimer={handleSetSleepTimer}
                onClearTimer={handleClearSleepTimer}
                activeTimerEndsAt={sleepTimerEndsAt}
            />
        )}
        {isAiModalOpen && (
            <AiToolsModal 
                onClose={() => setIsAiModalOpen(false)}
                onAnalyzeHighlights={handleAnalyzeChapter}
                onGenerateFlashcards={handleGenerateFlashcards}
                isAnalyzing={isAnalyzing}
                analysisResult={analysisResult || null}
                activeCategories={activeAiCategories}
                onToggleCategory={handleToggleAiCategory}
                error={analysisError}
                flashcards={flashcards}
                flashcardReviews={flashcardReviews}
                onUpdateFlashcardReviews={setFlashcardReviews}
            />
        )}
        {isCharacterModalOpen && (
            <CharacterTrackerModal
                onClose={() => setIsCharacterModalOpen(false)}
                bookText={book.chapters?.map(c => c.content).join(' ') || ''}
                profiles={characterProfiles}
                onProfilesLoaded={setCharacterProfiles}
            />
        )}
        {isTocOpen && book.chapters && (
            <TableOfContentsModal
                chapters={book.chapters}
                currentChapterIndex={currentChapterIndex}
                onSelectChapter={handleSelectChapter}
                onClose={() => setIsTocOpen(false)}
            />
        )}
    </div>
  );
};

export default PlayerView;