import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.epub')) {
        onFileSelect(file);
      } else {
        alert('Please upload a valid .txt or .epub file.');
      }
    }
  }, [onFileSelect]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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
      handleFile(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    document.getElementById('fileInput')?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files);
  };

  return (
    <div
      className={`w-full max-w-lg p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out cursor-pointer
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
        accept=".txt,.epub"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <UploadIcon className={`w-12 h-12 transition-colors ${isDragging ? 'text-indigo-300' : 'text-gray-400'}`} />
        <p className="text-xl font-semibold text-gray-200">
          Drop a .txt or .epub file here
        </p>
        <p className="text-gray-400">or click to select</p>
      </div>
    </div>
  );
};

export default FileUpload;