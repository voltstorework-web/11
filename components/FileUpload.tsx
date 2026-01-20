
import React, { useState, useCallback, useRef } from 'react';
import Icon from './Icon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes: string;
  label: string;
  iconName: 'pdf' | 'image';
  file: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, acceptedTypes, label, iconName, file }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const baseBorder = 'border-2 border-dashed rounded-lg transition-colors duration-200';
  const idleBorder = 'border-gray-300 dark:border-white/20';
  const draggingBorder = 'border-brand dark:border-brand';
  const successBorder = 'border-green-500 dark:border-green-400';

  return (
    <div
      className={`p-6 text-center cursor-pointer ${baseBorder} ${isDragging ? draggingBorder : file ? successBorder : idleBorder}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={acceptedTypes}
        onChange={handleFileChange}
      />
      <div className={`mx-auto mb-3 ${file ? 'text-green-500' : 'text-gray-400 dark:text-subtle-text'}`}>
        <Icon name={file ? 'check' : iconName} className="w-12 h-12 mx-auto" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-light-text">{label}</p>
      {file ? (
         <p className="text-xs text-gray-500 dark:text-subtle-text mt-1 truncate">{file.name}</p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-subtle-text mt-1">Drag & drop or click to upload</p>
      )}
    </div>
  );
};

export default FileUpload;