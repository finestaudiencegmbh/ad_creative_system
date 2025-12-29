# Bolt.new Setup Checklist
## Schritt-für-Schritt Anleitung

---

## ✅ Pre-Migration Checklist

### 1. Accounts erstellen
- [ ] Bolt.new Account: https://bolt.new
- [ ] PlanetScale Account: https://planetscale.com (oder Railway/Supabase)
- [ ] AWS Account: https://aws.amazon.com (für S3 Storage)
- [ ] OpenAI Account: https://platform.openai.com (für LLM)

### 2. Daten aus Manus exportieren
- [ ] GitHub Repo URL kopieren
- [ ] Manus Management UI → Database → Connection Details kopieren
- [ ] SQL-Dump erstellen:
```bash
mysql -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] [DATABASE] > manus_backup.sql
```
- [ ] Alle Secrets aus Manus Settings → Secrets kopieren

### 3. API Keys vorbereiten
- [ ] Meta Access Token (langlebig, 60 Tage)
- [ ] Bannerbear API Key
- [ ] Gemini API Key
- [ ] Replicate API Token (optional)
- [ ] OpenAI API Key (neu für Bolt)
- [ ] AWS Access Keys (neu für Bolt)

---

## 🚀 Bolt.new Setup

### Phase 1: Projekt importieren

#### Option A: GitHub Import
1. [ ] Bolt.new → "Import from GitHub"
2. [ ] Authorize GitHub
3. [ ] Wähle Repository: `ad_creative_system`
4. [ ] Warte auf Import (2-3 Minuten)

#### Option B: Manueller Upload
1. [ ] Clone GitHub Repo lokal
2. [ ] Zippe Projekt-Ordner
3. [ ] Bolt.new → "Upload Project"
4. [ ] Wähle ZIP-Datei

### Phase 2: Environment Variables konfigurieren

Bolt.new → Settings → Environment Variables

#### Database
```bash
DATABASE_URL="mysql://user:pass@host:port/database?ssl=true"
```

#### Meta API
```bash
META_ACCESS_TOKEN="EAAG..."
META_AD_ACCOUNT_ID="act_24911648491777694"
```

#### Bannerbear
```bash
BANNERBEAR_API_KEY="bb_pr_..."
BANNERBEAR_TEMPLATE_FEED="8BK3vWZJ78zE5Jzk1a"
BANNERBEAR_TEMPLATE_STORY="wXmzGBDakW7rZLN7gj"
BANNERBEAR_TEMPLATE_REEL="A37YJe5q03XBZmpvWK"
```

#### AI APIs
```bash
GEMINI_API_KEY="AIza..."
OPENAI_API_KEY="sk-..."
REPLICATE_API_TOKEN="r8_..."
```

#### Storage (S3)
```bash
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="ad-creative-system"
```

#### Make.com
```bash
MAKE_WEBHOOK_URL="https://hook.eu2.make.com/xxxxx"
```

#### JWT
```bash
JWT_SECRET="generate-random-32-char-string"
```

**JWT Secret generieren:**
```bash
openssl rand -base64 32
```

### Phase 3: Datenbank Setup

#### Schritt 1: PlanetScale Datenbank erstellen
1. [ ] https://planetscale.com → New Database
2. [ ] Name: `ad-creative-system`
3. [ ] Region: `EU West (Frankfurt)`
4. [ ] Plan: `Hobby` (kostenlos)
5. [ ] Create Database

#### Schritt 2: Connection String kopieren
1. [ ] Database → Settings → Passwords
2. [ ] Create Password
3. [ ] Kopiere Connection String
4. [ ] Füge in Bolt Environment Variables ein (`DATABASE_URL`)

#### Schritt 3: Schema importieren
```bash
# Option A: Mit MySQL Client
mysql -h [HOST] -u [USER] -p[PASSWORD] [DATABASE] < 01_database_schema.sql

# Option B: Mit Drizzle Kit (in Bolt Terminal)
pnpm drizzle-kit push
```

#### Schritt 4: Daten importieren (optional)
```bash
# Importiere Manus Backup
mysql -h [HOST] -u [USER] -p[PASSWORD] [DATABASE] < manus_backup.sql
```

### Phase 4: S3 Storage Setup

#### Schritt 1: S3 Bucket erstellen
1. [ ] AWS Console → S3 → Create Bucket
2. [ ] Bucket Name: `ad-creative-system-bolt`
3. [ ] Region: `eu-central-1`
4. [ ] **Wichtig:** Deaktiviere "Block all public access"
5. [ ] Create Bucket

#### Schritt 2: CORS konfigurieren
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

#### Schritt 3: IAM User erstellen
1. [ ] AWS Console → IAM → Users → Create User
2. [ ] User Name: `ad-creative-system-bolt`
3. [ ] Attach Policy: `AmazonS3FullAccess`
4. [ ] Create Access Key
5. [ ] Kopiere Access Key ID & Secret Access Key
6. [ ] Füge in Bolt Environment Variables ein

### Phase 5: Code-Anpassungen

#### Datei 1: `server/_core/llm.ts`

**Ersetze Manus LLM mit OpenAI:**

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function invokeLLM(params: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
}) {
  const response = await openai.chat.completions.create({
    model: params.model || "gpt-4",
    messages: params.messages as any,
  });
  
  return {
    choices: response.choices.map(choice => ({
      message: {
        content: choice.message.content,
      },
    })),
  };
}
```

#### Datei 2: `server/storage.ts`

**Ersetze Manus Storage mit S3:**

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function storagePut(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const bucket = process.env.AWS_S3_BUCKET!;
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  
  return { key, url };
}
```

#### Datei 3: `package.json`

**Füge neue Dependencies hinzu:**

```bash
pnpm add openai @aws-sdk/client-s3
```

### Phase 6: Testing

#### Test 1: Dev Server
```bash
pnpm install
pnpm dev
```
- [ ] Server läuft auf `http://localhost:3000`
- [ ] Keine Errors in Console

#### Test 2: Database Connection
```bash
pnpm drizzle-kit studio
```
- [ ] Drizzle Studio öffnet sich
- [ ] Alle 11 Tabellen sichtbar

#### Test 3: Meta API
```bash
curl -X GET "https://graph.facebook.com/v18.0/act_24911648491777694/campaigns?access_token=YOUR_TOKEN"
```
- [ ] JSON Response mit Kampagnen

#### Test 4: Bannerbear API
```bash
curl -X GET "https://api.bannerbear.com/v2/templates" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
- [ ] JSON Response mit Templates

#### Test 5: OpenAI API
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```
- [ ] JSON Response mit Completion

#### Test 6: S3 Upload
```bash
# In Bolt Terminal
node -e "
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: process.env.AWS_REGION });
s3.send(new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: 'test.txt',
  Body: 'Hello World'
})).then(() => console.log('✅ S3 Upload successful'));
"
```
- [ ] Console zeigt "✅ S3 Upload successful"

#### Test 7: Complete Flow (Browser)
1. [ ] Öffne Bolt Preview URL
2. [ ] Login (falls Auth implementiert)
3. [ ] Dashboard zeigt Kampagnen
4. [ ] Klicke "Creative Generator"
5. [ ] Wähle Kampagne
6. [ ] Wähle Format (Feed)
7. [ ] Klicke "Generieren"
8. [ ] Creative wird angezeigt
9. [ ] Download funktioniert

---

## 🐛 Troubleshooting

### Problem: "Cannot find module 'openai'"
**Lösung:**
```bash
pnpm add openai
```

### Problem: "S3 Access Denied"
**Lösung:**
- Prüfe IAM User Permissions
- Prüfe Bucket Policy (Public Read Access)

### Problem: "Database connection failed"
**Lösung:**
- Prüfe `DATABASE_URL` Format
- Prüfe PlanetScale Connection String
- Prüfe ob SSL aktiviert ist (`?ssl=true`)

### Problem: "Meta API Invalid Token"
**Lösung:**
- Token ist abgelaufen → Neuen generieren
- Token hat falsche Permissions → Business Manager prüfen

### Problem: "Make.com webhook not working"
**Lösung:**
- Scenario muss aktiv sein
- Webhook-URL prüfen
- Scenario History in Make.com prüfen

---

## 🚀 Deployment

### Schritt 1: Production Build
```bash
pnpm build
```
- [ ] Build erfolgreich (keine Errors)

### Schritt 2: Deploy auf Bolt
1. [ ] Bolt.new → "Deploy" Button
2. [ ] Wähle Domain: `ad-creative-system.bolt.new`
3. [ ] Environment Variables automatisch übernommen
4. [ ] Deploy starten
5. [ ] Warte auf Deployment (3-5 Minuten)

### Schritt 3: Custom Domain (Optional)
1. [ ] Bolt Settings → Domains
2. [ ] Add Domain: `app.finest-audience.de`
3. [ ] Kopiere DNS Records
4. [ ] Update DNS bei Domain-Provider
5. [ ] Warte auf DNS Propagation (10-60 Minuten)

### Schritt 4: SSL Certificate
- [ ] Bolt generiert automatisch Let's Encrypt Certificate
- [ ] Prüfe HTTPS funktioniert

---

## ✅ Final Checklist

### Funktionalität
- [ ] Dashboard lädt Kampagnen von Meta API
- [ ] Creative Generator funktioniert
- [ ] Creatives werden generiert und angezeigt
- [ ] Sales-Tracking funktioniert
- [ ] Lead-Korrekturen funktionieren
- [ ] Performance-Daten werden geladen
- [ ] Make.com Webhook funktioniert
- [ ] Download von Creatives funktioniert

### Performance
- [ ] Seite lädt in < 3 Sekunden
- [ ] Keine Console Errors
- [ ] Keine Network Errors
- [ ] Bilder laden schnell

### Security
- [ ] Alle Secrets in Environment Variables (nicht im Code)
- [ ] S3 Bucket hat korrekte Permissions
- [ ] Database hat SSL aktiviert
- [ ] JWT Secret ist sicher (32+ Zeichen)

### Production Ready
- [ ] Production Build funktioniert
- [ ] Deployment auf Bolt erfolgreich
- [ ] Custom Domain konfiguriert (optional)
- [ ] SSL Certificate aktiv
- [ ] Monitoring Setup (optional)

---

## 🎉 Migration Complete!

**Gratulation!** Dein Ad Creative System läuft jetzt auf Bolt.new.

**Nächste Schritte:**
1. Make.com Scenario konfigurieren
2. Eigene GPT-Prompts schreiben
3. System mit echten Kunden testen
4. Feedback sammeln und optimieren

---

**Support:** Bei Problemen siehe `00_MIGRATION_GUIDE.md` oder Bolt Discord
