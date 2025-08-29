import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Book, Chapter, TTSState, Flashcard, GlossaryItem, Bookmark, Annotation, DefaultReadingMode, ReaderSettings, ReadingMode } from '../types';
import { splitSentences, countWords } from '../utils';
import { synthesizeSpeech } from '../gemini';
import { DEFAULT_READER_SETTINGS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, ListIcon, BookTextIcon, MaximizeIcon, Share2Icon, SparklesIcon, CardsIcon, LightbulbIcon, LanguagesIcon, BookmarkIcon, MessageSquareIcon, PaletteIcon, TrashIcon, XIcon, DownloadIcon, HelpCircleIcon, SlidersHorizontalIcon, BookOpenIcon } from './Icons';
import ReaderView from './ReaderView';
import AudioControls from './AudioControls';
import Modal from './Modal';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import FlashcardViewer from './FlashcardViewer';
import ShareQuoteCard from './ShareQuoteCard';
import GlossaryViewer from './GlossaryViewer';
import TranslateContent from './TranslateContent';
import PlayerSettingsModal from './PlayerSettingsModal';
import AskBookContent from './AskBookContent';
import AnnotationMenu from './AnnotationMenu';

type ModalType = 
    | { type: 'summary'; title: string; content: string | null; error: string | null; isLoading: boolean; }
    | { type: 'flashcards'; title: string; cards: Flashcard[] | null; error: string | null; isLoading: boolean; }
    | { type: 'highlights'; title: string; highlights: string | null; error: string | null; isLoading: boolean; }
    | { type: 'glossary'; title: string; items: GlossaryItem[] | null; error: string | null; isLoading: boolean; }
    | { type: 'translate'; title: string; translatedText: string | null; error: string | null; isLoading: boolean; }
    | { type: 'share'; title: string; quote: string; }
    | { type: 'ask'; title: string; answer: string | null; error: string | null; isLoading: boolean; };

type SidebarTab = 'contents' | 'notes' | 'ai';

interface PlayerViewProps {
    book: Book;
    onBack: (finalTtsState: TTSState) => void;
    onUpdateBook: (book: Partial<Book> & { id: string }) => void;
    onPlay: () => void;
    onShareQuote: (quote: string, bookTitle: string) => void;
    initialMode: DefaultReadingMode;
    initialPlaybackState: 'play' | 'pause';
}

const getAICache = (key: string) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Failed to read from AI cache", e);
        return null;
    }
};

const setAICache = (key: string, value: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("Failed to write to AI cache", e);
        // This can happen if localStorage is full.
    }
};

const base64ToBlob = (base64: string, contentType: string = 'audio/mp3'): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
};

const PlayerView: React.FC<PlayerViewProps> = ({ book, onBack, onUpdateBook, onPlay, onShareQuote, initialMode, initialPlaybackState }) => {
  const [ttsState, setTtsState] = useState<TTSState>(TTSState.IDLE);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(book.lastChapterIndex || 0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(book.lastSentenceIndex || 0);
  const [modalContent, setModalContent] = useState<ModalType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('contents');
  const [isPlayerSettingsOpen, setIsPlayerSettingsOpen] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [jumpRequest, setJumpRequest] = useState<{ type: 'page' | 'percent'; value: number; id: number } | null>(null);
  const [paginationInfo, setPaginationInfo] = useState<{ currentPage: number, totalPages: number }>({ currentPage: 0, totalPages: 0 });
  const [annotationMenu, setAnnotationMenu] = useState<{ sentenceIndex: number; target: HTMLElement; annotation?: Annotation } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [viewMode, setViewMode] = useState<DefaultReadingMode>(initialMode);
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(book.readerSettings || DEFAULT_READER_SETTINGS);

    const [downloadStatus, setDownloadStatus] = useState({
        active: false,
        progress: 0,
        message: '',
        error: '',
        isDone: false,
    });
    const cancelDownloadRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef(new Map<string, string>());
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  // Refs to hold the latest state for use in event handlers, preventing stale closures.
  const chapterIndexRef = useRef(currentChapterIndex);
  const sentenceIndexRef = useRef(currentSentenceIndex);
  const ttsStateRef = useRef(ttsState);
  
  useEffect(() => {
    chapterIndexRef.current = currentChapterIndex;
    sentenceIndexRef.current = currentSentenceIndex;
    ttsStateRef.current = ttsState;
  }, [currentChapterIndex, currentSentenceIndex, ttsState]);
  
  const calculateProgress = useCallback(() => {
    const totalSentencesInBook = book.chapters.reduce((sum, chap) => sum + splitSentences(chap.content).length, 0);
    if (totalSentencesInBook === 0) return 0;
    
    const sentencesRead = book.chapters.slice(0, chapterIndexRef.current).reduce((sum, chap) => sum + splitSentences(chap.content).length, 0) + sentenceIndexRef.current;
    
    return Math.min(100, Math.round((sentencesRead / totalSentencesInBook) * 100));
  }, [book.chapters]);

  // Effect for saving progress
  useEffect(() => {
    const progress = calculateProgress();
    const bookUpdate: Partial<Book> & { id: string } = {
        id: book.id,
        lastChapterIndex: currentChapterIndex,
        lastSentenceIndex: currentSentenceIndex,
        progress: progress
    };
    onUpdateBook(bookUpdate);
  }, [currentChapterIndex, currentSentenceIndex, book.id, onUpdateBook, calculateProgress]);


  useEffect(() => {
    // Sync reader's internal mode with the player's overall view mode.
    if (viewMode === 'karaoke' && readerSettings.mode !== 'karaoke') {
      setReaderSettings(s => ({ ...s, mode: 'karaoke' }));
    } else if (viewMode !== 'karaoke' && readerSettings.mode === 'karaoke') {
      setReaderSettings(s => ({ ...s, mode: 'scroll' }));
    }
  }, [viewMode, readerSettings.mode]);

  const handleReaderSettingsChange = (newSettings: ReaderSettings) => {
    if (viewMode === 'karaoke' && newSettings.mode !== 'karaoke') return;
    setReaderSettings(newSettings);
    onUpdateBook({ id: book.id, readerSettings: newSettings });
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    const updateTime = () => {
        if(audioEl) setCurrentTime(audioEl.currentTime);
    };
    if (ttsState === TTSState.PLAYING) {
      listenTimerRef.current = setInterval(() => {
        onUpdateBook({ id: book.id, totalListenTime: (book.totalListenTime || 0) + 1 });
      }, 1000);
      audioEl?.addEventListener('timeupdate', updateTime);
    } else {
      if (listenTimerRef.current) clearInterval(listenTimerRef.current);
      audioEl?.removeEventListener('timeupdate', updateTime);
    }
    return () => {
      if (listenTimerRef.current) clearInterval(listenTimerRef.current);
      audioEl?.removeEventListener('timeupdate', updateTime);
    };
  }, [ttsState, book.id, book.totalListenTime, onUpdateBook]);


  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsDistractionFree(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  
  const currentVoice = book.voice || 'nova';
  const currentRate = book.rate ?? 1;

  const goToChapter = useCallback((index: number, sentence: number = 0, autoPlay: boolean = false) => {
    if (index >= 0 && index < book.chapters.length) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        setCurrentTime(0);
        setCurrentChapterIndex(index);
        setCurrentSentenceIndex(sentence);

        if (autoPlay || ttsStateRef.current === TTSState.PLAYING) {
            setTtsState(TTSState.PLAYING);
        } else {
            setTtsState(TTSState.IDLE);
        }
    }
  }, [book.chapters.length]);

  const playAudio = useCallback((src: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    if (audio.src !== src) {
        audio.src = src;
    }
    audio.playbackRate = book.rate ?? 1;
    audio.play().then(() => {
        setTtsState(TTSState.PLAYING);
    }).catch(e => {
        console.error("Audio play failed:", e);
        setTtsState(TTSState.IDLE);
    });
  }, [book.rate]);

  // The core fix: A stable `useEffect` to handle the 'ended' event.
  // This effect runs once to attach the listener. The handler inside
  // uses refs to access the LATEST state values, avoiding stale closures.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioEnd = () => {
        const currentSentences = splitSentences(book.chapters[chapterIndexRef.current]?.content || '');
        const nextSentence = sentenceIndexRef.current + 1;

        if (nextSentence < currentSentences.length) {
            setCurrentSentenceIndex(nextSentence);
        } else if (chapterIndexRef.current < book.chapters.length - 1) {
            goToChapter(chapterIndexRef.current + 1, 0, true);
        } else {
            setTtsState(TTSState.IDLE);
        }
    };
    
    audio.addEventListener('ended', handleAudioEnd);
    return () => audio.removeEventListener('ended', handleAudioEnd);
  }, [book.chapters, goToChapter]);

  const prefetchNextAudio = useCallback(async () => {
    const chapIdx = chapterIndexRef.current;
    const sentIdx = sentenceIndexRef.current;
    const voice = book.voice || 'nova';
  
    const currentSentences = splitSentences(book.chapters[chapIdx]?.content || '');
    let nextChapIdx = chapIdx;
    let nextSentIdx = sentIdx + 1;
    let nextSentences = currentSentences;

    if (nextSentIdx >= currentSentences.length) {
        if (chapIdx < book.chapters.length - 1) {
            nextChapIdx = chapIdx + 1;
            nextSentIdx = 0;
            nextSentences = splitSentences(book.chapters[nextChapIdx]?.content || '');
        } else {
            return;
        }
    }

    if (nextSentIdx < nextSentences.length) {
        const cacheKey = `${voice}-${nextChapIdx}-${nextSentIdx}`;
        if (!audioCache.current.has(cacheKey)) {
            const nextSentenceText = nextSentences[nextSentIdx];
            if (nextSentenceText?.trim()) {
                try {
                    const b64 = await synthesizeSpeech(nextSentenceText.trim(), voice);
                    audioCache.current.set(cacheKey, `data:audio/mp3;base64,${b64}`);
                } catch(e) { console.error("Prefetch failed", e); }
            }
        }
    }
  }, [book.chapters, book.voice]);

  const fetchAndPlay = useCallback(async () => {
    const chapterIdx = chapterIndexRef.current;
    const sentenceIdx = sentenceIndexRef.current;
    const voice = book.voice || 'nova';
    const sentences = splitSentences(book.chapters[chapterIdx]?.content || '');
    const sentenceText = sentences[sentenceIdx];

    if (!sentenceText?.trim()) {
      if (sentenceIdx + 1 < sentences.length) {
          setCurrentSentenceIndex(s => s + 1);
      } else if (chapterIdx < book.chapters.length - 1) {
          goToChapter(chapterIdx + 1, 0, true);
      } else {
          setTtsState(TTSState.IDLE);
      }
      return;
    }

    const cacheKey = `${voice}-${chapterIdx}-${sentenceIdx}`;
    let audioSrc = audioCache.current.get(cacheKey);

    if (audioSrc) {
        playAudio(audioSrc);
    } else {
        setTtsState(TTSState.LOADING);
        try {
            const audioBase64 = await synthesizeSpeech(sentenceText.trim(), voice);
            audioSrc = `data:audio/mp3;base64,${audioBase64}`;
            audioCache.current.set(cacheKey, audioSrc);
            playAudio(audioSrc);
        } catch (e) {
            console.error(e);
            setModalContent({ type: 'summary', title: "Playback Error", error: (e as Error).message, content: null, isLoading: false });
            setTtsState(TTSState.IDLE);
        }
    }
  }, [book.chapters, book.voice, playAudio, goToChapter]);
  
  useEffect(() => {
    if (ttsState === TTSState.PLAYING) {
        fetchAndPlay();
        prefetchNextAudio();
    }
  }, [ttsState, currentChapterIndex, currentSentenceIndex, fetchAndPlay, prefetchNextAudio]);
  
  const handlePlay = useCallback(() => {
    if(ttsState === TTSState.IDLE) onPlay();
    
    if (ttsState === TTSState.PAUSED && audioRef.current) {
       audioRef.current.play();
       setTtsState(TTSState.PLAYING);
    } else {
       setTtsState(TTSState.PLAYING);
    }
  }, [onPlay, ttsState]);
  
  useEffect(() => {
      if (initialPlaybackState === 'play' && ttsState === TTSState.IDLE) {
          handlePlay();
      }
  }, [initialPlaybackState, ttsState, handlePlay]);

  const handlePause = () => {
    if(audioRef.current) audioRef.current.pause();
    setTtsState(TTSState.PAUSED);
  };
  
  useEffect(() => {
    if(audioRef.current) audioRef.current.playbackRate = currentRate;
  }, [currentRate]);

  const handleStop = () => {
    if (audioRef.current) audioRef.current.pause();
    setTtsState(TTSState.IDLE);
    setCurrentSentenceIndex(0);
    setCurrentTime(0);
  };

  const handleSkip = (direction: 'backward' | 'forward') => {
    const newIndex = currentSentenceIndex + (direction === 'forward' ? 1 : -1);
    const sentences = splitSentences(book.chapters[currentChapterIndex]?.content || '');
    if (newIndex >= 0 && newIndex < sentences.length) {
      setCurrentSentenceIndex(newIndex);
    } else if (direction === 'forward' && currentChapterIndex < book.chapters.length - 1) {
        goToChapter(currentChapterIndex + 1, 0);
    } else if (direction === 'backward' && currentChapterIndex > 0) {
        const prevChapterSentences = splitSentences(book.chapters[currentChapterIndex - 1]?.content || '');
        goToChapter(currentChapterIndex - 1, prevChapterSentences.length - 1);
    }
  };
  
  const handleProgressChange = (newProgressPercent: number) => {
    if (audioRef.current && audioRef.current.duration) {
        const newTime = (newProgressPercent / 100) * audioRef.current.duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    }
  };
  
  const handleSentenceClick = (index: number) => {
    setCurrentSentenceIndex(index);
    if (viewMode !== 'read_only' && ttsState !== TTSState.IDLE) {
        setTtsState(TTSState.PLAYING);
    }
  };

  const handleToggleBookmark = () => {
    const existingBookmark = book.bookmarks.find(b => b.chapterIndex === currentChapterIndex && b.sentenceIndex === currentSentenceIndex);
    const sentence = splitSentences(book.chapters[currentChapterIndex].content)[currentSentenceIndex];
    const updatedBookmarks = existingBookmark
        ? book.bookmarks.filter(b => b.id !== existingBookmark.id)
        : [...book.bookmarks, { id: crypto.randomUUID(), chapterIndex: currentChapterIndex, sentenceIndex: currentSentenceIndex, textSnippet: sentence.substring(0, 100), createdAt: Date.now() }];
    onUpdateBook({ id: book.id, bookmarks: updatedBookmarks });
  };

  const handleAITask = useCallback(async (taskType: 'summary' | 'flashcards' | 'highlights' | 'glossary' | 'translate' | 'ask', extraData?: any) => {
    const chapter = book.chapters[currentChapterIndex];
    if (!chapter?.content) {
      setModalContent({ type: 'summary', title: 'Error', error: 'No content to process.', content: null, isLoading: false });
      return;
    }

    const cacheKey = `ai-cache:${book.id}:${currentChapterIndex}:${taskType}`;
    const canBeCached = ['summary', 'flashcards', 'highlights', 'glossary'].includes(taskType);
    
    if (canBeCached) {
        const cachedData = getAICache(cacheKey);
        if (cachedData) {
            const types = { summary: 'summary', flashcards: 'flashcards', highlights: 'highlights', glossary: 'glossary' };
            const contentKeys = { summary: 'content', flashcards: 'cards', highlights: 'highlights', glossary: 'items' };
            setModalContent({ type: types[taskType], title: `Chapter ${taskType.charAt(0).toUpperCase() + taskType.slice(1)}`, [contentKeys[taskType]]: cachedData, error: null, isLoading: false } as any);
            return;
        }
    }

    // FIX: Set a type-safe initial loading state for the modal based on the task type.
    // The previous implementation had a logic error and an invalid type comparison.
    switch (taskType) {
        case 'summary':
            setModalContent({ type: 'summary', title: 'Thinking...', content: null, error: null, isLoading: true });
            break;
        case 'flashcards':
            setModalContent({ type: 'flashcards', title: 'Thinking...', cards: null, error: null, isLoading: true });
            break;
        case 'highlights':
            setModalContent({ type: 'highlights', title: 'Thinking...', highlights: null, error: null, isLoading: true });
            break;
        case 'glossary':
            setModalContent({ type: 'glossary', title: 'Thinking...', items: null, error: null, isLoading: true });
            break;
        case 'translate':
            setModalContent({ type: 'translate', title: 'Thinking...', translatedText: null, error: null, isLoading: true });
            break;
        case 'ask':
            setModalContent({ type: 'ask', title: 'Thinking...', answer: null, error: null, isLoading: true });
            break;
    }
    
    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
        let response;
        
        switch (taskType) {
            case 'summary': {
                const prompt = `Summarize the following chapter content in a concise paragraph:\n\n---\n${chapter.content.substring(0, 15000)}\n---`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                const summary = response.text;
                if(canBeCached) setAICache(cacheKey, summary);
                setModalContent({ type: 'summary', title: 'Chapter Summary', content: summary, error: null, isLoading: false });
                break;
            }
            case 'flashcards': {
                const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } }, required: ["question", "answer"] } };
                const prompt = `Create 5-10 flashcards based on the key concepts, characters, and events from the following chapter. Each flashcard should have a clear question and a concise answer.\n\n---\n${chapter.content.substring(0, 15000)}\n---`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
                const cards = JSON.parse(response.text) as Flashcard[];
                if(canBeCached) setAICache(cacheKey, cards);
                setModalContent({ type: 'flashcards', title: 'Flashcards', cards, error: null, isLoading: false });
                break;
            }
             case 'highlights': {
                const prompt = `Identify and extract the 5 most important sentences or key takeaways from this chapter content. Present them as a simple list. \n\n---\n${chapter.content.substring(0, 15000)}\n---`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                const highlights = response.text;
                if(canBeCached) setAICache(cacheKey, highlights);
                setModalContent({ type: 'highlights', title: 'Key Highlights', highlights, error: null, isLoading: false });
                break;
            }
            case 'glossary': {
                const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ["term", "definition"] } };
                const prompt = `Identify 5-7 key terms, names, or concepts from the following chapter that might be unfamiliar to a reader. Provide a brief, one-sentence definition for each. \n\n---\n${chapter.content.substring(0, 15000)}\n---`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
                const items = JSON.parse(response.text) as GlossaryItem[];
                if(canBeCached) setAICache(cacheKey, items);
                setModalContent({ type: 'glossary', title: 'Glossary', items, error: null, isLoading: false });
                break;
            }
            case 'translate': {
                const prompt = `Translate the following text into ${extraData.lang}. Provide only the translated text.\n\n---\n${chapter.content.substring(0, 5000)}\n---`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                setModalContent({ type: 'translate', title: `Translate to ${extraData.lang}`, translatedText: response.text, error: null, isLoading: false });
                break;
            }
            case 'ask': {
                const prompt = `You are a helpful assistant that answers questions based *only* on the provided text. If the answer is not in the text, say so. Here is the text:\n\n---\n${chapter.content.substring(0, 15000)}\n---\n\nQuestion: ${extraData.question}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                setModalContent({ type: 'ask', title: 'Ask the Book', answer: response.text, error: null, isLoading: false });
                break;
            }
        }
    } catch (e) {
      const errorMessage = (e as Error).message || "An unknown error occurred.";
      setModalContent(prev => prev && 'isLoading' in prev ? { ...prev, error: errorMessage, isLoading: false } : { type: 'summary', title: 'Operation Failed', content: null, error: errorMessage, isLoading: false });
    }
  }, [book.id, book.chapters, currentChapterIndex]);

  const handleShareCurrentSentence = () => {
    const sentence = splitSentences(book.chapters[currentChapterIndex].content)[currentSentenceIndex];
    if (sentence) setModalContent({ type: 'share', title: "Share Quote", quote: sentence });
  };

  const handleDownloadImage = useCallback(() => {
    if (shareCardRef.current) {
        import('html-to-image').then(({ toPng }) => {
            toPng(shareCardRef.current!, { cacheBust: true })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `aurora-read-quote.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => console.error('oops, something went wrong!', err));
        });
    }
  }, []);

  const handleSentenceAction = (sentenceIndex: number, target: HTMLElement) => {
    const existingAnnotation = book.annotations.find(a => a.chapterIndex === currentChapterIndex && a.sentenceIndex === sentenceIndex);
    setAnnotationMenu({ sentenceIndex, target, annotation: existingAnnotation });
  };
  
  const handleUpdateAnnotation = (color: string, note?: string) => {
    const { annotations, chapters } = book;
    const existingIndex = annotations.findIndex(a => a.chapterIndex === currentChapterIndex && a.sentenceIndex === annotationMenu!.sentenceIndex);
    let updatedAnnotations;

    if (existingIndex > -1) {
        const updatedAnnotation = { ...annotations[existingIndex], color, note: note || undefined };
        updatedAnnotations = [...annotations];
        updatedAnnotations[existingIndex] = updatedAnnotation;
    } else {
        const sentence = splitSentences(chapters[currentChapterIndex].content)[annotationMenu!.sentenceIndex];
        const newAnnotation: Annotation = { id: crypto.randomUUID(), chapterIndex: currentChapterIndex, sentenceIndex: annotationMenu!.sentenceIndex, textSnippet: sentence.substring(0, 100), color, note, createdAt: Date.now() };
        updatedAnnotations = [...annotations, newAnnotation];
    }
    onUpdateBook({ id: book.id, annotations: updatedAnnotations });
    
    setAnnotationMenu(prev => {
        if (!prev) return null;
        const newAnnotation = updatedAnnotations.find(a => a.sentenceIndex === prev.sentenceIndex && a.chapterIndex === currentChapterIndex);
        return { ...prev, annotation: newAnnotation };
    });
  };

  const handleDeleteAnnotation = () => {
    if (!annotationMenu?.annotation) return;
    const updatedAnnotations = book.annotations.filter(a => a.id !== annotationMenu.annotation!.id);
    onUpdateBook({ id: book.id, annotations: updatedAnnotations });
  };
  
  const isBookmarked = useMemo(() => {
      return book.bookmarks.some(b => b.chapterIndex === currentChapterIndex && b.sentenceIndex === currentSentenceIndex);
  }, [book.bookmarks, currentChapterIndex, currentSentenceIndex]);
  
  const currentChapter = book.chapters[currentChapterIndex];
  const totalDuration = audioRef.current?.duration || 0;
  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
        if (!downloadStatus.active || downloadStatus.progress > 0 || downloadStatus.isDone || downloadStatus.error) return;

        const handleDownload = async () => {
            const JSZip = (window as any).JSZip;
            if (!JSZip) {
                setDownloadStatus(s => ({ ...s, error: "A required dependency (JSZip) could not be loaded." }));
                return;
            }

            const zip = new JSZip();
            const totalSentences = book.chapters.reduce((acc, chap) => acc + splitSentences(chap.content).length, 0);
            let processedSentences = 0;

            for (let chapIdx = 0; chapIdx < book.chapters.length; chapIdx++) {
                if (cancelDownloadRef.current) break;
                const chapter = book.chapters[chapIdx];
                const chapterFolder = zip.folder(chapter.title.replace(/[^a-zA-Z0-9 ]/g, ''));
                const sentences = splitSentences(chapter.content);

                for (let sentIdx = 0; sentIdx < sentences.length; sentIdx++) {
                    if (cancelDownloadRef.current) break;
                    const sentenceText = sentences[sentIdx].trim();
                    
                    setDownloadStatus(s => ({ ...s, progress: (processedSentences / totalSentences) * 100, message: `Synthesizing Ch. ${chapIdx + 1}, Sentence ${sentIdx + 1}` }));

                    if (sentenceText) {
                        try {
                            const audioBase64 = await synthesizeSpeech(sentenceText, book.voice);
                            chapterFolder.file(`sentence_${String(sentIdx + 1).padStart(4, '0')}.mp3`, base64ToBlob(audioBase64));
                        } catch (error) {
                            setDownloadStatus(s => ({ ...s, error: `Failed to synthesize sentence ${sentIdx + 1}: ${(error as Error).message}`}));
                            return;
                        }
                    }
                    processedSentences++;
                }
            }

            if (cancelDownloadRef.current) {
                setDownloadStatus({ active: false, progress: 0, message: '', error: '', isDone: false });
                return;
            }

            setDownloadStatus(s => ({ ...s, progress: 100, message: "Packaging your audiobook..." }));

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `${book.title}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            setDownloadStatus(s => ({ ...s, message: "Download complete!", isDone: true }));
        };

        handleDownload();
  }, [downloadStatus.active, book]);


  const SideBar = () => {
    const notes = useMemo(() => {
        return [...book.annotations, ...book.bookmarks].sort((a, b) => a.chapterIndex - b.chapterIndex || a.sentenceIndex - b.sentenceIndex);
    }, [book.annotations, book.bookmarks]);

    return (
        <div className={`absolute top-0 bottom-0 right-0 w-80 bg-gray-900/80 backdrop-blur-md border-l border-gray-700 transition-transform duration-300 ease-in-out z-30 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <header className="p-3 border-b border-gray-700">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                    <button onClick={() => setSidebarTab('contents')} className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 py-2 px-3 rounded-md font-medium text-sm transition-colors ${sidebarTab === 'contents' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}><ListIcon className="w-5 h-5" /> Contents</button>
                    <button onClick={() => setSidebarTab('notes')} className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 py-2 px-3 rounded-md font-medium text-sm transition-colors ${sidebarTab === 'notes' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}><BookTextIcon className="w-5 h-5" /> Notes</button>
                    <button onClick={() => setSidebarTab('ai')} className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 py-2 px-3 rounded-md font-medium text-sm transition-colors ${sidebarTab === 'ai' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}><SparklesIcon className="w-5 h-5" /> AI Tools</button>
                </nav>
            </header>
            
            {sidebarTab === 'contents' && (
                <div className="p-2 flex-grow overflow-y-auto space-y-1">
                    {book.chapters.map((chapter, index) => (
                        <button key={index} onClick={() => goToChapter(index, 0)} className={`w-full text-left p-2 rounded-md text-sm transition-colors ${index === currentChapterIndex ? 'bg-indigo-600/50 text-white' : 'hover:bg-gray-700/50 text-gray-300'}`}>
                            {chapter.title}
                        </button>
                    ))}
                </div>
            )}
            {sidebarTab === 'notes' && (
                <div className="p-2 flex-grow overflow-y-auto space-y-2">
                    {notes.length === 0 ? <p className="text-center text-gray-400 text-sm p-4">No bookmarks or annotations yet.</p> : notes.map(item => {
                       const isBookmark = 'createdAt' in item && !('color' in item);
                       return (
                            <button key={item.id} onClick={() => goToChapter(item.chapterIndex, item.sentenceIndex)} className="w-full text-left p-2 rounded-md hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-start gap-2">
                                    {isBookmark ? <BookmarkIcon className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" filled /> : <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor: (item as Annotation).color}}/>}
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-200 line-clamp-2">{item.textSnippet}</p>
                                        <p className="text-xs text-gray-400 mt-1">Chapter: {book.chapters[item.chapterIndex]?.title}</p>
                                        {!isBookmark && (item as Annotation).note && <p className="text-xs text-gray-300 mt-1 italic line-clamp-1">Note: {(item as Annotation).note}</p>}
                                    </div>
                                </div>
                            </button>
                       );
                    })}
                </div>
            )}
            {sidebarTab === 'ai' && (
                <div className="p-3 flex-grow overflow-y-auto space-y-2">
                    <button onClick={() => handleAITask('summary')} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-700/50 transition-colors"><LightbulbIcon className="w-5 h-5 text-indigo-400" /> <span className="text-sm">Chapter Summary</span></button>
                    <button onClick={() => handleAITask('flashcards')} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-700/50 transition-colors"><CardsIcon className="w-5 h-5 text-indigo-400" /> <span className="text-sm">Generate Flashcards</span></button>
                    <button onClick={() => handleAITask('highlights')} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-700/50 transition-colors"><SparklesIcon className="w-5 h-5 text-indigo-400" /> <span className="text-sm">Find Key Highlights</span></button>
                    <button onClick={() => handleAITask('glossary')} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-700/50 transition-colors"><BookOpenIcon className="w-5 h-5 text-indigo-400" /> <span className="text-sm">Create Glossary</span></button>
                    <button onClick={() => handleAITask('translate', { lang: 'Spanish' })} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-700/50 transition-colors"><LanguagesIcon className="w-5 h-5 text-indigo-400" /> <span className="text-sm">Translate Chapter</span></button>
                    <button onClick={() => handleAITask('ask')} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-700/50 transition-colors"><HelpCircleIcon className="w-5 h-5 text-indigo-400" /> <span className="text-sm">Ask the Book</span></button>
                    <div className="border-t border-gray-700 my-2"></div>
                    <button onClick={() => { setDownloadStatus({ active: true, progress: 0, message: 'Starting...', error: '', isDone: false }); cancelDownloadRef.current = false; }} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-700/50 transition-colors"><DownloadIcon className="w-5 h-5 text-indigo-400" /> <span className="text-sm">Download Audiobook</span></button>
                </div>
            )}
        </div>
    )
  }

  return (
    <div className={`w-full min-h-screen flex flex-col items-center p-2 sm:p-4 transition-all duration-300 ${isDistractionFree ? 'bg-black' : 'bg-gray-900'}`}>
        <header className={`w-full max-w-7xl flex justify-between items-center mb-4 transition-opacity duration-300 ${isDistractionFree ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button onClick={() => onBack(ttsStateRef.current)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"><ChevronLeftIcon className="w-6 h-6" /> <span className="text-lg font-semibold hidden sm:block">Back to Library</span></button>
            <div className="text-center"><h1 className="text-xl font-bold truncate max-w-xs sm:max-w-md md:max-w-lg">{book.title}</h1><p className="text-sm text-gray-400">{book.author || 'Unknown Author'}</p></div>
            <div className="flex items-center gap-2">
                <button onClick={() => document.body.requestFullscreen().catch(console.error)} className="p-2 rounded-lg hover:bg-gray-800 transition-colors hidden sm:block" title="Distraction Free Mode"><MaximizeIcon className="w-6 h-6" /></button>
                <button onClick={() => setIsSidebarOpen(s => !s)} className="p-2 rounded-lg hover:bg-gray-800 transition-colors"><ListIcon className="w-6 h-6" /></button>
            </div>
        </header>

        <main className="w-full flex-grow flex flex-col items-center justify-center relative overflow-hidden">
            { (viewMode !== 'audio_only' && currentChapter) && (
                 <ReaderView chapter={currentChapter} currentSentenceIndex={currentSentenceIndex} onSentenceClick={handleSentenceClick} settings={readerSettings} jumpRequest={jumpRequest} onPaginationUpdate={setPaginationInfo} annotations={book.annotations.filter(a => a.chapterIndex === currentChapterIndex)} onSentenceAction={handleSentenceAction}
                    headerInfo={ <div className="flex items-center gap-4 text-sm text-gray-400">{readerSettings.mode === 'page' && paginationInfo.totalPages > 0 && <span className="hidden sm:block">{paginationInfo.currentPage + 1} / {paginationInfo.totalPages}</span>}<span>{countWords(currentChapter.content)} words</span></div> }
                    actions={ <> <button onClick={handleToggleBookmark} className="p-2 rounded-full hover:bg-gray-700/50 transition-colors" title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}><BookmarkIcon className="w-5 h-5" filled={isBookmarked} /></button><button onClick={handleShareCurrentSentence} className="p-2 rounded-full hover:bg-gray-700/50 transition-colors" title="Share Current Sentence"><Share2Icon className="w-5 h-5" /></button> </> }
                />
            )}
            
            { viewMode === 'audio_only' && (
                <div className="w-full max-w-md flex-grow flex flex-col items-center justify-center gap-8">
                    <div className="relative aspect-square w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden group">
                        {book.cover ? <img src={book.cover} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-gray-800 to-gray-700"><BookOpenIcon className="w-16 h-16 text-gray-500 mb-2" /></div>}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><p className="text-white font-semibold text-lg">{currentChapter.title}</p></div>
                    </div>
                     <p className="text-center text-gray-300">{splitSentences(currentChapter.content)[currentSentenceIndex] || "Ready to play."}</p>
                </div>
            )}
            <SideBar />
        </main>
        
        { viewMode !== 'read_only' &&
            <footer className={`w-full flex items-center justify-center p-2 fixed bottom-0 transition-opacity duration-300 ${isDistractionFree ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <AudioControls ttsState={ttsState} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} onPrevChapter={() => goToChapter(currentChapterIndex - 1, 0)} onNextChapter={() => goToChapter(currentChapterIndex + 1, 0)} canGoPrev={currentChapterIndex > 0} canGoNext={currentChapterIndex < book.chapters.length - 1} onSkip={handleSkip} rate={currentRate} onRateChange={rate => onUpdateBook({ id: book.id, rate })} onOpenPlayerSettings={() => setIsPlayerSettingsOpen(true)} progress={progressPercent} onProgressChange={handleProgressChange} currentTime={formatTime(currentTime)} duration={formatTime(totalDuration)} />
            </footer>
        }
        
        {modalContent && (
             <Modal title={modalContent.title} onClose={() => setModalContent(null)}>
                {'isLoading' in modalContent && modalContent.isLoading && <Loader message="Thinking..." />}
                {'error' in modalContent && modalContent.error && <ErrorMessage message={modalContent.error} />}
                
                {modalContent.type === 'summary' && modalContent.content && <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{modalContent.content}</p>}
                {modalContent.type === 'flashcards' && modalContent.cards && <FlashcardViewer cards={modalContent.cards} />}
                {modalContent.type === 'highlights' && modalContent.highlights && <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{modalContent.highlights}</p>}
                {modalContent.type === 'glossary' && modalContent.items && <GlossaryViewer items={modalContent.items} />}
                {modalContent.type === 'translate' && <TranslateContent onTranslate={lang => handleAITask('translate', { lang })} isLoading={modalContent.isLoading} error={modalContent.error} translatedText={modalContent.translatedText} />}
                {modalContent.type === 'ask' && <AskBookContent onAsk={question => handleAITask('ask', { question })} isLoading={modalContent.isLoading} error={modalContent.error} answer={modalContent.answer} />}
                {modalContent.type === 'share' && (
                    <div className="flex flex-col items-center gap-6">
                        <ShareQuoteCard ref={shareCardRef} quote={modalContent.quote} bookTitle={book.title} author={book.author} />
                        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
                            <button onClick={handleDownloadImage} className="flex-1 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors active:scale-95 flex items-center justify-center gap-2"><DownloadIcon className="w-5 h-5" /> Download Image</button>
                            <button onClick={() => { onShareQuote(modalContent.quote, book.title); setModalContent(null); }} className="flex-1 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors hc-primary active:scale-95 flex items-center justify-center gap-2"><Share2Icon className="w-5 h-5" /> Share to Community</button>
                        </div>
                    </div>
                )}
            </Modal>
        )}
        
        {isPlayerSettingsOpen && <PlayerSettingsModal onClose={() => setIsPlayerSettingsOpen(false)} book={book} onUpdateBook={onUpdateBook} readerSettings={readerSettings} onReaderSettingsChange={handleReaderSettingsChange} viewMode={viewMode} onViewModeChange={setViewMode} />}
        {annotationMenu && <AnnotationMenu target={annotationMenu.target} annotation={annotationMenu.annotation} onUpdate={handleUpdateAnnotation} onDelete={handleDeleteAnnotation} onClose={() => setAnnotationMenu(null)} />}
        {downloadStatus.active && (
            <Modal title="Downloading Audiobook" onClose={() => downloadStatus.isDone || downloadStatus.error ? setDownloadStatus({ active: false, progress: 0, message: '', error: '', isDone: false }) : (cancelDownloadRef.current = true)}>
                <div className="flex flex-col items-center gap-4">
                    <p className="text-lg text-gray-300">{downloadStatus.message}</p>
                    <div className="w-full bg-gray-700 rounded-full h-4"><div className="bg-indigo-500 h-4 rounded-full transition-all duration-300" style={{ width: `${downloadStatus.progress}%` }}></div></div>
                    <p className="font-mono text-xl">{Math.round(downloadStatus.progress)}%</p>
                    {downloadStatus.error && <ErrorMessage message={downloadStatus.error} />}
                    {downloadStatus.isDone && <p className="text-green-400">Your download should begin shortly!</p>}
                    {downloadStatus.isDone || downloadStatus.error ? <button onClick={() => setDownloadStatus({ active: false, progress: 0, message: '', error: '', isDone: false })} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500">Close</button> : <button onClick={() => { cancelDownloadRef.current = true; setDownloadStatus(s => ({ ...s, message: 'Cancelling...' })); }} className="mt-4 px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600">Cancel</button>}
                </div>
            </Modal>
        )}
    </div>
  );
};

export default PlayerView;