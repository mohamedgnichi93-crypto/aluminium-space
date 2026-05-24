const sharp = require('sharp');
const path = require('path');

const SRC = path.resolve(
  'C:/Users/ASUS-PC/.gemini/antigravity-ide/brain/60507d3c-3764-478e-8c88-5e3b7158e5fd/media__1779654243709.png'
);

const PUBLIC = path.resolve(__dirname, '..', 'public');

const targets = [
  { file: path.join(PUBLIC, 'icon-192.png'),              size: 192 },
  { file: path.join(PUBLIC, 'icon-512.png'),              size: 512 },
  { file: path.join(PUBLIC, 'icon-512-maskable.png'),     size: 512 },
  { file: path.join(PUBLIC, 'logo-aluminium-space.png'),  size: 180 },
  { file: path.join(PUBLIC, 'images', 'favicon.png'),     size: 32  },
];

(async () => {
  for (const { file, size } of targets) {
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(file);

    // Verify
    const meta = await sharp(file).metadata();
    console.log(`✅ ${path.basename(file)} → ${meta.width}×${meta.height} (${meta.channels}ch, hasAlpha=${meta.hasAlpha})`);
  }
  console.log('\nAll 5 icons saved successfully.');
})();
