/**
 * Landing Page Scraper
 * 
 * Scrapes landing pages to extract metadata for automatic creative generation
 */

import * as cheerio from 'cheerio';

export interface LandingPageData {
  url: string;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  keywords: string | null;
  h1: string | null;
  h2: string | null; // First H2 (subheadline)
  heroImages: string[]; // Images in hero section
  ctaText: string | null; // First CTA button text
  error?: string;
}

/**
 * Scrape landing page and extract metadata
 */
export async function scrapeLandingPage(url: string): Promise<LandingPageData> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AdCreativeBot/1.0)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $('title').text().trim() || null;
    const description = $('meta[name="description"]').attr('content')?.trim() || null;
    const keywords = $('meta[name="keywords"]').attr('content')?.trim() || null;
    
    // Open Graph tags
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null;
    const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || null;
    const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || null;
    
    // First H1 heading
    const h1 = $('h1').first().text().trim() || null;
    
    // First H2 (subheadline)
    const h2 = $('h2').first().text().trim() || null;
    
    // Extract hero images (first 3 images in body)
    const heroImages: string[] = [];
    $('img').slice(0, 3).each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        // Convert relative URLs to absolute
        try {
          const absoluteUrl = new URL(src, url).href;
          heroImages.push(absoluteUrl);
        } catch {
          // Skip invalid URLs
        }
      }
    });
    
    // Extract first CTA button text
    const ctaText = $('button, a.button, a.btn, [class*="cta"]').first().text().trim() || null;

    return {
      url,
      title,
      description,
      ogTitle,
      ogDescription,
      ogImage,
      keywords,
      h1,
      h2,
      heroImages,
      ctaText,
    };
  } catch (error) {
    return {
      url,
      title: null,
      description: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      keywords: null,
      h1: null,
      h2: null,
      heroImages: [],
      ctaText: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get best description from scraped data
 * Priority: OG Description > Meta Description > H1 > Title
 */
export function getBestDescription(data: LandingPageData): string | null {
  return data.ogDescription || data.description || data.h1 || data.title;
}

/**
 * Get best title from scraped data
 * Priority: OG Title > Title > H1
 */
export function getBestTitle(data: LandingPageData): string | null {
  return data.ogTitle || data.title || data.h1;
}
