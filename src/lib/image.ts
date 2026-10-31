// Reads an image file and shrinks it. In cloud mode the compressed blob is
// uploaded to the Appwrite media bucket and the public URL is returned, so
// photos survive across devices; otherwise a data URL is kept in localStorage.
import { isStorageAuthed, uploadToStorage } from './appwrite';

function readCompressed(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be opened'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Image processing is not supported in this browser'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function compressImage(file: File, maxSize = 900, quality = 0.78): Promise<string> {
  const dataUrl = await readCompressed(file, maxSize, quality);
  if (isStorageAuthed()) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const url = await uploadToStorage(blob, `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`);
      if (url) return url;
    } catch {
      // fall through to the data URL
    }
  }
  return dataUrl;
}
