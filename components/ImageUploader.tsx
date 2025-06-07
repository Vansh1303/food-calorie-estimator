
import React, { useRef, useCallback } from 'react';
import { CameraIcon } from './icons/CameraIcon'; // This is the general camera/upload icon
import { PhotoIcon } from './icons/PhotoIcon';
import { XCircleIcon } from './icons/XCircleIcon';


interface ImageUploaderProps {
  onImageSelect: (file: File | null) => void;
  previewUrl: string | null; // This will now typically be non-null only if an image file is selected
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, previewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onImageSelect(file || null); // Pass null if no file selected or selection is cleared
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearImage = useCallback(() => {
    onImageSelect(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
    }
  }, [onImageSelect]);

  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        accept="image/*" // Standard image types
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Image file input"
      />
      
      {previewUrl ? (
        <div className="relative group">
          <img src={previewUrl} alt="Food preview" className="w-full h-64 object-cover rounded-lg shadow-lg border border-slate-200" />
          <button
            onClick={handleClearImage}
            className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Clear uploaded image"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div 
          onClick={handleUploadClick}
          onKeyPress={(e) => e.key === 'Enter' && handleUploadClick()}
          className="w-full h-64 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-emerald-50 transition-colors duration-200"
          role="button"
          tabIndex={0}
          aria-label="Upload image area"
        >
          <PhotoIcon className="w-16 h-16 text-slate-400 mb-3" />
          <p className="text-slate-600 font-semibold">Click or tap to upload image</p>
          <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP, HEIC</p>
        </div>
      )}

      {/* Show prominent upload button only if no preview (from an uploaded file) is active */}
      {!previewUrl && (
        <button
          onClick={handleUploadClick}
          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <CameraIcon className="w-5 h-5" /> 
          <span>Upload Food Image from File</span>
        </button>
      )}
    </div>
  );
};
