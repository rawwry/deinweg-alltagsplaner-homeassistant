# Dein Weg Alltagsplaner 🍽️📋

Modulare Fullstack-Web-Applikation für das ambulant betreute Wohnen, die den wöchentlichen Essens- und Einkaufsplanungsprozess digitalisiert und als **Home Assistant Add-on** betrieben werden kann.

---

## 🌟 Funktionen

- **Wöchentlicher Essensplaner (Mo–So)**:
  - Rezepte mit Zutaten, Zubereitungsschritten und Kategorien.
  - Automatische Portionsskalierung anhand der Bewohneranzahl des Standorts (z. B. 6 Portionen für Emsdetten).
  - Wählbare Köche pro Tag.
- **Konsolidierte Einkaufsliste**:
  - Automatische Mengen-Aggregation identischer Zutaten über die ganze Woche.
  - Gruppierung nach Supermarkt-Regalbereichen (Obst & Gemüse, Kühlung, Fleisch & Fisch, Vorrat etc.).
  - Interaktives Abhaken beim Einkaufen mit Fortschrittsbalken.
  - Hinzufügen individueller Sonderartikel (Kaffee, Toilettenpapier etc.).
- **Standortspezifische Preisschätzung**:
  - Richtpreise des hinterlegten Supermarkts (z. B. Netto Marken-Discount für Emsdetten, Rewe, Aldi Nord, Lidl).
  - Berechnung der Gesamtkosten für die Woche und Aufschlüsselung pro Tag.
- **Rollenbasierte Benutzerverwaltung & Multi-Standort**:
  - **Bewohner**: Haben ausschließlich Zugriff auf ihren eigenen Standort.
  - **Betreuer & Admin**: Standortübergreifender Zugriff mit schnellem Standortwechsler im Header.
  - Individueller Login mit Benutzername & Passwort („Eingeloggt bleiben“ Option).
- **Erweiterungs-Module**:
  - **Bewohner-Notizen**: Eigene To-Dos & Anliegen direkt an die zuständigen Betreuer des Standorts.
  - **Standort-Abfallkalender**: Visuelle Tonnen-Übersicht (Restmüll, Biomüll, Papier, Gelber Sack) mit nächstem Abfuhrtermin & Vorbereitung für ICS-Import.
- **Speicherung auf Home Assistant OS**:
  - SQLite-Datenbank unter `/share/deinweg-alltagsplaner/db/alltagsplaner.db`.
  - PDF-Exporte (spätere Ausbaustufe) unter `/share/deinweg-alltagsplaner/export`.

---

## 🚀 Betrieb als Home Assistant Add-on

Das Add-on lauscht auf **Port 4731**. Für den gesicherten Fernzugriff kann ein **Cloudflare Tunnel** vor Port 4731 geschaltet werden.

### Installation in Home Assistant
1. Füge dieses Repository unter **Einstellungen > Add-ons > Add-on Store > Repositories** hinzu:
   ```
   https://github.com/rawwry/Dein-Weg-Alltagsplaner
   ```
2. Wähle **Dein Weg Alltagsplaner** aus und klicke auf **Installieren**.
3. Starte das Add-on. Port 4731 ist im lokalen Netzwerk freigegeben.

---

## 💻 Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank migrieren und seeden
npm run db:setup

# 3. Entwicklungsmodus starten (Backend auf Port 4731, Frontend mit Vite)
npm run dev
```

---

## 📦 Semantic Versioning & Release

Versionen werden synchron in `package.json`, `config.yaml` und Quellcode geführt:
```bash
# Versionserhöhung (z.B. beta, patch, minor, major)
npm run version:bump -- 0.1.0-beta.2
```
Aktuelle Version: **v0.1.0-beta.1**
