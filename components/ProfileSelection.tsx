import React, { useState } from 'react';
import { Profile } from '../types';
import { PlusIcon } from './Icons';
import Modal from './Modal';
import { generateAvatarSvg } from '../utils';

interface ProfileSelectionProps {
  profiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  onCreateProfile: (name: string, avatar: string) => void;
}

const AVATARS = Array.from({ length: 12 }, (_, i) => `avatar-${i + 1}`);

const CreateProfileModal: React.FC<{
    onClose: () => void;
    onCreate: (name: string, avatar: string) => void;
}> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), selectedAvatar);
        }
    };

    return (
        <Modal onClose={onClose} title="Create New Profile">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <label htmlFor="profileName" className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Name
                    </label>
                    <input
                        type="text"
                        id="profileName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg"
                        placeholder="E.g., Mom, Alex, Kids..."
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Choose an Avatar</label>
                    <div className="grid grid-cols-6 gap-3">
                        {AVATARS.map((avatar) => (
                            <button
                                type="button"
                                key={avatar}
                                onClick={() => setSelectedAvatar(avatar)}
                                className={`p-1 rounded-full transition-all duration-200 ${selectedAvatar === avatar ? 'ring-2 ring-indigo-400' : ''}`}
                            >
                                <img src={generateAvatarSvg(avatar)} alt={avatar} className="w-12 h-12 rounded-full bg-gray-800" />
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg transition-colors active:scale-95">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-lg hc-primary transition-colors active:scale-95 disabled:opacity-50" disabled={!name.trim()}>Create Profile</button>
                </div>
            </form>
        </Modal>
    );
};


const ProfileSelection: React.FC<ProfileSelectionProps> = ({ profiles, onSelectProfile, onCreateProfile }) => {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="w-full max-w-5xl flex flex-col items-center justify-center animate-fade-in py-8 sm:py-16">
            <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-500 to-fuchsia-500 hc-text text-center">
                Who's Listening?
            </h1>
            <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-10">
                {profiles.map((profile) => (
                    <div key={profile.id} onClick={() => onSelectProfile(profile)} className="flex flex-col items-center gap-3 cursor-pointer group transition-transform duration-200 ease-in-out hover:scale-105">
                        <img
                            src={generateAvatarSvg(profile.avatar)}
                            alt={profile.name}
                            className="w-32 h-32 rounded-full object-cover bg-gray-800/50 border-4 border-transparent group-hover:border-indigo-500 transition-all"
                        />
                        <p className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">{profile.name}</p>
                    </div>
                ))}
                <div onClick={() => setIsCreating(true)} className="flex flex-col items-center justify-center gap-3 cursor-pointer group transition-transform duration-200 ease-in-out hover:scale-105">
                     <div className="w-32 h-32 rounded-full bg-gray-800/50 grid place-items-center border-4 border-dashed border-gray-600 group-hover:border-indigo-500 group-hover:bg-gray-800/80 transition-all">
                        <PlusIcon className="w-12 h-12 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                     </div>
                     <p className="text-lg font-semibold text-gray-400 group-hover:text-white transition-colors">Add Profile</p>
                </div>
            </div>
            
            {isCreating && (
                <CreateProfileModal 
                    onClose={() => setIsCreating(false)}
                    onCreate={(name, avatar) => {
                        onCreateProfile(name, avatar);
                        setIsCreating(false);
                    }}
                />
            )}
        </div>
    );
};

export default ProfileSelection;
