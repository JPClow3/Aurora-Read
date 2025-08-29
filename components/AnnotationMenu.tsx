import React, { useState, useEffect, useRef } from 'react';
import { Annotation } from '../types';
import { ANNOTATION_COLORS } from '../constants';
import { TrashIcon, XIcon } from './Icons';

interface AnnotationMenuProps {
  target: HTMLElement;
  annotation?: Annotation;
  onUpdate: (color: string, note?: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

const AnnotationMenu: React.FC<AnnotationMenuProps> = ({ target, annotation, onUpdate, onDelete, onClose }) => {
  const [note, setNote] = useState(annotation?.note || '');
  const [selectedColor, setSelectedColor] = useState(annotation?.color || ANNOTATION_COLORS[0]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    // Auto-save color change
    if (annotation || selectedColor !== ANNOTATION_COLORS[0]) {
      onUpdate(selectedColor, note || undefined);
    }
  }, [selectedColor]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };
  
  const handleNoteSave = () => {
    onUpdate(selectedColor, note || undefined);
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };
  
  const getPosition = () => {
    if (!target || !menuRef.current) return { top: '-9999px', left: '-9999px' };
    const rect = target.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX + rect.width / 2 - menuRect.width / 2;

    // Adjust if it goes off-screen
    if (left < 10) left = 10;
    if (left + menuRect.width > window.innerWidth - 10) {
      left = window.innerWidth - menuRect.width - 10;
    }
    if (top + menuRect.height > window.innerHeight - 10) {
        top = rect.top + window.scrollY - menuRect.height - 8;
    }

    return { top: `${top}px`, left: `${left}px` };
  };
  
  const position = getPosition();

  return (
    <div
      ref={menuRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-3 flex flex-col gap-3 animate-fade-in"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-200">Annotate</p>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors"><XIcon className="w-4 h-4 text-gray-400" /></button>
      </div>
      <div className="flex justify-around items-center">
        {ANNOTATION_COLORS.map(color => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className={`w-8 h-8 rounded-full border-2 transition-transform duration-150 ${selectedColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      <div>
        <textarea
          value={note}
          onChange={handleNoteChange}
          onBlur={handleNoteSave}
          placeholder="Add a note... (saves automatically)"
          className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 resize-none focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
      {annotation && (
        <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 p-2 text-sm text-red-400 bg-red-900/40 rounded-md hover:bg-red-900/60 transition-colors">
          <TrashIcon className="w-4 h-4" />
          Delete Annotation
        </button>
      )}
    </div>
  );
};

export default AnnotationMenu;
