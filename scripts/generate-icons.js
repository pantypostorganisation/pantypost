// scripts/generate-icons.js

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_ICON = 'public/logo.png'; // Using your existing logo

async function generateIcons() {
  console.log('✅ Generating PWA icons...');

  const iconsDir = path.join(process.cwd(), 'public', 'icons');

  // Create icons directory if it doesn't exist
  await fs.mkdir(iconsDir, { recursive: true });

  // Check if source icon exists
  try {
    await fs.access(SOURCE_ICON);
  } catch {
    console.error('❌ Source icon not found at:', SOURCE_ICON);
    console.log('Please ensure your logo.png exists in the public folder');
    return;
  }

  // Generate icons
  for (const size of ICON_SIZES) {
    await sharp(SOURCE_ICON)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));

    console.log(`✅ Generated icon-${size}x${size}.png`);
  }

  // Generate maskable icons (with padding)
  for (const size of ICON_SIZES) {
    const paddedSize = Math.floor(size * 0.8);
    await sharp(SOURCE_ICON)
      .resize(paddedSize, paddedSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .extend({
        top: Math.floor((size - paddedSize) / 2),
        bottom: Math.floor((size - paddedSize) / 2),
        left: Math.floor((size - paddedSize) / 2),
        right: Math.floor((size - paddedSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(iconsDir, `icon-maskable-${size}x${size}.png`));

    console.log(`✅ Generated icon-maskable-${size}x${size}.png`);
  }

  console.log('✅ All icons generated successfully!');
}

generateIcons().catch(console.error);