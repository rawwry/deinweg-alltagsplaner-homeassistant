# Changelog - Deine WG: Alltagsplaner

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

## [0.1.0-beta.36] - 2026-09-17

### Hinzugefügt & Verbessert
- **UI & Bento-Karten Überarbeitung (`DashboardHub`)**:
  - **Reine Outline-SVG Icons statt Emojis**: Alle Bento-Pills und Aufgaben-Karten nutzen nun konsistent moderne Outline-SVGs (`UtensilsCrossed`, `Wallet`, `Trash2`, `MessageSquare`, `ClipboardList` etc.). Bisherige Emojis (`🍳`, `🗑️`, `💬`) wurden vollständig abgelöst.
  - **Neues Wallet-Icon**: Die unschöne Geldnote im Wochenbudget-Widget wurde durch ein elegantes Outline-`Wallet`-Icon ersetzt.
  - **Mitteilungskarten & Ausblenden**: Der Pfeil nach rechts (`ArrowRight`) wurde entfernt. Die Ausblend-Schaltfläche nutzt nun das intuitive Auge-durchgestrichen-Icon (`EyeOff`).
  - **Bento 1 („Heute frisch auf den Tisch“)**: Zusätze *„Gemeinsames Abendessen“* und *„⭐ WG-Favorit“* sowie das Hintergrund-Emoji entfernt. Chefkoch- und Portionsanzeige wurden sauber in den Kartenkörper integriert; Aktionsbutton auf volle Breite gesetzt.
  - **Bento 4 („Flurfunk und Mitteilungen“)**: Pille umbenannt in *„Flurfunk und Mitteilungen“*, *„WG-Pinnwand“* entfernt, Notiz-Vorschaukarten sind direkt anklickbar und springen mit Fokus in den Flurfunk.
  - **Betreuer-Aufgabenansicht**: Der überflüssige Hilfetext *„Wöchentliche Einteilung und Zuweisungen für alle Wochentage“* wurde entfernt.
  - **Umbenennung Kochtraining**: Chefkoch-Aufgaben heißen nun einheitlich *„Kochtraining: [Gericht]“* mit der Beschreibung *„Du bist heute für die Zubereitung des Gemeinschaftsessens zuständig.“*
- **Aufgabenplan Desktop-Layout & Zeilenumbruch behoben (`ChorePlannerView`)**:
  - **Behebung der gequetschten Aufgabenbeschreibungen**: Die horizontale Kollision in den Aufgabenkarten wurde behoben. Aufgabenkarten sind nun in 3 saubere Ebenen strukturiert (Oben: Icon + Titel + Abhaken oben rechts; Mitte: 100% vollbreite Beschreibung ohne Umbruchprobleme; Unten: Bewohner-Zuweisung).
  - **Outline-SVGs im Aufgabenplan**: Sämtliche Aufgabenkarten nutzen modulare Outline-SVGs (`getChoreOutlineIcon`) anstelle von Emojis.
  - **Kochtraining**: Einheitliche Bezeichnung *„Kochtraining: [Gericht]“* und Beschreibung.
- **Flurfunk & Ankündigungen (`CaregiverNotesView` & Server-Routen)**:
  - **Permanente Ankündigungen immer oben**: Wichtige Ankündigungen (`ANKUENDIGUNG`) werden serverseitig und clientseitig immer an oberster Stelle priorisiert.
  - **Status-Badge bereinigt**: Der irreführende *„Offen“*-Badge wird bei permanenten Ankündigungen nicht mehr angezeigt.
  - **Deep-Linking vom Dashboard**: Beim Anklicken einer Mitteilung oder Ankündigung auf der Startseite springt der Flurfunk automatisch zu dem Eintrag, klappt ihn aus und scrollt ihn sanft ins Sichtfeld.

## [0.1.0-beta.35] - 2026-09-17

### Hinzugefügt & Verbessert
- **Optische Überarbeitung der Flurfunk-Mitteilungshinweise auf der Startseite (`DashboardHub`)**:
  - **Reine SVG-Icons statt 3D-/Farb-Blobs**: Die massiven, bunten Hintergrundkreise und Emojis wurden entfernt. Stattdessen werden elegante, schlanke SVG-Icons (`AlertCircle`, `Lightbulb`, `Mail`, `MessageSquare`) passend zur Kategorie akzentuiert dargestellt.
  - **Ausrufezeichen statt Megafon**: Bei Ankündigungen ersetzt das klare SVG-Ausrufezeichen (`AlertCircle`) das alte Lautsprecher-/Megafon-Symbol.
  - **Einheitliche Zeilenaufteilung & Absender**: Der Absender (*„von [Name]“*) steht nun immer konsistent und umbruchsicher (`whitespace-nowrap`) in der zweiten Zeile unter der Kategorie-Pille mit vergrößertem vertikalem Abstand zum Titel.
  - **Gänsefüßchen entfernt**: Alle überflüssigen Anführungszeichen (`„` und `“`) in Überschriften und Textauszügen wurden restlos entfernt.
  - **Mitteilungen ausblenden**:
    - Neue Schließen-Schaltfläche (`X`) an jeder Notiz-Karte (außer Ankündigungen) zum direkten Ausblenden vom Dashboard.
    - Beim Anklicken/Öffnen einer Mitteilung wird diese automatisch vom Home-Dashboard ausgeblendet.
    - **Ankündigungsschutz**: Wichtige Ankündigungen (`ANKUENDIGUNG`) können nicht ausgeblendet werden und bleiben bis zum Fristende bzw. zur Löschung durch Betreuer stets präsent.
- **Flurfunk-Farbkodierung synchronisiert (`CaregiverNotesView` & `DashboardHub`)**:
  - Kategorie-Farben und SVG-Icons wurden einheitlich im gesamten Flurfunk und in den Dashboard-Vorschaukacheln (Bento 4) angewendet:
    - Ankündigung: Rose / Rot mit `AlertCircle`-Icon.
    - Hinweis: Amber / Gelb mit `Lightbulb`-Icon.
    - Mitteilung: Sky / Blau mit `MessageSquare`-Icon.
- **Überschrift „Deine heutigen Aufgaben“ (`DashboardHub`)**:
  - In der Aufgaben-Kachel auf der Startseite wurde *„Was heute ansteht“* in das präzisere *„Deine heutigen Aufgaben“* geändert.
- **Einkaufskorb Budget-Widget Redesign (`DashboardHub`)**:
  - Die störende Hintergrundbox hinter dem Geldschein-Icon im Wochenbudget-Widget wurde entfernt; das SVG-Icon (`Banknote`) fügt sich nun sauber und reduziert in das Gesamtlayout ein.

## [0.1.0-beta.34] - 2026-09-17

### Hinzugefügt & Verbessert
- **Umbenennung „Wochenplan“ zu „Kochplan“ (`DesktopNav`, `BottomNav`, `DashboardHub`, `MealPlanView`, `ShoppingListView`)**:
  - Sämtliche Beschriftungen und Navigationselemente rund um die Essensplanung wurden von „Wochenplan“ in „Kochplan“ umbenannt.
  - Neues Koch-Icon (`ChefHat`) in Desktop- und mobiler Navigation sowie in Schnellzugriffen und Kopfzeilen.
- **Chefkoch-Aufgabe für Bewohner (`DashboardHub` & `ChorePlannerView`)**:
  - Sobald ein Bewohner an einem Tag im Kochplan als Chefkoch eingeteilt ist (`cookUserId`), erscheint diese Kochaufgabe automatisch unter „Deine Aufgaben“ auf dem Home-Dashboard sowie im Aufgabenplan.
  - Die Aufgabe ist für den Chefkoch mit Titel des Gerichts, Beschreibung und Koch-Icon versehen.
- **Persönliches Abhaken für Bewohner im Aufgabenplan & Dashboard (`ChorePlannerView` & `DashboardHub`)**:
  - Bewohner können ihre zugewiesenen Aufgaben zur eigenen Orientierung persönlich abhaken.
  - Dieser Erledigt-Status wird rein lokal pro Bewohner (`localStorage`) gespeichert und ist für andere Bewohner und Betreuer unsichtbar; es werden keine störenden Statusmeldungen an Betreuer ausgelöst.
  - Für Bewohner ist im Aufgabenplan standardmäßig der Filter *„Nur meine Aufgaben“* aktiv.
- **Mobile Bottom-Navigation Optimierung (`BottomNav`)**:
  - Neuer **Home-Button** ganz links mit direktem Zugriff auf das Dashboard (`hub`).
  - Der Tab *„Rezepte“* wird für Bewohner ausgeblendet.
  - Vergrößerter unterer Sicherheitsabstand (`pb-5 sm:pb-3`), damit die Leiste nicht direkt an den Gehäuserand stößt.
- **Flurfunk-Banner auf dem Home-Dashboard (`DashboardHub`)**:
  - Vollständig klickbare Hinweiskarte ohne überflüssige Buttons (*„Öffnen“* / *„Als erledigt markieren“* entfernt).
  - Korrigierte Farbkodierung: Ankündigungen rot/rose, Hinweise gelb/amber, Mitteilungen/Direktnachrichten blau/sky.
  - Korrekte Erkennung neuer Direktnachrichten statt irrtümlicher Kennzeichnung als Betreuer-Antwort.
- **Flurfunk-Kategorien bereinigt (`shared/types.ts`, `CaregiverNotesView`, Server-Routen)**:
  - Die Kategorie *„Fragen“* wurde restlos entfernt.
  - Bewohner können ausschließlich Mitteilungen verfassen; die Kategorieauswahl ist für Bewohner ausgeblendet und serverseitig fixiert.
- **Gericht entfernen Button im Rezept-Auswahlmodal (`RecipeSelectModal`)**:
  - Der unscheinbare Textlink *„Tag leeren (kein Gericht)“* wurde durch einen auffälligen roten Button mit Mülleimer-Icon (`Trash2`) und der Aufschrift *„Gericht entfernen“* ersetzt.
- **Dashboard Einkaufskorb Budget-Widget (`DashboardHub`)**:
  - Beschriftung geändert in *„Aktuelles Wochenbudget“* und *„Noch xxx € übrig“*.
  - Das alte Münz-Emoji wurde durch ein SVG-Geldnoten-Icon (`Banknote`) ersetzt.

## [0.1.0-beta.33] - 2026-09-17

### Hinzugefügt & Verbessert
- **Flurfunk: Ankündigungsschutz für Bewohner (`DashboardHub`, `CaregiverNotesView` & Server API)**:
  - Bewohner (`BEWOHNER`) können wichtige Ankündigungen (`ANKUENDIGUNG`) weder eigenständig ausblenden, noch als erledigt markieren oder löschen.
  - Auf dem Dashboard entfällt bei Ankündigungen für Bewohner der Ausblenden-/Erledigen-Button vollständig (nur *„Öffnen“* bleibt verfügbar).
  - Lokales Ausblenden ist für Bewohner bei Ankündigungen deaktiviert; Ankündigungen bleiben dauerhaft sichtbar, bis sie ein Betreuer archiviert/entfernt oder ihr Ablaufdatum (`expiresAt`) überschritten ist.
  - Serverseitig sind `PATCH /api/notes/:id/resolve`, `PATCH /api/notes/:id/status` und `DELETE /api/notes/:id` für Bewohner bei Ankündigungen mit HTTP 403 geschützt.
- **Flurfunk: Mitteilungen & Hinweise als erledigt markieren mit Betreuer-Benachrichtigung**:
  - Bewohner können Mitteilungen (`ALLGEMEIN`) und Hinweise (`HINWEIS`) mit dem Button *„Als erledigt markieren“* abschließen.
  - Das Thema wird serverseitig archiviert (`status: 'DONE'`, `isArchived: true`) und verschwindet sofort vom Dashboard und aus den aktiven Flurfunk-Mitteilungen.
  - **Automatische Betreuer-Benachrichtigung**:
    - Alle Betreuer des Standorts erhalten eine Benachrichtigungs-E-Mail (`sendCaregiverNoteResolvedEmail`), dass der Bewohner das Thema als erledigt markiert hat.
    - Im Gesprächsverlauf der Notiz wird automatisch ein Audit-Systemeintrag hinterlegt (*„✅ Hat dieses Thema als gelesen bzw. erledigt markiert.“*).

## [0.1.0-beta.32] - 2026-09-17

### Hinzugefügt & Verbessert
- **Dashboard: Multi-Rollen-Hinweisfenster für Betreuer und Bewohner (`DashboardHub`)**:
  - Großes, modernes Benachrichtigungs-Hinweisfenster auf der Startseite für **Betreuer UND Bewohner**, sobald neue oder aktive Themen im Flurfunk vorhanden sind.
  - Eigene Beiträge des aktuell angemeldeten Benutzers werden automatisch herausgefiltert, sodass man niemals über seine eigenen Notizen benachrichtigt wird.
  - Farblich abgestimmt auf den jeweiligen Beitragstyp (Ankündigung, Hinweis, Frage, Mitteilung, Bewohner-Anliegen, Direktnachricht).
  - Aktionen: *„Als gelesen abhaken“* (speichert den Gelesen-Status lokal pro Benutzer-ID und leert ggf. `hasUnreadResponse`) sowie *„Öffnen“* mit direktem Wechsel zum Flurfunk.
  - Bei mehr als 3 aktiven Hinweisen sorgt ein dezenter Sammel-Button (*„+ X weitere Mitteilungen im Flurfunk ansehen“*) für eine aufgeräumte Home-Ansicht.
- **Flurfunk: Farbkodierung der Beitragskarten (`CaregiverNotesView`)**:
  - **📢 Ankündigung**: Rötlich / Rose / Pink gefärbt (`bg-rose-500/10 border-rose-500/35`) zur klaren Hervorhebung wichtiger WG-Neuigkeiten.
  - **💡 Hinweis**: Gelblich / Amber gefärbt (`bg-amber-500/10 border-amber-500/35`) für praktische Ratschläge, Putzhinweise oder Termine.
  - **❓ Frage**: Violett / Purple gefärbt (`bg-purple-500/10 border-purple-500/35`) für Abstimmungen oder Gruppenfragen.
  - **💬 Mitteilung (Allgemein)**: Blau / Sky gefärbt (`bg-sky-500/10 border-sky-500/35`) für alltägliche Notizen und WG-Pinnwandeinträge.
  - Vollständige Entfernung der überflüssigen Kategorie *„Dringend“* aus allen Auswahllisten, Filtern und Typen (mit nahtlosem Fallback für bestehende Einträge).
- **Flurfunk: Beiträge durch Betreuer editierbar (`CaregiverNotesView` & Server API)**:
  - Betreuer und Administratoren können ihre eigenen Flurfunk-Beiträge nachträglich editieren (Titel, Inhalt, Kategorie, Angepinnt, Ablaufdatum und Sichtbarkeit/Empfänger).
  - Neuer API-Endpunkt `PUT /api/notes/:id` mit Berechtigungsprüfung (`ADMIN` oder Notiz-Verfasser).
  - Komfortables Inline-Bearbeitungsformular direkt auf der jeweiligen Karte mit *Speichern*- und *Abbrechen*-Funktion.

## [0.1.0-beta.31] - 2026-09-17

### Hinzugefügt & Verbessert
- **Dashboard: Optimierungen Einkaufsliste, Abfall-Radar & Flurfunk (`DashboardHub`)**:
  - **Einkaufsliste Beschriftung**: Umbenannt in präzises *„xx Artikel auf der Einkaufsliste“* (statt *„... auf der Liste“*).
  - **Abstand Artikel & Einheit behoben**: Garantierter Zwischenraum zwischen Artikelbezeichnung und Mengenangabe in der Vorschau (z. B. `Zwiebeln (2 Stück)` statt `Zwiebeln(2 Stück)`).
  - **Abfall-Radar Überschrift**: Headline lautet nun informativ *„Nächste Abholung: [Tonnenart]“* (z. B. *„Nächste Abholung: Biotonne“*) anstelle der isolierten Tonnenbezeichnung.
  - **Flurfunk Fußzeile bereinigt**: Der überflüssige Satz *„Alle Bewohner und Betreuer können Zettel und Wünsche anheften.“* wurde entfernt. Der Button *„Zum Flurfunk“* schließt die Box nun harmonisch und vollwertig ab.
  - **Bewohner-Benachrichtigungsbanner**: Betreuer-Direktnachrichten an Bewohner werden im Dashboard nun korrekt als *„Neue Direktnachricht von [Betreuer]“* mit Betreff *„Nachricht: „[Titel]““* dargestellt (nicht mehr fälschlicherweise als Antwort zu einem Beitrag).
- **Flurfunk: Fehlerbehebung bei Betreuer-Direktnachrichten (`server/src/modules/notes/routes.ts`)**:
  - Neuerstellung von Direktnachrichten durch Betreuer kopiert den Inhalt nicht mehr in `caregiverResponse`. Dadurch wurden die Textdoppelung und die fälschliche Anzeige als Antwort für Bewohner vollständig behoben.
  - Exakte Modellierung von `authorId` (Verfasser) und `residentId` (Empfänger) in Prisma.
  - E-Mail-Benachrichtigung an den Bewohner bei Eingang einer neuen Direktnachricht.
- **Flurfunk: Beiträge anpinnen (`isPinned`)**:
  - Betreuer und Admins können wichtige Beiträge dauerhaft oben anheften.
  - Angepinnte Beiträge erhalten einen leuchtenden Pin-Badge `[📌 Angepinnt]` und werden stets an erster Stelle vor allen anderen Notizen einsortiert.
  - Betreuer können den Pin-Status jederzeit direkt mit einem Klick auf das Pinnnadel-Icon auf der Karte umschalten (`PATCH /api/notes/:id/pin`).
- **Flurfunk: Kategorien & Beitragsarten (`category`)**:
  - Beim Erstellen kann aus 5 semantischen Kategorien gewählt werden: *Mitteilung* (💬), *Ankündigung* (📢), *Hinweis* (⚠️), *Frage* (❓) und *Dringend* (🚨).
  - Farbige Header-Badges auf jeder Notiz-Karte sorgen für unmittelbare visuelle Orientierung.
- **Flurfunk: Ablaufdatum für temporäre Mitteilungen (`expiresAt`)**:
  - Betreuer können optional ein Ablaufdatum festlegen (z. B. für Aushänge über anstehende WG-Events oder Handwerkerbesuche).
  - Nach Ablaufdatum werden Mitteilungen automatisch archiviert.
- **Flurfunk: Einklappbare Beitrags-Karten (Collapsible UI)**:
  - Karten im Flurfunk sind einklappbar und ausklappbar für maximale Übersicht auch bei vielen Beiträgen.
  - Eingeklappter Zustand zeigt Badges, Autor, Titel, ein 2-zeiliges Text-Snippet sowie die Anzahl der Antworten.
  - Ausgeklappter Zustand offenbart den vollständigen Text, den gesamten Gesprächsverlauf, das Antwort-Eingabefeld und die Aktionen (*Als erledigt archivieren*, *Wiedereröffnen*, *Löschen*).

## [0.1.0-beta.30] - 2026-09-17

### Hinzugefügt & Verbessert
- **Dashboard: Vollständige visuelle und typografische Harmonisierung aller Bento-Karten (`DashboardHub`)**:
  - **„Heute frisch auf den Tisch“ angeglichen**: Die zuvor überdimensionierte Überschrift (`text-2xl sm:text-3xl`) wurde exakt an die anderen Boxen angepasst (`text-xl font-semibold text-white mb-1.5 font-sans tracking-tight`).
  - **Identische Typografie über alle 5 Dashboard-Boxen**:
    - **Header-Pillen**: Einheitlich `inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap` mit passendem Emoji-Icon für alle Karten (*Deine Aufgaben / Heute frisch auf den Tisch / Einkaufskorb / Abfall-Radar / Flurfunk & Notizen*).
    - **Box-Überschriften**: Alle 5 Karten verwenden nun ausnahmslos `<h3>` mit `text-xl font-semibold text-white mb-1.5 font-sans tracking-tight`.
    - **Untertitel**: Alle 5 Karten verwenden exakt `text-xs text-slate-300 mb-4 leading-relaxed font-sans`.
    - **Innenabstände (Padding)**: Alle Karten nutzen einheitlich `rounded-[2.5rem] p-6 sm:p-8`.
    - **Aktions-Buttons**: Alle Karten-Buttons im Footer sind nun einheitlich auf `py-2.5 rounded-2xl text-xs font-semibold font-sans` mit dezenter Trennlinie (`pt-4 border-t`) harmonisiert.
  - **Flurfunk & Notizen**: Vollwertige Überschrift *„Mitteilungen & Notizen“* und Untertitel integriert, wodurch auch in der unteren Spaltenreihe beide Boxen (*Abfall-Radar* & *Flurfunk*) eine perfekte vertikale Symmetrie besitzen.

## [0.1.0-beta.29] - 2026-09-17

### Hinzugefügt & Verbessert
- **Gesamtaufgabenplan: Vollständige Bereinigung & Umbenennung (`ChorePlannerView`)**:
  - **Abhaken vollständig entfernt**: Das Abhaken von Aufgaben wurde im gesamten Wochenaufgabenplan restlos entfernt. Die Ansicht fungiert als saubere, verlässliche Alltags- und Dienstübersicht.
  - **Statuspille & Zähler entfernt**: Die Kopfzeilen-Pille *„x / x erledigt“* sowie Erledigungs-Häkchen auf den Wochentagsbuttons und Tages-Tabs wurden komplett entfernt.
  - **Titel & Beschreibung vereinfacht**: Der Haupttitel heißt nun schlicht **„Aufgabenübersicht“** (statt *„Haushalts- & Alltagsorganisation“*).
- **Dashboard: Zentrierter Begrüßungsbereich & Bereinigung (`DashboardHub`)**:
  - **Zentriertes Layout**: Der gesamte Begrüßungskopf (`Guten Abend / Gute Nacht <Name>!`) ist nun exakt mittig zentriert.
  - **Textbereinigung**: Die Floskel *„Hier ist dein WG-Überblick für heute“* wurde entfernt. Die Zeile lautet nun einheitlich und klar: `{Wochentag, Datum} — Schön, dass du da bist.`
  - **Buttons entfernt**: Die beiden Schnellwahlbuttons *„Aufgabenplan“* und *„Budget“* unterhalb der Begrüßung wurden entfernt. Ungelesene Flurfunk-Meldungen bleiben bei Bedarf dezent zentriert erreichbar.
- **Dashboard: Vollständige Lesbarkeit der Aufgabendetails auf Mobilgeräten (`DashboardHub`)**:
  - In der Bewohner-Box *„Deine Aufgaben“* wurden die Beschneidung (`truncate`) und Breitenbegrenzung (`max-w-[220px]`) der Detailbeschreibungen vollständig entfernt.
  - Mit `items-start`, natürlichem Zeilenumbruch (`break-words whitespace-normal`) und optimierter Schriftfarbe (`text-slate-300`) sind nun alle Anweisungen und Detailhinweise zu den Diensten auf Smartphones sowie Desktop vollständig lesbar.

## [0.1.0-beta.28] - 2026-09-17

### Hinzugefügt & Verbessert
- **Aufgabenplaner: Abhaken für Bewohner auch im Wochenplan deaktiviert (`ChorePlannerView` & Backend)**:
  - Bewohner haben im Aufgabenplan keine interaktiven Abhake-Buttons mehr, sondern sehen ausschließlich lesbare Status-Badges (`✓ Erledigt` oder `○ Offen`).
  - Absicherung auf Server-Ebene: `/api/chores/toggle-complete` ist mit `requireRole('ADMIN', 'BETREUER')` geschützt, sodass nur Betreuer und Admins Aufgaben abhaken können.
- **Dashboard: Optimierung der Aufgabenbox für Bewohner & Mobile Ansicht (`DashboardHub`)**:
  - **Pille gekürzt & Umbruch behoben**: In der Pille steht nun prägnant `[📋 Deine Aufgaben]` mit `whitespace-nowrap` – bricht auf mobilen Bildschirmen nicht mehr um.
  - **Doppelung entfernt**: Titel harmonisiert auf *„Was heute ansteht“* anstelle der vorherigen doppelten Benennung *„Deine Aufgaben für heute“*.
  - **Neues, sauberes Action-Design**: Der bisher unschön in den Header gequetschte Textlink samt Pfeil wurde entfernt. Stattdessen befindet sich am Fuß der Karte nun eine aufgeräumte, moderne Aktionsleiste mit `[📅 Wochenplan öffnen]` (bzw. für Betreuer `[📅 Aufgabenplan verwalten]`), passend zum Bento-Design der übrigen Karten.

## [0.1.0-beta.27] - 2026-09-17

### Hinzugefügt & Verbessert
- **Dashboard: Redesign der Bewohner-Aufgabenbox (`DashboardHub`)**:
  - **Einheitliches Bento-Design**: Die Box *„Aufgaben für heute“* für Bewohner entspricht nun exakt dem Design der übrigen Bento-Karten (`rounded-[2.5rem] p-7 sm:p-8 relative overflow-hidden group`).
  - **Header-Pille**: Ergänzt um die standardmäßige Badge-Pille `[📋 AUFGABEN FÜR HEUTE]`.
  - **Größere Überschrift**: Titel angepasst auf `text-xl font-semibold` analog zum Einkaufskorb.
  - **Besen-Icon & Abhaken für Bewohner entfernt**: Wie gewünscht wurde das Besen-Icon im Header entfernt und das interaktive Abhaken für Bewohner deaktiviert (rein informative Tagesübersicht der Aufgaben). Entsprechend wurde der Zähler *„x / x erledigt“* für Bewohner entfernt.
- **Aufgabenplan: Multi-Bewohner-Zuweisung & „Allen Bewohnern zuweisen“ (`ChorePlannerView` & `AdminManagementView`)**:
  - **Aufgaben mehreren Bewohnern zuordnen**: Aufgaben (z. B. Zimmerreinigung oder gemeinsame WG-Dienste) können nun mehreren Bewohnern gleichzeitig oder mit 1 Klick *allen Bewohnern* zugewiesen werden.
  - **Einstellungen / Vorlagen**: Bei der Erstellung und Bearbeitung von Aufgaben-Vorlagen können Betreuer mit `[👥 Allen Bewohnern zuweisen]` oder via Checkboxen mehrere Bewohner auswählen.
  - **Wochenplaner / Tages-Einteilung**: Auch im Wochenplan können Betreuer Aufgaben flexibel allen Bewohnern oder einer beliebigen Auswahl an Bewohnern zuordnen, mit visueller Avatar-Stapelung und Namensauflistung auf den Tageskarten.
  - **Datenbank & Backend**: `assignedResidentIds` unterstützt JSON-Listen und `'["ALL"]'`, mit intelligenter Vererbung von Vorlagen-Standards und tagesbezogenen Überschreibungen.

## [0.1.0-beta.26] - 2026-09-16

### Hinzugefügt & Verbessert
- **Aufgabenplaner Desktop-Redesign (`ChorePlannerView`)**:
  - **Abschied von unbenutzbaren 7 Quetschspalten**: Die bisherige 7-Spalten-Darstellung auf großen Bildschirmen wurde durch ein großzügiges, strukturiertes 2-Spalten-Kartenraster (`grid-cols-1 xl:grid-cols-2 gap-6`) ersetzt.
  - **Viel Platz für Inhalte**: Jeder Wochentag erhält eine 550–650px breite Bento-Tageskarte mit großem Wochentag-Titel, vollständigem Datum, leuchtendem "Heute"-Statusbadge und Fortschrittszähler ("X von Y erledigt" bzw. "Alle erledigt ✅").
  - **Wochentag-Schnellauswahl & Fokus-Modus**: Neue Filterleiste am oberen Rand (`[ 📅 Ganze Woche (7 Tage) ]` sowie Direkttasten für jeden Wochentag `[ Mo 15.09. ]` bis `[ So 21.09. ]`). Mit einem Klick kann auf einen einzelnen Tag im Vollbild-Fokus gewechselt werden, um Aufgaben für diesen Tag konzentriert einzuteilen.
  - **Horizontale, lesbare Aufgabenzeilen**:
    - Großes 42×42px Emoji-Icon für jede Aufgabe (Küche, Zimmer, Müll, Bad, etc.).
    - Vollständige, lesbare Aufgabenbeschreibungen ohne willkürlichen Zeilenabriss.
    - Zuweisungs-Badge für Bewohner mit Foto/Avatar, Namensanzeige und Stift-Icon für Betreuer zum schnellen Ändern.
    - Grüne "Erledigt"-Schaltfläche mit CheckCircle-Icon vs. interaktiver "Abhaken"-Button mit geschmeidigem Klick-Feedback.
  - **Feiner Fortschrittsbalken** pro Wochentag zur visuellen Rückmeldung des Erledigungsstands.
- **Dashboard-Begrüßung: Harmonischer Zeilenabstand (`DashboardHub`)**:
  - Der vertikale Abstand zwischen dem Begrüßungstitel (*"Gute Nacht, Timo! 🌙"*) und der Datumsunterzeile wurde entzerrt (`mt-3`, `leading-relaxed`). Die Typografie wirkt nun entspannt, ausgewogen und nicht mehr gedrungen.

## [0.1.0-beta.25] - 2026-09-16

### Hinzugefügt & Verbessert
- **Neues Modul: Aufgabenplan (Haushalts- & Alltagsorganisation)**:
  - **Zentrale digitale Aufgabenplanung**: Vollständiger Ersatz unübersichtlicher Zettel durch einen interaktiven Wochenplan (`ChorePlannerView`) mit Wochentagen Mo - So.
  - **Betreuer-Konfiguration in den Einstellungen**: Neuer Bereich *„Aufgaben-Vorlagen“* in der Verwaltung (`AdminManagementView`), in dem Betreuer wiederkehrende Aufgaben (z. B. Küche & Abwasch, Zimmerreinigung, Müll & Recycling, Bad reinigen) mit Emojis, Beschreibungen und Sortierung pflegen können.
  - **Intuitive Bewohner-Zuweisung**: Mit einem Klick können Betreuer jedem Tag und jeder Aufgabe Bewohner zuweisen.
  - **Tägliches Dashboard-Widget & 1-Klick-Abhaken**:
    - **Für Bewohner**: Prominentes persönliches Widget *„Deine Aufgaben für heute“* direkt auf der Startseite mit Anzeige des Erledigungsfortschritts und interaktiver Checkbox zum sofortigen Abhaken.
    - **Für Betreuer**: Übersicht aller heutigen WG-Aufgaben mit Zuweisungs- und Erledigungsstatus.
    - Filterfunktion im Wochenplan zwischen *„Alle Aufgaben“* und *„Nur meine Aufgaben“*.
  - **Navigation**: Aufgabenplan ist in Desktop- und Mobile-Navigation sowie im Dashboard-Header direkt erreichbar.
- **Rezept-Kategorien: Betreuer-Pflege & Dropdown-Auswahl**:
  - Freies Textfeld beim Anlegen/Bearbeiten von Rezepten durch ein sauberes Dropdown ersetzt.
  - Neuer Verwaltungsbereich *„Rezept-Kategorien“* in den Einstellungen (`AdminManagementView`), in dem Betreuer Kategorien anlegen, umbenennen (inkl. synchroner Aktualisierung bestehender Rezepte) und löschen können.
  - Dynamische Filterung im Rezeptkatalog anhand der konfigurierten Kategorien.
- **Bugfix: Profilbild-Klick (Leere Seite behoben)**:
  - Behebung des React Hooks Violation Fehlers in `UserProfileModal.tsx` (Hook-Aufrufe nach bedingtem `return null` hatten die React-App zum Absturz gebracht).
  - Saubere State-Synchronisierung der Profildaten beim Öffnen des Modals.
  - Einbau einer globalen `ErrorBoundary` in `App.tsx` zur Ausfallsicherheit.
- **Dashboard: Harmonische Begrüßung**:
  - Entfernung der doppelten Begrüßung (*"Guten Abend Timo!"* + *"Hallo Timo, schön dass du da bist!"*).
  - Aufgeräumte Struktur: Status-Zeile mit WG und Kalenderwoche oben, zeitbasierte Hauptbegrüßung mit Emoji (*"Guten Abend, Timo! 🍲"*) und deutscher Datumszeile darunter.

## [0.1.0-beta.24] - 2026-09-16

### Hinzugefügt & Verbessert
- **Dashboard: Harmonisches 2-Spalten Bento-Raster & Einkaufskorb-Breite**:
  - Umstellung des asymmetrischen 3-Spalten-Rasters auf ein gleichmäßiges 2-Spalten-Layout (`grid-cols-1 lg:grid-cols-2`).
  - Großzügige Breite für die *Einkaufskorb*-Box: Keine gedrängten Textumbrüche mehr im Wochen-Budget-Bereich (`Wochen-Budget KW xx` und `Noch xx € frei` stehen jetzt aufgeräumt nebeneinander).
  - Sinnvolle thematische Bündelung: Zeile 1 widmet sich Kochen & Einkauf (Rezept-Spotlight + Einkaufskorb); Zeile 2 Alltag & Austausch (Abfall-Radar + Flurfunk).
- **Abfall-Radar: Bereinigung & Zähler-Entfernung**:
  - Entfernung der verwirrenden Zähler-Pille oben rechts (wie `In -247 Tagen`).
  - Automatische Filterung auf anstehende und heutige Abholtermine (vergangene Alttermine werden ignoriert).
- **Button-Labels: Doppelte Plus-Zeichen bereinigt**:
  - Entfernung doppelter Pluszeichen in Beschriftungen (`+ Gericht wählen`, `Termin eintragen`, `Neues Rezept eintragen`, `Zum Flurfunk`).
- **Supermarkt-Stammdaten: Umbenennung in „Netto“**:
  - Umbenennung von *Netto Marken Discoun(t)* in **Netto** in Initial-Seed und automatische Bereinigung in bestehenden Datenbanken.
- **Wöchentliches Budget: Sonntag-Abschluss & Bewohner-Transparenz**:
  - **Automatischer Sonntag-Abschluss**: Jede Woche gilt ab Sonntag automatisch als abgeschlossen (`isConfirmed: true`). Nicht verbrauchte Überschüsse fließen verlässlich in die Sonderkasse.
  - **Fokussierte Bewohneransicht**: Bewohner sehen auf einen Blick das noch verfügbare Wocheneinkaufs-Budget (`Noch xx € frei`); Betreuer-Verwaltungsbuttons und komplexe Kassenbuch-Aktionen sind für Bewohner ausgeblendet.
- **Flurfunk: Direktnachrichten von Betreuern an Bewohner & Entspannungs-Icon**:
  - **Betreuer-Direktnachrichten**: Wenn Betreuer einen vertraulichen Beitrag schreiben, wählen sie nun gezielt *„Direkt an Bewohner“* mit praktischem Bewohner-Auswahlfeld. Der gewählte Bewohner sieht den Hinweis sofort auf seinem Dashboard und erhält eine Benachrichtigung.
  - **Neues Entspannungs-Icon (Flaticon 5522984)**: Ersatz des alten Zigaretten-Icons im Leerzustand durch eine friedlich auf einem Kissen ruhende Person mit hinter dem Kopf verschränkten Armen.

## [0.1.0-beta.23] - 2026-09-16

### Hinzugefügt & Verbessert
- **Supermärkte verwalten & umbenennen in den Einstellungen**:
  - Betreuer und Administratoren können Supermärkte nun direkt in den Einstellungen umbenennen, neue Märkte anlegen oder ungenutzte Supermärkte löschen.
  - Direkter Schnellzugriff via Stift-Icon (`Pencil`) neben dem Markt-Auswahlfeld für den Standort sowie ein dediziertes Verwaltungsmodal mit Inline-Editierung (Enter/Escape).
  - Backend-Endpunkte `POST /api/food/supermarkets`, `PUT /api/food/supermarkets/:id` und `DELETE /api/food/supermarkets/:id` mit Rollenprüfung und Schutz vor versehentlichem Löschen aktiv verknüpfter Märkte.
- **Top-Notch Redesign der Einkaufsliste (`ShoppingListView`)**:
  - **Aufgeräumte Seitenstruktur**: Die alte monolithische Hero-Box wurde aufgelöst zugunsten einer eleganten Kopfzeile (Titel, Standort, Kalenderwochen-Umschalter `< KW X >`, Schnellzugriff zum Wochenplan).
  - **Drei perfekt ausbalancierte Bento-Metrik-Karten**:
    - **Einkaufswagen**: Deutliche Anzeige („x von x Artikel abgehakt“), gradienter Fortschrittsbalken und Zähler für erledigte vs. noch offene Besorgungen.
    - **Kassen-Schätzung**: Prominente Summenanzeige mit Markt-Badge und Erläuterung.
    - **WG-Wochenbudget**: Restbudget in großer Schrift, Status-Pill („Verfügbar“ / „Abgerechnet“) und direkter Button zur WG-Kassenverwaltung.
  - **Aktionsleiste & Zusatzartikel**: Saubere Statusleiste mit Kategorienanzahl und aufklappbarem, ergonomischem Formular für eigene Artikel (Kaffee, Hafermilch, Drogerie etc.).
- **Radikale Vereinfachung des WG-Budget- & Sonderkassen-Fensters (`LocationBudgetModal`)**:
  - Komplette Neugestaltung und Reduktion der Komplexität durch einen intuitiven Zwei-Reiter-Switcher:
    - **Reiter 1: Wocheneinkauf (KW {week})**: Fokus auf das verbleibende Einkaufsbudget der Woche, Kassenbon-Status und klares Betreuer-Formular zur Belegabrechnung.
    - **Reiter 2: WG-Sonderkasse (Spartopf)**: Transparente Übersicht des aktuellen Guthabens aus nicht verbrauchten Einkaufsbudgets, Historie der Anschaffungen/Aktivitäten und Buchungsformular für Betreuer.
  - Befreit von überflüssigen Tabellen und doppelten Erklärungen – übersichtlich, leicht verständlich und barrierefrei für alle Bewohner und Betreuer.

## [0.1.0-beta.22] - 2026-09-16

### Hinzugefügt & Verbessert
- **Flurfunk: Gesprächsstränge & Threading (`CaregiverNoteMessage`)**:
  - Unterstützung für echte, mehrteilige Dialoge zwischen Bewohnern und Betreuern (Bewohner schreibt -> Betreuer antwortet -> Bewohner nimmt Bezug -> Betreuer reagiert weiter).
  - Neuer chronologischer Gesprächsverlauf im Bento-Card-Design mit Verfasser-Avatar, Initialen, Name, Rollen-Badge („Betreuer“ / „Bewohner“) und Zeitstempel.
  - Direkte Inline-Antwortmöglichkeit („Auf Mitteilung antworten...“) für alle Gesprächsteilnehmer.
  - Automatische Bereinigung des Ungelesen-Status beim Öffnen durch den Bewohner.
- **Flurfunk: Ästhetische, statische SVG-Vektorgrafik im Empty State**:
  - Ersatz der animierten Zeichnung durch ein elegantes, minimalistisches und professionelles Vektor-Icon ohne störende Blink- oder Ping-Animationen.
- **Einkaufsliste: Hero Box Feinschliff & Symmetrie**:
  - **Identische Box-Höhen**: Vollständige Symmetrie der inneren Metrik-Boxen (`items-stretch`) mit einheitlicher vertikaler Ausrichtung.
  - **Dezentes Hintergrundmotiv & Ambient Glow**: Sanftes Wasserzeichen (`🛒`) in Kombination mit einem dezenten Glow im oberen rechten Bereich – parallel zur „Heute frisch auf den Tisch“-Box auf dem Dashboard.
  - **Tippfehler behoben**: Korrektur von „x von x Artikeln“ zu „x von x Artikel“.
- **Wöchentliches Standort-Budget & WG-Sonderkasse**:
  - **Standort-Budget**: Jeder Standort erhält ein wöchentlich hinterlegtes Einkaufsbudget (Standard: 350,00 €), das Betreuer in den Standort-Einstellungen individuell anpassen können.
  - **Transparenter Budget-Tracker für Bewohner**: Bewohner sehen auf dem Dashboard und in der Einkaufsliste jederzeit auf einen Blick, wie viel Geld für den aktuellen Wocheneinkauf noch zur Verfügung steht.
  - **Kassenbon-Erfassung für Betreuer**: Betreuer können den tatsächlichen Rechnungsbetrag laut Kassenbon erfassen, Notizen hinterlegen und die Woche als abgerechnet markieren.
  - **WG-Sonderkasse (Rücklagen-Konto)**:
    - Nicht ausgeschöpfte Wocheneinkaufs-Beträge fließen automatisch und transparent in die WG-Sonderkasse.
    - Vollständiges Kassenbuch (`LocationSavingsTransaction`): Betreuer können Sonderanschaffungen (z. B. Toaster), Aktivitäten (z. B. Kinoabend) und Reparaturen mit Verwendungszweck, Kategorie und Datum eintragen oder verwalten.
    - Transparentes Informations-Modal (`LocationBudgetModal`), das auch Bewohnern jederzeit Einsicht in den Gesamtstand und die Ausgaben gibt.

## [0.1.0-beta.21] - 2026-09-16

### Hinzugefügt & Verbessert
- **Vollwertiger Rezept-Editor für Betreuer (`RecipeEditModal`)**:
  - Neuer „Rezept bearbeiten“-Button im Rezept-Detail-Modal und Rezepte-Katalog für Betreuer und Admins.
  - Umfangreiches Bearbeitungsmodal via React Portal (`z-[100]`) mit Body-Scroll-Lock:
    - Titel, Kategorie-Auswahl, Kochzeit (Minuten) und Basis-Portionen.
    - Foto-Upload mit integrierter Canvas-Komprimierung oder direkte Bild-URL Eingabe.
    - Kurzbeschreibung und mehrzeilige Zubereitungsanleitung.
    - Vollständig dynamische Zutatenliste: Beliebiges Hinzufügen, Bearbeiten und Entfernen von Zutaten (Name, Menge, Einheit, Notiz).
    - Backend-Zutaten-Erkennung: Bei neu eingetippten Zutaten ohne ID wird automatisch nach existierenden Zutaten gesucht oder diese nahtlos neu angelegt.
- **Flurfunk: Sichtbarkeit zwischen Öffentlich und Privat an Betreuer**:
  - Beim Verfassen einer Flurfunk-Notiz kann gewählt werden:
    - 👥 **Öffentlich für alle**: Sichtbar für alle Bewohner und Betreuer der WG.
    - 🔒 **Privat an Betreuer**: Vertrauliche Nachricht, nur für den Bewohner und das Betreuer-Team des Standorts sichtbar.
  - Private Beiträge sind durch eine dezente lilafarbene `🔒 Nur für Betreuer`-Badge gekennzeichnet.
  - Bewohner-Datenschutz auf Datenbank- und API-Ebene: Bewohner erhalten in Abfragen ausschließlich öffentliche Notizen oder ihre eigenen privaten Notizen.
- **Flurfunk: Automatische E-Mail- & Dashboard-Benachrichtigungen**:
  - **Dashboard-Hinweis für Bewohner**: Wenn ein Betreuer auf den Beitrag eines Bewohners antwortet, erscheint ganz oben auf dem Dashboard des Bewohners ein animiertes Alert-Banner mit Antwort-Vorschau, Schnellzugriff zum Flurfunk und Button „Als gelesen abhaken“.
  - **E-Mail an Bewohner**: Hat der Bewohner eine E-Mail-Adresse hinterlegt, erhält er automatisch eine formatierte HTML-E-Mail mit der Rückmeldung des Betreuers.
  - **E-Mail an Betreuer bei Direktnachricht**: Geht eine neue private Notiz an die Betreuer ein, werden die Betreuer des Standorts automatisch per E-Mail informiert.
- **Konfigurierbare E-Mail-Vorlagen in den Admin-Einstellungen**:
  - Im Admin-Bereich unter „Eigener Mailserver (SMTP)“ können Betreuer die Vorlagen für Betreff und E-Mail-Text beider Benachrichtigungstypen frei konfigurieren.
  - Unterstützung dynamischer Platzhalter wie `{residentName}`, `{noteTitle}`, `{responderName}`, `{replyText}`, `{locationName}`, `{authorName}` und `{noteContent}`.
- **Einkaufsliste: Harmonische Bento Hero Box**:
  - Die drei ehemals getrennten und unruhigen oberen Boxen wurden zu einer einheitlichen, modernen **Bento Hero Box** zusammengefasst.
  - Beseitigung redundanter doppelter „KW X“-Angaben.
  - Nahtlos integrierter Einkaufswagen-Fortschrittsbalken und Kassenbetrag-Schätzung.
  - Integrierter Schnellzugriff „+ Eigenen Artikel hinzufügen“ und Wochenplan-Sprunglink.
- **Flurfunk: Neues Mobil-Layout für Tabs (Segmented Control)**:
  - Ersatz der bisherigen Buttons durch eine saubere, moderne 50/50-Segmented-Pill-Bar im iOS-/Bento-Stil, die sich auf Smartphones gleichmäßig über die Breite verteilt und nicht mehr umbricht.
- **Flurfunk: Minimalistische Vektorgrafik im Empty State**:
  - Die bisherigen Emojis (`🎉 📻 ☕`) im leeren Flurfunk-Zustand wurden durch eine feine, stilisierte Zigaretten-Vektorgrafik (SVG) mit sanften Rauchschwaden und glimmender Spitze ersetzt – passend zum WG-Konzept des „Flurfunks“ an der Raucherecke.
- **Wochenplan: Bereinigung der mobilen Ansicht**:
  - Die Textzeile „Geplante Kochtage für Standort...“ wird auf Smartphones nun ausgeblendet (`hidden sm:flex`), was für eine wesentlich ruhigere und aufgeräumtere mobile Darstellung sorgt.

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
