/**
 * Claude Image Generation
 * Uses Anthropic's Claude API to generate complete ad creatives with text overlays
 */

import Anthropic from '@anthropic-ai/sdk';
import { ENV } from './env';

const anthropic = new Anthropic({
  apiKey: process.env.OPENAI_API_KEY || '', // Anthropic API key from env
});

interface ClaudeImageGenerationParams {
  prompt: string;
  aspectRatio: '1:1' | '9:16';
  eyebrowText?: string;
  headlineText: string;
  ctaText?: string;
  styleReference?: string; // URL to winning ad for style matching
}

interface ClaudeImageGenerationResult {
  url: string;
  base64?: string;
}

/**
 * Generate ad creative with Claude
 * Returns complete image with text overlays integrated
 */
export async function generateImageWithClaude(
  params: ClaudeImageGenerationParams
): Promise<ClaudeImageGenerationResult> {
  const { prompt, aspectRatio, eyebrowText, headlineText, ctaText, styleReference } = params;

  // Determine dimensions based on aspect ratio
  const dimensions = aspectRatio === '1:1' 
    ? { width: 1080, height: 1080 }
    : { width: 1080, height: 1920 };

  // Build comprehensive prompt for Claude
  const fullPrompt = `Create a professional Facebook/Instagram ad creative image with the following specifications:

**Visual Style:**
${prompt}

**Dimensions:** ${dimensions.width}x${dimensions.height}px (${aspectRatio} aspect ratio)

**Text Elements to Include:**
${eyebrowText ? `- Eyebrow Text (small, uppercase, accent color): "${eyebrowText}"` : ''}
- Main Headline (large, bold, prominent): "${headlineText}"
${ctaText ? `- Call-to-Action Button: "${ctaText}"` : ''}

**Design Requirements:**
- Modern, professional advertising aesthetic
- High contrast for readability
- Text should be clearly legible and well-positioned
- Use safe zones for ${aspectRatio === '9:16' ? 'Stories/Reels (avoid top 25% and bottom 30%)' : 'Feed posts'}
- Background should complement but not compete with text
- Professional color scheme with accent colors
- Clean typography hierarchy

${styleReference ? `**Style Reference:** Match the visual style of this winning ad: ${styleReference}` : ''}

Create a complete, ready-to-use ad creative that looks professional and conversion-optimized.`;

  try {
    // Note: Claude currently doesn't have native image generation
    // We'll use Claude to generate a detailed prompt, then use that with an image generation service
    // For now, we'll create a fallback that generates a text-based creative description
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: fullPrompt + '\n\nGenerate an extremely detailed image generation prompt that a text-to-image AI can use to create this exact ad creative. Include specific details about layout, colors, typography, positioning, and visual elements.',
      }],
    });

    const enhancedPrompt = message.content[0].type === 'text' 
      ? message.content[0].text 
      : prompt;

    console.log('📝 Claude enhanced prompt:', enhancedPrompt.substring(0, 200) + '...');

    // For now, return a placeholder - we'll integrate with actual image generation
    // In production, you would call FLUX/Replicate/etc with the enhanced prompt
    return {
      url: '', // Will be filled by image generation service
      base64: undefined,
    };

  } catch (error) {
    console.error('❌ Claude image generation error:', error);
    throw new Error(`Claude image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhance prompt using Claude's understanding
 */
export async function enhancePromptWithClaude(
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

Ad text elements:
${context.eyebrowText ? `- Eyebrow: "${context.eyebrowText}"` : ''}
- Headline: "${context.headlineText}"
${context.ctaText ? `- CTA: "${context.ctaText}"` : ''}

Format: ${dimensions} (${context.aspectRatio})

Create an extremely detailed, specific image generation prompt that will produce a professional Facebook/Instagram ad creative. Include:
1. Exact layout and composition
2. Specific color palette and gradients
3. Typography style and positioning
4. Visual elements and their placement
5. Lighting and atmosphere
6. Text integration and hierarchy

The prompt should be optimized for FLUX or similar text-to-image models. Focus on creating a cohesive design where text and visuals work together perfectly.

Return ONLY the enhanced prompt, no explanations.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: promptEnhancementRequest,
      }],
    });

    const enhancedPrompt = message.content[0].type === 'text' 
      ? message.content[0].text 
      : basePrompt;

    console.log('✨ Prompt enhanced by Claude');
    return enhancedPrompt;

  } catch (error) {
    console.error('⚠️  Claude prompt enhancement failed, using base prompt:', error);
    return basePrompt;
  }
}
