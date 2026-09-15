# Changelog - Deine WG: Alltagsplaner

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

## [0.1.0-beta.20] - 2026-09-16

### Hinzugefügt & Verbessert
- **Umbenennung „WG-Pinnwand“ zu „Flurfunk“**:
  - Der Bereich „WG-Pinnwand“ heißt nun durchgängig **„Flurfunk“** (Desktop-Navigation, mobile Navigationsleiste, Dashboard-Bento-Widgets, Schnellzugriff und Detailansicht).
  - Frischere, lebendige WG-Sprache („Flurfunk & Mitteilungen“, „Alles ruhig im Flurfunk“, „Neuen Beitrag verfassen“).
- **Wochenplan-Redesign (Desktop & Mobile)**:
  - **Desktop**: Großformatige, ansprechende 16:9-Rezeptbilder (`aspect-video`) anstelle kleiner quadratischer Vorschauen.
  - **Identische Breiten**: Die Felder „Portionen“, „Koch:“ und der Aktionsbutton („Gericht ändern“ bzw. „+ Gericht wählen“) sind nun in einer aufgeräumten Spalte untereinander mit pixelgenau identischer Breite angeordnet. Das verschafft den Rezeptkarten und Bildern maximalen Freiraum.
  - **Mobile-Optimierung**: Moderne Rezept-Kartenhierarchie auf Mobilgeräten mit vollflächigem 16:9-Coverbild oben, großem Titel und Zubereitungszeit, aufgeräumtem 2-Spalten-Raster für Portionen und Koch sowie einem großzügigen, daumenfreundlichen Aktionsbutton über die volle Kartenbreite.
  - **Orientierung**: Automatische Hervorhebung des heutigen Wochentags mit einem „Heute“-Badge.
  - **Rezeptauswahl**: Das Modal zur Gerichtauswahl zeigt nun ebenfalls Rezept-Vorschaubilder direkt in der Liste an.
- **Lightbox-Spalt oben am Menü behoben**:
  - Sämtliche Dialoge und Modals (`RecipeModal`, `RecipeSelectModal`, `UserProfileModal`, `ChangelogModal` und `RecipeAddModal`) werden nun per React `createPortal` direkt im `document.body` mit `z-[100]` gerendert.
  - Dadurch werden jegliche Stacking-Context-Traps und Layout-Clipping-Effekte durch übergeordnete Container verhindert: Die abdunkelnde Lightbox überdeckt nun zu 100% den gesamten Viewport inklusive des oberen Menübalkens ohne Spalt.
  - Integrierter Body-Scroll-Lock verhindert das Scrollen des Hintergrunds und Verschieben der Menüs bei geöffneter Lightbox.
  - Klick auf den Hintergrund schließt die Lightbox komfortabel.
- **Code-Qualitätsverbesserungen**:
  - Root `tsconfig.json` um Excludes für Client und Dist erweitert, um JSX-Konflikte im Stammverzeichnis zu beheben.
  - Ungültige Tailwind-Klasse `h-18` im Header durch `h-16 sm:h-20` ersetzt.
  - Rechte- und Portionsübergabe für das globale Rezept-Modal in `App.tsx` vervollständigt.

## [0.1.0-beta.19] - 2026-09-15

### Hinzugefügt & Verbessert
- **Mobile Fußzeile vollständig ausgeblendet**:
  - Auf Smartphones (< 640px) wird die Fußzeile nun vollständig ausgeblendet (`hidden sm:block`), um wertvollen Platz zu sparen und kein Sichtfeld zu verdecken.
- **Header-Entlastung & Standortanzeige für Bewohner mobil entfernt**:
  - Bewohner-Accounts sehen auf Mobilgeräten keine Standort-Badge mehr.
  - Der obere Menübalken wurde entschlackt: Der Logout-Button wurde aus der oberen Navigation entfernt und befindet sich nun sauber im Profil-Menü und in den Einstellungen, wodurch auf Smartphones keinerlei Icons mehr überlappen.
  - Der Standortwähler für Betreuer ist auf kleinen Bildschirmen kompakt und überlappungsfrei dimensioniert.
- **Bewohner-Profil & Selbstverwaltungs-Menü**:
  - Klick auf das eigene Profilbild im Header öffnet ein maßgeschneidertes Einstellungsmenü (`UserProfileModal`).
  - Bewohner können selbstständig ihren Namen, ihre E-Mail-Adresse, ihr Passwort, ihren Geburtstag (mit TT.MM.JJJJ-Anzeige) sowie ihr Profilbild (inkl. 256x256-Zuschnitt und Komprimierung) ändern.
  - Bewohner können ihr persönliches Farbschema direkt im Profil-Menü wählen.
  - Dedizierter Abmelde-Button (Logout) im Profil-Menü und im Admin-Bereich.
- **Reaktives Farbschema (Theming-Fix)**:
  - Vollständige Anbindung der CSS-Variablen `--theme-primary`, `--theme-from`, `--theme-to` und `--theme-subtle` an Tailwind und UI-Klassen (`btn-theme-gradient`, `badge-theme`, `active-nav-theme`, `border-theme`).
  - Ein Klick auf ein Farbschema (Magenta, Amber, Emerald, Ocean, Violett) schaltet nun alle Aktionsbuttons, Badges, Menüleisten und Akzente sofort live im gesamten Interface um.
- **Seitenleiste standardmäßig eingeklappt**:
  - Die Hauptnavigationsleiste startet nun auf Desktop-Geräten standardmäßig eingeklappt (`deinewg_sidebar_collapsed = true`).
- **Rezept-Bilder im Rezepte-Katalog**:
  - Im Rezepte-Katalog werden hinterlegte Rezepte mit einem ansprechenden 16:9-Cover-Bild (Grid-View) bzw. einer 64x64-Miniatur (List-View) dargestellt.
  - Beim Anlegen oder Bearbeiten eines Rezepts kann direkt ein Foto ausgewählt (mit automatischer Client-Kompression) oder eine URL angegeben werden.
  - Im Rezept-Detail-Modal (`RecipeModal`) wird das Gericht mit einem großzügigen Hero-Header präsentiert.
- **Wochenplan: Mehr Abstand zwischen Rezeptname und Detailtext**:
  - Die täglichen Gerichtkarten im Wochenplan besitzen nun großzügigen vertikalen Raum zwischen Titel, Detailbeschreibung und Metadaten.
  - Bei Rezepten mit Bild wird im Wochenplan zusätzlich ein ansprechendes Thumbnail angezeigt.

## [0.1.0-beta.18] - 2026-09-15

### Hinzugefügt & Behoben
- **App-Umbenennung zu „Deine WG: Alltagsplaner“**:
  - Web-Applikation, Home Assistant Add-on (`config.yaml`), HTML-Titel und Metadaten offiziell auf **„Deine WG: Alltagsplaner“** aktualisiert.
- **Apple Touch Icon & Android Homescreen PWA Support**:
  - Neues offizielles App-Icon als `apple-touch-icon.png` (180x180) für iOS-Homescreens implementiert.
  - Vollständiges Web App Manifest (`manifest.json`) mit hochauflösenden Icons (`icon-192.png`, `icon-512.png`) für Android-Geräte („Zum Startbildschirm hinzufügen“ / Standalone-Modus).
- **Home Assistant Add-on Icon**:
  - Bereitstellung des neuen Icons als hochauflösendes `icon.png` (512x512) im Hauptverzeichnis für die Kacheldarstellung im Home Assistant Add-on Store.
- **Bugfix Einkaufskorb-Vorschau im Dashboard**:
  - Behoben: Im Dashboard-Bento „Einkaufskorb“ wurden zuvor fälschlicherweise nur `(g)` oder `(stück)` ohne Artikelnamen angezeigt, da die Eigenschaften `name` und `totalAmount` der aggregierten Liste nicht angesprochen wurden. Artikelname, Menge und Preis werden nun einwandfrei dargestellt.

## [0.1.0-beta.17] - 2026-09-15

### Hinzugefügt & Verbessert
- **Non-Sticky Footer im natürlichen Scrollbereich**:
  - Die Fußzeile ist nicht mehr dauerhaft im Viewport fixiert/gepinnt. Sie befindet sich nun barrierearm und unaufdringlich am Ende des Seiteninhalts mit optimalem Abstand zur mobilen Navigationsleiste.
- **Farbschema-Wahl als eigener Unterpunkt in den Einstellungen**:
  - Der Farbswitch-Button im oberen Header wurde entfernt.
  - In der Verwaltung (`Verwaltung -> Erscheinungsbild`) steht nun ein übersichtlicher, dedizierter Bereich mit interaktiven Themen-Karten bereit.
  - Dynamische CSS-Klassen (`bg-theme-primary`, `bg-theme-gradient`, `text-theme`, `border-theme`) sorgen für eine saubere, reaktive Einfärbung aller UI-Komponenten.
- **Authentische SVG-Mülltonnen (WasteWheelieBin)**:
  - Bunte Kacheln mit Emojis (♻️, 🍂, 📦, 🗑️) wurden durch maßgefertigte, gestochen scharfe Vektor-Mülltonnen mit Deckelgriff, konischem Korpus, Verstärkungsrippen und Rädern ersetzt.
  - Exakte Farbgebung nach deutschen Entsorgungsstandards (Gelbe Tonne/Sack, Biotonne, Papiertonne, Restmülltonne) sowohl im Dashboard-Abfall-Radar als auch in der Timeline des Abfallkalenders.
- **Persönliche Begrüßung im Dashboard**:
  - Die frühere unpersönliche Frage („Was steht heute im Alltag an?“) wurde durch eine herzliche, persönliche Begrüßung mit dem Vornamen des Nutzers („Hallo {Vorname}, schön dass du da bist!“) und tageszeitlicher Einleitung ersetzt.
- **Durchgängiges deutsches Datumsformat (TT.MM.JJJJ)**:
  - Zentrale Formatierungs-Utilities (`formatGermanDate`, `formatGermanDateTime`) garantieren auf allen Seiten und in allen Modulen das strikte deutsche Format `TT.MM.JJJJ` (z. B. `15.09.2026`).
- **Kompakte WG-Schnellzugriff Bento-Dock**:
  - Die fünf übermäßig großen Kacheln am Seitenende wurden durch eine schlanke, harmonisch gestaltete Bento-Docking-Leiste ersetzt, die den Fluss des Designs wahrt und wertvollen Platz spart.
- **Eigenes Profilbild / Avatar-Upload**:
  - Jeder Benutzer kann jetzt über einen Klick auf das Profil-Icon im Header oder in der Benutzerverwaltung ein persönliches Foto hochladen.
  - Automatische Client-seitige Zentrierung, quadratischer Zuschnitt (256x256) und WebP/JPEG-Kompression zur schnellen Übertragung und Speicherung in der SQLite-Datenbank.
- **Strikte 2-Gruppen-Rollen („Bewohner“ und „Betreuer“)**:
  - Vollständige Bereinigung verwirrender Bezeichnungen wie „Betreuer & admin“: In der gesamten Anwendung gibt es strikt nur noch zwei Benutzergruppen: „Bewohner“ und „Betreuer“.

## [0.1.0-beta.16] - 2026-09-08

### Hinzugefügt & Verbessert
- **Dein Weg Magenta & Pink Farbschema**:
  - Vollständige Neuorientierung der Marken- und Highlight-Farben am offiziellen Dein-Weg-Logo: Warme Rose-, Pink- und Magenta-Akzente (`#e11d48`, `#f43f5e`, `#ec4899`, `#fda4af`) ersetzen die bisherigen gelb-bernsteinfarbenen Töne.
  - Subtile, atmosphärische Magenta-Lichthöfe im Hintergrund und farbharmonische Verläufe auf Buttons, Kacheln und Markern.
- **Multi-Theme Farbkonzept (5 auswählbare Themes)**:
  - Integration eines universellen `ThemeProvider` und `useTheme`-Hooks mit direkter `localStorage`-Persistenz.
  - Schnellauswahl über ein Palette-Icon im oberen Header sowie interaktive Themen-Karten im Administrationsbereich (`Verwaltung -> System`).
  - Fünf sorgfältig abgestimmte Themes:
    1. **Dein Weg Magenta**: Originalgetreues Pink, Rose & Magenta passend zum Markenlogo (Standard).
    2. **Modern Amber**: Warmes Gold- und Bernsteindesign.
    3. **Emerald Fresh**: Vitales Wald- und Smaragdgrün.
    4. **Ocean Blue**: Klares, beruhigendes Azur- und Ozeanblau.
    5. **Deep Violet**: Kreatives Amethyst- und Violettdesign.
- **Verfeinerte, elegante Typografie**:
  - Reduzierung der übermäßig gewichtigen Schriftstärken (Outfit `font-black`/`font-extrabold`) zugunsten einer ausgewogenen, schlanken und modernen Typografie mit *Plus Jakarta Sans* (`font-semibold` / `font-medium` mit dezentem Buchstabenabstand `-0.015em`).
  - Erstklassige visuelle Balance zwischen Leichtigkeit, Ästhetik und Barrierearmut.
- **Erhalt funktionaler Abfalltonnen-Farben**:
  - Die bundesweit standardisierten Tonnenfarben (Gelber Sack, Biotonne, Restmüll, Papiertonne) bleiben im Abfallkalender zur kognitiven Orientierung der Bewohner erhalten, während das UI-Interface sich dynamisch dem Theme anpasst.

## [0.1.0-beta.15] - 2026-09-07

### Geändert & Verbessert
- **Radikales UI-Redesign: „Warm Modern Living & Cozy Bistro Bento“**:
  - **Neues Design-Fundament**: Das generische Schiefergrau (`slate-950`/`border-slate-800`) wurde durch eine warme, einladende Dämmerungs-Atmosphäre (`#0c0b10`) mit sanften bernsteinfarbenen Ambient-Lichthöfen und haptischen Oberflächen-Tokens (`surface-card`, `surface-elevated`, `surface-border`) ersetzt.
  - **Premium-Typografie**: Integration von Google Fonts *Outfit* für prägnante Headlines und Kachel-Titel sowie *Plus Jakarta Sans* für erstklassige Lesbarkeit von Mengentexten und Zutatenlisten.
  - **Asymmetrisches Bento Grid (Dashboard)**:
    - **Bistro Hero Spotlight**: Großformatige Speisenkarte mit aktuellem Gericht, Rezept-Tags (Zubereitungszeit, vegetarisch, vegan), Chefkoch-Zuweisung und Portionsangabe.
    - **Visueller Abfall-Radar**: Farbcodierte Tonnen-Squircles (Gelb ♻️, Bio-Grün 🍂, Papier-Blau 📦, Rest-Anthrazit 🗑️) mit Hervorhebung der nächsten Abfuhr und Countdown.
    - **Echtzeit-Einkaufskorb**: Übersicht der noch offenen Einkäufe mit Supermarkt-Kostenschätzung.
    - **WG-Pinnwand**: Echte Post-It-Notizen aus der WG mit Betreuer-Antworten.
    - **Haptische Bento-Kacheln**: Schnellzugriffe mit dezentem Schwebungs-Effekt und bernsteinfarbenen Hover-Lichthöfen.
  - **Einheitliche Überarbeitung aller Ansichten**:
    - Wochenplan mit tagesgenauer Kochanzeige, Portionsregler und Rezeptauswahl-Modal.
    - Rezeptkatalog mit Suchleiste, Kategorien-Filtern, Portionsskalierer und Detail-Bento-Karten.
    - Einkaufsliste mit Fortschrittsbalken, Kostenschätzung und Schnelleintragsleiste.
    - Abfallkalender mit 1-Tages-Vorlauf-Banner und chronologischer Abfuhrleiste.
    - Betreuernotizen und Administrationsbereich im abgestimmten Warm-Living-Look.

## [0.1.0-beta.14] - 2026-09-07

### Geändert & Verbessert
- **Originales High-Res Logo integriert & Login-Animation**:
  - Das hochauflösende Original-Markenlogo (1024x261 PNG) wurde direkt als primäre Bildressource eingebunden (`logo.png`).
  - Auf dem Login-Screen präsentiert sich das Logo in einer ausgewogenen, gut lesbaren Größe (`h-16 sm:h-20`, bis max. 280px Breite) mit weichem Ambient-Lichthof und sanfter Schwebung (`animate-float`).
  - Volle Schärfe durch hochauflösendes Ausgangsmaterial – keine Pixelierung und keine künstliche Nachbildung.

## [0.1.0-beta.13] - 2026-09-07

### Geändert & Verbessert
- **Gestochen scharfes Vektor-SVG-Logo & perfekte Proportionen**:
  - Vollständige Umstellung aller Logo-Vorkommen (`LoginView`, `Header`, Ladeanzeige, Favicon) von einer niedrig aufgelösten Rastergrafik auf eine native, unendlich scharfe Vektor-SVG-Grafik (`logo.svg`).
  - Das Logo auf der Anmeldeseite wurde auf eine ausgewogene, elegante Höhe skaliert (`h-14` bis `h-16`, ca. 56–64px) – gestochen scharf auf allen Bildschirmauflösungen (Retina, 4K, Mobile) und nie mehr verpixelt oder überdimensioniert.
- **Permanenter Footer in der Web-App**:
  - Die Web-Applikation nutzt nun ein echtes Full-Height-Viewport-Layout (`h-screen h-[100dvh] flex flex-col overflow-hidden`).
  - Der Footer bleibt dauerhaft und zuverlässig am unteren Rand eingeblendet, während die WG-Inhalte im Hauptbereich eigenständig scrollen.
  - Nahtlose, überlappungsfreie Anordnung mit der mobilen Navigationsleiste.
- **Zentrierte minimalistische Highlight-Karten mit dezenten Animationen**:
  - Neugestaltung der drei zentralen Dashboard-Boxen („Heute auf dem Tisch“, „Einkaufsliste“, „Nächste Abfuhr“) im modernen, zentrierten Design.
  - Veraltete Emoji-Icons wurden durch zentrierte, minimalistische Vektor-Icons (`UtensilsCrossed`, `ShoppingBag`, `Trash2`) in edlen, farblich akzentuierten Squircles mit weichem Glüheffekt ersetzt.
  - Dezente Mikro-Animationen: Sanfte Neigung, Hebung und Schwebung bei Maus-Hover.
  - Vollkommen symmetrische Ausrichtung, zentrierte Kategorien-Pills, einheitliche Höhen und harmonisch bündige Aktions-Buttons.
  - Die Schnellstart-Kacheln für die WG-Bereiche wurden mit klaren Lucide-Icons vereinheitlicht.

## [0.1.0-beta.12] - 2026-09-07

### Geändert & Verbessert
- **Login-Screen Redesign & Logo-Animation**:
  - Das Dein Weg Logo auf der Login-Seite wurde deutlich vergrößert (`h-28` bis `h-32`) und schwebt mit einer sanften, eleganten Float-Animation (`@keyframes float`).
  - Ein weicher, pulsierender Ambient-Lichthof hinter dem Logo verleiht dem Markenauftritt eine edle Ausstrahlung.
  - Die Textuntertitel („Dein Weg Alltagsplaner Alltags- & Essensplanung im betreuten Wohnen“) wurden entfernt – das Logo steht nun pur und wirkungsvoll im Zentrum.
  - Die Anmeldekarte wurde als modernes Frosted-Glass-Element mit tiefem Schatten, abgerundeten Ecken und Farbverlaufs-Button umgestaltet.
- **Globales UI & Tiefenwirkung**:
  - Globaler, sanfter Radial-Farbverlauf auf dem Seitenhintergrund für organische Tiefe und ein hochwertiges Ambiente.
  - Das Dashboard präsentiert sich im modernen Glassmorphism-Look mit ambientem Begrüßungs-Banner, farblich akzentuierten Highlight-Karten und lebendigen Kacheln für die WG-Bereiche.
  - Die Desktop-Navigation verfügt über einen strahlenden aktiven Indikator und feiner abgestimmte Hover-Zustände.

## [0.1.0-beta.11] - 2026-09-07

### Geändert & Verbessert
- **Header vergrößert & Logo-Fokus**:
  - Die obere Menüleiste wurde auf `h-20` (80px) vergrößert, sodass das Dein Weg Markenlogo deutlich größer, prominenter und hochwertiger zur Geltung kommt (`h-12` bis `h-14`).
  - Der überflüssige Textzusatz „Dein Weg Alltagsplaner Ambulant betreutes wohnen“ neben dem Logo wurde entfernt.
- **Zahnrad-Icon für Verwaltung**:
  - Die Schaltfläche zur Administration im Header oben rechts wurde durch ein modernes, dezentes Zahnrad-Icon (`Settings`) ersetzt (mit animiertem Hover- und Aktiv-Effekt).
- **Benennungen & Konsistenz**:
  - Auf dem Dashboard wurde der Eintrag „Heute Selbstversorgung / Frei“ präzisiert auf **„Heute Selbstversorgung“**.
  - Der Begriff **„Müllkalender“** wurde in der gesamten Web-Applikation einheitlich in **„Abfallkalender“** umbenannt (Desktop-Navigation, Dashboard-Button, Kachel-Schnellzugriff, Ansichten-Überschrift und mobile Bottom-Navigation).
- **Interaktiver In-App Changelog**:
  - Im Footer wurde ein neuer Direktlink zu **„Changelog“** ergänzt (auch per Klick auf das Versions-Badge `v0.1.0-beta.11` erreichbar).
  - Ein interaktives, modales Dialogfenster zeigt nun alle Releases und deren wichtigste Änderungen transparent und ansprechend strukturiert an.

## [0.1.0-beta.10] - 2026-09-06

### Geändert & Verbessert
- **Offizielles Dein Weg Logo integriert**:
  - Das hochgeladene, offizielle Markenlogo wurde in die Anwendung integriert (`Header`, `LoginView`, Ladeanzeige und Favicon).
  - SVG-Platzhalter wurden durch die saubere, hochauflösende Markenidentität ersetzt.
- **Verwaltung im Header oben rechts**:
  - Für Administratoren und Betreuer wurde die Schaltfläche „Verwaltung“ aus der Sidebar in den oberen Header direkt neben die Abmelden-Schaltfläche verlegt.
  - Dadurch ist die Administration auf allen Bildschirmgrößen konsistent und blitzschnell erreichbar.
- **Sidebar-Optimierung & Emojis bereinigt**:
  - Die nachgestellten Emojis hinter den Menüeinträgen wurden entfernt – die sauberen Lucide-Icons auf der linken Seite bieten klare und fokussierte Orientierung.
  - Die Seitenleiste startet auf Desktop-Geräten standardmäßig eingeklappt (`collapsed`), wodurch der Fokus voll auf den Inhalten liegt.
  - Die untere Infobox in der Seitenleiste trägt nun den Text „Taktische Skill-Issue-Prävention“.
- **Müllkalender & Footer Texte**:
  - Das Herz-Emoji bei der „Biotonne“ im Dashboard-Schnellüberblick wurde entfernt.
  - Der Text unten rechts im Footer wurde durch „fcknzs“ ersetzt.

## [0.1.0-beta.9] - 2026-09-06

### Hinzugefügt
- **Einklappbare Seitenleiste (Collapsible Sidebar)**:
  - Die linke Navigationsleiste auf Desktop-Geräten lässt sich ab sofort über einen Toggle-Button (`PanelLeftClose` / `PanelLeftOpen`) bequem einklappen und ausklappen.
  - Im eingeklappten Zustand schrumpft die Sidebar auf eine schlanke Icon-Leiste (`w-20`) mit zentrierten Icons, Tooltips und unaufdringlichen Benachrichtigungs-Punkten.
  - Der Zustand (eingeklappt/ausgeklappt) wird automatisch im `localStorage` gespeichert und bleibt über Besuche hinweg erhalten.
- **Neuer moderner App-Footer**:
  - Am Seitenende wurde ein dedizierter, eleganter Footer integriert mit der Zeile:
    `© 2026 Dein Weg Planner Tool v0.1.0-beta.9 · timovorwald.de · Alle Rechte vorbehalten.` inklusive Direktlink zu `timovorwald.de`.
  - Die früheren Versionshinweise wurden aus der Sidebar in diesen zentralen Footer überführt.
- **Verspieltes, modernes Design & Klienten-freundliche Sprache**:
  - Sämtliche bürokratische oder zu förmliche Begriffe wie „konsolidiert“ oder „Ticketsystem“ wurden durch herzliche, verständliche Sprache ersetzt:
    - „Konsolidierte Einkaufsliste“ -> „Gemeinsame Einkaufsliste 🛒“
    - „{count} Zutaten konsolidiert“ -> „{count} Sachen auf unserer Liste 🛒“
    - „Kalkulierte Gesamtkosten“ -> „Geschätzter Betrag an der Kasse 💳“
    - „Ticketsystem & Betreuernotizen“ -> „WG-Pinnwand & Mitteilungen 📌 💬“
    - „Modulare Alltagsbausteine“ -> „Schnellzugriff auf unsere WG-Bereiche 🎨“
    - „Standort-Abfallkalender“ -> „Unser WG-Müllkalender 🚛 ♻️“
  - Bunte, anschauliche Grafiken, Illustrationen und thematische Emojis (u. a. für Lebensmittel-Kategorien wie 🥦 Obst & Gemüse, 🧀 Milch & Käse, 🥩 Fleisch, 🥖 Backwaren, 🍝 Pasta & Nudeln) zur Steigerung der Übersichtlichkeit und Barrierefreiheit.
  - Freundliche Willkommens-Grüße, lebendige Farbverläufe und weiche Animationen.

## [0.1.0-beta.8] - 2026-09-06

### Hinzugefügt
- **Wochenplan Kalenderwochen-Button**:
  - Der mittlere Navigations-Button zwischen den Vor- und Zurück-Pfeilen zeigt nun die jeweils aktive Kalenderwoche an (`KW XX`) anstelle des statischen Texts „Heute“.
  - Ein Klick auf den Button springt weiterhin zuverlässig zur aktuellen Kalenderwoche zurück; die aktuelle Kalenderwoche wird dezent optisch hervorgehoben.
- **Konfigurierbare Kochtage pro Standort (Plan-Umfang)**:
  - Jeder Standort kann nun individuell konfigurieren, an welchen und wie vielen Wochentagen gemeinsam gekocht wird (z. B. Mo–Do = 4 Tage für Standort Emsdetten).
  - Wochentag-Pill-Auswahl (Mo, Di, Mi, Do, Fr, Sa, So) und Schnellfilter-Presets („Mo - So“, „Mo - Fr“, „Mo - Do“) beim Anlegen und Bearbeiten von Standorten.
  - Standort-Bearbeitungs-Modal („Pencil“-Button) direkt auf den Standort-Karten in der Verwaltung.
  - Direktzugriff auf Kochtage & Standardportionen („Plan-Tage“) über einen Einstellungs-Button im Header des Wochenplans für Betreuer/Admins.
  - Inaktive Wochentage werden im Wochenplan als „🍽️ Selbstversorgung“ (individuelle Verpflegung) dargestellt mit der Option, bei Bedarf Ausnahmen einzutragen.
  - Umschalter zwischen „Nur geplante Kochtage anzeigen“ und „Alle 7 Tage anzeigen (inkl. Selbstversorgung)“.
- **Vollständige Selbstverwaltung des Lebensmittel- und Richtpreiskatalogs**:
  - In „Verwaltung“ -> „Preise“ können Administratoren/Betreuer eigene Lebensmittel und Richtpreise pro Supermarkt erfassen, bearbeiten und löschen (inkl. Filtereingabe).
  - Neuer Button „Katalog leeren“ mit Bestätigungsdialog zum vollständigen Bereinigen aller bestehenden Zutaten und Preise.
  - Backend-Endpunkte für Zutat-Bearbeitung (`PUT /api/food/ingredients/:id`), Löschen (`DELETE /api/food/ingredients/:id`) und Katalog-Leeren (`POST /api/food/ingredients/clear-all`).

### Geändert
- **Bereinigter Startbestand**:
  - Der Initial-Seed (`seed.ts`) enthält ab sofort 0 vordefinierte Lebensmittel und Richtpreise, sodass der Katalog vollständig nach eigenen Vorgaben gepflegt werden kann.

## [0.1.0-beta.7] - 2026-09-06

### Hinzugefügt
- **Bewohner-Standort-Zuweisung im Verwaltungsbereich**:
  - In „Verwaltung“ -> „Standorte“ können Betreuer nun beliebige Standorte auswählen und die dort wohnenden Bewohner direkt per Checkbox-Liste und Suchfunktion zuweisen.
  - Neuer Backend-Endpunkt `PUT /api/core/locations/:id/residents` zur atomaren Aktualisierung der Bewohner eines Standorts.
  - Anzeige der aktuell zugewiesenen Bewohner direkt auf den Standort-Karten inklusive farbiger Namens-Badges.
  - Standort-Schnellzugriffsleiste am oberen Rand der Standorte-Verwaltung.
  - Standort-Wechsel-Dropdown direkt im Zuweisungs-Modal für unterbrechungsfreies Verwalten mehrerer Standorte.
  - Direkte Standort-Auswahlmöglichkeit für Bewohner auch in der Benutzertabelle (`PUT /api/core/users/:id`).
  - Löschfunktion für Benutzeraccounts mit Schutz vor Selbst-Löschung (`DELETE /api/core/users/:id`).

### Geändert
- **E-Mail-Feld bei Benutzeranlage**:
  - Die Angabe einer E-Mail-Adresse ist bei der Neuanlage von Bewohnern ab sofort explizit optional.
  - Der Hinweis `(Firmenadresse für Betreuer)` wurde vollständig entfernt.

## [0.1.0-beta.6] - 2026-09-06

### Hinzugefügt
- **Ticketsystem für Betreuernotizen & Anliegen**:
  - Trennung in Reiter „Aktive Anliegen“ und „Archiv (Gelöst)“.
  - Bewohner und Betreuer können strukturierte Tickets verfassen (Dringlichkeit, Betreff, Details).
  - Betreuer/Admins können direkt auf Tickets antworten (`caregiverResponse`), wodurch die Antwort prominent im Ticket für den Bewohner angezeigt wird.
  - „Als gelöst markieren & archivieren“-Workflow für Betreuer mit Zeitstempel und Bearbeiter-Zuordnung.
  - Wiedereröffnungsfunktion für archivierte Tickets im Archiv.
  - Live-Badge in Desktop- und Mobile-Navigation mit Anzeige der Anzahl offener, ungelöster Tickets für Betreuer.
- **Löschfunktion für Rezepte**:
  - Betreuer und Administratoren können Rezepte direkt aus der Kachelansicht, Listenansicht und dem Rezeptdetail-Modal löschen.
  - Integrierte Sicherheitsabfrage vor dem Löschen.
  - Sichere Datenbank-Kaskadierung (Zutaten-Zuordnungen werden bereinigt, Verweise in vergangenen Essensplänen werden ohne Datenverlust auf null gesetzt).
- **Automatischer JWT-Sicherheitsschlüssel**:
  - Falls in der Konfiguration kein individueller `jwt_secret` gesetzt ist oder der Platzhalter verwendet wird, generiert das System beim Start automatisch einen kryptografisch sicheren 64-Zeichen Hex-Key und speichert diesen persistent ab (`STORAGE_DIR/jwt.secret`). Dadurch sind Tokens auch ohne manuelles Eingreifen vor externem Zugriff geschützt.

### Geändert
- **Dashboard Highlight-Cards Redesign**:
  - Die drei Boxen „Heute auf dem Tisch“, „Einkaufsliste“ und „Nächste Tonne“ wurden harmonisiert.
  - Einheitliche Mindesthöhen, strukturierte Inhaltsbereiche und perfekte horizontale Ausrichtung der Aktions-Buttons am unteren Kartenrand (`mt-auto`).
- **Sidebar-Footer**:
  - Text „Dein Weg • Ambulant Betreut“ ersetzt durch `© 2026 timovorwald.de`.
- **Rechte im Abfallkalender**:
  - Bewohner können im Abfallkalender keine Termine mehr anlegen oder ICS-Dateien importieren. Die entsprechenden Buttons und Dialoge stehen exklusiv Betreuern und Administratoren zur Verfügung.
- **Bereinigter Startbestand**:
  - Vordefinierte Beispielrezepte wurden aus dem Initial-Seed entfernt, sodass Neuinstallationen mit einem leeren Rezeptekatalog starten (Supermärkte und Zutatenpreise bleiben erhalten).

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
