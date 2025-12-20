/**
 * AI Services for Creative Generation
 * - FLUX image generation via Replicate
 * - GPT text generation via OpenAI
 */

import { invokeLLM } from "./_core/llm";

// ============================================
// FLUX Image Generation via Replicate
// ============================================

interface FluxGenerationParams {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "3:4" | "4:3";
  numOutputs?: number;
  outputFormat?: "webp" | "jpg" | "png";
  outputQuality?: number; // 0-100
}

interface FluxGenerationResult {
  imageUrls: string[];
  prompt: string;
}

/**
 * Generate images using FLUX.1 [dev] via Replicate
 */
export async function generateImageWithFlux(
  params: FluxGenerationParams
): Promise<FluxGenerationResult> {
  const {
    prompt,
    aspectRatio = "9:16", // Default to Story format
    numOutputs = 1,
    outputFormat = "png",
    outputQuality = 90,
  } = params;

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }

  try {
    // Start prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-1.1-pro",
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          num_outputs: numOutputs,
          output_format: outputFormat,
          output_quality: outputQuality,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API Error: ${JSON.stringify(error)}`);
    }

    const prediction = await response.json();
    const predictionId = prediction.id;

    // Poll for completion
    let result = prediction;
    while (result.status === "starting" || result.status === "processing") {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            "Authorization": `Bearer ${replicateToken}`,
          },
        }
      );

      result = await pollResponse.json();
    }

    if (result.status === "failed") {
      throw new Error(`FLUX generation failed: ${result.error}`);
    }

    return {
      imageUrls: Array.isArray(result.output) ? result.output : [result.output],
      prompt,
    };
  } catch (error) {
    console.error("[FLUX] Image generation failed:", error);
    throw error;
  }
}

// ============================================
// GPT Text Generation
// ============================================

interface AdTextGenerationParams {
  communicationGoal: string;
  targetAudience: string;
  brandVoice?: string;
  productDescription?: string;
  format: "feed" | "story";
}

interface AdTextGenerationResult {
  headline: string;
  bodyText: string;
  callToAction: string;
  variations: Array<{
    headline: string;
    bodyText: string;
    callToAction: string;
  }>;
}

/**
 * Generate ad text using GPT-4
 */
export async function generateAdText(
  params: AdTextGenerationParams
): Promise<AdTextGenerationResult> {
  const {
    communicationGoal,
    targetAudience,
    brandVoice = "professional and engaging",
    productDescription = "",
    format,
  } = params;

  const systemPrompt = `Du bist ein erfahrener Werbetexter für Meta Ads (Facebook/Instagram). 
Deine Aufgabe ist es, überzeugende Werbetexte zu erstellen, die hohe CTR und Conversions erzielen.

Beachte folgende Best Practices:
- Klare, direkte Sprache
- Emotionale Ansprache der Zielgruppe
- Starke Call-to-Actions
- Benefit-orientiert (nicht Feature-orientiert)
- Kurz und prägnant für ${format === "story" ? "Story-Format (sehr kurz)" : "Feed-Format"}`;

  const userPrompt = `Erstelle 3 Varianten von Werbetexten für folgende Kampagne:

**Kommunikationsziel:** ${communicationGoal}
**Zielgruppe:** ${targetAudience}
**Markenstimme:** ${brandVoice}
${productDescription ? `**Produktbeschreibung:** ${productDescription}` : ""}
**Format:** ${format === "story" ? "Instagram/Facebook Story (sehr kurz)" : "Instagram/Facebook Feed"}

Gib die Texte im folgenden JSON-Format zurück:
{
  "variations": [
    {
      "headline": "Kurze, aufmerksamkeitsstarke Headline (max. 40 Zeichen)",
      "bodyText": "Haupttext mit Mehrwert und Emotion (max. ${format === "story" ? "80" : "125"} Zeichen)",
      "callToAction": "Klare Handlungsaufforderung (max. 20 Zeichen)"
    }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ad_text_generation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              variations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    bodyText: { type: "string" },
                    callToAction: { type: "string" },
                  },
                  required: ["headline", "bodyText", "callToAction"],
                  additionalProperties: false,
                },
              },
            },
            required: ["variations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in GPT response");
    }

    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentString);
    const variations = parsed.variations || [];

    if (variations.length === 0) {
      throw new Error("No variations generated");
    }

    return {
      headline: variations[0].headline,
      bodyText: variations[0].bodyText,
      callToAction: variations[0].callToAction,
      variations,
    };
  } catch (error) {
    console.error("[GPT] Text generation failed:", error);
    throw error;
  }
}

// ============================================
// RAG-based Creative Recommendations
// ============================================

interface CreativeRecommendationParams {
  clientId: number;
  performanceHistory: Array<{
    creativeName: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }>;
  onboardingData: {
    communicationGoal?: string;
    targetAudience?: string;
    brandVoice?: string;
  };
}

interface CreativeRecommendationResult {
  recommendations: string[];
  topPerformers: string[];
  insights: string;
}

/**
 * Generate creative recommendations based on performance data and onboarding info
 */
export async function generateCreativeRecommendations(
  params: CreativeRecommendationParams
): Promise<CreativeRecommendationResult> {
  const { performanceHistory, onboardingData } = params;

  // Sort by CTR
  const sortedByPerformance = [...performanceHistory].sort((a, b) => {
    const ctrA = a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0;
    const ctrB = b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0;
    return ctrB - ctrA;
  });

  const topPerformers = sortedByPerformance.slice(0, 3).map((p) => p.creativeName);

  const systemPrompt = `Du bist ein Performance-Marketing-Experte, der Meta Ads analysiert und Optimierungsempfehlungen gibt.`;

  const userPrompt = `Analysiere die folgenden Performance-Daten und gib konkrete Empfehlungen für neue Creatives:

**Performance-Historie (Top 5):**
${sortedByPerformance
  .slice(0, 5)
  .map(
    (p, i) =>
      `${i + 1}. ${p.creativeName}: ${p.impressions} Impressions, ${p.clicks} Clicks (CTR: ${p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(2) : 0}%), ${p.conversions} Conversions, €${p.spend} Spend`
  )
  .join("\n")}

**Onboarding-Daten:**
- Kommunikationsziel: ${onboardingData.communicationGoal || "Nicht angegeben"}
- Zielgruppe: ${onboardingData.targetAudience || "Nicht angegeben"}
- Markenstimme: ${onboardingData.brandVoice || "Nicht angegeben"}

Gib 5 konkrete, umsetzbare Empfehlungen für neue Creative-Varianten, die auf den Top-Performern basieren.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const insights = typeof content === 'string' ? content : '';

    // Extract recommendations (simple parsing)
    const recommendations = insights
      .split("\n")
      .filter((line: string) => line.match(/^\d+\./))      .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
      .slice(0, 5);;

    return {
      recommendations,
      topPerformers,
      insights,
    };
  } catch (error) {
    console.error("[RAG] Recommendation generation failed:", error);
    throw error;
  }
}
