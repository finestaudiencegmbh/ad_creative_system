/**
 * Text Overlay using Sharp + SVG
 * Alternative to Canvas-based text rendering
 */

import sharp from 'sharp';
import { calculateSafeZones, getTypographySpecs } from './safe-zone-calculator';

type CreativeFormat = 'feed' | 'story' | 'reel' | 'all';

export interface TextOverlayConfig {
  imageBuffer: Buffer;
  eyebrowText?: string;
  headlineText: string;
  ctaText?: string;
  format: CreativeFormat;
  designSystem?: { colorPalette: string[] };
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

// Format configs now use learned safe zones and typography
const formatConfigs: Record<Exclude<CreativeFormat, 'all'>, FormatConfig> = {
  feed: {
    width: 1080,
    height: 1080,
    safeZoneTop: 74,  // Learned from user creatives
    safeZoneBottom: 19,  // Learned from user creatives
    eyebrowFontSize: 37,  // Learned from user creatives
    headlineFontSize: 68,  // Learned from user creatives
    ctaFontSize: 32,
    lineHeight: 1.2,
  },
  story: {
    width: 1080,
    height: 1920,
    safeZoneTop: 192, // 10% of 1920 (learned from top performers)
    safeZoneBottom: 192, // 10% of 1920
    eyebrowFontSize: 38,
    headlineFontSize: 70,
    ctaFontSize: 43,
    lineHeight: 1.2,
  },
  reel: {
    width: 1080,
    height: 1920,
    safeZoneTop: 192, // 10% of 1920
    safeZoneBottom: 192, // 10% of 1920
    eyebrowFontSize: 38,
    headlineFontSize: 70,
    ctaFontSize: 43,
    lineHeight: 1.2,
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
  
  // Extract colors from design system or use defaults
  // Eyebrow: Prefer red/warm accent colors
  const eyebrowColor = config.designSystem?.colorPalette?.find((c: string) => 
    c.toUpperCase().match(/#[A-F][0-9A-F]{1}0000/) || // Red colors like #FF0000, #A00000
    c.toUpperCase().match(/#[E-F][0-9A-F]{4}/) || // Bright reds
    c.toUpperCase().match(/#[3-4][0-9A-F]FF[0-9A-F]{2}/) // Neon greens like #39FF14, #26FF00
  ) || '#FF0000';
  
  // CTA: Prefer green colors
  const ctaColor = config.designSystem?.colorPalette?.find((c: string) => 
    c.toUpperCase().match(/#00[6-8][0-9A-F]{3}/) || // Green colors like #008000, #006600
    c.toUpperCase().match(/#[0-6][A-F]1[B-F]9[A-F]/) // Purple colors like #5E259F, #6A1B9A
  ) || '#008000';

  // Eyebrow text (small, uppercase, colored)
  if (config.eyebrowText) {
    currentY += eyebrowFontSize;
    svgElements.push(`
      <defs>
        <filter id="eyebrow-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.8"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <text
        x="${width / 2}"
        y="${currentY}"
        font-family="Arial, sans-serif"
        font-size="${eyebrowFontSize}"
        font-weight="700"
        fill="${eyebrowColor}"
        text-anchor="middle"
        letter-spacing="2"
        filter="url(#eyebrow-shadow)"
      >${escapeXml(config.eyebrowText.toUpperCase())}</text>
    `);
    currentY += spacing;
  }

  // Headline text (large, bold, white, multi-line with strong shadow)
  svgElements.push(`
    <defs>
      <filter id="headline-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
        <feOffset dx="0" dy="4" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.9"/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  `);
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
        filter="url(#headline-shadow)"
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
        fill="${ctaColor}"
        rx="9"
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
