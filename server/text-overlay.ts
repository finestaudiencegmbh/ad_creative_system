/**
 * Text Overlay Engine
 * 
 * Adds text overlays to generated images using Canvas API
 */

import type { DesignSystem } from './creative-analyzer';

// Canvas is optional - gracefully handle if not available
let createCanvas: any;
let loadImage: any;
let registerFont: any;

try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
  registerFont = canvas.registerFont;
} catch (error) {
  console.warn('⚠️  Canvas module not available - text overlays will be skipped');
}

export type CreativeFormat = 'feed' | 'story' | 'reel' | 'all';
export type ActualFormat = Exclude<CreativeFormat, 'all'>;

export interface FormatDimensions {
  width: number;
  height: number;
  aspectRatio: string;
  safeZones: {
    top: number; // Percentage from top
    bottom: number; // Percentage from bottom
    textAreaStart: number; // Percentage where text can start
    textAreaEnd: number; // Percentage where text must end
  };
}

export const FORMAT_SPECS: Record<Exclude<CreativeFormat, 'all'>, FormatDimensions> = {
  feed: {
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    safeZones: {
      top: 5,
      bottom: 5,
      textAreaStart: 8,
      textAreaEnd: 92,
    },
  },
  story: {
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    safeZones: {
      top: 14, // Profile/Username area
      bottom: 20, // CTA area
      textAreaStart: 18,
      textAreaEnd: 66, // Middle 66% is safe
    },
  },
  reel: {
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    safeZones: {
      top: 25, // UI elements
      bottom: 30, // Description/Audio
      textAreaStart: 28,
      textAreaEnd: 45, // Middle 45% is safe
    },
  },
};

export interface TextOverlayConfig {
  eyebrowText?: string;
  headlineText: string;
  ctaText?: string;
  designSystem: DesignSystem;
  format?: CreativeFormat; // Default: 'feed'
}

/**
 * Add text overlay to image
 */
export async function addTextOverlay(
  imageUrl: string,
  config: TextOverlayConfig
): Promise<Buffer> {
  // Check if canvas is available
  if (!createCanvas || !loadImage) {
    throw new Error('Canvas module not available - cannot add text overlays');
  }
  
  try {
    // Load the generated image
    const image = await loadImage(imageUrl);
    
    // Get format specifications
    const format = (config.format || 'feed') as Exclude<CreativeFormat, 'all'>;
    const formatSpec = FORMAT_SPECS[format];
    
    // Create canvas with same dimensions
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the base image
    ctx.drawImage(image, 0, 0);
    
    // Extract colors from design system
    const colors = config.designSystem.colorPalette;
    const accentColor = colors.find(c => c !== '#000000' && c !== '#FFFFFF') || '#8B5CF6';
    const primaryColor = '#FFFFFF';
    
    // Calculate responsive font sizes based on image dimensions
    const baseSize = Math.min(image.width, image.height);
    const eyebrowSize = Math.floor(baseSize * 0.04); // 4% of base
    const headlineSize = Math.floor(baseSize * 0.08); // 8% of base
    const ctaSize = Math.floor(baseSize * 0.05); // 5% of base
    
    // Calculate safe zone positions
    const textStartY = image.height * (formatSpec.safeZones.textAreaStart / 100);
    const textEndY = image.height * (formatSpec.safeZones.textAreaEnd / 100);
    const textAreaHeight = textEndY - textStartY;
    
    // Add eyebrow text (top of safe zone)
    if (config.eyebrowText) {
      ctx.font = `bold ${eyebrowSize}px Arial, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const eyebrowY = textStartY;
      ctx.fillText(config.eyebrowText.toUpperCase(), image.width / 2, eyebrowY);
    }
    
    // Add headline text (center of safe zone)
    ctx.font = `bold ${headlineSize}px Arial, sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Word wrap for headline
    const headlineY = config.eyebrowText 
      ? textStartY + eyebrowSize * 1.5 
      : textStartY + textAreaHeight * 0.1;
    const maxWidth = image.width * 0.9; // 90% of width
    wrapText(ctx, config.headlineText.toUpperCase(), image.width / 2, headlineY, maxWidth, headlineSize * 1.2);
    
    // Highlight numbers in headline (make them green/accent)
    highlightNumbers(ctx, config.headlineText, image.width / 2, headlineY, maxWidth, headlineSize, accentColor);
    
    // Add CTA button (bottom of safe zone)
    if (config.ctaText) {
      const ctaY = textEndY - ctaSize * 2; // Position above safe zone end
      const ctaWidth = config.ctaText.length * ctaSize * 0.7;
      const ctaHeight = ctaSize * 2;
      const ctaX = (image.width - ctaWidth) / 2;
      
      // Draw button background with border
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Semi-transparent background
      roundRect(ctx, ctaX - 20, ctaY - ctaHeight / 2, ctaWidth + 40, ctaHeight, 10);
      ctx.fill();
      ctx.stroke();
      
      // Draw button text
      ctx.font = `bold ${ctaSize}px Arial, sans-serif`;
      ctx.fillStyle = primaryColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.ctaText, image.width / 2, ctaY);
    }
    
    // Return as buffer
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Text overlay error:', error);
    throw new Error('Failed to add text overlay');
  }
}

/**
 * Word wrap text
 */
function wrapText(
  ctx: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

/**
 * Highlight numbers in text with accent color
 */
function highlightNumbers(
  ctx: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  accentColor: string
) {
  // Find number patterns (e.g., "70-380", "100+", "$5,000")
  const numberPattern = /\d+[-–]\d+|\d+\+|\$?\d{1,3}(,\d{3})*(\.\d+)?%?/g;
  const matches = text.match(numberPattern);
  
  if (!matches) return;
  
  // Re-render text with highlighted numbers
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  const lineHeight = fontSize * 1.2;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      currentY += lineHeight;
      line = word + ' ';
    } else {
      line = testLine;
    }
    
    // Check if word contains number
    if (numberPattern.test(word)) {
      ctx.fillStyle = accentColor;
      const wordX = x - ctx.measureText(line).width / 2 + ctx.measureText(line.slice(0, line.lastIndexOf(word))).width;
      ctx.fillText(word, wordX, currentY);
      ctx.fillStyle = '#FFFFFF'; // Reset to white
    }
  }
}

/**
 * Draw rounded rectangle
 */
function roundRect(
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
