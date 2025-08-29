
import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';

const FlashcardViewer: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        setIsFlipped(false);
    }, [currentIndex]);

    if (!cards || cards.length === 0) {
        return <p className="text-center text-gray-400">No flashcards were generated for this chapter.</p>;
    }

    const card = cards[currentIndex];

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="w-full h-64 rounded-xl flex items-center justify-center p-6 text-center text-xl cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 bg-gray-700 rounded-lg">
                        <p>{card.question}</p>
                    </div>
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-4 bg-indigo-800 rounded-lg">
                         <p>{card.answer}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between w-full">
                <button
                    onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 bg-gray-600 rounded-lg disabled:opacity-50 transition-colors active:scale-95"
                >
                    Prev
                </button>
                <p className="text-gray-400">{currentIndex + 1} / {cards.length}</p>
                <button
                    onClick={() => setCurrentIndex(i => Math.min(cards.length - 1, i + 1))}
                    disabled={currentIndex === cards.length - 1}
                    className="px-4 py-2 bg-gray-600 rounded-lg disabled:opacity-50 transition-colors active:scale-95"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default FlashcardViewer;
