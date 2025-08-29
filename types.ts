

export enum TTSState {
  IDLE,
  PLAYING,
  PAUSED,
  LOADING,
}

export type GeminiVoice = 'echo' | 'onyx' | 'shimmer' | 'alloy' | 'fable' | 'nova';

export type ReadingMode = 'karaoke' | 'scroll' | 'page';
export type Theme = 'dark' | 'light' | 'sepia' | 'grey';
export type FontFamily = 'sans' | 'serif' | 'dyslexic';
export type PageTurnAnimation = 'slide' | 'fade' | 'scroll';

export interface ReaderSettings {
  mode: ReadingMode;
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: number; // in rem
  lineHeight: number; // multiplier
  margin: number; // in rem
  highlightColor: string; // hex color
  autoScroll: boolean;
  autoScrollAlignment: 'center' | 'top';
  pageTurnAnimation: PageTurnAnimation;
}

export interface Bookmark {
  id: string;
  chapterIndex: number;
  sentenceIndex: number;
  textSnippet: string;
  createdAt: number;
}

export interface Annotation {
  id:string;
  chapterIndex: number;
  sentenceIndex: number;
  textSnippet: string;
  color: string; // hex color for annotation highlight
  note?: string;
  createdAt: number;
}


export interface Chapter {
  title: string;
  content: string;
}

// This is the combined type used by components. It's a merge of CoreBookData and UserBookData.
export interface Book {
  // Core Data
  id:string;
  fileName: string;
  title: string;
  author?: string;
  genre?: string;
  year?: number;
  tags?: string[];
  chapters: Chapter[];
  cover?: string;
  createdAt: number;
  wordCount?: number;

  // User-specific Data
  voice: GeminiVoice;
  rate: number;
  lastPlayed?: number;
  readerSettings: ReaderSettings;
  bookmarks: Bookmark[];
  annotations: Annotation[];
  progress: number;
  totalListenTime: number;
  finishedAt?: number;
  rating?: number;
  lastChapterIndex?: number;
  lastSentenceIndex?: number;
}


// New type for a user profile
export interface Profile {
  id: string;
  name: string;
  avatar: string; // e.g., 'avatar-1'
}

// New type for shared book data stored in the 'books' object store
export interface CoreBookData {
    id:string;
    fileName: string;
    title: string;
    author?: string;
    genre?: string;
    year?: number;
    tags?: string[];
    chapters: Chapter[];
    cover?: string; 
    createdAt: number;
    wordCount?: number;
}

// New type for user-specific book data stored in the 'userBookData' object store
export interface UserBookData {
    id: [string, string]; // Compound key: [profileId, bookId]
    profileId: string;
    bookId: string;
    voice: GeminiVoice;
    rate: number;
    lastPlayed?: number;
    readerSettings: ReaderSettings;
    bookmarks: Bookmark[];
    annotations: Annotation[];
    progress: number;
    totalListenTime: number;
    finishedAt?: number;
    rating?: number;
    lastChapterIndex?: number;
    lastSentenceIndex?: number;
}


export interface Flashcard {
    question: string;
    answer: string;
}

export interface GlossaryItem {
    term: string;
    definition: string;
}

export interface SharedQuote {
  id: string;
  quote: string;
  bookTitle: string;
  timestamp: number;
  likes: number;
}

export interface PlayerSettings {
  voice: GeminiVoice;
  rate: number;
}

export type SortOrder = 'creationDate' | 'lastPlayed' | 'title' | 'author' | 'length';
export type DefaultReadingMode = 'karaoke' | 'hybrid' | 'read_only' | 'audio_only';

// AppSettings are now per-profile.
export interface AppSettings {
    highContrast: boolean;
    sortOrder: SortOrder;
    defaultVoice: GeminiVoice;
    defaultReaderSettings: ReaderSettings;
    defaultReadingMode: DefaultReadingMode;
    readingGoal?: number; // in minutes
    readingLog: Record<string, number>; // { 'YYYY-MM-DD': secondsListened }
}