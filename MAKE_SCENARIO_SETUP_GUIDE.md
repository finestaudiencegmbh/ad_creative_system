# Make.com Scenario Setup Guide
## Creative Generator für Manus Ad Performance System

---

## 🎯 Übersicht

Dieses Make.com Scenario empfängt Creative-Generierungsanfragen von Manus, generiert mit Gemini AI die Copy-Texte und Hintergrundbilder, fügt mit Bannerbear Text-Overlays hinzu und sendet die fertigen Creatives zurück an Manus.

**Flow:**
```
Manus → Make.com Webhook → Gemini AI → Bannerbear → Manus Callback
```

---

## 📋 Voraussetzungen

- ✅ Make.com Account (Free oder bezahlt)
- ✅ Gemini API Key (bereits in Manus vorhanden)
- ✅ Bannerbear API Key (bereits in Manus vorhanden)
- ✅ 3 Bannerbear Templates (Feed, Story, Reel) - siehe unten

---

## 🔧 Scenario Erstellung

### Schritt 1: Neues Scenario erstellen

1. Gehe zu https://eu2.make.com/scenarios
2. Klicke auf **"Create a new scenario"**
3. Benenne es: **"Manus Creative Generator"**

---

### Modul 1: Webhooks - Custom Webhook

**Setup:**
1. Klicke auf das **"+"** Icon
2. Suche nach **"Webhooks"**
3. Wähle **"Custom webhook"**
4. Klicke auf **"Create a webhook"**
5. Webhook Name: **"Manus Creative Trigger"**
6. Klicke auf **"Save"**
7. **WICHTIG:** Kopiere die Webhook-URL (sieht aus wie: `https://hook.eu2.make.com/xxxxx`)

**Diese URL musst du in Manus als `MAKE_WEBHOOK_URL` Secret speichern!**

**Erwartete Daten von Manus:**
```json
{
  "jobId": "uuid-string",
  "userId": 1,
  "campaignId": "120236291446940214",
  "landingPageUrl": "https://finest-audience.com/landingpage-vorlage",
  "format": "feed",
  "count": 1,
  "callbackUrl": "https://3000-xxx.manusvm.computer/api/trpc/ai.receiveCreatives"
}
```

---

### Modul 2: Google Gemini AI - Generate a Response

**Setup:**
1. Klicke auf das **"+"** Icon nach dem Webhook
2. Suche nach **"Google Gemini AI"**
3. Wähle **"Generate a response"**
4. **Connection:** Erstelle neue Verbindung mit deinem Gemini API Key
5. **Model:** `gemini-2.0-flash-exp`
6. **Role:** `user`
7. **Prompt:** (siehe unten)

**Prompt-Konfiguration:**
```
Du bist ein Meta Ads Creative-Generator. Analysiere die Landing Page und erstelle ein überzeugendes Ad Creative.

Landing Page URL: {{1.landingPageUrl}}
Format: {{1.format}}

Erstelle ein JSON mit folgender Struktur:
{
  "eyebrow": "Kurzer Aufmerksamkeits-Text (max 30 Zeichen, GROSSBUCHSTABEN)",
  "headline": "Hauptbotschaft (max 60 Zeichen)",
  "cta": "Call-to-Action Button Text (max 25 Zeichen)",
  "backgroundPrompt": "Detaillierter Prompt für Hintergrundbild-Generierung. Beschreibe das Bild das generiert werden soll. KEINE Text-Anweisungen! Fokus auf: Farben, Stimmung, Objekte, Stil. Beispiel: 'Professional marketing dashboard with colorful charts, modern gradient background, clean minimalist design'"
}

Beispiel Output:
{
  "eyebrow": "520 MIO. € BEWÄHRT",
  "headline": "70-380 Leads für Hochpreis-Produkte",
  "cta": "Gratis Vorlagen Sichern",
  "backgroundPrompt": "Professional marketing dashboard with blue and purple gradient, charts and graphs, modern business aesthetic, clean design"
}

WICHTIG:
- eyebrow: Immer GROSSBUCHSTABEN, kurz und prägnant
- headline: Benefit-orientiert, keine Fragen
- cta: Handlungsaufforderung, kein "Mehr erfahren"
- backgroundPrompt: NUR Bildbeschreibung, KEIN Text!

Antworte NUR mit dem JSON, keine zusätzlichen Erklärungen.
```

**Ausgabe-Variable:** `{{2.choices[].message.content}}`

---

### Modul 3: Tools - Parse JSON

**Setup:**
1. Klicke auf das **"+"** Icon nach Gemini
2. Suche nach **"Tools"**
3. Wähle **"Parse JSON"**
4. **JSON string:** `{{2.choices[].message.content}}`
5. **Data structure:** Klicke auf **"Generate from sample"**
6. Füge dieses Beispiel-JSON ein:
```json
{
  "eyebrow": "520 MIO. € BEWÄHRT",
  "headline": "70-380 Leads für Hochpreis-Produkte",
  "cta": "Gratis Vorlagen Sichern",
  "backgroundPrompt": "Professional marketing dashboard"
}
```
7. Klicke auf **"Save"**

**Ausgabe-Variablen:**
- `{{3.eyebrow}}`
- `{{3.headline}}`
- `{{3.cta}}`
- `{{3.backgroundPrompt}}`

---

### Modul 4: Bannerbear - Create an Image

**Setup:**
1. Klicke auf das **"+"** Icon nach Parse JSON
2. Suche nach **"Bannerbear"**
3. Wähle **"Create an Image"**
4. **Connection:** Erstelle neue Verbindung mit deinem Bannerbear API Key
5. **Template:** Hier musst du eine **Formel** verwenden um das richtige Template basierend auf dem Format zu wählen

**Template-Formel:**
```
{{if(1.format = "feed"; "8BK3vWZJ78zE5Jzk1a"; if(1.format = "story"; "wXmzGBDakW7rZLN7gj"; "A37YJe5q03XBZmpvWK"))}}
```

**Modifications (Layers):**

Klicke auf **"Add item"** für jeden Layer:

**Layer 1 - Eyebrow:**
- **Name:** `eyebrow`
- **Text:** `{{3.eyebrow}}`

**Layer 2 - Headline:**
- **Name:** `headline`
- **Text:** `{{3.headline}}`

**Layer 3 - CTA:**
- **Name:** `cta`
- **Text:** `{{3.cta}}`

**Layer 4 - Background:**
- **Name:** `background`
- **Text:** `{{3.backgroundPrompt}}`

**WICHTIG:** Diese Layer-Namen müssen EXAKT in deinen Bannerbear Templates existieren!

**Ausgabe-Variable:** `{{4.image_url}}`

---

### Modul 5: HTTP - Make a Request

**Setup:**
1. Klicke auf das **"+"** Icon nach Bannerbear
2. Suche nach **"HTTP"**
3. Wähle **"Make a request"**
4. **URL:** `{{1.callbackUrl}}`
5. **Method:** `POST`
6. **Headers:**
   - **Name:** `Content-Type`
   - **Value:** `application/json`
7. **Body type:** `Raw`
8. **Content type:** `JSON (application/json)`
9. **Request content:**
```json
{
  "jobId": "{{1.jobId}}",
  "creatives": [
    {
      "url": "{{4.image_url}}",
      "format": "{{1.format}}",
      "headline": "{{3.headline}}",
      "eyebrow": "{{3.eyebrow}}",
      "cta": "{{3.cta}}"
    }
  ]
}
```

---

## 🎨 Bannerbear Templates Setup

Du brauchst 3 Templates in Bannerbear mit EXAKT diesen Layer-Namen:

### Template 1: Feed (1:1 - 1080x1080px)

**Template ID:** `8BK3vWZJ78zE5Jzk1a`

**Layers:**
1. **background** (AI Image Layer)
   - Position: Gesamtes Bild (0,0 - 1080,1080)
   - Type: AI Image

2. **eyebrow** (Text Layer)
   - Position: Oben (X: 50, Y: 50)
   - Font: Arial Bold, 32px
   - Color: #FF0000 (Rot)
   - Alignment: Center

3. **headline** (Text Layer)
   - Position: Mitte (X: 50, Y: 450)
   - Font: Arial Bold, 48px
   - Color: #FFFFFF (Weiß)
   - Alignment: Center
   - Text Shadow: Ja (für Lesbarkeit)

4. **cta** (Text Layer mit Button-Style)
   - Position: Unten (X: 50, Y: 950)
   - Font: Arial Bold, 28px
   - Color: #FFFFFF (Weiß)
   - Background: #00AA00 (Grün)
   - Padding: 20px
   - Border Radius: 10px
   - Alignment: Center

---

### Template 2: Story (9:16 - 1080x1920px)

**Template ID:** `wXmzGBDakW7rZLN7gj`

**Layers:**
1. **background** (AI Image Layer)
   - Position: Gesamtes Bild (0,0 - 1080,1920)
   - Type: AI Image

2. **eyebrow** (Text Layer)
   - Position: Oben (X: 50, Y: 300) ← Safe Zone beachten!
   - Font: Arial Bold, 28px
   - Color: #FF0000 (Rot)
   - Alignment: Center

3. **headline** (Text Layer)
   - Position: Mitte (X: 50, Y: 850)
   - Font: Arial Bold, 42px
   - Color: #FFFFFF (Weiß)
   - Alignment: Center
   - Text Shadow: Ja
   - Max Width: 900px (für Zeilenumbruch)

4. **cta** (Text Layer mit Button-Style)
   - Position: Unten (X: 50, Y: 1550) ← Safe Zone beachten!
   - Font: Arial Bold, 26px
   - Color: #FFFFFF (Weiß)
   - Background: #00AA00 (Grün)
   - Padding: 18px
   - Border Radius: 10px
   - Alignment: Center

**Safe Zones für Story:**
- Top: 14% (268px) - Keine wichtigen Elemente
- Bottom: 20% (384px) - Keine wichtigen Elemente

---

### Template 3: Reel (9:16 - 1080x1920px)

**Template ID:** `A37YJe5q03XBZmpvWK`

**Layers:**
1. **background** (AI Image Layer)
   - Position: Gesamtes Bild (0,0 - 1080,1920)
   - Type: AI Image

2. **eyebrow** (Text Layer)
   - Position: Oben (X: 50, Y: 500) ← Safe Zone beachten!
   - Font: Arial Bold, 28px
   - Color: #FF0000 (Rot)
   - Alignment: Center

3. **headline** (Text Layer)
   - Position: Mitte (X: 50, Y: 900)
   - Font: Arial Bold, 42px
   - Color: #FFFFFF (Weiß)
   - Alignment: Center
   - Text Shadow: Ja
   - Max Width: 900px

4. **cta** (Text Layer mit Button-Style)
   - Position: Unten (X: 50, Y: 1350) ← Safe Zone beachten!
   - Font: Arial Bold, 26px
   - Color: #FFFFFF (Weiß)
   - Background: #00AA00 (Grün)
   - Padding: 18px
   - Border Radius: 10px
   - Alignment: Center

**Safe Zones für Reel:**
- Top: 25% (480px) - Keine wichtigen Elemente
- Bottom: 30% (576px) - Keine wichtigen Elemente

---

## 🧪 Testing

### Schritt 1: Scenario aktivieren

1. Klicke unten rechts auf **"Scheduling"**
2. Wähle **"Immediately as data arrives"**
3. Klicke auf **"OK"**
4. Scenario ist jetzt aktiv!

### Schritt 2: Webhook-URL in Manus speichern

1. Gehe zu Manus Settings → Secrets
2. Füge hinzu:
   - **Key:** `MAKE_WEBHOOK_URL`
   - **Value:** `https://hook.eu2.make.com/xxxxx` (deine Webhook-URL aus Modul 1)

### Schritt 3: Test-Creative generieren

1. Gehe in Manus zum Creative Generator
2. Wähle Kampagne: **"Funnel Vorlagen"**
3. Format: **Feed**
4. Anzahl: **1**
5. Klicke auf **"Generieren"**

### Schritt 4: Make.com Logs prüfen

1. Gehe zu Make.com → Scenarios
2. Klicke auf dein Scenario
3. Klicke auf **"History"**
4. Prüfe ob Execution erfolgreich war (grüner Haken)
5. Klicke auf die Execution um Details zu sehen

### Schritt 5: Ergebnis in Manus prüfen

1. Nach ~30 Sekunden sollte das Creative in Manus erscheinen
2. Prüfe ob Text korrekt ist (Eyebrow, Headline, CTA)
3. Prüfe ob Hintergrundbild relevant ist

---

## ❌ Troubleshooting

### Problem: "Template not found"
**Lösung:** Prüfe ob die Template IDs in Modul 4 korrekt sind. Gehe zu Bannerbear Dashboard → Templates und kopiere die UIDs.

### Problem: "Layer 'eyebrow' not found"
**Lösung:** Deine Bannerbear Templates haben nicht die richtigen Layer-Namen. Benenne die Layer um oder erstelle neue Templates nach obiger Anleitung.

### Problem: "Gemini returns invalid JSON"
**Lösung:** Der Prompt muss angepasst werden. Füge am Ende hinzu: "Antworte AUSSCHLIESSLICH mit dem JSON-Objekt, keine Markdown-Code-Blöcke, keine Erklärungen."

### Problem: "Callback URL not reachable"
**Lösung:** Manus muss öffentlich erreichbar sein. Prüfe ob die URL in `callbackUrl` korrekt ist und von außen erreichbar.

### Problem: "Background image is generic/irrelevant"
**Lösung:** Der `backgroundPrompt` von Gemini ist zu generisch. Passe den Prompt in Modul 2 an um spezifischere Bildbeschreibungen zu erzwingen.

---

## 📊 Monitoring

**Make.com Dashboard:**
- Gehe zu Scenarios → Dein Scenario → History
- Prüfe Execution Count, Success Rate, Errors

**Manus Database:**
- Prüfe `creativeJobs` Tabelle
- Status sollte `completed` sein
- `output` enthält die Creative-URLs

**Bannerbear Dashboard:**
- Gehe zu Images → Recent
- Prüfe ob Bilder generiert wurden
- Prüfe ob Text korrekt platziert ist

---

## 💰 Kosten

**Make.com:**
- Free Plan: 1.000 Operations/Monat
- Pro Plan: 10.000 Operations/Monat (~$9/Monat)
- 1 Creative = ~5 Operations (Webhook + Gemini + Parse + Bannerbear + HTTP)
- **Kostenlos für ~200 Creatives/Monat**

**Bannerbear:**
- Free Plan: 30 Images/Monat
- Starter Plan: 500 Images/Monat (~$49/Monat)
- **Empfehlung: Starter Plan für Production**

**Gemini API:**
- Gemini 2.0 Flash: $0.075 / 1M Tokens Input
- ~500 Tokens pro Request = $0.0000375 pro Creative
- **Praktisch kostenlos**

**Total pro Creative:** ~$0.10 (hauptsächlich Bannerbear)

---

## 🚀 Next Steps

1. ✅ Scenario in Make.com erstellen (10 Minuten)
2. ✅ Bannerbear Templates erstellen (15 Minuten)
3. ✅ Webhook-URL in Manus speichern (1 Minute)
4. ✅ Test-Creative generieren (1 Minute)
5. ✅ Prompts optimieren basierend auf Ergebnissen (iterativ)

---

## 📞 Support

Bei Problemen:
1. Prüfe Make.com Execution History
2. Prüfe Bannerbear Image History
3. Prüfe Manus Server Logs
4. Kontaktiere Make.com Support (sehr hilfreich!)

---

**Viel Erfolg! 🎉**
