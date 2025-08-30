import React, { useState, useEffect, useMemo } from 'react';
import { Flashcard, FlashcardReview, FlashcardReviewEase } from '../types';

interface FlashcardViewerProps {
    cards: Flashcard[];
    reviews: Record<string, FlashcardReview>;
    onUpdateReviews: (newReviews: Record<string, FlashcardReview>) => void;
    onClose: () => void;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ cards, reviews, onUpdateReviews, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [sessionReviews, setSessionReviews] = useState<Record<string, FlashcardReviewEase>>({});

    const cardsToReview = useMemo(() => {
        const now = Date.now();
        return cards.filter(card => {
            const review = reviews[card.id];
            return !review || review.nextReviewDate <= now;
        });
    }, [cards, reviews]);

    useEffect(() => {
        setIsFlipped(false);
        if (currentIndex >= cardsToReview.length && cardsToReview.length > 0) {
            setSessionEnded(true);
        }
    }, [currentIndex, cardsToReview.length]);

    if (cardsToReview.length === 0) {
        return (
            <div className="text-center text-gray-400 flex flex-col items-center gap-4">
                <p>No flashcards due for review right now.</p>
                <button onClick={onClose} className="px-4 py-2 bg-indigo-600 rounded-lg">Done</button>
            </div>
        );
    }

    const card = cardsToReview[currentIndex];

    const handleNextCard = (ease: FlashcardReviewEase) => {
        setSessionReviews(prev => ({ ...prev, [card.id]: ease }));
        setCurrentIndex(i => i + 1);
    };

    const handleFinishSession = () => {
        const now = Date.now();
        const updatedReviews = { ...reviews };

        for (const cardId in sessionReviews) {
            const ease = sessionReviews[cardId];
            const oldReview = reviews[cardId];
            let newInterval = oldReview?.interval || 1;

            if (ease === 'easy') {
                newInterval = Math.ceil(newInterval * 2.5);
            } else if (ease === 'medium') {
                newInterval = Math.ceil(newInterval * 1.5);
            } else { // hard
                newInterval = 1;
            }

            updatedReviews[cardId] = {
                ease,
                interval: newInterval,
                nextReviewDate: now + newInterval * 24 * 60 * 60 * 1000,
            };
        }
        onUpdateReviews(updatedReviews);
        onClose();
    };

    if (sessionEnded) {
        return (
            <div className="text-center flex flex-col items-center gap-4">
                <h3 className="text-xl font-semibold">Session Complete!</h3>
                <p className="text-gray-400">You've reviewed all due cards for this chapter.</p>
                <button onClick={handleFinishSession} className="px-6 py-2 bg-indigo-600 rounded-lg text-lg">
                    Save & Finish
                </button>
            </div>
        );
    }


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

            {isFlipped ? (
                 <div className="flex items-center justify-center w-full gap-3">
                    <button onClick={() => handleNextCard('hard')} className="px-4 py-2 bg-red-800/80 rounded-lg transition-colors active:scale-95 w-24">Hard</button>
                    <button onClick={() => handleNextCard('medium')} className="px-4 py-2 bg-yellow-700/80 rounded-lg transition-colors active:scale-95 w-24">Medium</button>
                    <button onClick={() => handleNextCard('easy')} className="px-4 py-2 bg-green-800/80 rounded-lg transition-colors active:scale-95 w-24">Easy</button>
                </div>
            ) : (
                <div className="flex items-center justify-center w-full min-h-[40px]">
                     <p className="text-gray-400">{currentIndex + 1} / {cardsToReview.length}</p>
                </div>
            )}
        </div>
    );
};

export default FlashcardViewer;
