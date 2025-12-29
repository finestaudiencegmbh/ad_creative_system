# Secrets & Environment Variables
## Für Bolt.new Migration

---

## 🔐 Erforderliche Secrets

Diese Secrets müssen in Bolt.new konfiguriert werden:

### 1. Database Connection
```bash
DATABASE_URL="mysql://user:password@host:port/database?ssl=true"
```
**Aktueller Wert:** Siehe Management UI → Database → Settings (bottom-left)

---

### 2. Meta Marketing API
```bash
META_ACCESS_TOKEN="EAAG..."
META_AD_ACCOUNT_ID="act_24911648491777694"
```
**Beschreibung:**
- `META_ACCESS_TOKEN`: Meta Business API Access Token
- `META_AD_ACCOUNT_ID`: Meta Ad Account ID (mit "act_" Prefix)

**Wo zu finden:**
- Meta Business Manager → Business Settings → System Users → Token generieren
- Ad Account ID: Meta Ads Manager → Account Settings

---

### 3. Bannerbear API (Text Overlay Rendering)
```bash
BANNERBEAR_API_KEY="bb_pr_..."
BANNERBEAR_TEMPLATE_FEED="8BK3vWZJ78zE5Jzk1a"
BANNERBEAR_TEMPLATE_STORY="wXmzGBDakW7rZLN7gj"
BANNERBEAR_TEMPLATE_REEL="A37YJe5q03XBZmpvWK"
```
**Beschreibung:**
- Bannerbear rendert professionelle Text-Overlays auf Bilder
- 3 Templates für Feed (1:1), Story (9:16), Reel (9:16)

**Wo zu finden:**
- https://www.bannerbear.com/dashboard
- API Key: Settings → API Keys
- Template IDs: Templates → Copy UID

---

### 4. Google Gemini AI
```bash
GEMINI_API_KEY="AIza..."
```
**Beschreibung:**
- Für Landing Page Analyse (Vision API)
- Für Copy-Generierung (Text Generation)
- Für Background Image Prompts (Imagen)

**Wo zu finden:**
- https://aistudio.google.com/app/apikey
- Erstelle neuen API Key

---

### 5. Replicate API (Backup für Bildgenerierung)
```bash
REPLICATE_API_TOKEN="r8_..."
```
**Beschreibung:**
- Backup für SDXL Bildgenerierung (falls Gemini Imagen nicht verfügbar)
- Aktuell nicht aktiv genutzt

**Wo zu finden:**
- https://replicate.com/account/api-tokens

---

### 6. Make.com Webhook
```bash
MAKE_WEBHOOK_URL="https://hook.eu2.make.com/xxxxx"
```
**Beschreibung:**
- Webhook-URL für Make.com Scenario
- Wird nach Make.com Setup generiert

**Wo zu finden:**
- Make.com → Scenarios → Dein Scenario → Webhooks Module → Copy URL

---

### 7. JWT & Auth
```bash
JWT_SECRET="random-secure-string-min-32-chars"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://login.manus.im"
VITE_APP_ID="your-app-id"
OWNER_OPEN_ID="owner-openid"
OWNER_NAME="Jan Ortmüller"
```
**Beschreibung:**
- `JWT_SECRET`: Zufälliger String für Session-Signing (min 32 Zeichen)
- OAuth-Variablen: Nur für Manus OAuth (kann in Bolt durch eigenes Login ersetzt werden)

**Generierung JWT_SECRET:**
```bash
openssl rand -base64 32
```

---

### 8. Built-in Forge API (Manus-spezifisch)
```bash
BUILT_IN_FORGE_API_URL="https://api.manus.im/forge"
BUILT_IN_FORGE_API_KEY="manus-api-key"
VITE_FRONTEND_FORGE_API_KEY="frontend-api-key"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im/forge"
```
**Beschreibung:**
- Manus-spezifische APIs (LLM, Storage, Notifications)
- **WICHTIG:** Diese müssen in Bolt ersetzt werden!

**Ersatz in Bolt:**
- LLM: Eigene OpenAI/Anthropic API Keys verwenden
- Storage: Eigenes S3/Cloudflare R2 Setup
- Notifications: Eigenes Email/Push-System

---

### 9. Analytics (Optional)
```bash
VITE_ANALYTICS_ENDPOINT="https://analytics.manus.im"
VITE_ANALYTICS_WEBSITE_ID="website-id"
```
**Beschreibung:**
- Manus Analytics (optional)
- Kann in Bolt durch Google Analytics/Plausible ersetzt werden

---

## 📋 Vollständige .env Datei für Bolt

```bash
# ============================================
# Database
# ============================================
DATABASE_URL="mysql://user:password@host:port/database?ssl=true"

# ============================================
# Meta Marketing API
# ============================================
META_ACCESS_TOKEN="EAAG..."
META_AD_ACCOUNT_ID="act_24911648491777694"

# ============================================
# Bannerbear API
# ============================================
BANNERBEAR_API_KEY="bb_pr_..."
BANNERBEAR_TEMPLATE_FEED="8BK3vWZJ78zE5Jzk1a"
BANNERBEAR_TEMPLATE_STORY="wXmzGBDakW7rZLN7gj"
BANNERBEAR_TEMPLATE_REEL="A37YJe5q03XBZmpvWK"

# ============================================
# Google Gemini AI
# ============================================
GEMINI_API_KEY="AIza..."

# ============================================
# Replicate API (Backup)
# ============================================
REPLICATE_API_TOKEN="r8_..."

# ============================================
# Make.com Webhook
# ============================================
MAKE_WEBHOOK_URL="https://hook.eu2.make.com/xxxxx"

# ============================================
# JWT & Session
# ============================================
JWT_SECRET="your-random-32-char-secret"

# ============================================
# OpenAI API (für Bolt - ersetzt Manus LLM)
# ============================================
OPENAI_API_KEY="sk-..."

# ============================================
# S3 Storage (für Bolt - ersetzt Manus Storage)
# ============================================
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="your-bucket-name"

# ============================================
# App Config
# ============================================
NODE_ENV="production"
PORT="3000"
VITE_APP_TITLE="Finest Ad Performance System"
VITE_APP_LOGO="/favicon.png"
```

---

## 🔄 Manus → Bolt Replacements

### LLM Integration
**Manus:**
```typescript
import { invokeLLM } from "./server/_core/llm";
const response = await invokeLLM({ messages: [...] });
```

**Bolt Replacement:**
```typescript
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [...]
});
```

---

### Storage Integration
**Manus:**
```typescript
import { storagePut } from "./server/storage";
const { url } = await storagePut(key, buffer, "image/png");
```

**Bolt Replacement:**
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: process.env.AWS_REGION });
await s3.send(new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: key,
  Body: buffer,
  ContentType: "image/png"
}));
const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
```

---

### Auth Integration
**Manus:**
```typescript
// Uses Manus OAuth automatically
const user = ctx.user; // From protectedProcedure
```

**Bolt Replacement:**
```typescript
// Implement custom JWT auth
import jwt from "jsonwebtoken";
const token = jwt.sign({ userId }, process.env.JWT_SECRET);
// Or use NextAuth.js / Clerk / Auth0
```

---

## ⚠️ Wichtige Hinweise

1. **Database URL:** Muss von Manus Management UI kopiert werden (Connection Details)
2. **Meta Access Token:** Muss langlebig sein (60 Tage oder System User Token)
3. **Bannerbear Templates:** Müssen in Bannerbear Dashboard konfiguriert werden (siehe MAKE_SETUP_FINAL.md)
4. **Make.com Webhook:** Wird erst nach Make.com Scenario Setup generiert
5. **S3 Storage:** Manus S3-URLs bleiben gültig, aber neue Uploads brauchen eigenes S3

---

## 🧪 Testing nach Migration

Nach Setup in Bolt, teste:

```bash
# 1. Database Connection
pnpm drizzle-kit studio

# 2. Meta API
curl -X GET "https://graph.facebook.com/v18.0/act_24911648491777694/campaigns?access_token=YOUR_TOKEN"

# 3. Bannerbear API
curl -X GET "https://api.bannerbear.com/v2/templates" \
  -H "Authorization: Bearer YOUR_API_KEY"

# 4. Gemini API
curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## 📞 Support

Bei Problemen mit Secrets:
- Meta API: https://developers.facebook.com/support
- Bannerbear: https://www.bannerbear.com/support
- Gemini: https://ai.google.dev/support
- Make.com: https://www.make.com/en/help
