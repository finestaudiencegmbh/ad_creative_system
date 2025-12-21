/**
 * Landing Page Screenshot Service
 * 
 * Captures screenshots of landing pages for visual analysis
 */

import puppeteer from 'puppeteer';

export interface ScreenshotResult {
  imageBuffer: Buffer;
  base64: string;
}

/**
 * Capture screenshot of landing page hero section
 * 
 * @param url - Landing page URL
 * @returns Screenshot buffer and base64 string
 */
export async function captureLandingPageScreenshot(
  url: string
): Promise<ScreenshotResult> {
  let browser;
  
  try {
    console.log(`📸 Capturing screenshot of: ${url}`);
    
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    
    const page = await browser.newPage();
    
    // Set viewport to desktop size
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    
    // Navigate to landing page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Capture screenshot of hero section (first 1080px height)
    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      },
    });
    
    const imageBuffer = Buffer.from(screenshot);
    const base64 = imageBuffer.toString('base64');
    
    console.log(`✅ Screenshot captured (${imageBuffer.length} bytes)`);
    
    return {
      imageBuffer,
      base64,
    };
  } catch (error) {
    console.error(`❌ Screenshot capture failed:`, error);
    throw new Error(
      `Failed to capture screenshot: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Analyze landing page screenshot with Gemini Vision
 * 
 * @param base64Image - Base64-encoded screenshot
 * @returns Visual description in German
 */
export async function analyzeLandingPageVisuals(
  base64Image: string
): Promise<string> {
  const { invokeLLM } = await import('./_core/llm');
  
  try {
    console.log(`🔍 Analyzing landing page visuals with Gemini Vision...`);
    
    // Call Gemini Vision with image
    const response = await invokeLLM({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analysiere dieses Landing Page Hero-Bild und beschreibe die visuellen Elemente auf Deutsch.

FOKUS:
- Welche visuellen Elemente sind zu sehen? (z.B. Dashboard, Funnel, Grafiken, Personen, Produkte)
- Welche Farben dominieren?
- Welcher Stil wird verwendet? (modern, minimalistisch, futuristisch, etc.)
- Welche Stimmung vermittelt das Bild?

ANTWORT FORMAT:
Gib eine präzise, detaillierte Beschreibung der visuellen Elemente, die für die Generierung eines Meta Ads Creatives verwendet werden kann.

Beispiel: "Marketing-Dashboard mit lila/pink Farbschema, zeigt Analytics-Grafiken, Lead-Generierungs-Funnel, moderne futuristische Ästhetik mit 3D-Elementen"`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
    });
    
    const visualDescription = response.choices[0].message.content;
    
    if (!visualDescription || typeof visualDescription !== 'string') {
      throw new Error('No visual description returned from Gemini Vision');
    }
    
    console.log(`✅ Visual analysis complete: ${visualDescription.substring(0, 100)}...`);
    
    return visualDescription;
  } catch (error) {
    console.error(`❌ Visual analysis failed:`, error);
    throw new Error(
      `Failed to analyze visuals: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
