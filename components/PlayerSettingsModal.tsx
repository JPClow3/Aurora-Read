import React from 'react';
import { ReaderSettings, Theme, FontFamily } from '../types';
import Modal from './Modal';
import { PaletteIcon, TypeIcon } from './Icons';

interface PlayerSettingsModalProps {
  onClose: () => void;
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
}

const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({ onClose, settings, onSettingsChange }) => {
  return (
    <Modal onClose={onClose} title="Display Settings">
      <div className="space-y-6 text-gray-200">
        <div>
          <label className="text-base font-medium flex items-center gap-2"><PaletteIcon className="w-5 h-5" /> Theme</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['sepia', 'light', 'dark'] as Theme[]).map(theme => (
              <button key={theme} onClick={() => onSettingsChange({...settings, theme})} className={`capitalize w-full p-2 rounded-md border-2 transition-colors ${settings.theme === theme ? 'border-indigo-400' : 'border-gray-600 hover:border-gray-500'}`}>
                {theme}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-base font-medium flex items-center gap-2"><TypeIcon className="w-5 h-5" /> Typography</label>
          <div className="mt-2 grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="fontFamily" className="block text-sm text-gray-400">Font</label>
              <select
                id="fontFamily"
                value={settings.fontFamily}
                onChange={e => onSettingsChange({...settings, fontFamily: e.target.value as FontFamily})}
                className="w-full mt-1 bg-gray-700 text-white text-base rounded-md p-2 border border-gray-600 focus:outline-none"
              >
                <option value="serif">Serif</option>
                <option value="sans">Sans-serif</option>
              </select>
            </div>
            <div>
              <label htmlFor="fontSize" className="block text-sm text-gray-400">Size: {settings.fontSize.toFixed(1)}rem</label>
              <input
                id="fontSize"
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={settings.fontSize}
                onChange={e => onSettingsChange({...settings, fontSize: parseFloat(e.target.value)})}
                className="w-full h-2 mt-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PlayerSettingsModal;