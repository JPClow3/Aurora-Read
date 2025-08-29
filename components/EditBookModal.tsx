

import React, { useState } from 'react';
import { Book } from '../types';
import Modal from './Modal';
import { XIcon, StarIcon } from './Icons';

const EditBookModal: React.FC<{ book: Book, onClose: () => void, onSave: (book: Book) => Promise<void> }> = ({ book, onClose, onSave }) => {
    const [title, setTitle] = useState(book.title);
    const [author, setAuthor] = useState(book.author || '');
    const [genre, setGenre] = useState(book.genre || '');
    const [year, setYear] = useState(book.year?.toString() || '');
    const [tags, setTags] = useState(book.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [rating, setRating] = useState(book.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSave = async () => {
        // Create a new set of tags based on current state before saving
        const finalTags = [...tags];
        const newTags = tagInput
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
        if (newTags.length > 0) {
            newTags.forEach(t => {
                if (!finalTags.includes(t)) {
                    finalTags.push(t);
                }
            });
        }
        await onSave({ ...book, title, author, genre: genre || undefined, year: Number(year) || undefined, tags: finalTags, rating: rating > 0 ? rating : undefined });
    };

    const addTagsFromInput = () => {
        const newTags = tagInput
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
            
        if (newTags.length > 0) {
            const uniqueNewTags = newTags.filter(t => !tags.includes(t));
            setTags(prevTags => [...prevTags, ...uniqueNewTags]);
            setTagInput('');
        }
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTagsFromInput();
        }
    };
    
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <Modal onClose={onClose} title="Edit Book Details">
            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg" />
                </div>
                <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-300">Author</label>
                    <input type="text" id="author" value={author} onChange={e => setAuthor(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-gray-300">Genre</label>
                        <input type="text" id="genre" value={genre} onChange={e => setGenre(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-300">Year</label>
                        <input type="number" id="year" value={year} onChange={e => setYear(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg" />
                    </div>
                </div>
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-300">Tags</label>
                    <div className="mt-1 flex flex-wrap gap-2 items-center p-2 bg-gray-700 border border-gray-600 rounded-lg">
                        {tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 bg-indigo-600 text-sm rounded px-2 py-0.5">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="text-indigo-200 hover:text-white">
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            id="tags"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            onBlur={addTagsFromInput}
                            placeholder="Add tags (comma-separated)..."
                            className="flex-grow bg-transparent outline-none p-1"
                        />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                    <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)}>
                                <StarIcon className="w-6 h-6 transition-colors text-yellow-400" filled={(hoverRating || rating) >= star} />
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg transition-colors active:scale-95">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-indigo-600 rounded-lg hc-primary transition-colors active:scale-95">Save</button>
                </div>
            </div>
        </Modal>
    );
};

export default EditBookModal;