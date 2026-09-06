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
    version: '0.1.0-beta.11',
    date: '2026-09-07',
    isLatest: true,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Was gibt's Neues?</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  v{APP_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Übersicht aller Versionen und wichtigsten Neuerungen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Version List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 divide-y divide-slate-800/60">
          {RELEASES.map((release, idx) => (
            <div key={release.version} className={idx > 0 ? 'pt-6' : ''}>
              {/* Version Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded-xl border ${
                      release.isLatest
                        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-sky-400/40 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    v{release.version}
                  </span>
                  {release.isLatest && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aktuell
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">{release.date}</span>
                </div>
              </div>

              <div className="text-sm font-semibold text-slate-200 mb-3">
                {release.tagline}
              </div>

              {/* Highlights Group */}
              <div className="space-y-3">
                {release.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="bg-slate-800/40 rounded-2xl p-3.5 border border-slate-800/80">
                    <div className="text-xs font-bold text-sky-300 mb-1.5 flex items-center gap-1.5">
                      <span>{h.category}</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {h.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2">
                          <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
                          <span className="leading-relaxed">{item}</span>
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
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dein Weg Planner Tool</span>
          </div>

          <a
            href="https://github.com/rawwry/deinweg-alltagsplaner-homeassistant"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline font-medium"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
