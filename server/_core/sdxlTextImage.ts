/**
 * SDXL Text-Aware Image Generation via Replicate
 * Generates images with text integrated directly into the composition
 */

import Replicate from 'replicate';
import { ENV } from './env';

const replicate = new Replicate({
  auth: ENV.replicateApiToken,
});

interface SDXLTextImageConfig {
  prompt: string;
  textElements: {
    eyebrow?: string;
    headline: string;
    cta?: string;
  };
  width: number;
  height: number;
  styleReference?: string;
}

/**
 * Generate image with integrated text using SDXL
 * Uses prompt engineering to ensure text is rendered clearly
 */
export async function generateSDXLTextImage(config: SDXLTextImageConfig): Promise<string> {
  const { prompt, textElements, width, height } = config;

  // Build comprehensive prompt with text instructions
  const textPrompt = buildTextPrompt(textElements);
  const fullPrompt = `${prompt}

${textPrompt}

Style: Modern advertising creative, professional typography, clean layout, high contrast text, readable fonts, marketing poster aesthetic`;

  const negativePrompt = `blurry text, unreadable text, distorted letters, misspelled words, low quality, pixelated, watermark, signature`;

  try {
    console.log(`🎨 Generating SDXL image with text: ${width}x${height}`);
    console.log(`📝 Text elements:`, textElements);

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          width,
          height,
          num_outputs: 1,
          num_inference_steps: 40,
          guidance_scale: 7.5,
          scheduler: "K_EULER",
        },
      }
    );

    console.log(`🔍 SDXL raw output:`, JSON.stringify(output, null, 2));
    console.log(`🔍 Output type: ${typeof output}, isArray: ${Array.isArray(output)}`);

    // Handle different output formats
    let imageUrl: string | undefined;
    
    if (Array.isArray(output)) {
      imageUrl = output[0];
      console.log(`📊 Array output, first element: ${imageUrl}`);
    } else if (typeof output === 'string') {
      imageUrl = output;
      console.log(`📊 String output: ${imageUrl}`);
    } else if (output && typeof output === 'object') {
      // Try to extract URL from object
      const obj = output as any;
      imageUrl = obj.url || obj.uri || obj.output || obj[0];
      console.log(`📊 Object output, extracted: ${imageUrl}`);
    }
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error(`❌ Invalid SDXL output format. Output:`, output);
      throw new Error(`Invalid SDXL output format: expected string URL, got ${typeof output}. Raw output: ${JSON.stringify(output)}`);
    }

    console.log(`✅ SDXL image generated: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error('❌ SDXL generation error:', error);
    throw error;
  }
}

/**
 * Build text-focused prompt from text elements
 */
function buildTextPrompt(textElements: SDXLTextImageConfig['textElements']): string {
  const parts: string[] = [];

  if (textElements.eyebrow) {
    parts.push(`Small uppercase text at top: "${textElements.eyebrow}"`);
  }

  parts.push(`Large bold headline text in center: "${textElements.headline}"`);

  if (textElements.cta) {
    parts.push(`Call-to-action button at bottom with text: "${textElements.cta}"`);
  }

  return `Text overlay composition:\n${parts.join('\n')}`;
}
