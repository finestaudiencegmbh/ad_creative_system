# Make.com Integration Setup Guide

## Übersicht

Das Creative Generation System nutzt Make.com als externen Rendering-Service. Manus sendet Webhook-Requests an Make.com, Make.com generiert die Creatives (Gemini Imagen + Bannerbear), und sendet die fertigen Bilder zurück an Manus.

## Vorteile

✅ **Zuverlässig** - Make.com Error Handling + Retries  
✅ **Skalierbar** - Parallele Requests ohne Server-Last  
✅ **Wartbar** - Creative-Logic außerhalb von Manus  
✅ **Flexibel** - Einfach neue Services hinzufügen (Midjourney, DALL-E)  
✅ **Transparent** - Make.com Logs zeigen jeden Schritt  

---

## 1. Make.com Scenario erstellen

### Schritt 1: Neues Scenario anlegen

1. Gehe zu https://www.make.com/
2. Klicke auf "Create a new scenario"
3. Benenne es: "Manus Creative Generator"

### Schritt 2: Webhook Trigger hinzufügen

1. Füge "Webhooks" → "Custom webhook" als Trigger hinzu
2. Klicke "Create a webhook"
3. **Kopiere die Webhook-URL** (z.B. `https://hook.eu1.make.com/abc123...`)
4. Diese URL wird später in Manus als `MAKE_WEBHOOK_URL` hinterlegt

### Schritt 3: Module hinzufügen

Das Scenario besteht aus 4 Modulen:

```
1. Webhook (Trigger)
   ↓
2. HTTP Request → Gemini Imagen (Hintergrundbild generieren)
   ↓
3. HTTP Request → Bannerbear (Text-Overlays hinzufügen)
   ↓
4. HTTP Request → Manus Callback (Fertige Creatives zurücksenden)
```

---

## 2. Module konfigurieren

### Modul 1: Webhook (Trigger)

**Empfängt von Manus:**
```json
{
  "jobId": "uuid-string",
  "userId": 1,
  "campaignId": "120236291446940214",
  "landingPageUrl": "https://finest-audience.com/landingpage-vorlage",
  "format": "feed",
  "count": 1,
  "callbackUrl": "https://your-app.manus.space/api/trpc/ai.receiveCreatives"
}
```

### Modul 2: Gemini Imagen (Hintergrundbild)

**HTTP Request:**
- **URL:** `https://api.gemini.com/v1/imagen/generate` (Beispiel - echte URL verwenden)
- **Method:** POST
- **Headers:**
  - `Authorization: Bearer YOUR_GEMINI_API_KEY`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "prompt": "Professional ad background for {{landingPageUrl}} - modern, clean, high quality",
  "aspectRatio": "{{format === 'feed' ? '1:1' : '9:16'}}",
  "numOutputs": 1
}
```

**Output:** `backgroundImageUrl`

### Modul 3: Bannerbear (Text-Overlays)

**HTTP Request:**
- **URL:** `https://api.bannerbear.com/v2/images`
- **Method:** POST
- **Headers:**
  - `Authorization: Bearer YOUR_BANNERBEAR_API_KEY`
  - `Content-Type: application/json`
- **Body:**
```json
{
  "template": "{{format === 'feed' ? 'FEED_TEMPLATE_ID' : (format === 'story' ? 'STORY_TEMPLATE_ID' : 'REEL_TEMPLATE_ID')}}",
  "modifications": [
    {
      "name": "background",
      "image_url": "{{backgroundImageUrl}}"
    },
    {
      "name": "eyebrow",
      "text": "520 MIO. € SYSTEM GRATIS"
    },
    {
      "name": "headline",
      "text": "70-380 QUALIFIZIERTE LEADS/MONAT AUTOMATISIERT"
    },
    {
      "name": "cta",
      "text": "Funnel-Vorlagen gratis sichern"
    }
  ]
}
```

**Output:** `finalCreativeUrl`

### Modul 4: Manus Callback

**HTTP Request:**
- **URL:** `{{callbackUrl}}` (aus Webhook-Daten)
- **Method:** POST
- **Headers:**
  - `Content-Type: application/json`
- **Body:**
```json
{
  "jobId": "{{jobId}}",
  "creatives": [
    {
      "url": "{{finalCreativeUrl}}",
      "format": "{{format}}",
      "headline": "70-380 QUALIFIZIERTE LEADS/MONAT AUTOMATISIERT",
      "eyebrow": "520 MIO. € SYSTEM GRATIS",
      "cta": "Funnel-Vorlagen gratis sichern"
    }
  ]
}
```

---

## 3. Manus konfigurieren

### Webhook-URL in Manus hinterlegen

1. Kopiere die Make.com Webhook-URL aus Schritt 2
2. Füge sie als Secret in Manus hinzu:
   - Name: `MAKE_WEBHOOK_URL`
   - Value: `https://hook.eu1.make.com/abc123...`

### APP_URL (optional)

Die Callback-URL wird automatisch aus dem Request erkannt (`https://${req.headers.host}`). Falls du eine spezifische URL nutzen willst:
- Name: `APP_URL`
- Value: `https://your-app.manus.space`

---

## 4. Testen

### Test-Flow:

1. Öffne Manus Creative Generator
2. Wähle Kampagne: "Funnel Vorlagen"
3. Wähle Format: "Feed"
4. Wähle Anzahl: "1"
5. Klicke "Generieren"

**Erwartetes Verhalten:**
1. ✅ Toast: "Creative-Generierung gestartet... Bitte warten."
2. ✅ Make.com Scenario wird getriggert (siehe Make.com Logs)
3. ✅ Nach ~20-30 Sekunden: Toast "1 Creatives erfolgreich generiert!"
4. ✅ Creative wird angezeigt mit Download-Button

### Debugging:

**Wenn nichts passiert:**
- Prüfe Make.com Logs: Wurde der Webhook empfangen?
- Prüfe Manus Server Logs: Wurde `triggerCreativeGeneration` aufgerufen?
- Prüfe `MAKE_WEBHOOK_URL` Secret: Ist die URL korrekt?

**Wenn Callback nicht ankommt:**
- Prüfe Make.com Modul 4: Ist `callbackUrl` korrekt?
- Prüfe Manus Server Logs: Kommt der Callback an?
- Prüfe Netzwerk: Kann Make.com deine Manus-Instanz erreichen?

---

## 5. Produktiv-Setup

### API Keys zentral verwalten

Alle API Keys (Gemini, Bannerbear) werden in Make.com hinterlegt, **nicht** in Manus. Das bedeutet:
- ✅ Kunden brauchen keine eigenen API Keys
- ✅ Du kontrollierst die Kosten
- ✅ Einfaches Onboarding

### Kosten-Tracking

Make.com zeigt dir:
- Anzahl Executions pro Monat
- Anzahl generierte Creatives
- API-Kosten (Gemini + Bannerbear)

Du kannst diese Kosten in dein Pricing einrechnen (z.B. "100 Creatives/Monat inklusive").

---

## 6. Erweiterte Features

### Batch-Generierung

Für mehrere Creatives gleichzeitig:
1. Make.com Scenario mit Loop erweitern
2. `count` Parameter aus Webhook nutzen
3. Mehrere Creatives im Callback zurücksenden

### Weitere Formate

Für Story/Reel:
1. Bannerbear Templates für Story (9:16) und Reel (9:16) erstellen
2. Template-IDs in Make.com Modul 3 hinterlegen
3. Format-Switch im Scenario implementieren

### Alternative Services

Statt Gemini Imagen:
- Midjourney (via API)
- DALL-E 3 (via OpenAI API)
- Stable Diffusion (via Replicate)

Statt Bannerbear:
- Placid.app
- Abyssale
- Eigener Canvas-Renderer

---

## Support

Bei Fragen:
- Make.com Docs: https://www.make.com/en/help
- Bannerbear Docs: https://developers.bannerbear.com/
- Gemini Docs: https://ai.google.dev/docs

**Viel Erfolg! 🚀**
