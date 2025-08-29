import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

import FileUpload from './components/FileUpload';
import { BookOpenIcon, PlusIcon, SettingsIcon, UsersIcon, UserIcon, LogOutIcon, SearchIcon, SortIcon } from './components/Icons';
import { Book, SharedQuote, AppSettings, SortOrder, Profile, CoreBookData, DefaultReadingMode, TTSState } from './types';
import * as db from './db';
import { parseEpub, parsePdf, parseText } from './parser';
import { DEFAULT_READER_SETTINGS, SHARED_QUOTES_KEY } from './constants';
import Loader from './components/Loader';
import PlayerView from './components/PlayerView';
import LibraryView from './components/LibraryView';
import CommunityView from './components/CommunityView';
import ProfileView from './components/ProfileView';
import Modal from './components/Modal';
import ErrorMessage from './components/ErrorMessage';
import EditBookModal from './components/EditBookModal';
import ReaderSettingsPanel from './components/ReaderSettingsPanel';
import { GEMINI_VOICES } from './gemini';
import ProfileSelection from './components/ProfileSelection';
import MiniPlayer from './components/MiniPlayer';
import { generateAvatarSvg } from './utils';

const LAST_PROFILE_KEY = 'aurora_last_profile_id';
type ActiveTab = 'library' | 'community' | 'profile';

const DEFAULT_APP_SETTINGS: AppSettings = {
    highContrast: false,
    sortOrder: 'creationDate',
    defaultVoice: 'nova',
    defaultReaderSettings: DEFAULT_READER_SETTINGS,
    defaultReadingMode: 'hybrid',
    readingGoal: 30,
    readingLog: {},
};

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  const [library, setLibrary] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [lastActiveBook, setLastActiveBook] = useState<Book | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [sharedQuotes, setSharedQuotes] = useState<SharedQuote[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for MiniPlayer and PlayerView integration
  const [lastTtsState, setLastTtsState] = useState<TTSState | null>(null);
  const [playerInitialState, setPlayerInitialState] = useState<'play' | 'pause'>('pause');
  
  // State for community likes
  const [likedQuoteIds, setLikedQuoteIds] = useState<Set<string>>(new Set());
  
  const cancelationRef = useRef(false);
  const progressUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bookToSaveRef = useRef<Book | null>(null);

  useEffect(() => {
    bookToSaveRef.current = selectedBook;
  }, [selectedBook]);


  useEffect(() => {
    async function init() {
        try {
            await db.initDB();
            setIsDbReady(true);

            const allProfiles = await db.getProfiles();
            setProfiles(allProfiles);

            const lastProfileId = localStorage.getItem(LAST_PROFILE_KEY);
            const lastProfile = allProfiles.find(p => p.id === lastProfileId);
            
            if (lastProfile) {
                handleSelectProfile(lastProfile);
            } else if (allProfiles.length === 1) {
                handleSelectProfile(allProfiles[0]);
            }

            const storedQuotes = localStorage.getItem(SHARED_QUOTES_KEY);
            if (storedQuotes) setSharedQuotes(JSON.parse(storedQuotes));
        } catch (e) {
            console.error("Failed to initialize DB or load profiles", e);
            setError("Could not load data. Please try refreshing the page.");
        }
    }
    init();
  }, []);

  const handleSelectProfile = async (profile: Profile) => {
    setCurrentProfile(profile);
    localStorage.setItem(LAST_PROFILE_KEY, profile.id);
    
    // Load profile-specific settings
    const settings = await db.getProfileSettings(profile.id);
    setAppSettings(settings || DEFAULT_APP_SETTINGS);

    // Load profile-specific community likes
    const likedQuotesKey = `aurora_liked_quotes_${profile.id}`;
    const storedLikedIds = localStorage.getItem(likedQuotesKey);
    setLikedQuoteIds(storedLikedIds ? new Set(JSON.parse(storedLikedIds)) : new Set());

    // Load profile-specific library view
    setIsLoading(true);
    setLoadingMessage(`Loading ${profile.name}'s library...`);
    const books = await db.getBooksForProfile(profile.id, {
        defaultVoice: settings?.defaultVoice || DEFAULT_APP_SETTINGS.defaultVoice,
        defaultReaderSettings: settings?.defaultReaderSettings || DEFAULT_APP_SETTINGS.defaultReaderSettings,
    });
    setLibrary(books);

    const mostRecentBook = books.reduce((latest, book) => {
      if (!book.lastPlayed) return latest;
      if (!latest || book.lastPlayed > (latest.lastPlayed || 0)) {
        return book;
      }
      return latest;
    }, null as Book | null);

    setLastActiveBook(mostRecentBook);

    setIsLoading(false);
    setLoadingMessage('');
  };

  const handleCreateProfile = async (name: string, avatar: string) => {
    try {
        const newProfile: Profile = { id: crypto.randomUUID(), name, avatar };
        await db.addProfile(newProfile);
        await db.saveProfileSettings(newProfile.id, DEFAULT_APP_SETTINGS);
        setProfiles(prev => [...prev, newProfile]);
        handleSelectProfile(newProfile);
    } catch (err) {
        console.error("Failed to create profile:", err);
        setError("Could not create the new profile. Please try again.");
    }
  };
  
  const handleSwitchProfile = () => {
    setSelectedBook(null); // Deselect book when switching profile
    setCurrentProfile(null);
    setLibrary([]);
    setLastActiveBook(null);
    setLastTtsState(null);
    localStorage.removeItem(LAST_PROFILE_KEY);
  }

  useEffect(() => {
      if (!currentProfile) return;
      document.body.classList.toggle('high-contrast', appSettings.highContrast);
      try {
          db.saveProfileSettings(currentProfile.id, appSettings);
      } catch (e) { console.error("Failed to save settings", e); }
  }, [appSettings, currentProfile]);

  const saveSharedQuotes = (quotes: SharedQuote[]) => {
    try {
        localStorage.setItem(SHARED_QUOTES_KEY, JSON.stringify(quotes));
        setSharedQuotes(quotes);
    } catch (e) {
        console.error("Failed to save shared quotes", e);
    }
  };
  
  const handleShareQuote = (quote: string, bookTitle: string) => {
    const newQuote: SharedQuote = {
        id: crypto.randomUUID(),
        quote,
        bookTitle,
        timestamp: Date.now(),
        likes: 0,
    };
    saveSharedQuotes([newQuote, ...sharedQuotes]);
  };
  
  const handleToggleLikeQuote = (quoteId: string) => {
    if (!currentProfile) return;

    const newLikedIds = new Set(likedQuoteIds);
    const isLiked = newLikedIds.has(quoteId);

    const updatedQuotes = sharedQuotes.map(q => {
        if (q.id === quoteId) {
            return { ...q, likes: q.likes + (isLiked ? -1 : 1) };
        }
        return q;
    });

    if (isLiked) {
        newLikedIds.delete(quoteId);
    } else {
        newLikedIds.add(quoteId);
    }

    setLikedQuoteIds(newLikedIds);
    saveSharedQuotes(updatedQuotes); // This saves quotes to localStorage and updates state
    localStorage.setItem(`aurora_liked_quotes_${currentProfile.id}`, JSON.stringify(Array.from(newLikedIds)));
  };

  const filteredAndSortedBooks = useMemo(() => {
      let filtered = library;

      if (searchTerm) {
          const lowercasedTerm = searchTerm.toLowerCase();
          filtered = library.filter(book => 
              book.title.toLowerCase().includes(lowercasedTerm) ||
              book.author?.toLowerCase().includes(lowercasedTerm) ||
              book.tags?.some(tag => tag.toLowerCase().includes(lowercasedTerm)) ||
              book.chapters.some(chapter => chapter.content.toLowerCase().includes(lowercasedTerm))
          );
      }

      return [...filtered].sort((a, b) => {
          switch (appSettings.sortOrder) {
              case 'title':
                  return a.title.localeCompare(b.title);
              case 'author':
                  return (a.author || 'zzz').localeCompare(b.author || 'zzz');
              case 'length':
                  return (b.wordCount || 0) - (a.wordCount || 0);
              case 'lastPlayed':
                  return (b.lastPlayed || 0) - (a.lastPlayed || 0);
              case 'creationDate':
              default:
                  return (b.createdAt || 0) - (a.createdAt || 0);
          }
      });
  }, [library, appSettings.sortOrder, searchTerm]);
  
  const sortedQuotes = useMemo(() => {
      return [...sharedQuotes].sort((a, b) => b.timestamp - a.timestamp);
  }, [sharedQuotes]);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (!currentProfile) return;
    setError(null);
    setIsLoading(true);
    cancelationRef.current = false;
    
    for (const [index, file] of files.entries()) {
        if (cancelationRef.current) break;
        setLoadingMessage(`Processing file ${index + 1} of ${files.length}: ${file.name}`);
        try {
            let parsedData: Omit<CoreBookData, 'id' | 'fileName' | 'createdAt'>;

            if (file.type === 'application/pdf') {
                parsedData = await parsePdf(file, (msg) => setLoadingMessage(`${file.name}: ${msg}`), cancelationRef);
            } else if (file.name.endsWith('.epub')) {
                parsedData = await parseEpub(file, (msg) => setLoadingMessage(`${file.name}: ${msg}`), cancelationRef);
            } else if (file.type === 'text/plain' || file.name.endsWith('.md')) {
                parsedData = await parseText(file);
            } else {
                console.warn(`Unsupported file type: ${file.name}`);
                continue;
            }

            const newCoreBook: CoreBookData = { 
                ...parsedData, 
                id: crypto.randomUUID(), 
                fileName: file.name,
                createdAt: Date.now(),
            };
            await db.addBook(newCoreBook);
        } catch (err: any) {
            if (err.message !== "Cancelled by user.") {
                setError(`Failed to process ${file.name}: ${err.message || 'An unknown error occurred'}`);
            }
        }
    }

    // Refresh library for current user
    if (currentProfile) {
        const books = await db.getBooksForProfile(currentProfile.id, {
            defaultVoice: appSettings.defaultVoice,
            defaultReaderSettings: appSettings.defaultReaderSettings,
        });
        setLibrary(books);
    }

    setIsLoading(false);
    setLoadingMessage('');
    if (!cancelationRef.current && files.length > 0) {
        setIsUploading(false);
    }
  }, [currentProfile, appSettings]);


  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm("Are you sure you want to delete this book? This will remove it for all profiles.")) {
        try {
            await db.deleteBook(bookId);
            setLibrary(prev => prev.filter(b => b.id !== bookId));
            if (selectedBook?.id === bookId) {
                setSelectedBook(null);
            }
            if (lastActiveBook?.id === bookId) {
                setLastActiveBook(null);
                setLastTtsState(null);
            }
        } catch (e) {
            setError("Failed to delete book from library.");
            console.error(e);
        }
    }
  };
  
  const handleTimeUpdate = useCallback((seconds: number) => {
    setAppSettings(prev => {
        const today = new Date().toISOString().split('T')[0];
        const newLog = { ...prev.readingLog };
        newLog[today] = (newLog[today] || 0) + seconds;
        return { ...prev, readingLog: newLog };
    });
  }, []);

  const flushUpdatesToDb = useCallback(async (): Promise<void> => {
    if (progressUpdateTimerRef.current) {
        clearTimeout(progressUpdateTimerRef.current);
        progressUpdateTimerRef.current = null;
    }
    if (bookToSaveRef.current && currentProfile) {
        try {
            await db.updateBook(bookToSaveRef.current, currentProfile.id);
        } catch (e) {
            setError("Failed to save book progress.");
            console.error(e);
        }
    }
  }, [currentProfile]);
  
  const handleUpdateBook = useCallback((updatedBookData: Partial<Book> & { id: string }) => {
    if (!currentProfile) return;

    setLibrary(prevLibrary => {
      const bookIndex = prevLibrary.findIndex(b => b.id === updatedBookData.id);

      if (bookIndex === -1) {
        // This prevents the update and subsequent logic from running, fixing the warning.
        console.warn("Attempted to update a book not in the library:", updatedBookData.id);
        return prevLibrary;
      }

      const oldBook = prevLibrary[bookIndex];
      const fullUpdatedBook = { ...oldBook, ...updatedBookData };

      // Handle marking the book as finished
      if (fullUpdatedBook.progress === 100 && oldBook.progress < 100) {
        fullUpdatedBook.finishedAt = Date.now();
      }

      // Handle time update
      if (fullUpdatedBook.totalListenTime > oldBook.totalListenTime) {
        const secondsIncrement = fullUpdatedBook.totalListenTime - oldBook.totalListenTime;
        handleTimeUpdate(secondsIncrement);
      }

      // Use functional updates for other states to avoid stale closures.
      setSelectedBook(currentSelected => 
        currentSelected?.id === fullUpdatedBook.id ? fullUpdatedBook : currentSelected
      );
      setLastActiveBook(currentLastActive => 
        currentLastActive?.id === fullUpdatedBook.id ? fullUpdatedBook : currentLastActive
      );

      // Update the ref for debounced saving
      bookToSaveRef.current = fullUpdatedBook;

      // Clear any pending save and set a new one
      if (progressUpdateTimerRef.current) clearTimeout(progressUpdateTimerRef.current);

      const isMetadataUpdate = 'title' in updatedBookData || 'author' in updatedBookData || 'tags' in updatedBookData;

      // For frequent progress updates, debounce the DB write.
      // For explicit metadata changes (like editing details), save immediately.
      if (!isMetadataUpdate) {
        progressUpdateTimerRef.current = setTimeout(() => flushUpdatesToDb(), 2000);
      } else {
        // This is async, but we can't await it here. Fire-and-forget is acceptable.
        flushUpdatesToDb();
      }

      // Construct the new library state
      const newLibrary = [...prevLibrary];
      newLibrary[bookIndex] = fullUpdatedBook;
      return newLibrary;
    });
  }, [currentProfile, handleTimeUpdate, flushUpdatesToDb]);
  
  const handleBookPlayed = useCallback(async (bookId: string) => {
    const bookToUpdate = library.find(b => b.id === bookId);
    if (bookToUpdate) {
        await handleUpdateBook({ id: bookToUpdate.id, lastPlayed: Date.now() });
        setLastActiveBook(prev => ({ ...prev!, lastPlayed: Date.now() }));
    }
  }, [library, handleUpdateBook]);
  
  const handleSelectBook = (book: Book) => {
    const initialState = (lastTtsState === TTSState.PLAYING || lastTtsState === TTSState.LOADING) ? 'play' : 'pause';
    setPlayerInitialState(initialState);
    setSelectedBook(book);
    setLastActiveBook(book);
  };
  
  const handleToggleMiniPlayerState = () => {
    setLastTtsState(prev => (prev === TTSState.PLAYING || prev === TTSState.LOADING) ? TTSState.PAUSED : TTSState.PLAYING);
  };

  const MainContent = () => {
    if (!isDbReady) {
        return <Loader message="Initializing..." />;
    }

    if (!currentProfile) {
        return <ProfileSelection profiles={profiles} onSelectProfile={handleSelectProfile} onCreateProfile={handleCreateProfile} />;
    }

    if (isLoading) {
        return <Loader message={loadingMessage} />;
    }

    if (selectedBook) {
      return <PlayerView 
        book={selectedBook} 
        onBack={(finalState) => {
            flushUpdatesToDb().finally(() => {
              // When returning to library, if playback was active, set state to paused.
              // If it was idle, it remains idle. This represents user's intent.
              if (finalState === TTSState.PLAYING || finalState === TTSState.LOADING) {
                  setLastTtsState(TTSState.PAUSED);
              } else {
                  setLastTtsState(finalState);
              }
              setSelectedBook(null);
            });
        }} 
        onUpdateBook={handleUpdateBook} 
        onPlay={() => handleBookPlayed(selectedBook.id)} 
        onShareQuote={handleShareQuote} 
        initialMode={appSettings.defaultReadingMode}
        initialPlaybackState={playerInitialState}
      />;
    }

    const ReadingGoalProgress = () => {
        const today = new Date().toISOString().split('T')[0];
        const goalMinutes = appSettings.readingGoal || 30;
        const safeGoalMinutes = goalMinutes > 0 ? goalMinutes : 30;
        const listenedSeconds = appSettings.readingLog?.[today] || 0;
        const listenedMinutes = Math.floor(listenedSeconds / 60);
        const progressPercent = Math.min((listenedMinutes / safeGoalMinutes) * 100, 100);
        
        return (
            <div className="w-48" title={`${listenedMinutes} of ${goalMinutes} minutes listened today`}>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-300">Daily Goal</span>
                    <span className="text-xs font-medium text-gray-400">{listenedMinutes} / {goalMinutes} min</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 hc-border">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500 hc-accent-bg" style={{width: `${progressPercent}%`}}></div>
                </div>
            </div>
        )
    };
    
    const ProfileSwitcher = () => {
        return (
            <div className="relative group">
                 <button className="p-2 bg-gray-700/80 rounded-full hover:bg-gray-700 transition-colors active:scale-95 flex items-center gap-2">
                    <img src={generateAvatarSvg(currentProfile.avatar)} alt="avatar" className="w-8 h-8 rounded-full bg-gray-800 object-cover" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                    <div className="px-3 py-2 border-b border-gray-700">
                        <p className="text-sm font-semibold text-white truncate">{currentProfile.name}</p>
                    </div>
                    <button onClick={handleSwitchProfile} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                        <LogOutIcon className="w-4 h-4" />
                        Switch Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
      <>
        <header className="w-full max-w-7xl flex justify-between items-center mb-6 px-2 gap-4">
            <div className='text-left'>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-500 to-fuchsia-500 hc-text">
                Aurora Read
                </h1>
                <p className="mt-2 text-lg text-gray-400 hc-dim-text">Your personal collection of listenable stories.</p>
            </div>
            <div className="flex items-center gap-4">
                {activeTab === 'library' && <ReadingGoalProgress />}
                <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-gray-700/80 rounded-full hover:bg-gray-700 flex-shrink-0 transition-colors active:scale-95" title="Settings">
                    <SettingsIcon className="w-6 h-6"/>
                </button>
                <ProfileSwitcher />
            </div>
        </header>
        
        <div className={`w-full max-w-7xl transition-all duration-300 ${lastActiveBook && !selectedBook ? 'pb-24' : ''}`}>
            <div className="mb-6 border-b border-gray-700 hc-border">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('library')} className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'library' ? 'border-indigo-500 text-indigo-400 hc-accent-border hc-accent-text' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        <BookOpenIcon className="w-5 h-5" /> My Library
                    </button>
                    <button onClick={() => setActiveTab('community')} className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'community' ? 'border-indigo-500 text-indigo-400 hc-accent-border hc-accent-text' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        <UsersIcon className="w-5 h-5" /> Community
                    </button>
                    <button onClick={() => setActiveTab('profile')} className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-400 hc-accent-border hc-accent-text' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        <UserIcon className="w-5 h-5" /> Profile
                    </button>
                </nav>
            </div>
            
            {activeTab === 'library' && (
                <>
                    <div className="w-full flex flex-col sm:flex-row gap-4 mb-6 px-1">
                        <div className="relative flex-grow">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search title, author, tag, or content..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-800/80 text-white text-base rounded-md p-2 pl-10 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="relative">
                           <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                           <select value={appSettings.sortOrder} onChange={e => setAppSettings(s => ({...s, sortOrder: e.target.value as SortOrder}))} className="w-full sm:w-auto bg-gray-800/80 text-white text-base rounded-md p-2 pl-10 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none">
                                <option value="creationDate">Creation Date</option>
                                <option value="lastPlayed">Last Played</option>
                                <option value="title">Title</option>
                                <option value="author">Author</option>
                                <option value="length">Length</option>
                            </select>
                        </div>
                    </div>
                    <LibraryView books={filteredAndSortedBooks} onSelectBook={handleSelectBook} onDeleteBook={handleDeleteBook} onEditBook={setEditingBook} />
                </>
            )}
            {activeTab === 'community' && <CommunityView quotes={sortedQuotes} onToggleLike={handleToggleLikeQuote} likedQuoteIds={likedQuoteIds} />}
            {activeTab === 'profile' && <ProfileView library={library} appSettings={appSettings} />}
        </div>
        
        <button onClick={() => setIsUploading(true)} className="fixed bottom-6 right-6 sm:bottom-8 sm-right-8 p-4 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 hc-primary z-40 active:scale-95" aria-label="Add new book">
            <PlusIcon className="w-7 h-7" />
        </button>

        {lastActiveBook && !selectedBook && (
            <MiniPlayer 
                book={lastActiveBook}
                ttsState={lastTtsState}
                onTogglePlayPause={handleToggleMiniPlayerState}
                onSelect={() => handleSelectBook(lastActiveBook)}
            />
        )}
      </>
    );
  };
  
  const handleCancelUpload = () => {
    cancelationRef.current = true;
    setIsLoading(false);
    setIsUploading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900/40 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 hc-bg">
      <main className="flex-grow w-full flex flex-col items-center justify-start gap-8">
        <MainContent />
      </main>
      
      {isUploading && currentProfile && (
          <Modal onClose={() => isLoading ? handleCancelUpload() : setIsUploading(false)} title="Upload a new book">
              {isLoading ? (
                <Loader message={loadingMessage || "Processing your file..."} onCancel={handleCancelUpload} />
              ) : (
                <>
                    {error && <div className='mb-4'><ErrorMessage message={error}/></div>}
                    <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
                </>
              )}
          </Modal>
      )}

      {editingBook && currentProfile && (
        <EditBookModal
            book={editingBook}
            onClose={() => setEditingBook(null)}
            onSave={async (updatedBook) => {
                await handleUpdateBook(updatedBook);
                setEditingBook(null);
            }}
        />
      )}

      {isSettingsOpen && currentProfile && (
        <Modal onClose={() => setIsSettingsOpen(false)} title="Settings">
            <div className="flex flex-col gap-6 text-gray-200">
                <h3 className="text-lg font-semibold text-indigo-300 border-b border-gray-600 pb-2">General</h3>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <label htmlFor="highContrastToggle" className="text-lg hc-text">High Contrast Mode</label>
                        <p className="text-sm text-gray-400 hc-dim-text">Improves visibility and readability.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="highContrastToggle" className="sr-only peer" checked={appSettings.highContrast} onChange={() => setAppSettings(s => ({...s, highContrast: !s.highContrast}))}/>
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
                
                <h3 className="text-lg font-semibold text-indigo-300 border-b border-gray-600 pb-2 mt-2">Goals</h3>
                <div className="flex items-center justify-between">
                    <label htmlFor="readingGoal" className="text-lg hc-text">Daily Listening Goal</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            id="readingGoal" 
                            value={appSettings.readingGoal || 30} 
                            onChange={e => setAppSettings(s => ({...s, readingGoal: parseInt(e.target.value, 10) || 0}))} 
                            className="bg-gray-700 text-white w-24 text-base rounded-md p-2 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            min="0"
                        />
                        <span className="text-gray-400">minutes</span>
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-indigo-300 border-b border-gray-600 pb-2 mt-2">Library</h3>
                <div className="flex items-center justify-between">
                    <label htmlFor="sortOrderModal" className="text-lg hc-text">Default Sort Order</label>
                    <select id="sortOrderModal" value={appSettings.sortOrder} onChange={e => setAppSettings(s => ({...s, sortOrder: e.target.value as SortOrder}))} className="bg-gray-700 text-white text-base rounded-md p-2 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                        <option value="creationDate">Creation Date</option>
                        <option value="lastPlayed">Last Played</option>
                        <option value="title">Title</option>
                        <option value="author">Author</option>
                        <option value="length">Length</option>
                    </select>
                </div>
                 <div>
                    <label className="text-lg hc-text">Default Experience</label>
                    <p className="text-sm text-gray-400 hc-dim-text mb-2">Choose how books open by default.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(['hybrid', 'karaoke', 'read_only', 'audio_only'] as DefaultReadingMode[]).map(mode => (
                            <button key={mode} onClick={() => setAppSettings(s => ({...s, defaultReadingMode: mode}))} className={`capitalize w-full p-2 rounded-md border-2 transition-colors text-sm ${appSettings.defaultReadingMode === mode ? 'border-indigo-400 bg-indigo-900/30' : 'border-gray-600 hover:border-gray-500'}`}>
                                {mode.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-indigo-300 border-b border-gray-600 pb-2 mt-2">Defaults</h3>
                 <div className="flex items-center justify-between">
                    <label htmlFor="defaultVoiceModal" className="text-lg hc-text">Default Voice</label>
                    <select id="defaultVoiceModal" value={appSettings.defaultVoice} onChange={e => setAppSettings(s => ({...s, defaultVoice: e.target.value as any}))} className="bg-gray-700 text-white text-base rounded-md p-2 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                       {GEMINI_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
                 <details className="bg-gray-900/50 rounded-lg p-2 border border-gray-700/50">
                    <summary className="text-lg font-medium cursor-pointer p-2 rounded hover:bg-gray-700/50">Default Reader Settings</summary>
                    <div className="p-4 mt-2 border-t border-gray-700">
                        <ReaderSettingsPanel
                            settings={appSettings.defaultReaderSettings}
                            onSettingsChange={newSettings => setAppSettings(s => ({...s, defaultReaderSettings: newSettings}))}
                        />
                    </div>
                </details>
            </div>
        </Modal>
      )}

    </div>
  );
};

export default App;