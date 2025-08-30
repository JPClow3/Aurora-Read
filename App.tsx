import React, { useState, useCallback, useRef } from 'react';
import { Book } from './types';
import FileUpload from './components/FileUpload';
import PlayerView from './components/PlayerView';
import Loader from './components/Loader';
import { parseFile } from './parser';

const App: React.FC = () => {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This ref is a workaround for a bug where PlayerView's cleanup effect
  // calls onBookUpdate during unmount, which would otherwise prevent
  // navigating back to the library view.
  const isNavigatingBack = useRef(false);

  const handleFileSelect = useCallback(async (file: File) => {
    isNavigatingBack.current = false;
    setError(null);
    setIsLoading(true);
    try {
      const parsedData = await parseFile(file);
      const newBook: Book = {
        ...parsedData,
        id: crypto.randomUUID(),
        fileName: file.name,
      };
      setBook(newBook);
    } catch (err: any) {
      setError(err.message || 'Failed to process file.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBookUpdate = useCallback((updatedBook: Book) => {
    // Don't update state if we are navigating back, to allow PlayerView to unmount.
    // In a real app with persistence, we might save `updatedBook` here.
    if (!isNavigatingBack.current) {
      setBook(updatedBook);
    }
  }, []);

  const handleBackToLibrary = () => {
    isNavigatingBack.current = true;
    setBook(null);
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900/40 text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {isLoading ? (
        <Loader message="Processing your book..." />
      ) : book ? (
        // FIX: Added the required onBookUpdate prop to PlayerView.
        <PlayerView book={book} onBack={handleBackToLibrary} onBookUpdate={handleBookUpdate} />
      ) : (
        <div className="text-center w-full max-w-2xl animate-fade-in">
            <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-500 to-fuchsia-500">
                Aurora Read
            </h1>
            <p className="mt-4 text-lg text-gray-400">
                Upload a book to begin your personalized reading and listening experience.
            </p>
            {error && <p className="mt-4 text-red-400">{error}</p>}
            <div className="mt-8 flex justify-center">
                <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            </div>
        </div>
      )}
    </div>
  );
};

export default App;