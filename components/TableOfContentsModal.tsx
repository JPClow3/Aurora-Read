import React from 'react';
import Modal from './Modal';
import { Chapter } from '../types';

interface TableOfContentsModalProps {
  chapters: Chapter[];
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  onClose: () => void;
}

const TableOfContentsModal: React.FC<TableOfContentsModalProps> = ({ chapters, currentChapterIndex, onSelectChapter, onClose }) => {
  return (
    <Modal onClose={onClose} title="Table of Contents">
      <div className="max-h-[60vh] overflow-y-auto -mr-2 pr-2">
        <ul className="space-y-1">
          {chapters.map((chapter, index) => (
            <li key={chapter.href || index}>
              <button
                onClick={() => onSelectChapter(index)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  index === currentChapterIndex
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                {chapter.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default TableOfContentsModal;
