/**
 * Improved Headline Generation with Quality Checks
 */

import { invokeLLM } from './_core/llm';
import type { LandingPageData } from './landingpage-scraper';

export async function generateHeadlineVariationsImproved(
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
          content: `Generate ${count} headline variations based on this WINNING creative that already performs well:

WINNING CREATIVE ANALYSIS:
- Original Headline: "${originalHeadline}"
- Why it works: This headline is already proven to convert
- Style to replicate: ${originalHeadline.includes('DIESER') || originalHeadline.includes('DER') ? 'Direct, specific, result-focused' : 'Benefit-driven, emotional'}
- Formatting: ${originalHeadline === originalHeadline.toUpperCase() ? 'ALL CAPS for urgency' : 'Mixed case'}
- Numbers: ${/\d/.test(originalHeadline) ? 'Uses specific numbers/results' : 'No numbers'}

LANDING PAGE CONTEXT (PRIMARY SOURCE FOR CONTENT):
- Main Message: ${landingPageData.h1 || 'N/A'}
- Value Proposition: ${landingPageData.h2 || 'N/A'}
- Description: ${landingPageData.description || 'N/A'}
- CTA: ${landingPageData.ctaText || 'N/A'}

**CRITICAL REQUIREMENTS:**
1. **Perfect German:** No spelling/grammar errors (ä, ö, ü, ß must be correct)
2. **Match winning style:** Replicate structure, tone, formatting of original
3. **Landing page alignment:** Use actual value propositions from landing page, not generic claims
4. **Proven patterns:** If original uses numbers → use numbers. If original is urgent → be urgent.
5. **Marketing relevance:** No 0815 statements. Use specific benefits from landing page.
6. **CTA quality:** Match the style of landing page CTA (e.g., "Jetzt X erhalten" not generic "Mehr erfahren")

**EXAMPLES OF GOOD vs BAD:**
GOOD: "DIESER FUNNEL GENERIERT 70-380 QUALIFIZIERTE LEADS" (specific, numbers, proven)
BAD: "Mehr Leads für dein Business" (generic, no proof, boring)

GOOD: "DCA STRATEGIE LANDINGPAGE 3" (specific, references actual content)
BAD: "Neue Marketing Strategie" (vague, could be anything)

For each variation, provide:
- eyebrow: Short category/context text (e.g., "GEHEIMNIS ENTLÜFTET", "COPY-PASTE-VORLAGEN")
- headline: Main headline matching winning style (e.g., "DIESER FUNNEL GENERIERT 70-380 QUALIFIZIERTE LEADS")
- cta: Action-oriented CTA matching landing page offer (e.g., "JETZT MEHR ERFAHREN", "Funnel-Templates gratis erhalten")

**QUALITY CHECK:** Before returning, verify:
- ✓ All German words spelled correctly (especially ä, ö, ü, ß)
- ✓ Headlines reference actual landing page content
- ✓ Style matches winning creative structure
- ✓ No generic marketing fluff

Format as JSON array.`,
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
    return [{
      eyebrow: 'JETZT NEU',
      headline: originalHeadline,
      cta: landingPageData.ctaText || 'Jetzt mehr erfahren',
    }];
  }
}
