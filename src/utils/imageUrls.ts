// src/utils/imageUrls.ts
//
// Browse cards display images at roughly 320px, but were loading the
// full 1600px upload -- twenty-five times the pixels needed, for every
// card. On a phone the grid rendered as black boxes while the images
// crawled in.
//
// The backend writes a 400px WebP thumbnail into a thumbs/ subfolder
// beside each upload (see pantypost-backend/utils/imageOptimizer.js).
// This maps a full-size URL onto its thumbnail.
//
// Falls back to the original URL when the pattern does not match, and
// the <img> onError in the card handles the case where a thumbnail was
// never generated -- so an image that predates thumbnails still shows,
// it is just the full-size one.

export function thumbnailUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const match = url.match(/^(.*\/uploads\/[^/]+)\/([^/]+)$/);
    if (!match) return url;
    const [, dir, file] = match;
    const base = file.replace(/\.[^.]+$/, '');
    return `${dir}/thumbs/${base}.webp`;
  } catch {
    return url;
  }
}
