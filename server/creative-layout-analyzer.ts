/**
 * Creative Layout Analyzer
 * 
 * Uses Gemini Vision to analyze text positions, safe zones, and typography in creatives
 */

import { invokeLLM } from "./_core/llm";

export interface CreativeLayoutAnalysis {
  textElements: {
    eyebrow?: {
      position: string; // e.g., "top-center", "top-left"
      estimatedCoordinates: string; // e.g., "x: 50%, y: 10%"
      color: string;
      hasStroke: boolean;
      hasShadow: boolean;
      fontSize: string; // e.g., "small", "medium", "large"
    };
    headline: {
      position: string;
      estimatedCoordinates: string;
      color: string;
      hasStroke: boolean;
      hasShadow: boolean;
      fontSize: string;
      alignment: string; // "left", "center", "right"
    };
    cta: {
      position: string;
      estimatedCoordinates: string;
      backgroundColor: string;
      textColor: string;
      hasIcon: boolean;
    };
  };
  safeZones: {
    description: string; // Where text can safely be placed
    avoidAreas: string[]; // Areas to avoid (e.g., "center where main visual is")
  };
  visualComposition: {
    mainFocusArea: string; // Where the main visual element is
    backgroundComplexity: string; // "simple", "moderate", "complex"
    contrastLevel: string; // "high", "medium", "low"
  };
  typographySpecs: {
    headlineContrast: string; // How text stands out from background
    readabilityTechniques: string[]; // e.g., ["text shadow", "stroke", "background overlay"]
  };
}

/**
 * Analyze creative layout using Gemini Vision
 */
export async function analyzeCreativeLayout(
  imageBase64: string
): Promise<CreativeLayoutAnalysis> {
  const prompt = `You are a Meta Ads creative designer analyzing a successful ad creative.

Analyze this image and extract detailed layout information:

1. TEXT ELEMENTS:
   - Eyebrow text (small text above headline): Position, color, stroke, shadow, size
   - Headline (main text): Position, color, stroke, shadow, size, alignment
   - CTA button: Position, background color, text color, has icon?

2. SAFE ZONES:
   - Where can text be safely placed without overlapping important visuals?
   - Which areas should be avoided for text placement?

3. VISUAL COMPOSITION:
   - Where is the main visual focus (book, dashboard, product)?
   - Background complexity (simple/moderate/complex)?
   - Overall contrast level (high/medium/low)?

4. TYPOGRAPHY SPECS:
   - How does the headline text achieve good contrast?
   - What readability techniques are used? (shadow, stroke, background overlay, etc.)

Provide a detailed analysis in JSON format matching this structure:
{
  "textElements": {
    "eyebrow": {
      "position": "top-center",
      "estimatedCoordinates": "x: 50%, y: 10%",
      "color": "#00FF00",
      "hasStroke": false,
      "hasShadow": true,
      "fontSize": "small"
    },
    "headline": {
      "position": "center",
      "estimatedCoordinates": "x: 50%, y: 45%",
      "color": "#FFFFFF",
      "hasStroke": true,
      "hasShadow": true,
      "fontSize": "large",
      "alignment": "center"
    },
    "cta": {
      "position": "bottom-center",
      "estimatedCoordinates": "x: 50%, y: 85%",
      "backgroundColor": "#00FF00",
      "textColor": "#000000",
      "hasIcon": true
    }
  },
  "safeZones": {
    "description": "Top 20% and bottom 30% are safe for text. Center area has main visual.",
    "avoidAreas": ["center 40-60% where book/product is displayed", "areas with complex graphics"]
  },
  "visualComposition": {
    "mainFocusArea": "center, showing open book with dashboards",
    "backgroundComplexity": "moderate",
    "contrastLevel": "high"
  },
  "typographySpecs": {
    "headlineContrast": "white text with black stroke and shadow on dark purple background",
    "readabilityTechniques": ["text shadow", "stroke outline", "high contrast colors"]
  }
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "creative_layout_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              textElements: {
                type: "object",
                properties: {
                  eyebrow: {
                    type: "object",
                    properties: {
                      position: { type: "string" },
                      estimatedCoordinates: { type: "string" },
                      color: { type: "string" },
                      hasStroke: { type: "boolean" },
                      hasShadow: { type: "boolean" },
                      fontSize: { type: "string" },
                    },
                    required: ["position", "estimatedCoordinates", "color", "hasStroke", "hasShadow", "fontSize"],
                    additionalProperties: false,
                  },
                  headline: {
                    type: "object",
                    properties: {
                      position: { type: "string" },
                      estimatedCoordinates: { type: "string" },
                      color: { type: "string" },
                      hasStroke: { type: "boolean" },
                      hasShadow: { type: "boolean" },
                      fontSize: { type: "string" },
                      alignment: { type: "string" },
                    },
                    required: ["position", "estimatedCoordinates", "color", "hasStroke", "hasShadow", "fontSize", "alignment"],
                    additionalProperties: false,
                  },
                  cta: {
                    type: "object",
                    properties: {
                      position: { type: "string" },
                      estimatedCoordinates: { type: "string" },
                      backgroundColor: { type: "string" },
                      textColor: { type: "string" },
                      hasIcon: { type: "boolean" },
                    },
                    required: ["position", "estimatedCoordinates", "backgroundColor", "textColor", "hasIcon"],
                    additionalProperties: false,
                  },
                },
                required: ["headline", "cta"],
                additionalProperties: false,
              },
              safeZones: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  avoidAreas: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["description", "avoidAreas"],
                additionalProperties: false,
              },
              visualComposition: {
                type: "object",
                properties: {
                  mainFocusArea: { type: "string" },
                  backgroundComplexity: { type: "string" },
                  contrastLevel: { type: "string" },
                },
                required: ["mainFocusArea", "backgroundComplexity", "contrastLevel"],
                additionalProperties: false,
              },
              typographySpecs: {
                type: "object",
                properties: {
                  headlineContrast: { type: "string" },
                  readabilityTechniques: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["headlineContrast", "readabilityTechniques"],
                additionalProperties: false,
              },
            },
            required: ["textElements", "safeZones", "visualComposition", "typographySpecs"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No valid response from Gemini Vision");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("[Creative Layout Analyzer] Failed:", error);
    throw new Error(
      `Creative layout analysis failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
