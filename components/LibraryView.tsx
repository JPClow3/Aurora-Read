import React from 'react';
import { Book } from '../types';
import { BookOpenIcon, EditIcon, TrashIcon, StarIcon } from './Icons';

const LibraryView: React.FC<{ books: Book[]; onSelectBook: (book: Book) => void; onDeleteBook: (bookId: string) => void; onEditBook: (book: Book) => void; }> = ({ books, onSelectBook, onDeleteBook, onEditBook }) => {
  if (books.length === 0) {
    return (
        <div className="w-full text-center py-20 px-6 bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-700/80 animate-fade-in">
            <BookOpenIcon className="mx-auto w-16 h-16 text-gray-600 hc-dim-text" />
            <h3 className="mt-4 text-2xl font-semibold text-gray-100 hc-text">Your library is empty</h3>
            <p className="mt-2 text-lg text-gray-400 hc-dim-text">Click the plus button to add your first book.</p>
        </div>
    );
  }
  return (
    <div className="w-full max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {books.map((book, index) => (
        <div key={book.id} className="group relative will-change-transform animate-slide-up" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}>
          <div onClick={() => onSelectBook(book)} className="relative aspect-[2/3] bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-indigo-500/30 hc-bg">
              {book.cover ? (
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-gray-800 to-gray-700 hc-bg">
                  <BookOpenIcon className="w-12 h-12 text-gray-500 mb-2 hc-dim-text" />
                  <span className="text-gray-300 font-semibold hc-text line-clamp-3">{book.title}</span>
                </div>
              )}
              {book.progress !== undefined && book.progress > 0 && (
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-600/50 z-10">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${book.progress}%` }}></div>
                  </div>
              )}
          </div>
          <div className='mt-2 text-left px-1'>
            <p className='text-sm font-semibold text-gray-100 truncate hc-text' title={book.title}>{book.title}</p>
            <p className='text-xs text-gray-400 truncate hc-dim-text'>{book.author || 'Unknown Author'}</p>
            {book.rating && (
                <div className="flex items-center gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-3 h-3 text-yellow-400" filled={i < book.rating!} />
                    ))}
                </div>
            )}
          </div>
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus-within:opacity-100 z-20">
             <button onClick={(e) => { e.stopPropagation(); onEditBook(book) }} className="p-2 bg-blue-600/80 backdrop-blur-sm rounded-full text-white hover:bg-blue-500 focus:opacity-100 focus:outline-none active:scale-95 transition-transform" aria-label="Edit book details">
                <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id) }} className="p-2 bg-red-600/80 backdrop-blur-sm rounded-full text-white hover:bg-red-500 focus:opacity-100 focus:outline-none active:scale-95 transition-transform" aria-label="Delete book">
                <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LibraryView;