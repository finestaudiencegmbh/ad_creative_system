/**
 * Google Gemini Image Generation
 * Uses Gemini 2.0 Flash with Imagen 3 for complete ad creative generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '');

interface GeminiImageGenerationParams {
  prompt: string;
  aspectRatio: '1:1' | '9:16';
  eyebrowText?: string;
  headlineText: string;
  ctaText?: string;
  styleDescription?: string;
}

interface GeminiImageGenerationResult {
  url: string;
  base64?: string;
}

/**
 * Generate ad creative with Gemini + Imagen 3
 * Returns complete image with text overlays integrated
 */
export async function generateImageWithGemini(
  params: GeminiImageGenerationParams
): Promise<GeminiImageGenerationResult> {
  const { prompt, aspectRatio, eyebrowText, headlineText, ctaText, styleDescription } = params;

  // Determine dimensions and safe zones based on aspect ratio
  const isSquare = aspectRatio === '1:1';
  const dimensions = isSquare 
    ? '1080x1080 pixels (square format for Facebook/Instagram Feed)'
    : '1080x1920 pixels (vertical format for Instagram Stories/Reels)';
  
  const safeZones = isSquare
    ? 'No safe zones required for square format'
    : 'IMPORTANT: Keep text in safe zone - avoid top 25% and bottom 30% of image for Stories/Reels UI elements';

  // Build comprehensive prompt for Gemini
  const fullPrompt = `Create a professional, high-quality Facebook/Instagram advertising creative image.

**IMAGE SPECIFICATIONS:**
- Dimensions: ${dimensions}
- Aspect Ratio: ${aspectRatio}
- ${safeZones}

**VISUAL STYLE:**
${styleDescription || prompt}

**TEXT ELEMENTS (MUST BE CLEARLY VISIBLE AND INTEGRATED INTO THE DESIGN):**
${eyebrowText ? `
1. EYEBROW TEXT (small, uppercase, positioned above headline):
   Text: "${eyebrowText}"
   Style: Small font, uppercase, accent color (bright cyan/green #00ff88), positioned at top of text block
` : ''}

2. MAIN HEADLINE (large, bold, most prominent):
   Text: "${headlineText}"
   Style: Very large bold font, white color, high contrast, centered or left-aligned
   ${!isSquare ? 'Position: Center of safe zone (between 25% from top and 30% from bottom)' : 'Position: Center of image'}

${ctaText ? `
3. CALL-TO-ACTION BUTTON:
   Text: "${ctaText}"
   Style: Button with bright accent background (#00ff88), dark text, rounded corners
   Position: Below headline with spacing
` : ''}

**DESIGN REQUIREMENTS:**
- Modern, professional advertising aesthetic matching Meta Ads best practices
- High contrast between text and background for maximum readability
- Text must be sharp, clear, and perfectly legible
- Use professional typography (sans-serif, bold weights)
- Background should be visually interesting but not compete with text
- Color scheme: Dark background with bright accent colors for text/buttons
- Professional gradient or solid background with subtle visual elements
- NO stock photo watermarks or placeholder text
- Create a cohesive design where text and visuals work together seamlessly

**STYLE NOTES:**
- Think premium, conversion-optimized Meta advertising
- Similar to high-performing lead generation ads
- Modern, clean, data-driven aesthetic
- Professional color palette with strategic use of accent colors

Generate a complete, ready-to-use advertising creative that looks professional and conversion-optimized.`;

  try {
    // Use Gemini 2.0 Flash for image generation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
    });

    console.log('🎨 Generating image with Gemini + Imagen 3...');
    console.log('📝 Prompt:', fullPrompt.substring(0, 300) + '...');

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: fullPrompt,
        }],
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;
    const text = response.text();

    // Check if response contains image data
    // Note: Gemini 2.0 Flash currently generates text descriptions
    // For actual image generation, we need to use Imagen API separately
    // or wait for Gemini's image generation to be fully released

    console.log('📄 Gemini response:', text.substring(0, 200));

    // For now, we'll return a placeholder and note that we need to integrate Imagen API
    // The actual implementation would call Imagen 3 API with the enhanced prompt
    
    throw new Error('Gemini image generation requires Imagen 3 API integration - not yet available in SDK');

  } catch (error) {
    console.error('❌ Gemini image generation error:', error);
    throw new Error(`Gemini image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhance prompt using Gemini's understanding
 * This works immediately and can improve FLUX/Replicate prompts
 */
export async function enhancePromptWithGemini(
  basePrompt: string,
  context: {
    eyebrowText?: string;
    headlineText: string;
    ctaText?: string;
    aspectRatio: '1:1' | '9:16';
  }
): Promise<string> {
  const dimensions = context.aspectRatio === '1:1' 
    ? '1080x1080px square'
    : '1080x1920px vertical';

  const promptEnhancementRequest = `You are an expert at creating detailed image generation prompts for advertising creatives.

Base visual concept: ${basePrompt}

Ad text elements that will be overlaid:
${context.eyebrowText ? `- Eyebrow: "${context.eyebrowText}"` : ''}
- Headline: "${context.headlineText}"
${context.ctaText ? `- CTA: "${context.ctaText}"` : ''}

Format: ${dimensions} (${context.aspectRatio})

Create an extremely detailed, specific image generation prompt for FLUX/Replicate that will produce a professional Facebook/Instagram ad creative BACKGROUND (text will be added separately). Include:

1. Exact visual style and composition
2. Specific color palette (dark backgrounds work best for text overlays)
3. Lighting and atmosphere
4. Visual elements and their placement
5. Mood and aesthetic
6. Technical details (depth, perspective, quality)

The background should:
- Be visually interesting but not too busy
- Provide good contrast for white/bright text overlays
- Match modern Meta advertising aesthetics
- Support the headline's message

Return ONLY the enhanced prompt optimized for FLUX, no explanations or additional text.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
    });

    const result = await model.generateContent(promptEnhancementRequest);
    const enhancedPrompt = result.response.text().trim();

    console.log('✨ Prompt enhanced by Gemini');
    console.log('📝 Enhanced:', enhancedPrompt.substring(0, 150) + '...');
    
    return enhancedPrompt;

  } catch (error) {
    console.error('⚠️  Gemini prompt enhancement failed, using base prompt:', error);
    return basePrompt;
  }
}
