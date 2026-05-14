import sharp from 'sharp';

// Use grifo-icon.png as source (1024x588)
// Crop to center square, then resize

const source = 'public/grifo-icon.png';

async function generateIcon(size, filename) {
  const img = sharp(source);
  const meta = await img.metadata();
  
  // Center crop to square
  const squareSize = Math.min(meta.width, meta.height);
  const left = Math.floor((meta.width - squareSize) / 2);
  const top = Math.floor((meta.height - squareSize) / 2);
  
  await sharp(source)
    .extract({ left, top, width: squareSize, height: squareSize })
    .resize(size, size)
    .png()
    .toFile(`public/${filename}`);
    
  console.log(`✅ Generated ${filename} (${size}x${size})`);
}

await generateIcon(192, 'icon-192.png');
await generateIcon(512, 'icon-512.png');
await generateIcon(512, 'icon-512-maskable.png');

console.log('All icons generated!');
