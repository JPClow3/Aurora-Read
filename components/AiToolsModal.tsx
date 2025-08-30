import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { SparklesIcon } from './Icons';
import { ChapterAnalysis, HighlightCategory, Flashcard, FlashcardReview } from '../types';
import ErrorMessage from './ErrorMessage';
import FlashcardViewer from './FlashcardViewer';

interface AiToolsModalProps {
    onClose: () => void;
    onAnalyzeHighlights: () => void;
    onGenerateFlashcards: () => void;
    isAnalyzing: boolean;
    analysisResult: ChapterAnalysis | null;
    activeCategories: Set<HighlightCategory>;
    onToggleCategory: (category: HighlightCategory) => void;
    error: string | null;
    flashcards: Flashcard[];
    flashcardReviews: Record<string, FlashcardReview>;
    onUpdateFlashcardReviews: (reviews: Record<string, FlashcardReview>) => void;
}

const CategoryToggle: React.FC<{
    label: string;
    category: HighlightCategory;
    color: string;
    count: number;
    isActive: boolean;
    onToggle: (category: HighlightCategory) => void;
}> = ({ label, category, color, count, isActive, onToggle }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isActive ? color : 'border-gray-600 bg-gray-700/50'}`}>
        <div>
            <p className="font-semibold text-white">{label}</p>
            <p className="text-sm text-gray-400">{count} found</p>
        </div>
        <input 
            type="checkbox"
            checked={isActive}
            onChange={() => onToggle(category)}
            className="w-5 h-5 rounded text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500"
        />
    </div>
);

const AiToolsModal: React.FC<AiToolsModalProps> = ({ 
    onClose, onAnalyzeHighlights, onGenerateFlashcards, isAnalyzing, analysisResult, 
    activeCategories, onToggleCategory, error, flashcards, flashcardReviews, onUpdateFlashcardReviews 
}) => {
    const [view, setView] = useState<'main' | 'flashcards'>('main');
    
    useEffect(() => {
        if (!analysisResult) {
            onAnalyzeHighlights();
        }
    }, [analysisResult, onAnalyzeHighlights]);
    
    const renderMainView = () => (
        <div className="flex flex-col gap-4">
            <div className="text-center">
                <SparklesIcon className="w-12 h-12 text-indigo-400 mx-auto" />
                <p className="mt-2 text-gray-300">Let AI analyze this chapter to reveal deeper insights.</p>
            </div>

            {isAnalyzing && (
                <div className="flex items-center justify-center gap-2 p-4 bg-gray-700/50 rounded-lg">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Analyzing chapter...</span>
                </div>
            )}
            
            {error && <ErrorMessage message={error} />}

            <div className="bg-gray-700/30 p-3 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg text-center">Smart Highlights</h3>
                {analysisResult && !isAnalyzing && (
                    <div className="space-y-3">
                        <CategoryToggle 
                            label="Key Plot Points"
                            category="plot"
                            color="border-red-500 bg-red-900/30"
                            count={analysisResult.keyPlotPoints.length}
                            isActive={activeCategories.has('plot')}
                            onToggle={onToggleCategory}
                        />
                         <CategoryToggle 
                            label="Character Introductions"
                            category="character"
                            color="border-blue-500 bg-blue-900/30"
                            count={analysisResult.characterIntroductions.length}
                            isActive={activeCategories.has('character')}
                            onToggle={onToggleCategory}
                        />
                         <CategoryToggle 
                            label="Foreshadowing"
                            category="foreshadowing"
                            color="border-purple-500 bg-purple-900/30"
                            count={analysisResult.foreshadowing.length}
                            isActive={activeCategories.has('foreshadowing')}
                            onToggle={onToggleCategory}
                        />
                    </div>
                )}
            </div>

             <div className="bg-gray-700/30 p-3 rounded-lg space-y-3 text-center">
                <h3 className="font-semibold text-lg">Study Tools</h3>
                {flashcards.length > 0 ? (
                    <button onClick={() => setView('flashcards')} className="w-full p-2 bg-indigo-600 rounded-lg">
                        Study Flashcards ({flashcards.length})
                    </button>
                ) : (
                    <button onClick={onGenerateFlashcards} disabled={isAnalyzing} className="w-full p-2 bg-indigo-600 rounded-lg disabled:opacity-50">
                        Generate Flashcards
                    </button>
                )}
            </div>
        </div>
    );
    
    return (
        <Modal onClose={onClose} title={view === 'flashcards' ? "Study Flashcards" : "AI-Powered Tools"}>
            {view === 'main' ? renderMainView() : (
                 <FlashcardViewer 
                    cards={flashcards}
                    reviews={flashcardReviews}
                    onUpdateReviews={onUpdateFlashcardReviews}
                    onClose={() => setView('main')}
                 />
            )}
        </Modal>
    );
};

export default AiToolsModal;
