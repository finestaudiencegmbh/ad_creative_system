/**
 * Creative Analyzer
 * 
 * Analyzes winning ad creatives using Vision API to extract visual elements,
 * composition, colors, and style patterns
 */

import { invokeLLM } from './_core/llm';
import type { LandingPageData } from './landingpage-scraper';

export interface CreativeAnalysis {
  visualElements: string; // Description of visual elements (dashboard, chat, metrics, etc.)
  composition: string; // Layout and composition style
  colorScheme: string; // Dominant colors
  stylePatterns: string; // Common patterns across winning ads
}

/**
 * Analyze winning ad images using Vision API
 */
export async function analyzeWinningCreatives(imageUrls: string[]): Promise<CreativeAnalysis> {
  if (imageUrls.length === 0) {
    return {
      visualElements: 'No winning ad images available',
      composition: 'Unknown',
      colorScheme: 'Unknown',
      stylePatterns: 'No patterns identified',
    };
  }

  try {
    // Prepare image content for Vision API
    const imageContents = imageUrls.slice(0, 3).map(url => ({
      type: 'image_url' as const,
      image_url: {
        url,
        detail: 'high' as const,
      },
    }));

    // Analyze images with Vision API
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing advertising creatives. Describe visual elements, composition, colors, and patterns in detail.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze these winning ad creatives and describe:\n' +
                    '1. Visual Elements: What is shown? (e.g., dashboard screenshots, WhatsApp chats, metrics, people, products)\n' +
                    '2. Composition: How is the content arranged? (e.g., centered, split-screen, full-bleed)\n' +
                    '3. Color Scheme: What are the dominant colors?\n' +
                    '4. Style Patterns: What visual patterns are common across these ads?\n\n' +
                    'Be specific and detailed.',
            },
            ...imageContents,
          ],
        },
      ],
    });

    const messageContent = response.choices[0].message.content;
    const analysis = typeof messageContent === 'string' ? messageContent : '';
    
    // Parse the analysis into structured format
    return {
      visualElements: extractSection(analysis, 'Visual Elements') || 'Mixed visual elements',
      composition: extractSection(analysis, 'Composition') || 'Standard layout',
      colorScheme: extractSection(analysis, 'Color Scheme') || 'Professional colors',
      stylePatterns: extractSection(analysis, 'Style Patterns') || 'Clean modern design',
    };
  } catch (error) {
    console.error('Creative analysis error:', error);
    return {
      visualElements: 'Analysis failed',
      composition: 'Unknown',
      colorScheme: 'Unknown',
      stylePatterns: 'No patterns identified',
    };
  }
}

/**
 * Extract a section from the analysis text
 */
function extractSection(text: string, sectionName: string): string | null {
  const regex = new RegExp(`${sectionName}:?\\s*([^\\n]+(?:\\n(?!\\d+\\.|[A-Z][a-z]+ [A-Z])[^\\n]+)*)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Generate contextual FLUX prompt based on landing page and winning ads analysis
 */
export async function generateContextualPrompt(
  landingPageData: LandingPageData,
  creativeAnalysis: CreativeAnalysis,
  userDescription?: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating FLUX image generation prompts for advertising creatives. ' +
                   'Generate detailed, specific prompts that combine landing page context with successful visual patterns.',
        },
        {
          role: 'user',
          content: `Create a FLUX prompt for an advertising creative based on:

LANDING PAGE CONTEXT:
- Headline: ${landingPageData.h1 || 'N/A'}
- Subheadline: ${landingPageData.h2 || 'N/A'}
- Description: ${landingPageData.description || 'N/A'}
- CTA: ${landingPageData.ctaText || 'N/A'}

WINNING ADS ANALYSIS:
- Visual Elements: ${creativeAnalysis.visualElements}
- Composition: ${creativeAnalysis.composition}
- Color Scheme: ${creativeAnalysis.colorScheme}
- Style Patterns: ${creativeAnalysis.stylePatterns}

${userDescription ? `USER INPUT:\n- ${userDescription}\n` : ''}

Generate a detailed FLUX prompt that:
1. Uses similar visual elements as the winning ads
2. Incorporates the landing page message/value proposition
3. Matches the successful color scheme and composition
4. Creates a cohesive advertising creative

Output ONLY the prompt text, no explanations.`,
        },
      ],
    });

    const messageContent = response.choices[0].message.content;
    return typeof messageContent === 'string' ? messageContent : 'Professional advertising creative';
  } catch (error) {
    console.error('Prompt generation error:', error);
    // Fallback to basic prompt
    return `Professional advertising creative showing ${creativeAnalysis.visualElements}, ` +
           `${creativeAnalysis.composition} composition, ${creativeAnalysis.colorScheme} color scheme, ` +
           `context: ${landingPageData.h1 || landingPageData.title}`;
  }
}
