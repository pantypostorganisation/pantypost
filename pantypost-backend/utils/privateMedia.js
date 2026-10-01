// pantypost-backend/utils/privateMedia.js

/* Splits an upload into a public blurred preview and a private
 * original.
 *
 * The directory choice is the whole security model. server.js serves
 * uploads/ statically, so anything written there is readable by anyone
 * who guesses the path -- which is why private-media/ sits OUTSIDE it,
 * beside uploads/ rather than within. There is no URL that reaches a
 * file in there; it can only be streamed by a route that has first
 * checked the caller paid.
 *
 * The blur is baked into a separate file rather than applied in CSS
 * for the same reason: a CSS filter leaves the original in the page,
 * one DevTools panel away from being saved.
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
  console.warn('[PrivateMedia] sharp unavailable — digital content uploads will be rejected');
}

const PRIVATE_ROOT = path.join(__dirname, '..', 'private-media');
const PUBLIC_PREVIEW_DIR = path.join(__dirname, '..', 'uploads', 'content-previews');

const MAX_EDGE = 1600;
const PREVIEW_EDGE = 900;
const QUALITY = 88;
const PREVIEW_QUALITY = 70;

const BLUR_SIGMA = { light: 12, medium: 24, heavy: 40 };

/**
 * Processes one uploaded image.
 *
 * Returns the public preview URL and the private path. The caller
 * stores both; only the first is ever sent to a browser.
 */
async function processDigitalUpload(file, blurLevel = 'medium') {
  if (!sharp) throw new Error('Image processing is unavailable');

  await fs.mkdir(PRIVATE_ROOT, { recursive: true });
  await fs.mkdir(PUBLIC_PREVIEW_DIR, { recursive: true });

  /* A random name, not the uploader's filename and not the content id.
     The preview sits in a public directory, so a guessable name would
     let someone enumerate what exists even without the original. */
  const key = crypto.randomBytes(16).toString('hex');

  const privatePath = path.join(PRIVATE_ROOT, `${key}.webp`);
  const previewPath = path.join(PUBLIC_PREVIEW_DIR, `${key}.webp`);

  const sigma = BLUR_SIGMA[blurLevel] || BLUR_SIGMA.medium;

  try {
    const source = sharp(file.path, { failOn: 'none' }).rotate();
    const meta = await source.metadata();

    // The original the buyer receives, resized but not degraded.
    const full = sharp(file.path, { failOn: 'none' }).rotate();
    if ((meta.width || 0) > MAX_EDGE || (meta.height || 0) > MAX_EDGE) {
      full.resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true });
    }
    await full.webp({ quality: QUALITY }).toFile(privatePath);

    /* The preview: downscaled FIRST, then blurred.
       Blurring a full-size image and shrinking it afterwards leaves
       recoverable detail -- the downscale averages pixels that the
       blur only smeared. Shrinking first destroys the information
       before the blur hides what is left. */
    await sharp(file.path, { failOn: 'none' })
      .rotate()
      .resize(PREVIEW_EDGE, PREVIEW_EDGE, { fit: 'inside', withoutEnlargement: true })
      .blur(sigma)
      .webp({ quality: PREVIEW_QUALITY })
      .toFile(previewPath);

    // The upload as it arrived has served its purpose.
    await fs.unlink(file.path).catch(() => {});

    const stat = await fs.stat(privatePath);

    return {
      previewUrl: `/uploads/content-previews/${key}.webp`,
      originalPath: `${key}.webp`,
      fileSize: stat.size,
      mimeType: 'image/webp'
    };
  } catch (error) {
    // Leave nothing half-written behind.
    await fs.unlink(privatePath).catch(() => {});
    await fs.unlink(previewPath).catch(() => {});
    throw error;
  }
}

/** Absolute path of a private original, for streaming. */
function privatePathFor(storedName) {
  /* basename() because storedName comes from the database and a value
     like ../../etc/passwd would otherwise walk out of the directory.
     It should never contain a separator, but should-never is not a
     guarantee worth relying on for file reads. */
  return path.join(PRIVATE_ROOT, path.basename(String(storedName)));
}

/** Removes both files when content is deleted. */
async function removeDigitalUpload(storedName, previewUrl) {
  await fs.unlink(privatePathFor(storedName)).catch(() => {});
  if (previewUrl && previewUrl.includes('/content-previews/')) {
    const name = path.basename(previewUrl);
    await fs.unlink(path.join(PUBLIC_PREVIEW_DIR, name)).catch(() => {});
  }
}

module.exports = {
  processDigitalUpload,
  privatePathFor,
  removeDigitalUpload,
  PRIVATE_ROOT,
  BLUR_SIGMA,
  isAvailable: () => !!sharp
};
