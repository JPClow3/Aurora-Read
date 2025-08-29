import { Book, CoreBookData, UserBookData, Profile, AppSettings } from './types';

const DB_NAME = 'AudiobookLibraryDB';
const DB_VERSION = 2;
const BOOK_STORE = 'books';
const USER_DATA_STORE = 'userBookData';
const PROFILE_STORE = 'profiles';
const SETTINGS_STORE = 'profileSettings';


let db: IDBDatabase;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
        return resolve(true);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening DB', request.error);
      reject(false);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(BOOK_STORE)) {
        dbInstance.createObjectStore(BOOK_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(USER_DATA_STORE)) {
        const userDataStore = dbInstance.createObjectStore(USER_DATA_STORE, { keyPath: 'id' });
        userDataStore.createIndex('by-book', 'bookId', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains(PROFILE_STORE)) {
        dbInstance.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(SETTINGS_STORE)) {
         dbInstance.createObjectStore(SETTINGS_STORE, { keyPath: 'profileId' });
      }
    };
  });
};

// --- Book Functions ---

export const addBook = (book: CoreBookData): Promise<CoreBookData> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOK_STORE], 'readwrite');
    const store = transaction.objectStore(BOOK_STORE);
    const request = store.add(book);

    request.onsuccess = () => resolve(book);
    request.onerror = () => {
        console.error('Error adding book', request.error);
        reject(request.error);
    };
  });
};

export const getBooksForProfile = async (profileId: string, defaultSettings: { defaultVoice: any, defaultReaderSettings: any }): Promise<Book[]> => {
    const coreBooks = await new Promise<CoreBookData[]>((resolve, reject) => {
        const transaction = db.transaction([BOOK_STORE], 'readonly');
        const store = transaction.objectStore(BOOK_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const userBookDataMap = await new Promise<Map<string, UserBookData>>((resolve, reject) => {
        const transaction = db.transaction([USER_DATA_STORE], 'readonly');
        const store = transaction.objectStore(USER_DATA_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
            const map = new Map<string, UserBookData>();
            request.result.forEach((data: UserBookData) => {
                if(data.profileId === profileId) {
                    map.set(data.bookId, data);
                }
            });
            resolve(map);
        };
        request.onerror = () => reject(request.error);
    });
    
    // FIX: Refactored the data merging logic to be more robust. This new approach prevents
    // a subtle bug where essential properties from `coreBook` (like 'cover' and 'chapters') could be
    // overwritten or lost, leading to invisible book covers and player crashes.
    return coreBooks.map(coreBook => {
        const userData = userBookDataMap.get(coreBook.id);
        const defaultUserData = {
            progress: 0,
            totalListenTime: 0,
            bookmarks: [],
            annotations: [],
            rate: 1.0,
            voice: defaultSettings.defaultVoice,
            readerSettings: defaultSettings.defaultReaderSettings,
            lastChapterIndex: 0,
            lastSentenceIndex: 0,
        };
        
        // Safely merge user-specific data over the defaults.
        // This ensures that even if `userData` is missing some fields, the defaults will apply.
        const finalUserData = { ...defaultUserData, ...userData };

        // Destructure the problematic compound 'id' from the user data so it doesn't
        // overwrite the correct string 'id' from the core book data.
        const { id, ...userDataWithoutId } = finalUserData;

        // Combine the core book data with the final, clean user data.
        // The spread order ensures `coreBook` properties (like 'id', 'cover', 'chapters') are preserved.
        return { ...coreBook, ...userDataWithoutId };
    });
};

export const updateBook = (book: Book, profileId: string): Promise<Book> => {
    return new Promise((resolve, reject) => {
        const {
            voice, rate, lastPlayed, readerSettings, bookmarks, annotations,
            progress, totalListenTime, finishedAt, rating, lastChapterIndex, lastSentenceIndex, ...coreBookData
        } = book;
        
        const userBookData: UserBookData = {
            id: [profileId, book.id],
            profileId,
            bookId: book.id,
            voice, rate, lastPlayed, readerSettings, bookmarks, annotations,
            progress, totalListenTime, finishedAt, rating, lastChapterIndex, lastSentenceIndex
        };
        
        const transaction = db.transaction([BOOK_STORE, USER_DATA_STORE], 'readwrite');
        const bookStore = transaction.objectStore(BOOK_STORE);
        const userDataStore = transaction.objectStore(USER_DATA_STORE);
        
        // We only update core data that might have changed via "Edit Details"
        bookStore.put(coreBookData as CoreBookData); 
        userDataStore.put(userBookData);

        transaction.oncomplete = () => resolve(book);
        transaction.onerror = () => {
            console.error('Error updating book', transaction.error);
            reject(transaction.error);
        }
    });
};

export const deleteBook = (bookId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([BOOK_STORE, USER_DATA_STORE], 'readwrite');
        const bookStore = transaction.objectStore(BOOK_STORE);
        const userDataStore = transaction.objectStore(USER_DATA_STORE);
        const userDataIndex = userDataStore.index('by-book');

        bookStore.delete(bookId);

        const userDataRequest = userDataIndex.openCursor(IDBKeyRange.only(bookId));
        userDataRequest.onsuccess = () => {
            const cursor = userDataRequest.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        transaction.oncomplete = () => resolve(bookId);
        transaction.onerror = () => {
            console.error('Error deleting book', transaction.error);
            reject(transaction.error);
        };
    });
};

// --- Profile Functions ---

export const getProfiles = (): Promise<Profile[]> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROFILE_STORE], 'readonly');
        const store = transaction.objectStore(PROFILE_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addProfile = (profile: Profile): Promise<Profile> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROFILE_STORE], 'readwrite');
        const store = transaction.objectStore(PROFILE_STORE);
        const request = store.add(profile);
        request.onsuccess = () => resolve(profile);
        request.onerror = () => reject(request.error);
    });
};

// --- Settings Functions ---

export const getProfileSettings = (profileId: string): Promise<AppSettings | null> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get(profileId);
        request.onsuccess = () => resolve(request.result?.settings || null);
        request.onerror = () => reject(request.error);
    });
};

export const saveProfileSettings = (profileId: string, settings: AppSettings): Promise<void> => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.put({ profileId, settings });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};