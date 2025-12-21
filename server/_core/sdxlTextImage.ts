/**
 * SDXL Text-Aware Image Generation via Replicate HTTP API
 * Generates images with text integrated directly into the composition
 * Uses HTTP API directly instead of Node.js library to avoid empty object bug
 */

import { ENV } from './env';

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

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
}

/**
 * Generate image with integrated text using SDXL via HTTP API
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

    // Step 1: Create prediction via HTTP API
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${ENV.replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
        input: {
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          width,
          height,
          num_outputs: 1,
          num_inference_steps: 40,
          guidance_scale: 7.5,
          scheduler: "K_EULER",
        }
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create prediction: ${createResponse.status} ${errorText}`);
    }

    const prediction = await createResponse.json() as ReplicatePrediction;
    console.log(`✅ Prediction created: ${prediction.id}, status: ${prediction.status}`);

    // Step 2: Poll for completion
    let finalPrediction = prediction;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max (1s intervals)

    while ((finalPrediction.status === 'starting' || finalPrediction.status === 'processing') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${ENV.replicateApiToken}`,
        }
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        throw new Error(`Failed to poll prediction: ${pollResponse.status} ${errorText}`);
      }

      finalPrediction = await pollResponse.json() as ReplicatePrediction;
      console.log(`⏳ Status: ${finalPrediction.status} (attempt ${attempts}/${maxAttempts})`);
    }

    // Step 3: Check result
    if (finalPrediction.status === 'failed') {
      throw new Error(`SDXL generation failed: ${finalPrediction.error || 'Unknown error'}`);
    }

    if (finalPrediction.status !== 'succeeded') {
      throw new Error(`SDXL generation timed out after ${attempts} attempts`);
    }

    if (!finalPrediction.output || finalPrediction.output.length === 0) {
      throw new Error(`SDXL succeeded but returned no output`);
    }

    const imageUrl = finalPrediction.output[0];
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
