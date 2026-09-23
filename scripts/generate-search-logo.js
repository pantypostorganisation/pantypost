// scripts/generate-search-logo.js
//
// Builds the logo Google shows beside search results.
//
// The app icons are transparent, which is right for a browser tab and
// for an Android home screen where the OS supplies the backdrop. It is
// wrong for Google's results page: that renders on WHITE, with no dark
// mode, so a mark drawn to sit on black either vanishes or floats
// without its container.
//
// So this composites the existing icon onto a solid background and
// writes a separate file. The app icons are left alone -- they are
// correct for what they do.
//
// Run:  node scripts/generate-search-logo.js

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '..', 'src', 'app', 'icon.png');
const OUTPUT = path.join(__dirname, '..', 'public', 'icons', 'search-logo-512.png');

/* Black rather than orange. The mark is orange, so orange-on-orange
   would disappear; black is the brand's other colour and gives the
   mark maximum contrast on a white page. */
const BACKGROUND = { r: 0, g: 0, b: 0, alpha: 1 };

/* Google wants square, at least 112px, and ideally a multiple of 48.
   512 satisfies all three and downscales cleanly. */
const SIZE = 512;

/* A little breathing room. A mark that touches the edge of its tile
   looks cramped once Google renders it at 40px in a result row. */
const PADDING = 48;

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source not found: ${SOURCE}`);
    process.exit(1);
  }

  const inner = SIZE - PADDING * 2;

  const mark = await sharp(SOURCE)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: mark, top: PADDING, left: PADDING }])
    .png()
    .toFile(OUTPUT);

  const { size } = fs.statSync(OUTPUT);
  console.log(`Wrote ${OUTPUT} (${SIZE}x${SIZE}, ${(size / 1024).toFixed(1)} KB)`);
  console.log('Point the Organization logo in src/app/layout.tsx at /icons/search-logo-512.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
