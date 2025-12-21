import { invokeLLM } from './_core/llm';
import type { DeepAnalysisResult } from './deep-analysis-claude';

export interface TextIteration {
  preHeadline: string; // Eyebrow
  headline: string; // Main headline
  subHeadline?: string; // Optional subheadline
  cta: string; // Call to action
}

export async function generateTextIterations(
  analysis: DeepAnalysisResult,
  count: number = 3
): Promise<TextIteration[]> {
  const prompt = `Du bist ein Experte für Performance-Marketing und Copywriting. Basierend auf der folgenden Deep-Analysis, erstelle ${count} neue Text-Iterationen für Meta Ads Creatives.

**DEEP ANALYSIS:**
- Kernaussage: ${analysis.coreMessage}
- Wertversprechen: ${analysis.valueProposition}
- Zielgruppe: ${analysis.targetAudience}
- Tonalität: ${analysis.tone === 'du' ? 'Du-Ansprache' : 'Sie-Ansprache'}
- Voice Style: ${analysis.voiceStyle}
- Emotionale Trigger: ${analysis.emotionalTriggers.join(', ')}
- Schmerzpunkte: ${analysis.painPoints.join(', ')}
- Lösungen: ${analysis.solutions.join(', ')}
- Key Phrases: ${analysis.keyPhrases.join(', ')}
- Headline Patterns: ${analysis.headlinePatterns.join(', ')}
- CTA Patterns: ${analysis.ctaPatterns.join(', ')}

**AUFGABE:**
Erstelle ${count} neue Text-Iterationen die:
1. **Im EXAKT gleichen Ton** sprechen wie die Analyse zeigt (${analysis.tone === 'du' ? 'DU' : 'SIE'}!)
2. Die **gleichen emotionalen Trigger** verwenden
3. Die **gleichen Key Phrases** einbauen
4. Die **gleichen Headline-Patterns** folgen
5. Die **gleichen CTA-Patterns** nutzen
6. **Neue Variationen** sind aber die Kernaussage beibehalten

**FORMAT:**
Jede Iteration besteht aus:
- **Pre-Headline (Eyebrow)**: Kurzer Aufhänger (2-5 Wörter), oft in GROSSBUCHSTABEN
- **Headline**: Hauptaussage (max. 60 Zeichen), verkaufsstarke Formulierung
- **Sub-Headline** (optional): Ergänzende Info falls nötig
- **CTA**: Call-to-Action Button-Text (2-4 Wörter)

**WICHTIG:**
- Nutze ${analysis.tone === 'du' ? 'DU' : 'SIE'} konsequent!
- Keine generischen Phrasen - nutze die spezifischen Key Phrases aus der Analyse
- Jede Iteration muss unique sein aber den gleichen Stil haben
- Headlines müssen sofort Aufmerksamkeit erregen

Antworte im JSON-Format:
[
  {
    "preHeadline": "...",
    "headline": "...",
    "subHeadline": "..." (optional),
    "cta": "..."
  },
  ...
]`;

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
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  const iterations: TextIteration[] = JSON.parse(jsonMatch[0]);
  return iterations;
}
