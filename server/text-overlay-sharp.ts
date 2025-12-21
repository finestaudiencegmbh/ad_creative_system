/**
 * Text Overlay using Sharp + SVG
 * Alternative to Canvas-based text rendering
 */

import sharp from 'sharp';

type CreativeFormat = 'feed' | 'story' | 'reel' | 'all';

interface TextOverlayConfig {
  imageBuffer: Buffer;
  eyebrowText?: string;
  headlineText: string;
  ctaText?: string;
  format: CreativeFormat;
}

interface FormatConfig {
  width: number;
  height: number;
  safeZoneTop: number;
  safeZoneBottom: number;
  eyebrowFontSize: number;
  headlineFontSize: number;
  ctaFontSize: number;
  lineHeight: number;
}

const formatConfigs: Record<Exclude<CreativeFormat, 'all'>, FormatConfig> = {
  feed: {
    width: 1080,
    height: 1080,
    safeZoneTop: 0,
    safeZoneBottom: 0,
    eyebrowFontSize: 28,
    headlineFontSize: 56,
    ctaFontSize: 32,
    lineHeight: 1.3,
  },
  story: {
    width: 1080,
    height: 1920,
    safeZoneTop: 269, // 14% of 1920
    safeZoneBottom: 384, // 20% of 1920
    eyebrowFontSize: 32,
    headlineFontSize: 64,
    ctaFontSize: 36,
    lineHeight: 1.3,
  },
  reel: {
    width: 1080,
    height: 1920,
    safeZoneTop: 480, // 25% of 1920
    safeZoneBottom: 576, // 30% of 1920
    eyebrowFontSize: 32,
    headlineFontSize: 64,
    ctaFontSize: 36,
    lineHeight: 1.3,
  },
};

/**
 * Escape XML special characters for SVG
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap text to fit within max width
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Generate SVG overlay with text
 */
function generateTextSVG(config: TextOverlayConfig): string {
  const fmt = formatConfigs[config.format as Exclude<CreativeFormat, 'all'>];
  const { width, height, safeZoneTop, safeZoneBottom, eyebrowFontSize, headlineFontSize, ctaFontSize, lineHeight } = fmt;

  // Calculate available height for text
  const availableHeight = height - safeZoneTop - safeZoneBottom;
  const centerY = safeZoneTop + availableHeight / 2;

  // Wrap headline text
  const maxCharsPerLine = config.format === 'feed' ? 20 : 18;
  const headlineLines = wrapText(config.headlineText, maxCharsPerLine);

  // Calculate total text block height
  const eyebrowHeight = config.eyebrowText ? eyebrowFontSize * lineHeight : 0;
  const headlineHeight = headlineLines.length * headlineFontSize * lineHeight;
  const ctaHeight = config.ctaText ? ctaFontSize * lineHeight : 0;
  const spacing = 20;
  const totalHeight = eyebrowHeight + (config.eyebrowText ? spacing : 0) + headlineHeight + (config.ctaText ? spacing : 0) + ctaHeight;

  // Start Y position to center the text block
  let currentY = centerY - totalHeight / 2;

  const svgElements: string[] = [];

  // Eyebrow text (small, uppercase, colored)
  if (config.eyebrowText) {
    currentY += eyebrowFontSize;
    svgElements.push(`
      <text
        x="${width / 2}"
        y="${currentY}"
        font-family="Arial, sans-serif"
        font-size="${eyebrowFontSize}"
        font-weight="700"
        fill="#00ff88"
        text-anchor="middle"
        letter-spacing="2"
      >${escapeXml(config.eyebrowText.toUpperCase())}</text>
    `);
    currentY += spacing;
  }

  // Headline text (large, bold, white, multi-line)
  headlineLines.forEach((line, index) => {
    currentY += headlineFontSize * lineHeight;
    svgElements.push(`
      <text
        x="${width / 2}"
        y="${currentY}"
        font-family="Arial, sans-serif"
        font-size="${headlineFontSize}"
        font-weight="900"
        fill="#ffffff"
        text-anchor="middle"
      >${escapeXml(line)}</text>
    `);
  });

  // CTA text (medium, white with background)
  if (config.ctaText) {
    currentY += spacing + ctaFontSize;
    const ctaWidth = config.ctaText.length * (ctaFontSize * 0.6);
    const ctaPadding = 20;
    const ctaBoxWidth = ctaWidth + ctaPadding * 2;
    const ctaBoxHeight = ctaFontSize + 16;

    svgElements.push(`
      <rect
        x="${width / 2 - ctaBoxWidth / 2}"
        y="${currentY - ctaFontSize}"
        width="${ctaBoxWidth}"
        height="${ctaBoxHeight}"
        fill="#00ff88"
        rx="8"
      />
      <text
        x="${width / 2}"
        y="${currentY}"
        font-family="Arial, sans-serif"
        font-size="${ctaFontSize}"
        font-weight="700"
        fill="#000000"
        text-anchor="middle"
      >${escapeXml(config.ctaText)}</text>
    `);
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgElements.join('\n')}
    </svg>
  `;
}

/**
 * Add text overlay to image using Sharp + SVG
 */
export async function addTextOverlaySharp(config: TextOverlayConfig): Promise<Buffer> {
  try {
    const fmt = formatConfigs[config.format as Exclude<CreativeFormat, 'all'>];
    const { width, height } = fmt;

    const svg = generateTextSVG(config);
    const svgBuffer = Buffer.from(svg);

    // Convert SVG to PNG with explicit dimensions
    const svgImage = await sharp(svgBuffer)
      .resize(width, height)
      .png()
      .toBuffer();

    // Composite SVG overlay on top of image
    const result = await sharp(config.imageBuffer)
      .resize(width, height) // Ensure base image has correct size
      .composite([
        {
          input: svgImage,
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    console.log(`✅ Text overlay added successfully using Sharp (${config.format})`);
    return result;
  } catch (error) {
    console.error('❌ Sharp text overlay error:', error);
    // Return original image if overlay fails
    return config.imageBuffer;
  }
}
