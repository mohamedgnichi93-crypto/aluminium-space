const sharp = require('sharp');
const path = require('path');

const SRC = 'C:/Users/ASUS-PC/.gemini/antigravity-ide/brain/60507d3c-3764-478e-8c88-5e3b7158e5fd/media__1779655026857.jpg';
const DEST = path.resolve(__dirname, '..', 'public', 'images', 'logo-devis.png');

(async () => {
  // Resize to fit within 300×200 while preserving aspect ratio,
  // with a white background (PDF needs white, not transparent)
  await sharp(SRC)
    .resize(300, 200, {
      fit: 'inside',            // fit within bounding box, preserve aspect ratio
      withoutEnlargement: false
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // ensure white bg
    .png()
    .toFile(DEST);

  // Verify
  const meta = await sharp(DEST).metadata();
  const fs = require('fs');
  const stat = fs.statSync(DEST);
  console.log('Saved:', DEST);
  console.log('Dimensions:', meta.width + 'x' + meta.height);
  console.log('Format:', meta.format);
  console.log('Channels:', meta.channels, '(hasAlpha=' + meta.hasAlpha + ')');
  console.log('File size:', (stat.size / 1024).toFixed(1) + ' KB');
})();
