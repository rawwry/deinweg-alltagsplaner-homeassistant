import React, { useEffect } from 'react';
import { X, Sparkles, Tag, GitCommit, ExternalLink, ShieldCheck } from 'lucide-react';
import { APP_VERSION } from '../../../shared/version.js';

interface ChangelogModalProps {
  onClose: () => void;
}

interface VersionRelease {
  version: string;
  date: string;
  isLatest?: boolean;
  tagline: string;
  highlights: {
    category: string;
    items: string[];
  }[];
}

const RELEASES: VersionRelease[] = [
  {
    version: '0.1.0-beta.15',
    date: '2026-09-07',
    isLatest: true,
    tagline: 'Radikales Redesign: Warm Modern Living & Cozy Bistro Bento',
    highlights: [
      {
        category: '🍱 Asymmetrisches Bento-Dashboard & Bistro Hero',
        items: [
          'Vollkommen neu gestaltetes Dashboard im Cozy-Bistro-Bento-Stil mit tageszeitabhängiger Begrüßung (Morgen, Tag, Abend).',
          'Bistro Hero Spotlight mit großem Menü-Fokus, Kochanleitung, Zubereitungszeit, Rezept-Tags und dynamischer Kochzuweisung.',
          'Visueller Abfall-Radar mit farbcodierten Tonnen-Squircles (Gelb, Bio-Grün, Papier-Blau, Rest-Anthrazit) und Echtzeit-Countdown.',
          'Echtzeit-Einkaufskorb-Vorschau mit automatischer Preisschätzung der Supermärkte und WG-Pinnwand mit interaktiven Notizen.',
          'Haptische Schnellzugriffskacheln mit dezentem Schwebe-Effekt und edler Outfit-Typografie.',
        ],
      },
      {
        category: '🎨 Warm Modern Living Ästhetik',
        items: [
          'Ersetzung des generischen Schiefergraus durch eine warme Dämmerungs-Atmosphäre (#0c0b10) mit sanften bernsteinfarbenen Ambient-Lichthöfen.',
          'Premium-Typografie: Google Fonts Outfit für markante Titel kombiniert mit Plus Jakarta Sans für maximale Lesbarkeit.',
          'Organisch geschwungene Karten (rounded-[2.5rem]), samtige Glasflächen (Frosted Glass mit 20px Blur) und bernsteinfarbene Glow-Effekte bei Interaktion.',
          'Ganzheitliche Design-Konsistenz über alle Ansichten: Wochenplan, Rezeptkatalog, Einkaufsliste, Abfallkalender, Betreuernotizen und Verwaltung.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.14',
    date: '2026-09-07',
    tagline: 'Originales High-Res Logo & optimierte Login-Animation',
    highlights: [
      {
        category: '🎨 Originales Markenlogo',
        items: [
          'Einbindung der hochauflösenden Original-PNG-Grafik (1024x261) als primäres Logo.',
          'Wohlproportionierte Skalierung auf der Login-Seite (h-16 bis h-20, max. 280px) mit sanfter Schwebung und weichem Lichthof.',
          'Kristallklare Darstellung ohne Verpixelung auf allen Geräten.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.13',
    date: '2026-09-07',
    tagline: 'Vektor-SVG-Logo, permanenter Footer & zentrierte minimalistische Highlight-Karten',
    highlights: [
      {
        category: '💎 Vektor-SVG-Logo & Proportionen',
        items: [
          'Vollständige Umstellung auf native, unendlich scharfe Vektor-SVG-Grafik (logo.svg) für Login, Header, Ladeanzeige und Favicon.',
          'Ausgewogene, wohlproportionierte Skalierung auf der Anmeldeseite (h-14 bis h-16) – kristallklar und ohne Verpixelung.',
        ],
      },
      {
        category: '📌 Permanenter Footer',
        items: [
          'Full-Height-Viewport-Layout: Der Footer bleibt dauerhaft und verlässlich am unteren Bildschirmrand sichtbar.',
          'Hauptinhaltsbereich scrollt sauber und unabhängig; harmonische Einbindung über der mobilen Navigationsleiste.',
        ],
      },
      {
        category: '✨ Zentrierte minimalistische Highlight-Karten',
        items: [
          'Neugestaltung der drei Kern-Boxen („Heute auf dem Tisch“, „Einkaufsliste“, „Nächste Abfuhr“) mit zentrierter Symmetrie.',
          'Minimalistische Lucide-Vektor-Icons (UtensilsCrossed, ShoppingBag, Trash2) in farbigen Frosted-Glass-Squircles mit dezenten Hover-Animationen.',
          'Einheitliche Kachelhöhen, bündig ausgerichtete Buttons und Bereinigung der WG-Schnellzugriffe.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.12',
    date: '2026-09-07',
    tagline: 'Großes animiertes Login-Logo & modernes Glassmorphism-Design',
    highlights: [
      {
        category: '✨ Login-Screen Redesign',
        items: [
          'Dein Weg Logo auf dem Login-Screen stark vergrößert mit sanft schwebender Animation (Float-Keyframes).',
          'Weicher, pulsierender Ambient-Lichthof hinter dem Logo für ein edles Erscheinungsbild.',
          'Überflüssige Textzeilen („Dein Weg Alltagsplaner Alltags- & Essensplanung im betreuten Wohnen“) komplett entfernt.',
          'Anmeldekarte in edles Frosted-Glass-Design mit abgerundeten Feldern und Farbverlaufs-Button umgestaltet.',
        ],
      },
      {
        category: '🎨 UI & Tiefenwirkung',
        items: [
          'Globaler, dezenter Radial-Hintergrundverlauf für mehr optische Tiefe statt eintönigem Schwarz.',
          'Dashboard-Startseite mit ambienter Begrüßungs-Mesh-Card, Glas-Effekten und lebendigen Schnellstart-Kacheln aufgewertet.',
          'Desktop-Sidebar mit leuchtendem aktiven Randindikator und optimierten Icons.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.11',
    date: '2026-09-07',
    tagline: 'Top-Menü Redesign, Zahnrad-Verwaltung, Abfallkalender & In-App Changelog',
    highlights: [
      {
        category: '🎨 Header & Branding',
        items: [
          'Oberes Menü vergrößert für ein deutlich größeres, präsentes Dein Weg Logo.',
          'Textzusatz „Dein Weg Alltagsplaner Ambulant betreutes wohnen“ im Header entfernt – Fokus rein auf das offizielle Logo.',
          'Verwaltungs-Schaltfläche im Header durch ein elegantes Zahnrad-Icon ersetzt.',
        ],
      },
      {
        category: '📝 Benennungen & Klarheit',
        items: [
          'Eintrag auf dem Dashboard von „Heute Selbstversorgung / Frei“ präzisiert auf „Heute Selbstversorgung“.',
          '„Müllkalender“ einheitlich umbenannt in „Abfallkalender“ (Sidebar, Schnellzugriff, Überschriften).',
        ],
      },
      {
        category: '📜 Transparenz',
        items: [
          'Neuer direkter Link zum Changelog im Footer sowie interaktives In-App-Versionsarchiv.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.10',
    date: '2026-09-06',
    tagline: 'Offizielles Logo, Verwaltung im Header & Bereinigungen',
    highlights: [
      {
        category: '✨ Design & Identität',
        items: [
          'Offizielles transparentes Dein Weg Markenlogo integriert (Header, Login, Ladebildschirm, Favicon).',
          'Schaltfläche „Verwaltung“ für Betreuer und Admins oben rechts im Header platziert.',
          'Sidebar auf Desktop-Geräten standardmäßig eingeklappt für mehr Arbeitsfläche.',
          'Nachgestellte Emojis in den Navigationspunkten entfernt – saubere, moderne Lucide-Icons.',
          'Infobox in der Seitenleiste: „Taktische Skill-Issue-Prävention“.',
          'Herzchen bei der Biotonne entfernt; Footer-Claim unten rechts auf „fcknzs“ gesetzt.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.9',
    date: '2026-09-06',
    tagline: 'Einklappbare Seitenleiste, neuer Footer & Klienten-freundliche Sprache',
    highlights: [
      {
        category: '📐 Navigation & Layout',
        items: [
          'Einklappbare Desktop-Seitenleiste (Toggle zwischen 64px und 256px mit Zustandsspeicherung).',
          'Neuer zentraler App-Footer mit Copyright, Versionsnummer und Direktlink zu timovorwald.de.',
        ],
      },
      {
        category: '💬 Sprache & Barrierefreiheit',
        items: [
          'Bürokratische Formulierungen ersetzt durch warmherzige WG-Sprache (z. B. „Gemeinsame Einkaufsliste“, „WG-Pinnwand“, „Unser WG-Müllkalender“).',
          'Kategorien in der Einkaufsliste mit bunten Symbolen versehen zur besseren Orientierung.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.8',
    date: '2026-09-06',
    tagline: 'KW-Anzeige, konfigurierbare Kochtage & eigene Zutatenpflege',
    highlights: [
      {
        category: '🗓️ Wochenplan',
        items: [
          'Kalenderwochen-Button im Wochenplan zeigt nun direkt die aktive KW an (z. B. „KW 36“).',
          'Individuelle Kochtage pro Standort einstellbar (z. B. 4 Tage Mo–Do in Emsdetten).',
          'Selbstversorgungs-Karten an Tagen ohne gemeinsames Kochen.',
        ],
      },
      {
        category: '🛒 Richtpreise & Zutaten',
        items: [
          'Vollständige Selbstverwaltung des Zutaten- und Preiskatalogs in der Verwaltung.',
          'Startbestand vollständig bereinigt (0 vorgegebene Zutaten) für eigene Datenpflege.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.7',
    date: '2026-09-06',
    tagline: 'Standort-Bewohner-Zuweisung & optionale E-Mail für Bewohner',
    highlights: [
      {
        category: '👥 Benutzer & Standorte',
        items: [
          'Bewohner können in der Verwaltung direkt Standorten zugewiesen werden.',
          'E-Mail-Adresse ist für Bewohner nun optional (Hinweis auf Firmenadresse entfernt).',
          'Benutzer-Löschfunktion mit Schutz vor Selbstlöschung.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.6',
    date: '2026-09-06',
    tagline: 'Ticketsystem, Rezept-Löschfunktion & automatischer JWT-Schlüssel',
    highlights: [
      {
        category: '🔒 Sicherheit & Verwaltung',
        items: [
          'Automatischer kryptografischer 64-Zeichen JWT-Secret-Key für sicheren Produktionsbetrieb.',
          'Löschfunktion für Rezepte durch Betreuer/Admins mit sicherer Datenbereinigung.',
          'Abfallkalender-Einträge exklusiv für Betreuer/Admins geschützt.',
          'WG-Ticketsystem mit Antwortfunktion und Archiv.',
        ],
      },
    ],
  },
  {
    version: '0.1.0-beta.5',
    date: '2026-09-06',
    tagline: 'Home Assistant Container & Prisma Stabilitäts-Fix',
    highlights: [
      {
        category: '🐳 Docker & Backend',
        items: [
          'Prisma Client Initialisierung im Docker Container behoben.',
          'Dauerhafte Datenbank-Persistenz unter /share/deinweg-alltagsplaner/db.',
        ],
      },
    ],
  },
];

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bento-card bg-surface-card/95 border border-surface-border rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-center justify-between bg-surface-card/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-surface-cream flex items-center gap-2.5">
                <span>Was gibt's Neues?</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  v{APP_VERSION}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-surface-muted mt-0.5 font-sans">
                Übersicht aller Versionen und wichtigsten Neuerungen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-surface-muted hover:text-surface-cream hover:bg-surface-elevated rounded-2xl transition-all border border-transparent hover:border-surface-border"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Version List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 divide-y divide-surface-border/60">
          {RELEASES.map((release, idx) => (
            <div key={release.version} className={idx > 0 ? 'pt-6' : ''}>
              {/* Version Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-mono text-xs font-bold px-3 py-1 rounded-xl border ${
                      release.isLatest
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-400/40 shadow-md shadow-amber-500/20'
                        : 'bg-surface-elevated text-surface-muted border-surface-border'
                    }`}
                  >
                    v{release.version}
                  </span>
                  {release.isLatest && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aktuell
                    </span>
                  )}
                  <span className="text-xs text-surface-muted font-mono">{release.date}</span>
                </div>
              </div>

              <div className="text-sm sm:text-base font-display font-bold text-surface-cream mb-3">
                {release.tagline}
              </div>

              {/* Highlights Group */}
              <div className="space-y-3">
                {release.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="bg-surface-elevated/70 rounded-2xl p-4 border border-surface-border/80">
                    <div className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                      <span>{h.category}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-surface-muted">
                      {h.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2.5">
                          <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                          <span className="leading-relaxed text-surface-cream/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-card/80 flex items-center justify-between text-xs text-surface-muted font-sans">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-surface-cream/90">Dein Weg Planner Tool</span>
          </div>

          <a
            href="https://github.com/rawwry/deinweg-alltagsplaner-homeassistant"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 hover:underline font-semibold"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
