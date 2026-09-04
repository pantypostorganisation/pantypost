// pantypost-backend/scripts/generate-thumbnails.js
//
// Builds thumbnails for images uploaded BEFORE thumbnail generation
// existed. New uploads get one automatically (utils/imageOptimizer.js).
//
// Browse cards display at ~320px but were loading the full 1600px
// file, which is what made the grid render as black boxes on mobile
// while images crawled in. This backfills the missing thumbs/ folders.
//
// Usage:
//   node scripts/generate-thumbnails.js --dry-run   report only
//   node scripts/generate-thumbnails.js             build them
//
// Safe to re-run: existing thumbnails are skipped.

const path = require('path');
const fs = require('fs').promises;

let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.error('sharp is not installed. Run: npm install sharp');
  process.exit(1);
}

const UPLOADS = path.join(__dirname, '..', 'uploads');
const FOLDERS = ['listings', 'profile', 'profiles', 'covers'];
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const THUMB_EDGE = parseInt(process.env.IMAGE_THUMB_EDGE || '400', 10);
const THUMB_QUALITY = parseInt(process.env.IMAGE_THUMB_QUALITY || '80', 10);

const dryRun = process.argv.includes('--dry-run');
const kb = (b) => (b / 1024).toFixed(0) + 'KB';

async function run() {
  console.log(
    dryRun
      ? 'DRY RUN - nothing will be written.'
      : `Building ${THUMB_EDGE}px thumbnails at quality ${THUMB_QUALITY}.`
  );

  let built = 0, skipped = 0, before = 0, after = 0;

  for (const folder of FOLDERS) {
    const dir = path.join(UPLOADS, folder);
    let entries;
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }

    const images = entries.filter((f) => EXTS.has(path.extname(f).toLowerCase()));
    if (images.length === 0) continue;

    const thumbDir = path.join(dir, 'thumbs');
    if (!dryRun) await fs.mkdir(thumbDir, { recursive: true });

    console.log(`\n${folder}/  (${images.length} image${images.length === 1 ? '' : 's'})`);

    for (const name of images) {
      const src = path.join(dir, name);
      const out = path.join(thumbDir, path.basename(name, path.extname(name)) + '.webp');

      try {
        await fs.access(out);
        skipped += 1;
        continue;
      } catch {
        // no thumbnail yet
      }

      try {
        const srcSize = (await fs.stat(src)).size;
        if (dryRun) {
          console.log(`  ${name}  ${kb(srcSize)}  -> would build thumbnail`);
          before += srcSize;
          built += 1;
          continue;
        }

        await sharp(src, { failOn: 'none' })
          .rotate()
          .resize(THUMB_EDGE, THUMB_EDGE, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: THUMB_QUALITY })
          .toFile(out);

        const outSize = (await fs.stat(out)).size;
        before += srcSize;
        after += outSize;
        built += 1;
        console.log(`  ${name}  ${kb(srcSize)} -> ${kb(outSize)}`);
      } catch (err) {
        console.error(`  ${name} FAILED: ${err.message}`);
      }
    }
  }

  console.log(`\n${built} thumbnail(s) ${dryRun ? 'to build' : 'built'}, ${skipped} already existed.`);
  if (!dryRun && before > 0) {
    const saved = Math.max(0, 100 - Math.round((after / before) * 100));
    console.log(`Browse now loads ${kb(after)} instead of ${kb(before)} (-${saved}%).`);
  }
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
