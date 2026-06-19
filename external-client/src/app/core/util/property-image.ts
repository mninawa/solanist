/**
 * Curated gallery of house / solar-home photos used as a graceful fallback when a
 * property has no image (or its stored image fails to load). The image is chosen
 * deterministically from the property id so each property keeps a stable picture.
 */
const HOUSE_IMAGE_GALLERY = [
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&h=500&fit=crop',
];

/** Deterministically pick a fallback house image for a given seed (e.g. property id). */
export function fallbackPropertyImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return HOUSE_IMAGE_GALLERY[hash % HOUSE_IMAGE_GALLERY.length];
}

export const MAX_PROPERTY_IMAGE_BYTES = 6 * 1024 * 1024;

/**
 * Read a user-selected image file, downscale it to keep payloads small, and return a
 * JPEG data URL suitable for storing as the property image.
 */
export function readAndResizeImage(
  file: File,
  maxDimension = 1280,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    if (file.size > MAX_PROPERTY_IMAGE_BYTES) {
      reject(new Error('That image is too large. Please choose one under 6 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load that image.'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process that image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
