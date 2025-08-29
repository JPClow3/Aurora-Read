import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => 
        file.type === 'application/pdf' || 
        file.name.endsWith('.epub') ||
        file.type === 'text/plain' ||
        file.name.endsWith('.md')
      );
      
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      } else {
        alert('Please upload valid PDF, EPUB, TXT, or MD files.');
      }
    }
  }, [onFileSelect]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isLoading) {
        handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    document.getElementById('fileInput')?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div
      className={`w-full max-w-2xl p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out cursor-pointer
        ${isLoading ? 'border-gray-600 bg-gray-800/50' : 'border-gray-500 hover:border-indigo-400 hover:bg-gray-800/60'}
        ${isDragging ? 'border-indigo-400 bg-indigo-900/30 scale-105' : 'bg-gray-800/30'}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={isLoading ? undefined : handleClick}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept=".pdf,.epub,.txt,.md"
        onChange={handleFileChange}
        disabled={isLoading}
        multiple
      />
      <div className={`flex flex-col items-center justify-center space-y-4 text-center ${isDragging ? 'pointer-events-none' : ''}`}>
        <UploadIcon className={`w-12 h-12 transition-colors ${isDragging ? 'text-indigo-300' : 'text-gray-400'}`} />
        <p className="text-xl font-semibold text-gray-200">
          {isDragging ? "Drop your files here" : "Drop files here"}
        </p>
        <p className="text-gray-400">or click to select PDF, EPUB, TXT, & MD files</p>
      </div>
    </div>
  );
};

export default FileUpload;