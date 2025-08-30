import React, { useState, useCallback, useEffect } from 'react';
import Modal from './Modal';
import { UsersIcon } from './Icons';
import { CharacterProfile } from '../types';
import { analyzeCharactersInBook } from '../gemini';
import ErrorMessage from './ErrorMessage';

interface CharacterTrackerModalProps {
    onClose: () => void;
    bookText: string;
    profiles: CharacterProfile[] | null;
    onProfilesLoaded: (profiles: CharacterProfile[]) => void;
}

const CharacterTrackerModal: React.FC<CharacterTrackerModalProps> = ({ onClose, bookText, profiles, onProfilesLoaded }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCharacter, setActiveCharacter] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (!bookText || profiles) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeCharactersInBook(bookText);
            onProfilesLoaded(result);
        } catch (err: any) {
            console.error("Character analysis failed:", err);
            setError(err.message || "Failed to analyze characters.");
        } finally {
            setIsLoading(false);
        }
    }, [bookText, profiles, onProfilesLoaded]);
    
    useEffect(() => {
        handleAnalyze();
    }, [handleAnalyze]);
    
    const toggleCharacter = (name: string) => {
        setActiveCharacter(prev => prev === name ? null : name);
    };

    return (
        <Modal onClose={onClose} title="Character Tracker">
            <div className="flex flex-col gap-4 max-h-[70vh]">
                 <div className="text-center">
                    <UsersIcon className="w-12 h-12 text-indigo-400 mx-auto" />
                    <p className="mt-2 text-gray-300">Keep track of the characters and their relationships.</p>
                </div>
                
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-gray-700/50 rounded-lg">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span>Analyzing book... This may take a moment.</span>
                    </div>
                )}
                
                {error && <ErrorMessage message={error} />}

                {profiles && (
                    <div className="overflow-y-auto space-y-2 pr-2">
                        {profiles.map(profile => (
                            <div key={profile.name} className="bg-gray-700/50 rounded-lg border border-gray-600/50">
                                <button onClick={() => toggleCharacter(profile.name)} className="w-full text-left p-3 flex justify-between items-center">
                                    <span className="font-semibold text-lg">{profile.name}</span>
                                    <svg className={`w-5 h-5 transition-transform ${activeCharacter === profile.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                {activeCharacter === profile.name && (
                                    <div className="p-3 border-t border-gray-600/50 space-y-3">
                                        <p className="text-gray-300">{profile.summary}</p>
                                        {profile.relationships.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-indigo-300">Relationships:</h4>
                                                <ul className="list-disc list-inside text-gray-400 mt-1 space-y-1">
                                                    {profile.relationships.map(rel => (
                                                        <li key={rel.characterName}>
                                                            <strong>{rel.characterName}:</strong> {rel.relationship}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default CharacterTrackerModal;
