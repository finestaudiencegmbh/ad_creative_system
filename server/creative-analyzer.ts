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

export interface DesignSystem {
  colorPalette: string[]; // Hex colors extracted from image
  textLayout: {
    eyebrowPosition: string; // e.g., "top-left", "top-center"
    headlinePosition: string; // e.g., "center", "top-third"
    ctaPosition: string; // e.g., "bottom-center"
  };
  typography: {
    eyebrowStyle: string; // e.g., "small, red, uppercase"
    headlineStyle: string; // e.g., "large, bold, white with green highlights"
    ctaStyle: string; // e.g., "button with purple border"
  };
  visualStyle: string; // Overall description for FLUX prompt
  backgroundStyle: string; // e.g., "dark gradient", "black with glow"
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
 * Extract design system from winning creative for style replication
 */
export async function extractDesignSystem(imageUrl: string): Promise<DesignSystem> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing design systems in advertising creatives. Extract precise design specifications.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this advertising creative and extract the design system:\n' +
                    '1. Color Palette: List 3-5 dominant hex colors (e.g., #000000, #8B5CF6)\n' +
                    '2. Text Layout: Where is text positioned? (eyebrow text, main headline, CTA button)\n' +
                    '3. Typography: Describe text styles (sizes, colors, effects)\n' +
                    '4. Visual Style: Describe the overall aesthetic for image generation\n' +
                    '5. Background Style: Describe background (dark gradient, solid color, etc.)\n\n' +
                    'Format as JSON with keys: colorPalette, textLayout, typography, visualStyle, backgroundStyle',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high' as const,
              },
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'design_system',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              colorPalette: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of hex color codes',
              },
              textLayout: {
                type: 'object',
                properties: {
                  eyebrowPosition: { type: 'string' },
                  headlinePosition: { type: 'string' },
                  ctaPosition: { type: 'string' },
                },
                required: ['eyebrowPosition', 'headlinePosition', 'ctaPosition'],
                additionalProperties: false,
              },
              typography: {
                type: 'object',
                properties: {
                  eyebrowStyle: { type: 'string' },
                  headlineStyle: { type: 'string' },
                  ctaStyle: { type: 'string' },
                },
                required: ['eyebrowStyle', 'headlineStyle', 'ctaStyle'],
                additionalProperties: false,
              },
              visualStyle: { type: 'string' },
              backgroundStyle: { type: 'string' },
            },
            required: ['colorPalette', 'textLayout', 'typography', 'visualStyle', 'backgroundStyle'],
            additionalProperties: false,
          },
        },
      },
    });

    const messageContent = response.choices[0].message.content;
    const designSystem = typeof messageContent === 'string' ? JSON.parse(messageContent) : messageContent;
    
    return designSystem as DesignSystem;
  } catch (error) {
    console.error('Design system extraction error:', error);
    // Fallback design system
    return {
      colorPalette: ['#000000', '#FFFFFF', '#8B5CF6'],
      textLayout: {
        eyebrowPosition: 'top-center',
        headlinePosition: 'center',
        ctaPosition: 'bottom-center',
      },
      typography: {
        eyebrowStyle: 'small, uppercase, accent color',
        headlineStyle: 'large, bold, white',
        ctaStyle: 'button with border',
      },
      visualStyle: 'Modern professional advertising creative',
      backgroundStyle: 'Dark gradient background',
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
 * Generate style-aware FLUX prompt using design system from winning creative
 */
export async function generateStyleAwarePrompt(
  designSystem: DesignSystem,
  landingPageData: LandingPageData,
  userDescription?: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating FLUX image generation prompts that replicate visual styles. ' +
                   'Generate prompts that match the design system while creating new visual content.',
        },
        {
          role: 'user',
          content: `Create a FLUX prompt for a NEW advertising creative that matches this design system:

DESIGN SYSTEM TO REPLICATE:
- Visual Style: ${designSystem.visualStyle}
- Background: ${designSystem.backgroundStyle}
- Color Palette: ${designSystem.colorPalette.join(', ')}
- Overall Aesthetic: Match the style exactly

LANDING PAGE CONTEXT:
- Headline: ${landingPageData.h1 || 'N/A'}
- Subheadline: ${landingPageData.h2 || 'N/A'}
- Description: ${landingPageData.description || 'N/A'}

${userDescription ? `USER INPUT:\n- ${userDescription}\n` : ''}

Generate a FLUX prompt that:
1. Creates a NEW visual (different object/scene than original)
2. Matches the EXACT visual style and aesthetic
3. Uses the same color palette and background style
4. Incorporates the landing page message/value proposition
5. Leaves space for text overlay (no text in image)

IMPORTANT: The prompt should create a DIFFERENT visual element (e.g., if original shows a book, create a dashboard, laptop, or phone), but in the SAME style.

Output ONLY the prompt text, no explanations.`,
        },
      ],
    });

    const messageContent = response.choices[0].message.content;
    return typeof messageContent === 'string' ? messageContent : 'Professional advertising creative';
  } catch (error) {
    console.error('Style-aware prompt generation error:', error);
    // Fallback to basic prompt with design system
    return `${designSystem.visualStyle}, ${designSystem.backgroundStyle}, ` +
           `color palette: ${designSystem.colorPalette.join(', ')}, ` +
           `professional advertising creative, high quality, ` +
           `context: ${landingPageData.h1 || landingPageData.title}`;
  }
}

/**
 * Generate headline variations matching the style of winning creative
 */
export async function generateHeadlineVariations(
  originalHeadline: string,
  landingPageData: LandingPageData,
  count: number = 3
): Promise<{ eyebrow: string; headline: string; cta: string }[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert German copywriter for high-converting Facebook/Instagram advertising creatives. You write flawless German with perfect grammar, spelling, and punctuation. You analyze winning ads and replicate what works.',
        },
        {
          role: 'user',
          content: `Du bist ein professioneller Werbetexter für Meta Ads. Erstelle ${count} natürliche, verkaufsstarke Headlines auf Deutsch.

LANDING PAGE KONTEXT:
- Hauptbotschaft: ${landingPageData.h1 || 'N/A'}
- Wertversprechen: ${landingPageData.h2 || 'N/A'}
- Beschreibung: ${landingPageData.description || 'N/A'}
- CTA: ${landingPageData.ctaText || 'N/A'}

ORIGINAL WINNING HEADLINE (als Inspiration):
"${originalHeadline}"

**WICHTIGSTE REGEL: LESBARKEIT!**
Die Headlines MUSS natürlich klingen und flüssig lesbar sein. Keine Keyword-Stuffing, keine unnatürlichen Konstruktionen!

**ANFORDERUNGEN:**
1. **Natürliches Deutsch:** Schreibe wie ein Mensch, nicht wie ein Keyword-Generator
2. **Klare Struktur:** Jede Headline hat EINEN klaren Fokus, nicht 5 Features auf einmal
3. **Perfekte Grammatik:** Korrekte Satzstellung, keine Rechtschreibfehler (ä, ö, ü, ß)
4. **Benefit-fokussiert:** Was bekommt der Kunde? (nicht "Kopiere unsere Methode", sondern "10.000 Leads in 25 Minuten")
5. **Kurz & prägnant:** Maximal 60 Zeichen für Headline (ohne Eyebrow/CTA)

**GUTE vs. SCHLECHTE HEADLINES:**

✅ GUT: "10.000 Leads in 25 Minuten – ohne Technikwissen"
   (Klar, lesbar, ein Benefit)

❌ SCHLECHT: "10.000 Premium Leads: Kopiere Unsere DCA Methode In Nur 25 Min."
   (Zu viele Infos, unnatürliche Großschreibung, schwer lesbar)

✅ GUT: "Mehr Leads für dein Marketing – startklar in 25 Minuten"
   (Natürlich, flüssig, klar)

❌ SCHLECHT: "Lead-Generierung Neu Definiert: Unser Meta-Ads-System"
   (Gestelzt, zu vage, kein konkreter Benefit)

**STRUKTUR:**
- **eyebrow:** Kurze Kategorie (z.B. "META ADS SYSTEM", "DCA METHODE", "LEAD-GENERIERUNG")
- **headline:** Hauptbotschaft – MUSS natürlich und lesbar sein! (z.B. "10.000 Leads in 25 Minuten")
- **cta:** Klare Handlungsaufforderung (z.B. "JETZT STARTEN", "SYSTEM KOPIEREN", "MEHR ERFAHREN")

**QUALITÄTSKONTROLLE:**
Lies jede Headline laut vor. Klingt sie natürlich? Würde ein Mensch so sprechen?
Wenn NEIN → umschreiben!

Format als JSON array.`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'headline_variations',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              variations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    eyebrow: { type: 'string' },
                    headline: { type: 'string' },
                    cta: { type: 'string' },
                  },
                  required: ['eyebrow', 'headline', 'cta'],
                  additionalProperties: false,
                },
              },
            },
            required: ['variations'],
            additionalProperties: false,
          },
        },
      },
    });

    const messageContent = response.choices[0].message.content;
    const result = typeof messageContent === 'string' ? JSON.parse(messageContent) : messageContent;
    
    return result.variations;
  } catch (error) {
    console.error('Headline generation error:', error);
    // Fallback variations
    return [
      {
        eyebrow: landingPageData.h2 || 'Professionelle Lösung',
        headline: landingPageData.h1 || 'ERREICHE DEINE ZIELE SCHNELLER',
        cta: landingPageData.ctaText || 'Jetzt starten',
      },
    ];
  }
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
