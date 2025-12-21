/**
 * Safe Zone Calculator
 * 
 * Calculates safe zones for text placement based on learned layout patterns
 * from top-performing creatives
 */

export interface SafeZones {
  eyebrow: {
    x: number; // percentage
    y: number; // percentage
    maxWidth: number; // percentage
  };
  headline: {
    x: number;
    y: number;
    maxWidth: number;
  };
  cta: {
    x: number;
    y: number;
    maxWidth: number;
  };
  avoidAreas: {
    description: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

/**
 * Calculate safe zones for text placement based on aspect ratio
 * 
 * Learned patterns from top-performing creatives:
 * - Top 20-40%: Eyebrow + Headline
 * - Bottom 10-30%: CTA Button
 * - Center 40-60%: AVOID - Main visual area
 */
export function calculateSafeZones(aspectRatio: '1:1' | '9:16'): SafeZones {
  if (aspectRatio === '1:1') {
    // Feed format (1080x1080)
    return {
      eyebrow: {
        x: 50, // centered
        y: 15, // top 15%
        maxWidth: 80, // 80% of image width
      },
      headline: {
        x: 50, // centered
        y: 40, // top 40%
        maxWidth: 85, // 85% of image width
      },
      cta: {
        x: 50, // centered
        y: 85, // bottom 15%
        maxWidth: 70, // 70% of image width
      },
      avoidAreas: [
        {
          description: "Center area for main visual (book, dashboard, product)",
          x: 20,
          y: 40,
          width: 60,
          height: 40,
        },
      ],
    };
  } else {
    // Story/Reel format (1080x1920)
    return {
      eyebrow: {
        x: 50, // centered
        y: 10, // top 10%
        maxWidth: 80,
      },
      headline: {
        x: 50, // centered
        y: 55, // lower third (below main visual)
        maxWidth: 85,
      },
      cta: {
        x: 50, // centered
        y: 90, // bottom 10%
        maxWidth: 70,
      },
      avoidAreas: [
        {
          description: "Upper half for main visual",
          x: 10,
          y: 15,
          width: 80,
          height: 35,
        },
      ],
    };
  }
}

/**
 * Get typography specs for optimal readability
 * 
 * Learned from top-performers:
 * - White text (#FFFFFF) on dark background
 * - Text shadow (NOT stroke!)
 * - High contrast
 */
export interface TypographySpecs {
  eyebrow: {
    color: string;
    fontSize: number; // pixels
    fontWeight: string;
    shadow: string;
  };
  headline: {
    color: string;
    fontSize: number;
    fontWeight: string;
    shadow: string;
  };
  cta: {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    fontWeight: string;
    padding: {
      x: number;
      y: number;
    };
  };
}

export function getTypographySpecs(aspectRatio: '1:1' | '9:16'): TypographySpecs {
  const baseSize = aspectRatio === '1:1' ? 1080 : 1080; // Both use 1080 width
  
  return {
    eyebrow: {
      color: '#00FF00', // Neon green (learned from top creatives)
      fontSize: Math.round(baseSize * 0.035), // ~38px for 1080
      fontWeight: 'bold',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.8)', // Strong shadow for readability
    },
    headline: {
      color: '#FFFFFF', // White
      fontSize: Math.round(baseSize * 0.065), // ~70px for 1080
      fontWeight: 'bold',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.9)', // Very strong shadow
    },
    cta: {
      backgroundColor: '#00FF00', // Neon green
      textColor: '#000000', // Black
      fontSize: Math.round(baseSize * 0.04), // ~43px for 1080
      fontWeight: 'bold',
      padding: {
        x: Math.round(baseSize * 0.08), // ~86px horizontal padding
        y: Math.round(baseSize * 0.025), // ~27px vertical padding
      },
    },
  };
}
