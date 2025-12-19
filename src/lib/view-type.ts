// lib/view-type.ts
export async function detectViewType(imageUrl: string): Promise<'flat' | 'panorama'> {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      // In a non-browser environment (like SSR), we can't load images.
      // Default to 'flat' as a safe fallback.
      resolve('flat');
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Attempt to load cross-origin images

    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio >= 2) return resolve('panorama');
      resolve('flat');
    };
    
    img.onerror = () => {
        // If the image fails to load (e.g., CORS issue), default to flat
        console.warn(`Could not load image to detect view type: ${imageUrl}`);
        resolve('flat');
    };

    img.src = imageUrl;
  });
}
