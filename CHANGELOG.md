# Changelog - Dein Weg Alltagsplaner

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

## [0.1.0-beta.2] - 2026-09-06

### Hinzugefügt
- **Standard Dark Theme**: Vollständiges, modernes Dark Theme (`bg-slate-950`, Slate 900 Cards, Slate 800 Borders) standardmäßig für die gesamte Web-Applikation inklusive Login, Header, Navigation, Modulen und Modals.
- **Listenansicht im Rezeptekatalog**: Ansichtswechsel zwischen Kachel-/Rasteransicht (Grid) und kompakter Tabellen-/Listenansicht (List) mit Portions-, Zeit- und Zutatenübersicht.
- **1-Tages-Vorlauf für Abfallerinnerungen**:
  - Im Abfallkalender und auf dem Dashboard-Hub wird bei Terminen am Folgetag (`daysUntilNext === 1`) eine aktive Warnmeldung eingeblendet (*"⚠️ Morgen Abholung! Heute Abend rausstellen"*).
  - Bei Terminen am selben Tag (`daysUntilNext === 0`) wird *"🚨 Heute Abholung!"* signalisiert.

### Behoben
- **Portionsskalierer im Rezeptdetail**: Das Element `+ - [X] Personen` in `RecipeModal` bricht auf schmalen Displays nicht mehr um (`flex-nowrap`, `whitespace-nowrap`, flexible Breitenverteilung).

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
