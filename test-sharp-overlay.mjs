import sharp from 'sharp';

// Create a simple test image (1080x1080)
const testImage = await sharp({
  create: {
    width: 1080,
    height: 1080,
    channels: 4,
    background: { r: 50, g: 50, b: 100, alpha: 1 }
  }
}).png().toBuffer();

console.log('✅ Test image created: 1080x1080');

// Create SVG overlay
const svg = `
  <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
    <text x="540" y="540" font-family="Arial" font-size="64" fill="#ffffff" text-anchor="middle">TEST TEXT</text>
  </svg>
`;

const svgBuffer = Buffer.from(svg);

try {
  // Method 1: Direct composite (current approach)
  const result1 = await sharp(testImage)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();
  console.log('✅ Method 1 (direct composite) works!');
} catch (error) {
  console.error('❌ Method 1 failed:', error.message);
}

try {
  // Method 2: Convert SVG to PNG first
  const svgImage = await sharp(svgBuffer).resize(1080, 1080).png().toBuffer();
  const result2 = await sharp(testImage)
    .composite([{ input: svgImage, top: 0, left: 0 }])
    .png()
    .toBuffer();
  console.log('✅ Method 2 (SVG→PNG→composite) works!');
} catch (error) {
  console.error('❌ Method 2 failed:', error.message);
}
