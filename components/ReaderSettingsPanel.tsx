import React from 'react';
import { ReaderSettings, Theme, FontFamily, ReadingMode, PageTurnAnimation } from '../types';
import { PaletteIcon, SparklesIcon, TypeIcon, BookOpenIcon } from './Icons';

const ReaderSettingsPanel: React.FC<{ settings: ReaderSettings, onSettingsChange: (settings: ReaderSettings) => void; }> = ({ settings, onSettingsChange }) => {
  return (
    <div className="space-y-6">
        <div>
            <label className="text-base font-medium text-gray-300 flex items-center gap-2"><BookOpenIcon className="w-5 h-5" /> Reading Style</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
                {(['scroll', 'page'] as ReadingMode[]).map(mode => (
                    <button key={mode} onClick={() => onSettingsChange({...settings, mode})} className={`capitalize w-full p-2 rounded-md border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${settings.mode === mode ? 'border-indigo-400 bg-indigo-900/30' : 'border-gray-600 hover:border-gray-500'}`} disabled={settings.mode === 'karaoke'}>
                        {mode === 'scroll' ? 'Scrolling' : 'Paginated'}
                    </button>
                ))}
            </div>
             {settings.mode === 'karaoke' && <p className="text-xs text-gray-400 mt-1">Reading style is locked during Karaoke mode. Change the main View Mode to enable other styles.</p>}
        </div>
        {settings.mode === 'page' && (
            <div>
                <label htmlFor="pageTurnAnimation" className="text-base font-medium text-gray-300">Page Turn Animation</label>
                <select id="pageTurnAnimation" value={settings.pageTurnAnimation} onChange={e => onSettingsChange({...settings, pageTurnAnimation: e.target.value as PageTurnAnimation})} className="w-full mt-2 bg-gray-700 text-white text-base rounded-md p-2 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                    <option value="slide">Slide</option>
                    <option value="fade">Fade</option>
                    <option value="scroll">Scroll</option>
                </select>
            </div>
        )}
        <div>
            <label className="text-base font-medium text-gray-300 flex items-center gap-2"><PaletteIcon className="w-5 h-5" /> Theme</label>
            <div className="mt-2 flex items-center gap-2">
                {(['dark', 'light', 'sepia', 'grey'] as Theme[]).map(theme => (
                    <button key={theme} onClick={() => onSettingsChange({...settings, theme})} className={`capitalize w-full p-2 rounded-md border-2 transition-colors ${settings.theme === theme ? 'border-indigo-400' : 'border-gray-600 hover:border-gray-500'}`}>
                        {theme}
                    </button>
                ))}
            </div>
        </div>
        <div>
            <label className="text-base font-medium text-gray-300 flex items-center gap-2"><TypeIcon className="w-5 h-5" /> Typography</label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="fontFamily" className="block text-sm text-gray-400">Font</label>
                    <select id="fontFamily" value={settings.fontFamily} onChange={e => onSettingsChange({...settings, fontFamily: e.target.value as FontFamily})} className="w-full mt-1 bg-gray-700 text-white text-base rounded-md p-2 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                        <option value="sans">Sans-serif</option>
                        <option value="serif">Serif</option>
                        <option value="dyslexic">Dyslexia Friendly</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="fontSize" className="block text-sm text-gray-400">Size: {settings.fontSize.toFixed(1)}rem</label>
                    <input id="fontSize" type="range" min="0.8" max="2.0" step="0.1" value={settings.fontSize} onChange={e => onSettingsChange({...settings, fontSize: parseFloat(e.target.value)})} className="w-full h-2 mt-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 hc-accent-bg"/>
                </div>
                 <div>
                    <label htmlFor="lineHeight" className="block text-sm text-gray-400">Line Height: {settings.lineHeight.toFixed(1)}</label>
                    <input id="lineHeight" type="range" min="1.2" max="2.2" step="0.1" value={settings.lineHeight} onChange={e => onSettingsChange({...settings, lineHeight: parseFloat(e.target.value)})} className="w-full h-2 mt-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 hc-accent-bg"/>
                </div>
                <div>
                    <label htmlFor="margin" className="block text-sm text-gray-400">Margins: {settings.margin.toFixed(1)}rem</label>
                    <input id="margin" type="range" min="0.5" max="5.0" step="0.5" value={settings.margin} onChange={e => onSettingsChange({...settings, margin: parseFloat(e.target.value)})} className="w-full h-2 mt-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 hc-accent-bg"/>
                </div>
            </div>
        </div>
        <div>
            <label className="text-base font-medium text-gray-300 flex items-center gap-2"><SparklesIcon className="w-5 h-5" /> Highlighting</label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="autoScroll" className="text-sm text-gray-400">Auto-Scroll (Scroll mode)</label>
                    <input type="checkbox" id="autoScroll" checked={settings.autoScroll} onChange={e => onSettingsChange({...settings, autoScroll: e.target.checked})} className="w-5 h-5 rounded text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500" />
                </div>
                 <div className="flex items-center justify-between">
                    <label htmlFor="highlightColor" className="text-sm text-gray-400">Highlight Color</label>
                    <input id="highlightColor" type="color" value={settings.highlightColor} onChange={e => onSettingsChange({...settings, highlightColor: e.target.value})} className="p-1 h-8 w-14 block bg-gray-700 border border-gray-600 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none" />
                </div>
                {settings.autoScroll && (
                    <div className="sm:col-span-2">
                        <label htmlFor="autoScrollAlignment" className="text-sm text-gray-400">Auto-Scroll Alignment</label>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                            <button onClick={() => onSettingsChange({...settings, autoScrollAlignment: 'center'})} className={`capitalize w-full p-2 rounded-md border-2 text-xs transition-colors ${settings.autoScrollAlignment === 'center' ? 'border-indigo-400 bg-indigo-900/30' : 'border-gray-600 hover:border-gray-500'}`}>Center</button>
                            <button onClick={() => onSettingsChange({...settings, autoScrollAlignment: 'top'})} className={`capitalize w-full p-2 rounded-md border-2 text-xs transition-colors ${settings.autoScrollAlignment === 'top' ? 'border-indigo-400 bg-indigo-900/30' : 'border-gray-600 hover:border-gray-500'}`}>Top</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ReaderSettingsPanel;