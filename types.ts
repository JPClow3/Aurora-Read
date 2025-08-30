export enum TTSState {
  IDLE,
  PLAYING,
  PAUSED,
  LOADING,
}

export type ViewMode = 'reading' | 'karaoke' | 'hybrid';
// FIX: Added 'karaoke' to ReadingMode type.
export type ReadingMode = 'scroll' | 'page' | 'karaoke';
// FIX: Added PageTurnAnimation type.
export type PageTurnAnimation = 'slide' | 'fade' | 'scroll';
// FIX: Added 'grey' to Theme type.
export type Theme = 'sepia' | 'light' | 'dark' | 'grey';
// FIX: Added 'dyslexic' to FontFamily type.
export type FontFamily = 'serif' | 'sans' | 'dyslexic';

export interface ReaderSettings {
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: number; // in rem
  lineHeight: number; // multiplier
  // FIX: Added missing properties to support advanced reader settings.
  mode: ReadingMode;
  pageTurnAnimation: PageTurnAnimation;
  margin: number;
  bionicReading: boolean;
  autoScroll: boolean;
  highlightColor: string;
  autoScrollAlignment: 'top' | 'center';
  paperSimulation: boolean;
}

export interface Chapter {
  title: string;
  content: string;
  // FIX: Add optional `href` property to support EPUB chapter navigation and resolve type errors.
  href?: string;
}

export interface CoreBookData {
  // FIX: Added 'id' to serve as the key in IndexedDB and for lookups.
  id: string;
  // FIX: Moved fileName from Book to CoreBookData. fileName is essential, non-user-specific data
  // that must be persisted and retrieved with the core book details to prevent type errors.
  fileName: string;
  title: string;
  author?: string;
  chapters: Chapter[];
  // FIX: Added properties to support library view and editing features.
  cover?: string;
  genre?: string;
  year?: number;
  tags?: string[];
  // FIX: Add `fileType` and optional `epubData` to support different book formats (EPUB/TXT) and resolve type errors.
  fileType: 'epub' | 'txt';
  epubData?: ArrayBuffer;
}

// FIX: Added Annotation type for user highlights and notes.
export interface Annotation {
  id: string;
  sentenceIndex: number;
  color: string;
  note?: string;
}

// FIX: Extended the Book interface with user-specific progress and settings.
export interface Book extends CoreBookData {
  progress?: number;
  totalListenTime?: number;
  bookmarks?: any[];
  annotations?: Annotation[];
  rate?: number;
  voice?: any;
  readerSettings?: ReaderSettings;
  lastChapterIndex?: number;
  lastSentenceIndex?: number;
  finishedAt?: number;
  rating?: number;
  lastPlayed?: number;
  flashcards?: Flashcard[];
  flashcardReviews?: Record<string, FlashcardReview>;
}

export type FlashcardReviewEase = 'hard' | 'medium' | 'easy';

export interface FlashcardReview {
  nextReviewDate: number;
  ease: FlashcardReviewEase;
  interval: number; // in days
}

// FIX: Added UserBookData to model user-specific book data in IndexedDB.
export interface UserBookData {
  id: [string, string]; // [profileId, bookId]
  profileId: string;
  bookId: string;
  progress: number;
  totalListenTime: number;
  bookmarks: any[];
  annotations: Annotation[];
  rate: number;
  voice: any;
  readerSettings: ReaderSettings;
  lastChapterIndex: number;
  lastSentenceIndex: number;
  finishedAt?: number;
  rating?: number;
  lastPlayed?: number;
  flashcards?: Flashcard[];
  flashcardReviews?: Record<string, FlashcardReview>;
}

// FIX: Added Profile type for multi-user support.
export interface Profile {
  id: string;
  name: string;
  avatar: string;
}

// FIX: Added AppSettings to store global user settings like reading history.
export interface AppSettings {
  readingLog: Record<string, number>; // date string -> seconds listened
}

// FIX: Added Flashcard type for learning features.
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

// FIX: Added GlossaryItem type for definitions.
export interface GlossaryItem {
  term: string;
  definition: string;
}

// FIX: Added Comment type for the community feature.
export interface Comment {
    id: string;
    profileId: string;
    profileName: string;
    profileAvatar: string;
    timestamp: number;
    text: string;
}

// FIX: Added SharedQuote type for the community feature.
export interface SharedQuote {
    id: string;
    quote: string;
    bookTitle: string;
    timestamp: number;
    profileId: string;
    likedBy: string[];
    comments: Comment[];
}

export type HighlightCategory = 'plot' | 'character' | 'foreshadowing';

export interface AiHighlight {
  sentenceIndex: number;
  category: HighlightCategory;
}

export interface ChapterAnalysis {
  keyPlotPoints: number[];
  characterIntroductions: number[];
  foreshadowing: number[];
}

export interface CharacterRelationship {
  characterName: string;
  relationship: string;
}

export interface CharacterProfile {
  name: string;
  summary: string;
  relationships: CharacterRelationship[];
}
