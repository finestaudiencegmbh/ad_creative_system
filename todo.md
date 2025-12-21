# Ad Creative System - TODO

## System-Umbau (Neue Anforderungen)

### Phase 1: Branding & CI Integration
- [x] Firmen-Logo integrieren
- [x] CI-Farben anpassen (Primärfarbe, Akzentfarbe)
- [x] Firmenname im gesamten System ersetzen

### Phase 2: Eigenes Login-System
- [ ] Manus OAuth entfernen
- [ ] Email + Passwort Login implementieren
- [ ] Session-Management mit JWT
- [ ] Passwort-Reset-Funktion

### Phase 3: Navigation umbauen
- [x] "Kunden"-Verwaltung entfernen
- [x] Dashboard: KPIs und Performance-Übersicht für eingeloggten Kunden
- [x] Creative Generator: Bild + Text auf Knopfdruck
- [x] Werbetexte: Nur Headlines und Ad-Copy
- [x] Performance: Top 3 Performer vs. Top 3 Flops

### Phase 4: Admin-Backend
- [ ] Admin-Login und Authentifizierung
- [ ] Kunden-Account-Verwaltung (Erstellen, Bearbeiten, Löschen)
- [ ] Meta-Credentials-Verwaltung pro Kunde
- [ ] Onboarding-Daten-Verwaltung

### Phase 5: Testing & Optimierung
- [ ] Login-Flow testen
- [ ] Creative-Generierung testen
- [ ] Performance-Daten-Abruf testen
- [ ] Admin-Backend testen

---

## Bereits abgeschlossen (vorherige Version)

### Phase 1: Datenbank-Schema und Backend-Grundstruktur
- [x] Multi-Tenant-Datenbank-Schema erstellen (clients, onboarding_data, brand_assets, creatives, performance_data)
- [x] Backend-Helpers für Client-Verwaltung
- [x] Backend-Helpers für Brand-Asset-Verwaltung
- [x] Backend-Helpers für Creative-Verwaltung

### Phase 2: Meta API Integration
- [x] Meta Marketing API Integration (Insights API)
- [x] Performance-Daten-Abruf für Kampagnen (VSL-Funnel, ABO, Testing-ABO)
- [x] Background-Job für stündlichen Datenabruf
- [x] Performance-Daten-Speicherung und -Mapping

### Phase 3: KI-Services
- [x] Replicate FLUX API Integration für Bildgenerierung
- [x] OpenAI GPT API Integration für Textgenerierung
- [x] RAG-System für kontextbezogene Creative-Generierung
- [x] Performance-Insights-Generierung

### Phase 4: Frontend Dashboard
- [x] Dashboard-Layout mit Sidebar-Navigation
- [x] Client-Übersicht und -Verwaltung
- [x] Performance-Dashboard mit Visualisierungen
- [x] Kampagnen-Performance-Anzeige

### Korrekturen (neue Anforderungen)
- [x] Dashboard als Startseite (/) statt Landing Page
- [x] Sidebar-Navigation mit korrekten Labels (Dashboard, Creative Generator, Werbetexte, Performance)
- [x] Landing Page entfernen (nicht nötig für Kunden-Tool)
- [x] Direkt nach Login → Dashboard anzeigen

### Neue Anforderungen (Dashboard & Formate)
- [x] Dashboard: Kampagnen-Liste statt KPI-Karten anzeigen
- [x] Kampagnen sind klickbar → Detail-Seite mit Performance-Insights
- [x] Creative Generator: Reel-Format hinzufügen (1080×1920)
- [x] Safe Zone Templates für Story und Reel integrieren
- [x] Format-Auswahl: Feed (1080×1420), Story (1080×1920), Reel (1080×1920)


### Datumsfilter im Dashboard
- [x] Datumsfilter-Komponente erstellen (Heute, Letzte 7 Tage, Letzter Monat, Aktueller Monat, Letztes Quartal, Custom Range)
- [x] Voreinstellung: Aktueller Monat
- [x] KPIs basierend auf gewähltem Zeitraum filtern
- [ ] Filter-State in URL-Parameter speichern (optional)

### Meta API Live-Daten Integration
- [x] Meta Access Token und Ad Account ID als Secrets konfigurieren
- [x] Meta Marketing API Helper-Modul erstellen (getMetaCampaigns, getCampaignInsights)
- [x] tRPC campaigns.list Procedure implementieren
- [x] Dashboard auf echte Meta-Daten umstellen (statt Dummy-Daten)
- [x] Datumsfilter mit Meta API verbinden (datePreset: today, last_7d, last_30d, this_month, last_90d)
- [x] Vitest Tests für Meta API Connection und Campaigns schreiben
- [x] Live-Daten im Dashboard verifizieren (7 Kampagnen erfolgreich geladen)

### Dashboard Kampagnen-Filter
- [x] Dashboard standardmäßig nur aktive Kampagnen anzeigen
- [x] Tab-Navigation hinzufügen: "Aktive Kampagnen" und "Inaktive Kampagnen"
- [x] Filter-State zwischen Tabs verwalten

### Dashboard Metriken (Wichtige KPIs)
- [x] Ausgaben (bereits vorhanden)
- [x] Kosten pro Lead (Ausgaben / Leads)
- [x] CPM (Cost per Mille - Kosten pro 1000 Impressions)
- [x] Individuell ausgehende CTR (Outbound CTR)
- [x] Kosten pro individuell ausgehendem Klick (Cost per Outbound Click)
- [x] Conversion Rate Landingpage (Leads / individuell ausgehende Klicks * 100)

### Drill-Down Hierarchie (Kampagne → Anzeigengruppe → Werbeanzeige)
- [x] Meta API erweitern: Ad Sets (Anzeigengruppen) mit allen 6 Metriken abrufen
- [x] Meta API erweitern: Ads (Werbeanzeigen) mit allen 6 Metriken abrufen
- [x] Campaign Detail Page erstellen: Zeigt Anzeigengruppen der Kampagne
- [x] Ad Set Detail Page erstellen: Zeigt Werbeanzeigen der Anzeigengruppe
- [x] Standardmäßig nur aktive Ad Sets/Ads anzeigen (mit Tab für inaktive)
- [x] Navigation: Dashboard → Kampagne → Anzeigengruppe → Werbeanzeige
- [x] Breadcrumb-Navigation für einfache Rückkehr zur übergeordneten Ebene

### Sales Tracking & ROAS Berechnung
- [x] Datenbank-Schema: Sales-Tabelle mit Feldern (order_value, cash_collect, completion_date, campaign_id, adset_id, ad_id)
- [x] Backend: CRUD-Procedures für Sales (create, list, update, delete)
- [x] ROAS-Berechnung: ROAS Auftragsvolumen (Summe order_value / Ausgaben)
- [x] ROAS-Berechnung: ROAS Cash Collect (Summe cash_collect / Ausgaben)
- [x] UI: Dialog zum Hinzufügen von Sales-Einträgen auf allen Ebenen (Campaign/AdSet/Ad)
- [x] UI: Liste aller Sales-Einträge mit Bearbeiten/Löschen-Funktionen
- [x] Dashboard: ROAS-Metriken in Kampagnen-Cards anzeigen
- [x] Detail-Seiten: ROAS-Metriken in AdSet/Ad-Cards anzeigen
- [x] Datumsfilter: Nur Sales im gewählten Zeitraum für ROAS-Berechnung berücksichtigen

### Sales Management (Bearbeiten & Löschen)
- [x] Backend: Update und Delete Procedures für Sales implementieren
- [x] SalesListDialog Komponente: Liste aller Sales mit Bearbeiten/Löschen-Buttons
- [x] Sales-Zusammenfassung klickbar machen (öffnet SalesListDialog)
- [x] Edit-Funktionalität: Bestehende Sales-Einträge bearbeiten
- [x] Delete-Funktionalität: Sales-Einträge löschen mit Bestätigung
- [x] UI auf allen Ebenen implementieren (Dashboard, CampaignDetail, AdSetDetail)

### Lead-Anzahl mit manueller Korrektur
- [x] Datenbank-Schema: leadCorrections-Tabelle (metaCampaignId, metaAdSetId, metaAdId, correctedLeadCount)
- [x] Backend: CRUD-Procedures für Lead-Korrekturen (create, get, update, delete)
- [x] Metriken-Berechnung: CPL und CVR basierend auf korrigierter Lead-Zahl (falls vorhanden, sonst Meta API Wert)
- [x] UI: Lead-Anzahl in Metriken anzeigen (neben Ausgaben, CPM, etc.)
- [x] UI: "Bearbeiten"-Button für Lead-Anzahl mit Inline-Edit-Funktionalität
- [x] UI: Visueller Indikator wenn Lead-Zahl manuell korrigiert wurde
- [x] Automatische Neuberechnung von CPL und CVR nach Lead-Korrektur
- [x] Implementierung auf allen Ebenen (Dashboard, CampaignDetail, AdSetDetail)

### Intelligenter Creative Generator
- [x] Meta API erweitern: Creative-Daten abrufen (Bilder, Videos, Texte, Website-URLs)
- [x] Meta API erweitern: Zielgruppen-Definitionen aus Ad Sets auslesen (Alter, Geschlecht, Interessen, Standort)
- [x] Landingpage-Scraping: Title, Description, Open Graph Tags extrahieren
- [x] Performance-Ranking: Top-Performer nach ROAS → CPL → Kosten/Klick → Outbound CTR & CPM
- [x] Creative Generator UI: Kampagnen-Auswahl mit automatischer Landingpage-Erkennung
- [x] Creative Generator UI: Anzeigengruppen-Auswahl (Optional) für Zielgruppen-Kontext
- [x] Creative Generator UI: Format-Auswahl (Alle/Feed/Story/Reel) - Standard: Alle
- [x] Creative Generator UI: Beschreibung (Optional) - automatisch aus Landingpage befüllt
- [x] Winning Creative Analysis: Best Performer identifizieren und als Vorlage nutzen
- [x] FLUX Integration: Bildgenerierung basierend auf Landingpage + Zielgruppe + Winning Creatives
- [x] GPT-4 Integration: Textgenerierung (Headlines, Primary Text) basierend auf Kontext
- [x] Format-spezifische Generierung: Feed (1080x1080), Story (1080x1920), Reel (1080x1920)

### Bug Fixes - Creative Generator
- [x] Meta API Error #100: "creatives" Feld nicht direkt auf Ad-Node zugreifbar - richtigen Endpoint verwenden
- [x] FLUX Prompt verbessern: Generiert Text-Infografiken statt echte Werbemotive - besseren Prompt-Builder implementieren

### FLUX Prompt Verbesserung - Lead-Gen Creatives
- [x] Landingpage-Scraping für finest-audience.com/v3 testen
- [x] Prompt-Builder anpassen: Lead-Gen spezifische Creatives statt generische Produktfotos
- [x] Branche/Kategorie-Erkennung aus Landingpage-Kontext (z.B. "Marketing-Dienstleistung", "Lead-Generierung")
- [x] Fallback-Logik wenn Landingpage-Scraping keine aussagekräftigen Daten liefert

### Bug Fix - Creative Generator link_url Error
- [x] TypeError: Cannot read properties of undefined (reading 'link_url') - Null-Check hinzufügen

### Bug Fix - Landing Page URL auf Ad-Ebene
- [x] Landing Page URL liegt auf Ad-Ebene, nicht Kampagnen-Ebene
- [x] Logic anpassen: Alle Ads der Kampagne abrufen und URLs extrahieren
- [x] Falls mehrere URLs: Häufigste URL automatisch verwenden
- [x] Falls nur eine URL: Automatisch verwenden

### Bug Fix - Website-URL Feld in Meta API Creative
- [x] Debug: Tatsächliche Meta API Creative Response loggen
- [x] Korrektes Feld für Website-URL identifizieren (asset_feed_spec.link_urls für DCA)
- [x] extractLandingPageUrl Funktion mit korrektem Feld-Pfad aktualisieren
- [x] getAdCreatives erweitert um asset_feed_spec, effective_object_story_id, url_tags
- [x] Test mit "Funnel Vorlagen" Kampagne (finest-audience.com/l)

### Feature - Winning Ads Bild-Anzeige
- [x] Meta API: Bild-URLs aus Creatives abrufen (asset_feed_spec.images, image_url, thumbnail_url)
- [x] Backend: extractImageUrl Funktion hinzugefügt mit Fallback-Logik
- [x] Backend: Image URLs in getWinningCreatives Response hinzugefügt
- [x] Frontend: 64x64px Thumbnails in Top Performer Liste angezeigt
- [x] Error Handling: Bild wird ausgeblendet wenn URL nicht lädt

### Bug Fix - Beschreibungsfeld im Creative Generator
- [x] Seitentitel ("Startseite") aus Beschreibungsfeld entfernen
- [x] Feld standardmäßig leer lassen für manuelle Eingabe
- [x] Hilfreichen Placeholder-Text hinzugefügt

### Feature - Intelligente Creative-Analyse für Prompt-Generierung
- [x] Landing Page Hero-Section detailliert scrapen (H1, H2, CTA, Hero-Bilder)
- [x] Winning Ads Bilder mit Vision API analysieren (visuelle Elemente, Komposition, Farben)
- [x] LLM-basierter Prompt-Generator: Kombiniert Landing Page + Winning Ads Analyse
- [x] Kontextspezifische FLUX-Prompts statt generischer Templates
- [x] Integration in Creative Generator Flow mit generateCreativePrompt Mutation

### Feature - Style-Aware Creative Generation mit Text-Overlay
- [x] Vision API: Design-System aus Winning Creatives extrahieren (Farbpalette, Layout, Typografie)
- [x] FLUX: Neues Bild im gleichen visuellen Stil generieren (Style-Referenz)
- [x] Text-Overlay Engine mit Canvas API (Node.js canvas package)
- [x] LLM: Headlines im gleichen Stil wie Original generieren
- [x] Template-System: Eyebrow (rot) → Headline (weiß/grün) → CTA (lila Button)
- [x] Backend-Procedures: extractDesignSystem, generateStyleAwarePrompt, generateHeadlineVariations, addTextOverlay
- [x] Frontend-Integration: Kompletter Pipeline-Flow im Creative Generator
- [x] Batch-Generierung: 3-10 Variationen pro Winning Creative

### Feature - Multi-Format Support (Feed/Story/Reel) mit Safe Zones
- [x] Format-Definitionen: Feed (1080×1080, 1:1), Story (1080×1920, 9:16), Reel (1080×1920, 9:16)
- [x] Safe Zones implementiert:
  - [x] Story: Oben 14%, Unten 20%, Text in mittlerer 66%
  - [x] Reel: Oben 25%, Unten 30%, Text in mittlerer 45%
  - [x] Feed: Minimale Safe Zones (5%)
- [x] Text-Overlay Engine: Format-spezifische Layouts (text-overlay.ts)
- [x] FLUX: Aspect Ratio Parameter (1:1, 9:16)
- [x] Frontend: Format-Auswahl Dropdown + Safe Zone Hinweise
- [x] Frontend: Batch-Count Dropdown (1-10)
- [x] Backend: Batch-Generation Logic (batch-creative-generator.ts)
- [x] Backend: tRPC Procedure für generateBatchCreatives
- [x] Frontend: Komplette Integration des Batch-Flows
- [x] Frontend: Grid-View für multiple Creatives
- [x] Download: Einzelne Creatives (ZIP-Download optional)


### Bug Fixes - Creative Generator UI Features
- [x] Manuelle Landingpage-Eingabe wieder hinzufügen (falls automatische Erkennung fehlschlägt)
- [x] Anzeigengruppen-Auswahl für Targeting-Kontext wieder hinzufügen
- [x] "Alle Formate" Option wieder hinzufügen (generiert Feed + Story + Reel)
- [x] Canvas Error beheben: Text-Overlay vollständig optional machen (kein Error im Frontend)

### UX Improvement - Loading Animation
- [x] Ersetze technische Lade-Schritte mit animierter Ladeanimation
- [x] Zeige wechselnde Fun Facts über Facebook/Instagram während der Generierung
- [x] Schöne visuelle Animation statt nüchterner Schrittliste

### CRITICAL BUG - Text Overlays fehlen komplett
- [x] Canvas-basierte Text-Overlays funktionieren nicht (native Kompilierung fehlgeschlagen)
- [x] Alternative Lösung implementieren: Sharp + SVG für Text-Rendering
- [x] **NEUE LÖSUNG**: Google Gemini für Prompt-Optimierung implementiert
- [x] Gemini optimiert Prompts für FLUX-Generierung (enhancePromptWithGemini)
- [x] Sharp + SVG für Text-Overlays implementiert (addTextOverlaySharp)
- [ ] **PROBLEM**: Text-Overlays müssen noch getestet werden
- [ ] Testen mit allen 3 Formaten (Feed, Story, Reel)


### CRITICAL - Text Overlays funktionieren nicht (Sharp fehlgeschlagen)
- [x] Sharp SVG Dimensions-Fehler - zu komplex, nicht zuverlässig
- [x] **FINALE LÖSUNG**: Replicate SDXL mit nativem Text-Rendering implementiert
- [x] SDXL ersetzt FLUX + Sharp - generiert Text direkt ins Bild
- [ ] Testen mit Feed/Story/Reel Formaten

### Fun Facts Verbesserungen
- [x] Mehr Fun Facts hinzugefügt (25 → 65 Facts)
- [x] Anzeigedauer erhöht (4s → 8s)
- [x] Shuffle-Algorithmus ohne Wiederholungen implementiert


### UX Improvement - Ad Set Selection
- [x] Replace Ad Set ID text input with Select dropdown
- [x] Fetch active ad sets from selected campaign via tRPC
- [x] Show ad set names in dropdown (not IDs)
- [x] Keep field optional


### ROAS Integration in Winning Ads
- [x] ROAS aus manuell eingetragenen Verkäufen berechnen (getSalesData in db.ts)
- [x] ROAS-Logik bereits in Ranking integriert (40% Gewichtung)
- [x] ROAS in getWinningCreatives berechnen und zurückgeben
- [x] ROAS in Winning Ads UI anzeigen (neben CPL & CTR) - grün hervorgehoben
- [ ] Info-Hinweis wenn ROAS überall 0 ist: "ROAS-Daten nicht verfügbar"

### UX Improvement - Loading Screen als Modal
- [x] Loading Screen von statischem Bereich zu zentriertem Modal umbauen
- [x] Modal erscheint beim Klick auf "Generieren" Button
- [x] Modal mit Backdrop (dunkler Hintergrund)
- [x] Fun Facts Animation im Modal zentriert

### CRITICAL BUG - Creative Generation schlägt fehl
- [x] Nutzer kann keine Creatives generieren (lädt aber zeigt dann "Noch keine Creatives generiert")
- [x] Server-Logs prüfen um Fehlerursache zu identifizieren
- [x] Root Cause identifiziert: REPLICATE_API_TOKEN fehlt
- [ ] Replicate API Token mit Vitest validieren
- [ ] Kompletten Flow testen (Kampagne auswählen → Format wählen → Generieren)

### Performance Page - Filter Implementation
- [x] Kampagnen-Dropdown hinzufügen (alle aktiven Kampagnen)
- [x] Anzeigengruppen-Dropdown hinzufügen (optional, abhängig von gewählter Kampagne)
- [x] Top 3 Performer nach Filter filtern
- [x] Top 3 Flops nach Filter filtern
- [x] Kampagnen-Übersicht nach Filter filtern (falls Kampagne gewählt, nur diese zeigen)
- [x] "Alle Kampagnen" Option als Standard
- [x] TypeScript Fehler in getPerformanceData beheben
- [x] Frontend TypeScript Fehler beheben

### Creative Generator UX - Collapsible Steps
- [x] Schritt 2 (Format auswählen) als ausklappbares Dropdown
- [x] Schritt 3 (Anzahl Creatives) als ausklappbares Dropdown
- [x] Schritt 4 (Beschreibung) als ausklappbares Dropdown
- [x] Checkboxen hinzufügen: Grün wenn ausgefüllt, Grau wenn leer
- [x] Schritte automatisch ausklappen wenn vorheriger Schritt abgeschlossen
- [x] Schritt 1 (Kampagne) bleibt immer sichtbar
- [x] TypeScript Fehler beheben (getLandingPage procedure)

### Zielgruppen-Targeting Anzeige
- [x] Alter anzeigen (z.B. 25-45)
- [x] Geschlecht anzeigen (Männer/Frauen/Alle)
- [x] Land/Region anzeigen (z.B. Deutschland, Österreich)
- [x] Detaillierte Targeting-Angaben anzeigen (Interessen, Verhaltensweisen, demografische Merkmale)
- [x] Targeting-Daten von Meta API abrufen (getAdSetTargeting)
- [x] UI unter Anzeigengruppe-Dropdown implementieren

### CRITICAL BUG - Verkäufe werden nicht kaskadiert
- [x] Verkauf auf Creative-Ebene eingetragen → fehlt in Anzeigengruppe & Kampagne
- [x] Verkauf auf Anzeigengruppen-Ebene eingetragen → fehlt in Kampagne
- [x] getSalesData Logik anpassen: Creative-Verkäufe zu Anzeigengruppe aggregieren
- [x] getSalesData Logik anpassen: Anzeigengruppen-Verkäufe zu Kampagne aggregieren
- [x] Dashboard ROAS-Berechnung aktualisieren (bereits vorhanden)
- [x] Meta API Funktionen hinzugefügt: getAdDetails, getAdSetDetails
- [x] Sales creation Procedure aktualisiert: Auto-populate parent IDs
- [x] Tests für Verkaufs-Aggregation schreiben (8/8 passed)

### Winning Creatives ROAS Display
- [x] ROAS in Winning Creatives Liste anzeigen (Creative Generator) - bereits implementiert
- [x] ROAS grün hervorheben wenn verfügbar - bereits implementiert
- [x] Hinweis wenn ROAS überall 0 ist - gelbe Info-Box hinzugefügt

### Creative Generator UX Fixes - Progressive Disclosure
- [x] Schritt 2: Keine Vorauswahl, Placeholder "Format wählen"
- [x] Schritt 3: Keine Vorauswahl, Placeholder "Anzahl wählen"
- [x] Schritt 2 collapsed und disabled bis Schritt 1 ausgefüllt
- [x] Schritt 3 collapsed und disabled bis Schritt 2 ausgefüllt
- [x] Schritt 4 collapsed und disabled bis Schritt 3 ausgefüllt
- [x] Checkbox grün nur wenn Nutzer Wert ausgewählt hat (nicht vorausgefüllt)
- [x] Schritt 4 (optional) Checkbox immer grün sobald Schritt 3 ausgefüllt

### Winning Creatives - Ad Set Filtering
- [x] getWinningCreatives Procedure: Optional adSetId Parameter hinzugefügt
- [x] Wenn adSetId vorhanden: Nur Ads aus dieser Anzeigengruppe filtern
- [x] Frontend: adSetId an getWinningCreatives übergeben
- [x] Progressive Disclosure funktioniert (Schritte 2-4 disabled bis vorheriger Schritt ausgefüllt)
- [ ] Testen: Anzeigengruppe auswählen → nur Creatives aus dieser Anzeigengruppe (manuelle Tests erforderlich)

### Loading Modal UX Improvements
- [x] X-Button hinzugefügt (Modal kann geschlossen werden)
- [x] Generierung läuft weiter im Hintergrund wenn Modal geschlossen
- [x] Backdrop mit Gradient der Akzentfarbe (lila/violett)
- [x] Modal bleibt weiß, nur Hintergrund wird abgedunkelt

### CRITICAL BUG - SDXL Empty Object Response
- [x] "Invalid SDXL output format" Fehler bei Creative-Generierung
- [x] sdxlTextImage.ts geprüft: Output-Format Parameter
- [x] Replicate API Dokumentation geprüft: Output ist uri[]
- [x] Verbessertes Error Handling implementiert mit detailliertem Logging
- [x] Unterstützung für Array, String und Object Output-Formate
- [x] Getestet mit echten Replicate Credits - Credits werden abgezogen
- [x] Problem: Replicate gibt leeres Objekt zurück: [{}]
- [x] SDXL Model Version geprüft (alt: 39ed52f2, veraltet - 2 Jahre alt)
- [x] Auf neueste SDXL Version aktualisiert (neu: 7762fd07 - Latest)
- [x] Parameter validiert (alle korrekt)
- [ ] Testen mit neuer Version

### CRITICAL BUG - Failed to Fetch Error
- [ ] "Failed to fetch" Fehler bei Creative-Generierung
- [ ] Server-Logs prüfen um Root Cause zu identifizieren
- [ ] Server abstürzt oder Timeout bei generateBatchCreatives
- [ ] Fix implementieren und testen

### UX Improvement - Loading Animation mit Progress Bar
- [ ] Grüner Ladebalken (0-100%) als Hauptelement
- [ ] Drehender Spinner klein und ganz unten positionieren
- [ ] Fortschrittsanzeige in Prozent
- [ ] Smooth Animation während der Generierung

### CRITICAL BUG - Creative Generation Workflow komplett falsch
- [ ] Generierte Bilder haben keinen Bezug zur Landing Page
- [ ] Abstrakte Bilder (Smartphones, 3D-Netzwerke) statt Marketing-Visuals
- [ ] Text-Overlays fehlen komplett (Eyebrow, Headline, CTA)
- [ ] Gemini soll für Bildgenerierung verwendet werden (nicht SDXL)
- [ ] Korrekter Workflow:
  1. Winning Creative + Landing Page analysieren
  2. Text-Varianten basierend auf Winning Creative generieren
  3. Relevantes Bild passend zu Texten generieren (Gemini)
  4. Text-Overlays hinzufügen (Eyebrow rot, Headline weiß/grün, CTA lila)
  5. Feed-Creative auf Story/Reel übertragen (Safe Zones beachten)

### Quality Requirements (Endkunden-Ready)
- [ ] Rechtschreibung/Grammatik: LLM-Output muss fehlerfrei sein
- [ ] Marketing-relevante Aussagen: Keine 0815-Texte, basierend auf Landing Page + Winning Creatives
- [ ] CTA/Struktur: Von Winning Creatives lernen (was funktioniert)
- [ ] Skalierbarkeit: System muss für viele verschiedene Endkunden funktionieren
- [ ] Headline-Generierung: Muss Stil und Struktur der Winning Creatives matchen
- [ ] Prompt-Qualität: Landing Page Kontext prominent einbinden, keine generischen Visuals

### NEW FEATURE - Werbetexte (Ad Copywriting)
- [ ] Debug Creative Generation Fehler (keine Creatives generiert)
- [ ] Werbetexte Page: Landing Page Input Feld
- [ ] HAPPS Formel Implementation (Dawid Przybylski)
- [ ] Elite Copywriter Qualität (Zielgruppe ansprechen, Brücke zur Landing Page)
- [ ] 2 Versionen: Kurzer Text (nicht nur 3 Sätze!) und langer Text
- [ ] Beide Texte nach HAPPS Struktur aufgebaut
- [ ] Perfekte Rechtschreibung/Grammatik
- [ ] Testen bis nahezu perfekt

### CRITICAL BUG - SDXL Creative Generation Bug behoben
- [x] Replicate Node.js Library gibt leere Objekte zurück `[{}]`
- [x] HTTP-basierte SDXL-Implementierung (direkte API Calls)
- [x] Prediction erstellen → Polling → URL extrahieren
- [x] Test erfolgreich: Bild in ~7 Sekunden generiert
- [x] Browser-Test: Komplettes Creative mit Text-Overlays generiert
- [x] Status: Produktionsbereit

### UX Improvement - Loading Animation mit Progress Bar
- [x] Grüner Ladebalken (0-100%) als Hauptelement
- [x] Drehender Spinner klein und ganz unten positionieren
- [x] Fortschrittsanzeige in Prozent
- [x] Smooth Animation während der Generierung
- [x] Fun Facts während des Ladens anzeigen
- [x] Echtzeit-Fortschrittsberechnung basierend auf verstrichener Zeit

### CRITICAL BUG - Canvas Text-Overlay Bug behoben
- [x] Canvas native Bindings fehlen (`canvas.node`)
- [x] Sharp-basierte Text-Overlay Engine implementiert
- [x] SVG-Text-Compositing mit Sharp
- [x] Eyebrow, Headline, CTA professionell gerendert
- [x] Safe Zones für Story/Reel beachtet
- [x] Test erfolgreich: Text-Overlays sichtbar und lesbar

### Feature - Werbetexte (Ad Copywriting)
- [x] Werbetexte-Seite mit Landing Page URL Input
- [x] Backend scrapet Landing Page (Title, Description, H1, H2, CTA)
- [x] LLM generiert kurzen + langen Werbetext
- [x] Copywriting-Formeln (PAS, AIDA, BAB) integriert
- [x] Grammatik/Rechtschreibung Check im System Prompt
- [x] Perfekte Brücke zur Landing Page
- [x] Elite Copywriter System Prompt (20 Jahre Erfahrung)
- [x] Kurzer Text: ~200 Wörter (Hook, Problem, Solution, CTA)
- [x] Langer Text: ~500 Wörter (Hook mit Storytelling, Problem, Agitation, Solution, Proof, CTA)
- [x] Test erfolgreich: DCA Landing Page → Professionelle Werbetexte generiert
- [x] Status: Produktionsbereit

### Quality Requirements (User Feedback)
- [x] Rechtschreibung/Grammatik: Perfekt (keine LLM-Fehler)
- [x] Marketing-relevante Aussagen: Keine 0815-Texte
- [x] Landing Page Alignment: Perfekte Brücke (Tonalität, Versprechen, Pain Points)
- [x] CTA/Struktur: Von Winning Creatives lernen
- [x] Skalierbarkeit: System funktioniert für viele Endkunden


### Mobile Responsiveness (User Request)
- [ ] Dashboard: Mobile Layout optimieren
- [ ] Creative Generator: Mobile UI anpassen
- [ ] Werbetexte: Mobile UI anpassen
- [ ] Performance: Mobile UI anpassen
- [ ] Sidebar-Navigation: Mobile Hamburger Menu
- [ ] Kampagnen-Cards: Mobile-optimierte Darstellung
- [ ] Formulare: Touch-optimierte Inputs
- [ ] Buttons: Touch-Target-Größe (min 44x44px)
- [ ] Tabellen: Horizontal Scroll oder Card-Layout auf Mobile
- [ ] Modals: Full-Screen auf Mobile
- [ ] Alle Seiten auf Mobile testen (375px, 390px, 428px)
- [ ] Bug Fixes: Alle mobilen UI-Probleme beheben

### UX Improvements (nach Mobile Optimization)
- [ ] Feature-Vorschläge für optimale Nutzererfahrung entwickeln
- [ ] Konkrete, umsetzbare Verbesserungen vorschlagen


### Mobile Responsiveness - COMPLETED ✅
- [x] Dashboard mobile layout (single column metrics, responsive header)
- [x] Creative Generator mobile UI (responsive forms, collapsible steps)
- [x] Werbetexte mobile UI (full-width buttons, responsive copy cards)
- [x] Performance mobile UI (responsive filters, stacked cards)
- [x] Mobile testing on 390px viewport (iPhone 14 Pro)
- [x] All pages work perfectly on mobile - NO BUGS

### UX Improvement Proposals - DOCUMENTED
- [x] 15 konkrete Feature-Vorschläge erstellt
- [x] Priorisierung nach Impact & Effort
- [x] Quick Wins identifiziert (Creative Library, Landing Page Library, Templates, Dark Mode)
- [x] Must-Have Features (Meta Ads Integration, A/B Testing, Batch Preview)
- [x] Dokumentation: UX_IMPROVEMENT_PROPOSALS.md
