/**
 * Landing Page Deep Analyzer
 * 
 * Analyzes landing page content for ad copy generation:
 * - Target audience & pain points
 * - Solution promises & benefits
 * - Call-to-action & tone-of-voice
 */

import { invokeLLM } from "./_core/llm";
import { scrapeLandingPage } from "./landingpage-scraper";

export interface LandingPageDeepAnalysis {
  targetAudience: {
    description: string; // Who is the target audience?
    painPoints: string[]; // What problems do they have?
    desires: string[]; // What do they want to achieve?
  };
  solution: {
    mainPromise: string; // Core value proposition
    benefits: string[]; // Key benefits
    uniqueSellingPoints: string[]; // What makes it unique?
  };
  messaging: {
    toneOfVoice: string; // Formal/casual, Du/Sie, etc.
    keyPhrases: string[]; // Important phrases to use
    emotionalTriggers: string[]; // Fear, urgency, social proof, etc.
  };
  callToAction: {
    primary: string; // Main CTA text
    secondary?: string; // Optional secondary CTA
    urgency: string; // Time-limited, scarcity, etc.
  };
}

/**
 * Perform deep analysis of landing page for ad copy generation
 */
export async function analyzeLandingPageForAdCopy(
  landingPageUrl: string
): Promise<LandingPageDeepAnalysis> {
  console.log(`[Landing Page Deep Analyzer] Analyzing ${landingPageUrl}...`);

  // Scrape landing page content
  const scrapedData = await scrapeLandingPage(landingPageUrl);
  
  // Build content string from scraped data
  const scrapedContent = `
Title: ${scrapedData.title || ''}
Description: ${scrapedData.description || ''}
OG Title: ${scrapedData.ogTitle || ''}
OG Description: ${scrapedData.ogDescription || ''}
H1: ${scrapedData.h1 || ''}
H2: ${scrapedData.h2 || ''}
CTA: ${scrapedData.ctaText || ''}
Keywords: ${scrapedData.keywords || ''}

Full Page Content:
${scrapedData.bodyText || ''}
`;

  const prompt = `Du bist ein Elite-Copywriter für Meta Ads. Analysiere diese Landing Page und extrahiere alle Informationen, die für die Erstellung von perfekten Ad Texten notwendig sind.

Landing Page Content:
${scrapedContent}

Analysiere folgende Aspekte:

1. ZIELGRUPPE & SCHMERZPUNKTE:
   - Wer ist die Zielgruppe? (Demografisch, Psychografisch, Beruf, etc.)
   - Welche Probleme/Schmerzpunkte haben sie?
   - Was wollen sie erreichen? (Desires/Ziele)

2. LÖSUNG & BENEFITS:
   - Was ist das Hauptversprechen? (Core Value Proposition)
   - Welche konkreten Benefits werden genannt?
   - Was macht das Angebot einzigartig? (USPs)

3. MESSAGING & TONE:
   - Wie ist der Tone-of-Voice? (Du/Sie, formal/casual, freundlich/professionell)
   - Welche Key Phrases werden wiederholt verwendet?
   - Welche emotionalen Trigger werden genutzt? (Angst, Dringlichkeit, Social Proof, FOMO, etc.)

4. CALL-TO-ACTION:
   - Was ist der primäre CTA? (NICHT Cookie-Banner CTAs wie "Alle akzeptieren", "Accept all cookies", etc.!)
   - Gibt es einen sekundären CTA?
   - Welche Dringlichkeit wird kommuniziert? (Zeitlich begrenzt, Scarcity, etc.)

WICHTIG:
- Extrahiere EXAKT die Formulierungen von der Landing Page
- Achte auf die genaue Ansprache (Du vs. Sie)
- Identifiziere die stärksten emotionalen Trigger
- Finde die Kern-Botschaft, die in jedem Ad Text vorkommen sollte
- IGNORIERE Cookie-Banner CTAs! Suche nach dem HAUPT-CTA der Landing Page (z.B. "Jetzt starten", "Mehr erfahren", "Kostenlos testen")

Gib die Analyse in folgendem JSON-Format zurück (OHNE Markdown-Formatierung):
{
  "targetAudience": {
    "description": "Detaillierte Beschreibung der Zielgruppe",
    "painPoints": ["Schmerzpunkt 1", "Schmerzpunkt 2", ...],
    "desires": ["Ziel 1", "Ziel 2", ...]
  },
  "solution": {
    "mainPromise": "Hauptversprechen in einem Satz",
    "benefits": ["Benefit 1", "Benefit 2", ...],
    "uniqueSellingPoints": ["USP 1", "USP 2", ...]
  },
  "messaging": {
    "toneOfVoice": "Beschreibung des Tone-of-Voice",
    "keyPhrases": ["Phrase 1", "Phrase 2", ...],
    "emotionalTriggers": ["Trigger 1", "Trigger 2", ...]
  },
  "callToAction": {
    "primary": "Primärer CTA Text",
    "secondary": "Sekundärer CTA Text (optional)",
    "urgency": "Beschreibung der Dringlichkeit"
  }
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "landing_page_deep_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              targetAudience: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  painPoints: {
                    type: "array",
                    items: { type: "string" },
                  },
                  desires: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["description", "painPoints", "desires"],
                additionalProperties: false,
              },
              solution: {
                type: "object",
                properties: {
                  mainPromise: { type: "string" },
                  benefits: {
                    type: "array",
                    items: { type: "string" },
                  },
                  uniqueSellingPoints: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["mainPromise", "benefits", "uniqueSellingPoints"],
                additionalProperties: false,
              },
              messaging: {
                type: "object",
                properties: {
                  toneOfVoice: { type: "string" },
                  keyPhrases: {
                    type: "array",
                    items: { type: "string" },
                  },
                  emotionalTriggers: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["toneOfVoice", "keyPhrases", "emotionalTriggers"],
                additionalProperties: false,
              },
              callToAction: {
                type: "object",
                properties: {
                  primary: { type: "string" },
                  secondary: { type: "string" },
                  urgency: { type: "string" },
                },
                required: ["primary", "urgency"],
                additionalProperties: false,
              },
            },
            required: ["targetAudience", "solution", "messaging", "callToAction"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No valid response from LLM");
    }

    const analysis = JSON.parse(content);
    console.log(`[Landing Page Deep Analyzer] Analysis complete`);
    return analysis;
  } catch (error) {
    console.error("[Landing Page Deep Analyzer] Failed:", error);
    throw new Error(
      `Landing page deep analysis failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
