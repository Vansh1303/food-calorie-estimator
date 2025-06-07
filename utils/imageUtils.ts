
import type { Base64Image } from '../types';

export const fileToBase64 = <T extends File,>(file: T): Promise<Base64Image> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
        reject(new Error("Invalid file type. Only images are accepted."));
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is like "data:image/jpeg;base64,LzlqLzRBQ..."
      const parts = result.split(',');
      if (parts.length !== 2) {
        reject(new Error("Invalid file format for base64 conversion."));
        return;
      }
      
      // Extract mimeType from the data URL prefix
      const mimeTypePart = parts[0].match(/:(.*?);/);
      if (!mimeTypePart || mimeTypePart.length < 2) {
          reject(new Error("Could not determine mime type from data URL."));
          return;
      }
      const mimeType = mimeTypePart[1];

      // Ensure it's a supported image type for Gemini (optional strict check)
      const supportedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
      if (!supportedMimeTypes.includes(mimeType.toLowerCase())) {
        console.warn(`MIME type ${mimeType} might not be optimally supported by the AI. Common types like PNG, JPEG, WEBP are preferred.`);
        // We can still proceed, but good to be aware. Or reject if strictness is needed.
      }
      
      resolve({ base64: parts[1], mimeType: mimeType });
    };
    reader.onerror = (error) => reject(new Error(`File reading error: ${error}`));
  });
};
