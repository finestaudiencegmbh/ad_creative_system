import { invokeLLM } from './_core/llm';

export interface DeepAnalysisResult {
  // Core Understanding
  coreMessage: string;
  valueProposition: string;
  targetAudience: string;
  
  // Tonality & Voice
  tone: 'du' | 'sie';
  voiceStyle: string; // e.g., "direkt, vertrauenswürdig, dringlich"
  emotionalTriggers: string[];
  
  // Pain Points & Solutions
  painPoints: string[];
  solutions: string[];
  
  // Key Phrases & Patterns
  keyPhrases: string[];
  headlinePatterns: string[];
  ctaPatterns: string[];
  
  // Visual Themes
  visualThemes: string[];
  colorPalette: string[];
  aestheticStyle: string;
}

export async function performDeepAnalysis(
  landingPageText: string,
  winningAdsText: string[]
): Promise<DeepAnalysisResult> {
  const prompt = `Du bist ein Experte für Marketing-Analyse und Copywriting. Analysiere die folgende Landing Page und die erfolgreichen Werbeanzeigen, um ein tiefes Verständnis der Marketing-Strategie zu entwickeln.

**LANDING PAGE TEXT:**
${landingPageText}

**WINNING ADS TEXT:**
${winningAdsText.map((ad, i) => `Ad ${i + 1}:\n${ad}`).join('\n\n')}

**AUFGABE:**
Analysiere diese Texte im Detail und extrahiere folgende Informationen:

1. **Kernaussage**: Was ist die zentrale Botschaft? Was wird versprochen?

2. **Wertversprechen**: Welchen konkreten Nutzen bietet das Produkt/die Dienstleistung?

3. **Zielgruppe**: Wer ist die Zielgruppe? (Berufsgruppe, Probleme, Ziele)

4. **Tonalität**: 
   - Wird "Du" oder "Sie" verwendet?
   - Wie ist der Ton? (formell, casual, emotional, sachlich, dringlich, vertrauenswürdig, etc.)

5. **Emotionale Trigger**: Welche emotionalen Trigger werden verwendet? (FOMO, Social Proof, Authority, Scarcity, etc.)

6. **Schmerzpunkte**: Welche Probleme der Zielgruppe werden angesprochen?

7. **Lösungen**: Wie wird das Produkt als Lösung positioniert?

8. **Key Phrases**: Welche wiederkehrenden Phrasen, Formulierungen oder Wörter werden verwendet?

9. **Headline-Patterns**: Welche Muster erkennst du in den Headlines? (Zahlen, Zeitangaben, Versprechen, etc.)

10. **CTA-Patterns**: Welche Call-to-Action-Formulierungen werden verwendet?

11. **Visuelle Themen**: Welche visuellen Elemente oder Themen werden erwähnt oder impliziert?

12. **Farbpalette**: Welche Farben werden erwähnt oder passen zur Marke?

13. **Ästhetischer Stil**: Welcher visuelle Stil passt zur Marke? (modern, futuristisch, premium, minimalistisch, etc.)

**WICHTIG:**
- Sei extrem präzise und detailliert
- Achte besonders auf die Tonalität (Du vs. Sie)
- Identifiziere die EXAKTEN Formulierungen die funktionieren
- Verstehe die psychologischen Trigger

Antworte im JSON-Format:
{
  "coreMessage": "...",
  "valueProposition": "...",
  "targetAudience": "...",
  "tone": "du" oder "sie",
  "voiceStyle": "...",
  "emotionalTriggers": ["...", "..."],
  "painPoints": ["...", "..."],
  "solutions": ["...", "..."],
  "keyPhrases": ["...", "..."],
  "headlinePatterns": ["...", "..."],
  "ctaPatterns": ["...", "..."],
  "visualThemes": ["...", "..."],
  "colorPalette": ["...", "..."],
  "aestheticStyle": "..."
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  const responseText = typeof content === 'string' ? content : '';
  
  // Extract JSON from response (might be wrapped in markdown code blocks)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  const analysis: DeepAnalysisResult = JSON.parse(jsonMatch[0]);
  return analysis;
}

export async function extractLandingPageFullText(url: string): Promise<string> {
  const { scrapeLandingPage } = await import('./landingpage-scraper');
  const data = await scrapeLandingPage(url);
  
  // Return full body text instead of just title/description
  return data.bodyText || data.description || '';
}

export async function extractWinningAdsFullText(campaignId: string): Promise<string[]> {
  const { getAdCreatives, getCampaignAdSets, getAdSetAds } = await import('./meta-api');
  
  // Get all ad sets from campaign
  const adSets = await getCampaignAdSets(campaignId);
  
  // Get all ads from all ad sets
  const allAdsPromises = adSets.map((adSet: any) => getAdSetAds(adSet.id));
  const allAdsArrays = await Promise.all(allAdsPromises);
  const allAds = allAdsArrays.flat();
  
  // Extract text from first 5 ads (simplified - no ranking for now)
  const adsText: string[] = [];
  
  for (const ad of allAds.slice(0, 5)) { // First 5 ads
    try {
      const creative = await getAdCreatives(ad.id);
      if (creative) {
        // Extract all text from creative
        const texts: string[] = [];
        
        if (creative.title) texts.push(`Title: ${creative.title}`);
        if (creative.body) texts.push(`Body: ${creative.body}`);
        if (creative.link_description) texts.push(`Description: ${creative.link_description}`);
        if (creative.call_to_action_type) texts.push(`CTA: ${creative.call_to_action_type}`);
        
        adsText.push(texts.join('\n'));
      }
    } catch (error) {
      console.error(`Failed to extract text from ad ${ad.id}:`, error);
    }
  }
  
  return adsText;
}
