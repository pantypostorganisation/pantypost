// pantypost-backend/scripts/optimize-existing-images.js
//
// One-time pass over images uploaded BEFORE the optimiser existed.
//
// New uploads are shrunk automatically (utils/imageOptimizer.js). This
// script does the back catalogue. It rewrites the file in place --
// same filename, same extension, smaller bytes -- so nothing in the
// database needs updating and no URL changes. Originals are copied to
// an "originals" folder first.
//
// Usage, in order of increasing commitment:
//
//   node scripts/optimize-existing-images.js --dry-run
//       Report only. Shows every file and what it would save.
//
//   node scripts/optimize-existing-images.js --limit 1
//       Convert a SINGLE image so you can eyeball the quality on a
//       real device before touching the rest.
//
//   node scripts/optimize-existing-images.js
//       Convert everything.
//
// Verification documents are never touched: they are private, they are
// evidence, and they are on a deletion schedule of their own.

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
const FOLDERS = ['listings', 'profile', 'profiles', 'covers', 'temp'];
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const MAX_EDGE = parseInt(process.env.IMAGE_MAX_EDGE || '1600', 10);
const QUALITY = parseInt(process.env.IMAGE_WEBP_QUALITY || '85', 10);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.indexOf('--limit');
const limit = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

const kb = (bytes) => (bytes / 1024).toFixed(0) + 'KB';

async function processFile(filePath) {
  const before = (await fs.stat(filePath)).size;
  const meta = await sharp(filePath, { failOn: 'none' }).metadata();

  if (dryRun) {
    console.log(
      `  ${path.basename(filePath)}  ${kb(before)}  ${meta.width}x${meta.height}`
    );
    return { before, after: before, skipped: true };
  }

  // Keep the untouched source before overwriting anything.
  const originalsDir = path.join(path.dirname(filePath), 'originals');
  await fs.mkdir(originalsDir, { recursive: true });
  const backup = path.join(originalsDir, path.basename(filePath));
  try {
    await fs.access(backup);
  } catch {
    await fs.copyFile(filePath, backup);
  }

  const pipeline = sharp(backup, { failOn: 'none' }).rotate();
  if ((meta.width || 0) > MAX_EDGE || (meta.height || 0) > MAX_EDGE) {
    pipeline.resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true });
  }

  /* Written as WebP bytes under the ORIGINAL filename and extension.
     Browsers detect image type from content, not from the name, so a
     .jpg holding WebP data displays correctly -- and every URL already
     stored in the database keeps working untouched. */
  const buffer = await pipeline.webp({ quality: QUALITY }).toBuffer();
  await fs.writeFile(filePath, buffer);

  const after = (await fs.stat(filePath)).size;
  const saved = Math.max(0, 100 - Math.round((after / before) * 100));
  console.log(
    `  ${path.basename(filePath)}  ${kb(before)} -> ${kb(after)}  (-${saved}%)`
  );
  return { before, after, skipped: false };
}

async function run() {
  console.log(
    dryRun
      ? 'DRY RUN - nothing will be changed.'
      : `Optimising (max ${MAX_EDGE}px, quality ${QUALITY}). Originals kept in each folder's "originals" subfolder.`
  );
  if (limit !== Infinity) console.log(`Limited to ${limit} file(s).`);

  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

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

    console.log(`\n${folder}/  (${images.length} image${images.length === 1 ? '' : 's'})`);
    for (const name of images) {
      if (count >= limit) break;
      try {
        const result = await processFile(path.join(dir, name));
        totalBefore += result.before;
        totalAfter += result.after;
        count += 1;
      } catch (err) {
        console.error(`  ${name} FAILED: ${err.message}`);
      }
    }
    if (count >= limit) break;
  }

  console.log(`\n${count} file(s) processed.`);
  if (!dryRun && totalBefore > 0) {
    const saved = Math.max(0, 100 - Math.round((totalAfter / totalBefore) * 100));
    console.log(`Total: ${kb(totalBefore)} -> ${kb(totalAfter)} (-${saved}%)`);
  } else if (dryRun) {
    console.log(`Current total: ${kb(totalBefore)}`);
  }
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
