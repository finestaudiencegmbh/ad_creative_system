# 📦 Bolt.new Migrations-Paket
## Ad Creative System - Vollständige Migration von Manus

---

## 🎯 Was ist das?

Dieses Paket enthält **alles** was du brauchst um dein Ad Creative System von Manus zu Bolt.new zu migrieren.

**Migrations-Zeit:** 30-45 Minuten  
**Schwierigkeit:** Mittel (SQL-Kenntnisse hilfreich)

---

## 📦 Paket-Inhalt

```
BOLT_MIGRATION/
├── README.md                      ← Diese Datei
├── 00_MIGRATION_GUIDE.md          ← Hauptanleitung (START HIER!)
├── 01_database_schema.sql         ← SQL Schema für Datenbank
├── 02_secrets_and_env.md          ← Alle Secrets & Environment Variables
├── 03_dependencies.json           ← NPM Dependencies
└── 04_bolt_setup_checklist.md     ← Schritt-für-Schritt Checklist

MAKE_SETUP_FINAL.md                ← Make.com Webhook Setup (für später)
```

---

## 🚀 Quick Start

### Schritt 1: Lies die Hauptanleitung
```bash
# Öffne diese Datei:
00_MIGRATION_GUIDE.md
```

### Schritt 2: Folge der Checklist
```bash
# Arbeite diese Datei ab:
04_bolt_setup_checklist.md
```

### Schritt 3: Konfiguriere Secrets
```bash
# Alle Secrets findest du hier:
02_secrets_and_env.md
```

---

## ⚠️ Wichtig VORHER lesen!

### Was wird migriert?
✅ Vollständiger Code (bereits in GitHub)  
✅ Datenbank-Schema (SQL)  
✅ Alle Funktionen & Features  
✅ Secrets & Configuration  

### Was muss NEU eingerichtet werden?
🔧 Datenbank (PlanetScale/Railway/Supabase)  
🔧 S3 Storage (AWS S3)  
🔧 OpenAI API (ersetzt Manus LLM)  
🔧 Environment Variables in Bolt  

### Was bleibt GLEICH?
✅ Meta Marketing API Integration  
✅ Bannerbear Text Overlays  
✅ Make.com Webhook System  
✅ Gemini AI Integration  
✅ Komplette UI & Features  

---

## 📋 Voraussetzungen

### Accounts die du brauchst:
- [ ] Bolt.new Account: https://bolt.new
- [ ] PlanetScale Account: https://planetscale.com (oder Railway/Supabase)
- [ ] AWS Account: https://aws.amazon.com (für S3)
- [ ] OpenAI Account: https://platform.openai.com

### Daten aus Manus:
- [ ] GitHub Repo URL
- [ ] Datenbank Connection Details (Management UI → Database → Settings)
- [ ] Alle Secrets (Management UI → Settings → Secrets)

### Tools die du brauchst:
- [ ] MySQL Client (DBeaver, TablePlus, oder CLI)
- [ ] Git (für GitHub)
- [ ] Terminal/Command Line

---

## 🎓 Migrations-Reihenfolge

### Phase 1: Vorbereitung (5 Min)
1. Accounts erstellen (Bolt, PlanetScale, AWS, OpenAI)
2. Daten aus Manus exportieren
3. GitHub Repo klonen

### Phase 2: Code Import (5 Min)
1. Projekt in Bolt importieren (GitHub oder ZIP)
2. Dependencies installieren

### Phase 3: Datenbank Setup (10 Min)
1. PlanetScale Datenbank erstellen
2. Schema importieren (`01_database_schema.sql`)
3. Daten importieren (Manus Backup)

### Phase 4: Secrets konfigurieren (10 Min)
1. Alle Secrets aus `02_secrets_and_env.md` in Bolt eintragen
2. OpenAI API Key hinzufügen
3. AWS S3 Credentials hinzufügen

### Phase 5: Code-Anpassungen (15 Min)
1. LLM Integration ersetzen (Manus → OpenAI)
2. Storage Integration ersetzen (Manus → S3)
3. Dependencies aktualisieren

### Phase 6: Testing (10 Min)
1. Dev Server starten
2. Alle APIs testen
3. Complete Flow testen

### Phase 7: Deployment (5 Min)
1. Production Build
2. Deploy auf Bolt
3. Custom Domain (optional)

---

## 🆘 Hilfe & Support

### Bei Problemen:
1. **Lies zuerst:** `00_MIGRATION_GUIDE.md` → Troubleshooting Section
2. **Prüfe:** `04_bolt_setup_checklist.md` → Alle Schritte abgehakt?
3. **Secrets:** `02_secrets_and_env.md` → Alle korrekt konfiguriert?

### Support-Kanäle:
- **Bolt Discord:** https://discord.gg/bolt
- **Bolt Docs:** https://docs.bolt.new
- **Meta API:** https://developers.facebook.com/support
- **Bannerbear:** https://www.bannerbear.com/support

---

## ✅ Erfolgs-Kriterien

Migration ist erfolgreich wenn:

1. ✅ Dev Server läuft ohne Errors
2. ✅ Dashboard zeigt echte Meta-Kampagnen
3. ✅ Creative Generator funktioniert
4. ✅ Creatives werden generiert und angezeigt
5. ✅ Sales-Tracking funktioniert
6. ✅ Performance-Daten werden geladen
7. ✅ Make.com Webhook funktioniert (nach Setup)
8. ✅ Alle Features aus Manus funktionieren

---

## 🎉 Nach erfolgreicher Migration

**Gratulation!** Dein System läuft jetzt auf Bolt.

**Nächste Schritte:**
1. Make.com Scenario konfigurieren (siehe `MAKE_SETUP_FINAL.md`)
2. Eigene GPT-Prompts schreiben
3. Bannerbear Templates optimieren
4. System mit echten Kunden testen

---

## 📞 Kontakt

**Bei Fragen zur Migration:**
- Email: jan@marketing-estate.de
- Finest Audience: https://finest-audience.com

---

**Viel Erfolg mit der Migration! 🚀**

**START HIER:** `00_MIGRATION_GUIDE.md`
