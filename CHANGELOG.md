# Changelog - Dein Weg Alltagsplaner

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

## [0.1.0-beta.1] - 2026-09-06

### Hinzugefügt
- **Initialer Release v0.1.0-beta.1** als eigenständige Fullstack-Web-Applikation und Home Assistant Add-on auf Port 4731.
- **Rollen- & Standortverwaltung (RBAC)**:
  - Rollen `ADMIN`, `BETREUER` und `BEWOHNER` mit strikter Standort-Datenisolation.
  - Individueller Login mit Benutzername, Passwort und Option „Eingeloggt bleiben“.
- **Initiales Seeding**:
  - Standort Emsdetten (Standard-Supermarkt: Netto Marken-Discount) mit den Bewohnern Kevin, Dennis, Godfirst, Arne, Ertugrul und Udo.
  - Vorbereitete Standorte Steinfurt (Rewe) und Rheine (Aldi Nord).
  - Vorbefüllte Rezepte, Netto-Richtpreise und ein initialer Wochenplan.
- **Essens- & Einkaufsplaner (Foodplanner)**:
  - Wöchentlicher Essensplaner für Montag bis Sonntag mit Rezeptauswahl.
  - Automatische Portionsskalierung basierend auf der Bewohneranzahl des Standorts (z. B. 6 Portionen für Emsdetten).
  - Konsolidierte Einkaufsliste: Aggregation gleicher Zutaten, Sortierung nach Supermarkt-Kategorien und interaktives Abhaken.
  - Standortspezifische Preisschätzung für den Wocheneinkauf.
- **Erweiterungs-Module**:
  - Bewohner-Notizen & To-Dos an Betreuer mit Statusanzeige.
  - Standort-Abfallkalender mit farbigen Tonnen und Vorbereitung für ICS-Kalenderimport.
- **Home Assistant OS Integration**:
  - Persistente SQLite-Ablage unter `/share/deinweg-alltagsplaner/db/alltagsplaner.db`.
  - Vorbereitung für PDF-Exporte unter `/share/deinweg-alltagsplaner/export`.
  - Automatische Verzeichniserstellung beim Start.
