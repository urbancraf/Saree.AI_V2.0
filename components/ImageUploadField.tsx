import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  subLabel?: string;
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  subLabel,
  files,
  onFilesSelected,
  onRemoveFile,
  multiple = false,
  maxFiles = 1,
  accept = "image/*"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = files.length + newFiles.length;
      
      if (maxFiles && totalFiles > maxFiles) {
        alert(`You can only upload a maximum of ${maxFiles} files.`);
        return;
      }
      
      onFilesSelected(newFiles);
      // Reset input
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      {subLabel && <p className="text-xs text-slate-500 mb-2">{subLabel}</p>}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {files.map((file, idx) => (
          <div key={idx} className="relative group aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            <img
              src={URL.createObjectURL(file)}
              alt={`upload-${idx}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemoveFile(idx)}
              className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {(files.length < maxFiles) && (
          <div
            onClick={() => inputRef.current?.click()}
            className="aspect-[3/4] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors text-slate-400 hover:text-primary-600"
          >
            <Upload size={24} className="mb-2" />
            <span className="text-xs font-medium">Add Image</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />
    </div>
  );
};