import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

interface AdCopyResult {
  short: string;
  long: string;
}

/**
 * Generates professional ad copy (short + long) based on landing page analysis
 * Uses proven copywriting formulas (PAS, AIDA, BAB) and ensures perfect bridge to landing page
 */
export async function generateAdCopy(
  landingPageContent: string,
  landingPageUrl: string
): Promise<AdCopyResult> {
  const messages: Message[] = [
    {
      role: "system",
      content: `Du bist ein Elite Copywriter mit 20 Jahren Erfahrung in Performance Marketing und Meta Ads.

DEINE AUFGABE:
Generiere zwei Werbetexte (kurz + lang) basierend auf der Landing Page Analyse.

KRITISCHE ANFORDERUNGEN:
1. **Perfekte Brücke zur Landing Page:** Der Werbetext MUSS nahtlos zur Landing Page führen (gleiche Tonalität, gleiche Versprechen, gleiche Pain Points)
2. **Marketing-relevante Aussagen:** KEINE 0815-Phrasen wie "Steigere deine Conversion-Rate" oder "Erreiche mehr Kunden"
3. **Grammatik & Rechtschreibung:** Perfekt! Keine Fehler, keine Tippfehler, keine falschen Kommata
4. **Bewährte Formeln:** Nutze PAS (Problem-Agitate-Solution), AIDA (Attention-Interest-Desire-Action) oder BAB (Before-After-Bridge)
5. **Zielgruppen-Ansprache:** Sprich die Zielgruppe direkt an (Du/Sie je nach Landing Page Tonalität)

STRUKTUR KURZER TEXT (ca. 150-250 Wörter):
- Hook: Starke Eröffnung, die Aufmerksamkeit erregt
- Problem: Pain Point der Zielgruppe
- Solution: Lösung/Versprechen (aus Landing Page)
- CTA: Klare Handlungsaufforderung

STRUKTUR LANGER TEXT (ca. 400-600 Wörter):
- Hook: Starke Eröffnung mit Storytelling-Element
- Problem: Detaillierte Beschreibung des Pain Points
- Agitation: Verstärke das Problem (Was passiert, wenn es nicht gelöst wird?)
- Solution: Ausführliche Lösung mit Vorteilen
- Proof: Social Proof, Zahlen, Fakten (aus Landing Page)
- CTA: Starke Handlungsaufforderung

QUALITÄTSKRITERIEN:
✅ Spezifische Aussagen (keine generischen Marketing-Phrasen)
✅ Zahlen & Fakten aus Landing Page
✅ Emotionale Ansprache + rationale Argumente
✅ Klare Struktur mit Absätzen
✅ Perfekte Grammatik & Rechtschreibung
✅ Tonalität passt zur Landing Page

AUSGABEFORMAT:
Gib NUR die beiden Texte zurück, getrennt durch "---SEPARATOR---"
Keine Erklärungen, keine Metadaten, nur die Texte.`,
    },
    {
      role: "user",
      content: `Landing Page URL: ${landingPageUrl}

Landing Page Content:
${landingPageContent}

Generiere jetzt zwei professionelle Werbetexte (kurz + lang) basierend auf dieser Landing Page.`,
    },
  ];

  const response = await invokeLLM({ messages });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content generated from LLM");
  }

  // Extract text content
  const textContent = typeof content === 'string' ? content : content.map(c => c.type === 'text' ? c.text : '').join('');

  // Split short and long copy
  const parts = textContent.split("---SEPARATOR---");
  if (parts.length !== 2) {
    throw new Error("Invalid response format from LLM");
  }

  return {
    short: parts[0].trim(),
    long: parts[1].trim(),
  };
}
