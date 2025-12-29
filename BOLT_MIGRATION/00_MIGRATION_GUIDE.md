# 🚀 Bolt.new Migration Guide
## Ad Creative System - Vollständige Migration von Manus zu Bolt

---

## 📋 Übersicht

Dieses Paket enthält **alles** was du brauchst um das Ad Creative System 1:1 von Manus zu Bolt zu migrieren:

1. ✅ Vollständiger Source Code (bereits in GitHub)
2. ✅ Datenbank-Schema (SQL)
3. ✅ Secrets & Environment Variables
4. ✅ Dependencies & Configuration
5. ✅ Schritt-für-Schritt Anleitung

**Geschätzte Migrations-Zeit:** 30-45 Minuten

---

## 📦 Migrations-Paket Inhalt

```
BOLT_MIGRATION/
├── 00_MIGRATION_GUIDE.md          ← Diese Datei
├── 01_database_schema.sql         ← SQL Schema für Datenbank
├── 02_secrets_and_env.md          ← Alle Secrets & Env Variables
├── 03_dependencies.json           ← NPM Dependencies Liste
└── 04_bolt_setup_checklist.md     ← Bolt-spezifische Setup-Schritte
```

---

## 🎯 Migrations-Schritte

### Phase 1: Code Import (5 Minuten)

#### Option A: GitHub Import (Empfohlen)
1. Dein Code ist bereits in GitHub synchronisiert
2. Gehe zu Bolt.new
3. Klicke auf **"Import from GitHub"**
4. Wähle dein Repository
5. Bolt importiert automatisch alle Files

#### Option B: Manueller Upload
1. Download Code von GitHub
2. Zippe das Projekt-Verzeichnis
3. Bolt.new → **"Upload Project"**
4. Wähle ZIP-Datei

**Wichtige Files:**
```
ad_creative_system/
├── client/                 ← React Frontend
├── server/                 ← tRPC Backend
├── drizzle/               ← Database Schema
├── package.json           ← Dependencies
├── tsconfig.json          ← TypeScript Config
├── vite.config.ts         ← Vite Config
└── drizzle.config.ts      ← Database Config
```

---

### Phase 2: Datenbank Setup (10 Minuten)

#### Schritt 1: Datenbank erstellen

**Option A: PlanetScale (Empfohlen)**
```bash
# 1. Gehe zu https://planetscale.com
# 2. Erstelle neue Datenbank: "ad-creative-system"
# 3. Kopiere Connection String
```

**Option B: Railway**
```bash
# 1. Gehe zu https://railway.app
# 2. New Project → Provision MySQL
# 3. Kopiere Connection String
```

**Option C: Supabase**
```bash
# 1. Gehe zu https://supabase.com
# 2. New Project → Database
# 3. Kopiere Connection String
```

#### Schritt 2: Manus Datenbank exportieren

1. Gehe zu **Manus Management UI → Database**
2. Klicke auf **Settings** (bottom-left)
3. Kopiere Connection Details:
   - Host
   - Port
   - Username
   - Password
   - Database Name

4. Verbinde mit SQL-Client (z.B. DBeaver, TablePlus):
```bash
mysql -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] [DATABASE] > manus_backup.sql
```

#### Schritt 3: Schema in Bolt-Datenbank importieren

```bash
# 1. Importiere Schema
mysql -h [BOLT_HOST] -u [BOLT_USER] -p[BOLT_PASSWORD] [BOLT_DATABASE] < 01_database_schema.sql

# 2. Importiere Daten (falls vorhanden)
mysql -h [BOLT_HOST] -u [BOLT_USER] -p[BOLT_PASSWORD] [BOLT_DATABASE] < manus_backup.sql
```

**Oder mit Drizzle Kit:**
```bash
# 1. Update DATABASE_URL in .env
DATABASE_URL="mysql://user:pass@host:port/database"

# 2. Push Schema
pnpm drizzle-kit push
```

---

### Phase 3: Secrets konfigurieren (10 Minuten)

Kopiere alle Secrets aus `02_secrets_and_env.md` in Bolt Environment Variables:

#### Bolt.new → Settings → Environment Variables

```bash
# Database
DATABASE_URL="mysql://..."

# Meta API
META_ACCESS_TOKEN="EAAG..."
META_AD_ACCOUNT_ID="act_24911648491777694"

# Bannerbear
BANNERBEAR_API_KEY="bb_pr_..."
BANNERBEAR_TEMPLATE_FEED="8BK3vWZJ78zE5Jzk1a"
BANNERBEAR_TEMPLATE_STORY="wXmzGBDakW7rZLN7gj"
BANNERBEAR_TEMPLATE_REEL="A37YJe5q03XBZmpvWK"

# Gemini AI
GEMINI_API_KEY="AIza..."

# Make.com
MAKE_WEBHOOK_URL="https://hook.eu2.make.com/xxxxx"

# JWT
JWT_SECRET="random-32-char-string"

# OpenAI (ersetzt Manus LLM)
OPENAI_API_KEY="sk-..."

# S3 (ersetzt Manus Storage)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="..."
```

**Wichtig:** Siehe `02_secrets_and_env.md` für Details zu jedem Secret!

---

### Phase 4: Code-Anpassungen für Bolt (15 Minuten)

#### Anpassung 1: LLM Integration ersetzen

**Datei:** `server/_core/llm.ts`

**Vorher (Manus):**
```typescript
import { invokeLLM } from "./server/_core/llm";
const response = await invokeLLM({ messages: [...] });
```

**Nachher (Bolt):**
```typescript
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [...]
});
```

#### Anpassung 2: Storage Integration ersetzen

**Datei:** `server/storage.ts`

**Vorher (Manus):**
```typescript
import { storagePut } from "./server/storage";
const { url } = await storagePut(key, buffer, "image/png");
```

**Nachher (Bolt):**
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

#### Anpassung 3: Auth System ersetzen (Optional)

**Datei:** `server/_core/auth.ts`

**Option A: Eigenes JWT-System**
```typescript
import jwt from "jsonwebtoken";
const token = jwt.sign({ userId }, process.env.JWT_SECRET);
```

**Option B: NextAuth.js**
```bash
pnpm add next-auth
```

**Option C: Clerk**
```bash
pnpm add @clerk/nextjs
```

#### Anpassung 4: Dependencies installieren

```bash
# Entferne Manus-spezifische Dependencies
pnpm remove @manus/...

# Füge Bolt-kompatible Replacements hinzu
pnpm add openai @aws-sdk/client-s3 jsonwebtoken
```

---

### Phase 5: Testing (10 Minuten)

#### Test 1: Dev Server starten
```bash
pnpm install
pnpm dev
```

**Erwartetes Ergebnis:** Server läuft auf `http://localhost:3000`

#### Test 2: Datenbank-Verbindung
```bash
pnpm drizzle-kit studio
```

**Erwartetes Ergebnis:** Drizzle Studio öffnet sich, alle Tabellen sichtbar

#### Test 3: Meta API Connection
```bash
# Test in Browser Console oder Postman
curl -X GET "https://graph.facebook.com/v18.0/act_24911648491777694/campaigns?access_token=YOUR_TOKEN"
```

**Erwartetes Ergebnis:** JSON mit Kampagnen-Liste

#### Test 4: Bannerbear API
```bash
curl -X GET "https://api.bannerbear.com/v2/templates" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Erwartetes Ergebnis:** JSON mit Template-Liste

#### Test 5: Complete Flow
1. Login → Dashboard
2. Wähle Kampagne
3. Klicke "Creative Generator"
4. Generiere Test-Creative
5. Prüfe ob Creative angezeigt wird

---

## 🔧 Bekannte Probleme & Lösungen

### Problem 1: "DATABASE_URL not configured"
**Lösung:** Prüfe ob `DATABASE_URL` in `.env` korrekt gesetzt ist

### Problem 2: "Meta API Error: Invalid OAuth access token"
**Lösung:** 
- Token ist abgelaufen → Neuen Token generieren
- Token hat falsche Permissions → Business Manager Permissions prüfen

### Problem 3: "Bannerbear template not found"
**Lösung:** 
- Template IDs in `.env` prüfen
- Templates in Bannerbear Dashboard konfigurieren (siehe `MAKE_SETUP_FINAL.md`)

### Problem 4: "Make.com webhook not reachable"
**Lösung:**
- Make.com Scenario muss aktiv sein
- Webhook-URL in `.env` prüfen
- Scenario History in Make.com prüfen

### Problem 5: "S3 upload failed"
**Lösung:**
- AWS Credentials prüfen
- Bucket Permissions prüfen (Public Read Access)
- CORS Configuration prüfen

---

## 📊 Migrations-Checkliste

### Vor der Migration
- [ ] GitHub Repo geklont/geforkt
- [ ] Manus Datenbank-Backup erstellt
- [ ] Alle Secrets aus Manus kopiert
- [ ] Bolt.new Account erstellt

### Während der Migration
- [ ] Code in Bolt importiert
- [ ] Datenbank erstellt (PlanetScale/Railway/Supabase)
- [ ] Schema importiert (`01_database_schema.sql`)
- [ ] Daten importiert (Manus Backup)
- [ ] Alle Secrets in Bolt konfiguriert
- [ ] LLM Integration ersetzt (OpenAI)
- [ ] Storage Integration ersetzt (S3)
- [ ] Dependencies installiert

### Nach der Migration
- [ ] Dev Server läuft
- [ ] Datenbank-Verbindung funktioniert
- [ ] Meta API Connection funktioniert
- [ ] Bannerbear API funktioniert
- [ ] Gemini API funktioniert
- [ ] Make.com Webhook funktioniert
- [ ] Complete Flow getestet (Login → Creative Generation)
- [ ] Production Build erstellt (`pnpm build`)
- [ ] Deployment auf Bolt.new

---

## 🚀 Deployment auf Bolt

Nach erfolgreicher Migration:

1. **Build erstellen:**
```bash
pnpm build
```

2. **Deployment:**
- Bolt.new → **"Deploy"** Button
- Wähle Domain
- Konfiguriere Environment Variables
- Deploy!

3. **Custom Domain (Optional):**
- Bolt Settings → Domains
- Füge Custom Domain hinzu
- Update DNS Records

---

## 📞 Support & Hilfe

### Manus → Bolt Migration Support
- Bolt Discord: https://discord.gg/bolt
- Bolt Docs: https://docs.bolt.new

### API-spezifischer Support
- Meta API: https://developers.facebook.com/support
- Bannerbear: https://www.bannerbear.com/support
- Gemini: https://ai.google.dev/support
- Make.com: https://www.make.com/en/help

### Datenbank Support
- PlanetScale: https://planetscale.com/docs
- Railway: https://docs.railway.app
- Supabase: https://supabase.com/docs

---

## ✅ Erfolgs-Kriterien

Migration ist erfolgreich wenn:

1. ✅ Dev Server läuft ohne Errors
2. ✅ Dashboard zeigt echte Meta-Kampagnen
3. ✅ Creative Generator funktioniert
4. ✅ Creatives werden generiert und angezeigt
5. ✅ Sales-Tracking funktioniert
6. ✅ Performance-Daten werden geladen
7. ✅ Make.com Webhook funktioniert
8. ✅ Alle Features aus Manus funktionieren in Bolt

---

## 🎉 Nach erfolgreicher Migration

**Gratulation!** Dein Ad Creative System läuft jetzt auf Bolt.

**Nächste Schritte:**
1. Make.com Scenario konfigurieren (siehe `MAKE_SETUP_FINAL.md`)
2. Eigene GPT-Prompts schreiben
3. Bannerbear Templates optimieren
4. System mit echten Kunden testen
5. Feedback sammeln und iterieren

---

**Viel Erfolg! 🚀**
