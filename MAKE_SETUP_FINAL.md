# Make.com Setup - Finale Anleitung
## Alle Daten für deine eigenen GPT-Prompts

---

## 🎯 Übersicht

Manus sendet dir **alle gesammelten Daten** per Webhook. Du schreibst die Prompts in Make.com selbst.

**Flow:**
```
Manus Webhook → [DEINE GPT-PROMPTS] → Bannerbear → Manus Callback
```

---

## 📦 Webhook Payload (Was Manus an Make.com sendet)

### Beispiel-Payload:

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 1,
  "campaignId": "120236291446940214",
  "adSetId": "120236134701820214",
  
  "landingPageUrl": "https://finest-audience.com/landingpage-vorlage",
  
  "winningAd": {
    "id": "120236291447940215",
    "name": "Ad Creative 1 - Dashboard Visual",
    "imageUrl": "https://scontent.xx.fbcdn.net/v/t45.1600-4/...",
    "metrics": {
      "roasOrderVolume": 2.98,
      "roasCashCollect": 2.45,
      "costPerLead": 17.59,
      "costPerOutboundClick": 2.34,
      "outboundCtr": 1.56,
      "cpm": 8.92
    }
  },
  
  "targeting": {
    "ageMin": 25,
    "ageMax": 55,
    "genders": [1, 2],
    "geoLocations": {
      "countries": ["DE", "AT", "CH"]
    },
    "interests": [
      { "id": "6003139266461", "name": "Online advertising" },
      { "id": "6003107902433", "name": "Digital marketing" }
    ],
    "locales": [6]
  },
  
  "format": "feed",
  "count": 3,
  
  "callbackUrl": "https://3000-xxx.manusvm.computer/api/trpc/ai.receiveCreatives"
}
```

---

## 📋 Daten-Struktur Erklärung

### 1. Landing Page URL
```json
"landingPageUrl": "https://finest-audience.com/landingpage-vorlage"
```
- **Verwendung:** Scrape die Landing Page oder nutze die URL direkt in deinem Prompt
- **Beispiel Prompt:** "Analysiere diese Landing Page: {{landingPageUrl}} und erstelle passende Ad-Copy"

---

### 2. Winning Ad (Top Performer)

```json
"winningAd": {
  "id": "120236291447940215",
  "name": "Ad Creative 1 - Dashboard Visual",
  "imageUrl": "https://scontent.xx.fbcdn.net/v/t45.1600-4/...",
  "metrics": {
    "roasOrderVolume": 2.98,
    "roasCashCollect": 2.45,
    "costPerLead": 17.59,
    "costPerOutboundClick": 2.34,
    "outboundCtr": 1.56,
    "cpm": 8.92
  }
}
```

**Wichtig:**
- `imageUrl`: Direkter Link zum Bild des Top-Performers (kannst du in Gemini Vision hochladen)
- `metrics`: Performance-Daten des besten Ads

**Verwendung:**
- Download das Bild: `{{winningAd.imageUrl}}`
- Analysiere mit Gemini Vision: "Was macht dieses Ad erfolgreich? ROAS: {{winningAd.metrics.roasOrderVolume}}"
- Nutze als Style-Referenz für neue Creatives

---

### 3. Targeting (Zielgruppe)

```json
"targeting": {
  "ageMin": 25,
  "ageMax": 55,
  "genders": [1, 2],
  "geoLocations": {
    "countries": ["DE", "AT", "CH"]
  },
  "interests": [
    { "id": "6003139266461", "name": "Online advertising" },
    { "id": "6003107902433", "name": "Digital marketing" }
  ],
  "locales": [6]
}
```

**Erklärung:**
- `ageMin` / `ageMax`: Alter der Zielgruppe (z.B. 25-55)
- `genders`: `[1]` = Männer, `[2]` = Frauen, `[1, 2]` = Alle
- `geoLocations.countries`: ISO-Ländercodes (DE, AT, CH, etc.)
- `interests`: Array von Interessen-Objekten mit ID und Name
- `locales`: Sprach-IDs (6 = Deutsch)

**Verwendung in Prompt:**
```
Zielgruppe: {{targeting.ageMin}}-{{targeting.ageMax}} Jahre alt
Geschlecht: {{if(targeting.genders.length = 1; if(targeting.genders[0] = 1; "Männer"; "Frauen"); "Alle")}}
Länder: {{targeting.geoLocations.countries}}
Interessen: {{targeting.interests[].name}}
```

---

### 4. Format & Anzahl

```json
"format": "feed",
"count": 3
```

**Formate:**
- `feed`: 1080×1080px (1:1 Quadrat)
- `story`: 1080×1920px (9:16 Hochformat)
- `reel`: 1080×1920px (9:16 Hochformat)

**Verwendung:**
- Wähle Bannerbear Template basierend auf Format
- Generiere `count` Anzahl Creatives (1-10)

---

## 🔧 Make.com Scenario Setup

### Modul 1: Webhooks - Custom Webhook

1. Erstelle Custom Webhook
2. **Kopiere die Webhook-URL** (z.B. `https://hook.eu2.make.com/xxxxx`)
3. Speichere in Manus als `MAKE_WEBHOOK_URL` Secret

**Webhook empfängt automatisch alle Daten aus dem Payload oben.**

---

### Modul 2: HTTP - Download Winning Ad Image (Optional)

Wenn du das Winning Ad Bild analysieren willst:

**Setup:**
1. Modul: **HTTP → Get a file**
2. **URL:** `{{1.winningAd.imageUrl}}`
3. **Output:** Bild-Datei zum Hochladen in Gemini Vision

---

### Modul 3: Google Gemini AI - Dein Custom Prompt

**Hier schreibst du deinen eigenen Prompt!**

**Setup:**
1. Modul: **Google Gemini AI → Generate a response**
2. **Model:** `gemini-2.0-flash-exp`
3. **Role:** `user`
4. **Prompt:** (siehe Beispiel unten)

**Beispiel-Prompt (anpassen nach Bedarf):**

```
Du bist ein Meta Ads Creative-Generator für Performance-Marketing.

=== KONTEXT ===

Landing Page: {{1.landingPageUrl}}

Top Performer Ad:
- Name: {{1.winningAd.name}}
- ROAS: {{1.winningAd.metrics.roasOrderVolume}}x
- CPL: €{{1.winningAd.metrics.costPerLead}}
- CTR: {{1.winningAd.metrics.outboundCtr}}%
- Bild-URL: {{1.winningAd.imageUrl}}

Zielgruppe:
- Alter: {{1.targeting.ageMin}}-{{1.targeting.ageMax}} Jahre
- Geschlecht: {{if(length(1.targeting.genders) = 1; if(first(1.targeting.genders) = 1; "Männer"; "Frauen"); "Alle")}}
- Länder: {{join(1.targeting.geoLocations.countries; ", ")}}
- Interessen: {{join(map(1.targeting.interests; "name"); ", ")}}

Format: {{1.format}} ({{if(1.format = "feed"; "1080×1080px"; "1080×1920px")}})

=== AUFGABE ===

Erstelle {{1.count}} Creative-Variationen für diese Zielgruppe.

Analysiere die Landing Page und den Top Performer Ad, und erstelle dann:

1. **Eyebrow** (Aufmerksamkeits-Text)
   - Max 30 Zeichen
   - GROSSBUCHSTABEN
   - Rot/Akzentfarbe
   - Beispiel: "520 MIO. € BEWÄHRT"

2. **Headline** (Hauptbotschaft)
   - Max 60 Zeichen
   - Benefit-orientiert
   - Keine Fragen
   - Beispiel: "70-380 Leads für Hochpreis-Produkte"

3. **CTA** (Call-to-Action)
   - Max 25 Zeichen
   - Handlungsaufforderung
   - Beispiel: "Gratis Vorlagen Sichern"

4. **Background Prompt** (Für Gemini Imagen)
   - Detaillierte Bildbeschreibung
   - NUR visuelle Elemente (Farben, Objekte, Stil)
   - KEIN Text im Bild!
   - Beispiel: "Professional marketing dashboard with blue and purple gradient, colorful charts and graphs, modern business aesthetic, clean minimalist design, dark background with neon accents"

=== OUTPUT FORMAT ===

Antworte NUR mit einem JSON-Array (keine Markdown-Code-Blöcke):

[
  {
    "eyebrow": "520 MIO. € BEWÄHRT",
    "headline": "70-380 Leads für Hochpreis-Produkte",
    "cta": "Gratis Vorlagen Sichern",
    "backgroundPrompt": "Professional marketing dashboard with blue and purple gradient..."
  },
  {
    "eyebrow": "BEWÄHRT BEI 1.000+ KUNDEN",
    "headline": "Mehr Leads in 25 Minuten Setup",
    "cta": "Jetzt Starten",
    "backgroundPrompt": "Modern business office with laptop showing analytics..."
  }
]

Erstelle {{1.count}} unterschiedliche Variationen.
```

**Output:** `{{2.choices[].message.content}}`

---

### Modul 4: Tools - Parse JSON

**Setup:**
1. Modul: **Tools → Parse JSON**
2. **JSON string:** `{{2.choices[].message.content}}`
3. **Data structure:** Auto-generate oder manuell:

```json
[
  {
    "eyebrow": "TEXT",
    "headline": "TEXT",
    "cta": "TEXT",
    "backgroundPrompt": "TEXT"
  }
]
```

**Output:** Array von Creative-Objekten `{{3[]}}`

---

### Modul 5: Iterator (Loop durch Creatives)

**Setup:**
1. Modul: **Flow Control → Iterator**
2. **Array:** `{{3[]}}`

**Das iteriert durch jedes Creative und führt die nächsten Module für jedes aus.**

---

### Modul 6: Bannerbear - Create an Image

**Setup:**
1. Modul: **Bannerbear → Create an Image**
2. **Template:** Formel basierend auf Format:

```
{{if(1.format = "feed"; "8BK3vWZJ78zE5Jzk1a"; if(1.format = "story"; "wXmzGBDakW7rZLN7gj"; "A37YJe5q03XBZmpvWK"))}}
```

3. **Modifications (Layers):**

**Layer 1 - Eyebrow:**
- Name: `eyebrow`
- Text: `{{5.eyebrow}}`

**Layer 2 - Headline:**
- Name: `headline`
- Text: `{{5.headline}}`

**Layer 3 - CTA:**
- Name: `cta`
- Text: `{{5.cta}}`

**Layer 4 - Background (AI Image):**
- Name: `background`
- Text: `{{5.backgroundPrompt}}`

**Output:** `{{6.image_url}}`

---

### Modul 7: Array Aggregator (Sammle alle Creatives)

**Setup:**
1. Modul: **Tools → Array Aggregator**
2. **Source Module:** Iterator (Modul 5)
3. **Aggregated fields:**
   - `url`: `{{6.image_url}}`
   - `format`: `{{1.format}}`
   - `headline`: `{{5.headline}}`
   - `eyebrow`: `{{5.eyebrow}}`
   - `cta`: `{{5.cta}}`

**Output:** Array aller generierten Creatives `{{7.array}}`

---

### Modul 8: HTTP - Send Callback to Manus

**Setup:**
1. Modul: **HTTP → Make a request**
2. **URL:** `{{1.callbackUrl}}`
3. **Method:** `POST`
4. **Headers:**
   - Name: `Content-Type`
   - Value: `application/json`
5. **Body type:** `Raw`
6. **Content type:** `JSON (application/json)`
7. **Request content:**

```json
{
  "jobId": "{{1.jobId}}",
  "creatives": {{7.array}}
}
```

**Das sendet alle fertigen Creatives zurück an Manus.**

---

## 🎨 Bannerbear Templates

Du brauchst 3 Templates mit diesen Layer-Namen:

### Template IDs:
- **Feed:** `8BK3vWZJ78zE5Jzk1a`
- **Story:** `wXmzGBDakW7rZLN7gj`
- **Reel:** `A37YJe5q03XBZmpvWK`

### Layers (für alle 3 Templates):

1. **background** (AI Image Layer)
   - Type: AI Image
   - Position: Gesamtes Bild

2. **eyebrow** (Text Layer)
   - Font: Arial Bold, 32px (Feed) / 28px (Story/Reel)
   - Color: #FF0000 (Rot)
   - Position: Oben (mit Safe Zone bei Story/Reel)

3. **headline** (Text Layer)
   - Font: Arial Bold, 48px (Feed) / 42px (Story/Reel)
   - Color: #FFFFFF (Weiß)
   - Text Shadow: Ja
   - Position: Mitte

4. **cta** (Text Layer mit Button-Style)
   - Font: Arial Bold, 28px (Feed) / 26px (Story/Reel)
   - Color: #FFFFFF (Weiß)
   - Background: #00AA00 (Grün)
   - Padding: 20px
   - Border Radius: 10px
   - Position: Unten (mit Safe Zone bei Story/Reel)

**Safe Zones:**
- **Story:** Top 14% (268px), Bottom 20% (384px)
- **Reel:** Top 25% (480px), Bottom 30% (576px)
- **Feed:** Minimal (5%)

---

## 🧪 Testing

### 1. Scenario aktivieren
- Scheduling: **"Immediately as data arrives"**

### 2. Webhook-URL in Manus speichern
- Settings → Secrets → `MAKE_WEBHOOK_URL`

### 3. Test-Creative generieren
1. Manus → Creative Generator
2. Kampagne: **"DCA Methode -- Leads -- 25.11.25"**
3. Format: **Feed**
4. Anzahl: **1**
5. Generieren klicken

### 4. Make.com Logs prüfen
- History → Execution Details
- Prüfe ob alle Module erfolgreich waren

### 5. Ergebnis in Manus prüfen
- Nach ~30 Sekunden erscheint das Creative
- Download-Button sollte funktionieren

---

## 📊 Daten-Zugriff in Make.com

### Alle verfügbaren Variablen:

```
{{1.jobId}}                                    // Job-ID
{{1.userId}}                                   // User-ID
{{1.campaignId}}                               // Kampagnen-ID
{{1.adSetId}}                                  // Anzeigengruppen-ID (optional)

{{1.landingPageUrl}}                           // Landing Page URL

{{1.winningAd.id}}                             // Top Ad ID
{{1.winningAd.name}}                           // Top Ad Name
{{1.winningAd.imageUrl}}                       // Top Ad Bild-URL
{{1.winningAd.metrics.roasOrderVolume}}        // ROAS (Auftragsvolumen)
{{1.winningAd.metrics.roasCashCollect}}        // ROAS (Cash Collect)
{{1.winningAd.metrics.costPerLead}}            // Kosten pro Lead
{{1.winningAd.metrics.costPerOutboundClick}}   // Kosten pro Klick
{{1.winningAd.metrics.outboundCtr}}            // CTR (%)
{{1.winningAd.metrics.cpm}}                    // CPM

{{1.targeting.ageMin}}                         // Alter Min
{{1.targeting.ageMax}}                         // Alter Max
{{1.targeting.genders}}                        // Geschlechter [1, 2]
{{1.targeting.geoLocations.countries}}         // Länder-Array
{{1.targeting.interests}}                      // Interessen-Array
{{1.targeting.locales}}                        // Sprachen

{{1.format}}                                   // feed/story/reel
{{1.count}}                                    // Anzahl Creatives

{{1.callbackUrl}}                              // Callback URL
```

---

## ❌ Troubleshooting

### Problem: "winningAd is null"
**Ursache:** Keine Ads in der Kampagne oder keine Performance-Daten
**Lösung:** Prüfe ob `{{1.winningAd}}` existiert mit `if(exists(1.winningAd); ...; "No winning ad")`

### Problem: "targeting is null"
**Ursache:** Keine adSetId übergeben
**Lösung:** Targeting ist optional. Prüfe mit `if(exists(1.targeting); ...; "No targeting")`

### Problem: "Gemini returns invalid JSON"
**Lösung:** Füge am Ende des Prompts hinzu: "Antworte AUSSCHLIESSLICH mit dem JSON-Array, keine Markdown-Code-Blöcke (```json), keine Erklärungen."

### Problem: "Bannerbear layer not found"
**Lösung:** Layer-Namen in Templates müssen EXAKT `eyebrow`, `headline`, `cta`, `background` heißen

---

## 💡 Prompt-Tipps

### Landing Page Scraping in Gemini:
```
Analysiere diese Landing Page: {{1.landingPageUrl}}

Extrahiere:
- Hauptbotschaft (H1)
- Benefit-Statements
- Call-to-Action
- Zielgruppe
- Tonalität (Du/Sie, professionell/locker)

Nutze diese Insights für die Ad-Copy.
```

### Winning Ad Analyse mit Vision:
```
Analysiere dieses Top-Performer Ad (ROAS {{1.winningAd.metrics.roasOrderVolume}}x):

[Bild-URL: {{1.winningAd.imageUrl}}]

Was macht es erfolgreich?
- Farben
- Layout
- Visuelle Elemente
- Text-Platzierung

Nutze diesen Stil für neue Creatives.
```

### Zielgruppen-spezifische Copy:
```
Zielgruppe: {{1.targeting.ageMin}}-{{1.targeting.ageMax}} Jahre, {{join(1.targeting.geoLocations.countries; ", ")}}

Interessen: {{join(map(1.targeting.interests; "name"); ", ")}}

Erstelle Copy die genau diese Zielgruppe anspricht.
```

---

## 🚀 Next Steps

1. ✅ Scenario in Make.com erstellen (~15 Minuten)
2. ✅ Deinen eigenen Gemini-Prompt schreiben
3. ✅ Bannerbear Templates konfigurieren
4. ✅ Webhook-URL in Manus speichern
5. ✅ Test-Creative generieren
6. ✅ Prompts iterativ optimieren

---

## 📞 Support

**Make.com Scenario teilen:**
Wenn du Hilfe brauchst, teile dein Scenario:
1. Scenario → Settings → Share
2. Kopiere Public Link
3. Sende Link

**Manus Backend Logs:**
```bash
# Server-Logs prüfen
tail -f /home/ubuntu/ad_creative_system/logs/server.log
```

---

**Viel Erfolg mit deinen eigenen Prompts! 🎉**
