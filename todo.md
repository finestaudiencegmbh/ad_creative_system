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
