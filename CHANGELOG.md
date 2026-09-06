# Changelog - Dein Weg Alltagsplaner

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

## [0.1.0-beta.5] - 2026-09-06

### Behoben
- **Prisma Client Initialisierung im Docker Container**:
  - `docker-entrypoint.sh`: Führt `npx prisma generate` vor dem Start immer explizit aus, um sicherzustellen, dass `@prisma/client` auch bei bereits existierender Datenbank-Datei (`alltagsplaner.db`) vollständig initialisiert ist.
  - `docker-entrypoint.sh`: Flag `--skip-generate` beim Schema-Sync (`prisma db push`) entfernt.
  - `Dockerfile`: `prisma` und `tsx` direkt in `dependencies` überführt. Im Stage 2 Runner wird `npx prisma generate` bereits beim Docker-Image-Build ausgeführt.
  - Behebt den Fehler `@prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.`

## [0.1.0-beta.4] - 2026-09-06

### Behoben
- **CSS-Rendering im Docker-Build**:
  - `client/vite.config.ts` injiziert das `tailwindcss`-Plugin nun mit explizitem Pfad zu `tailwind.config.js`.
  - `client/tailwind.config.js` nutzt absolute Pfade zur Inhaltsauflösung (`index.html`, `src/`, `shared/`).
  - `Dockerfile` kopiert nun explizit alle `tailwind.config.js*` und `postcss.config.js*` Dateien in den Builder-Container.
  - Basispfad im Vite-Build auf absolute Domain-Auflösung (`base: '/'`) vereinheitlicht, um Asset-Ladefehler hinter Reverse Proxies und Cloudflare Tunnels zu eliminieren.

## [0.1.0-beta.3] - 2026-09-06

### Hinzugefügt
- **Ersteinrichtungs-Assistent (Setup Wizard)**:
  - Automatischer Start im Setup-Modus, sobald die Datenbank initial 0 Benutzer aufweist.
  - Pflichtangabe von Benutzername, vollem Namen, Firmen-E-Mail-Adresse und sicherem Passwort.
  - Prominenter Sicherheitshinweis bezüglich der zwingenden Verwendung der offiziellen Firmen-E-Mail-Adresse (z. B. `vorname.nachname@deinweg.de`).
  - Schutz vor Mehrfach-Initialisierung (Endpunkt wird nach dem ersten Benutzer dauerhaft mit Status 403 gesperrt).
- **Betreuer = Immer automatisch Admin**:
  - Jeder Betreuer (`BETREUER`) verfügt im RBAC-System und in der Benutzeroberfläche über alle Administrationsrechte (Standorte anlegen/löschen, Benutzer verwalten, Passwörter zurücksetzen, Mailserver konfigurieren, standortübergreifende Einsicht).
- **Sauberer Datenbank-Initialzustand (0 vorinstallierte Benutzer)**:
  - Vollständige Entfernung aller Test-Bewohner und Test-Accounts aus dem Seed.
  - Beibehaltung des Stammdatenkatalogs (Supermärkte Netto, Rewe, Aldi Nord, Lidl; 31 Zutaten mit Richtpreisen; 8 Basis-Rezepte).
- **E-Mail & SMTP-Server Konfiguration**:
  - Neuer Verwaltungs-Reiter „E-Mail / SMTP“ zur Konfiguration des eigenen Mailservers (Host, Port, SSL/TLS, Authentifizierung, Absender-E-Mail und Absender-Name).
  - Integrierte Funktion zum Testen der Mailserver-Verbindung und zum direkten Versand einer formatierten Test-E-Mail.
- **Standort-Management im Backend**:
  - Betreuer/Admins können direkt über die Oberfläche neue Standorte mit Name, Adresse, Standard-Portionen und Standard-Supermarkt anlegen.
  - Unbelegte Standorte (0 Bewohner) können sicher gelöscht werden.

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
