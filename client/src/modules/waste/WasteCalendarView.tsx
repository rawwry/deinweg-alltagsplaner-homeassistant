import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { WastePickupSummary, WasteType } from '../../../../shared/types.js';
import {
  Trash2,
  Calendar,
  Plus,
  Upload,
  Clock,
  Trash,
  Bell,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const WasteCalendarView: React.FC = () => {
  const { user, activeLocationId, activeLocation } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  const [pickups, setPickups] = useState<WastePickupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Add Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<WasteType>('YELLOW');
  const [newNotes, setNewNotes] = useState('');

  // ICS Import Form
  const [showIcsImport, setShowIcsImport] = useState(false);
  const [icsText, setIcsText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchPickups = async () => {
    try {
      setIsLoading(true);
      const data = await api.waste.list(activeLocationId);
      setPickups(data);
    } catch (err) {
      console.error('Fehler beim Laden des Abfallkalenders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [activeLocationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    try {
      await api.waste.create({
        locationId: activeLocationId,
        date: newDate,
        wasteType: newType,
        notes: newNotes.trim() || undefined,
      });

      setNewDate('');
      setNewNotes('');
      setShowAddForm(false);
      fetchPickups();
    } catch (err) {
      console.error('Fehler beim Erstellen des Abfuhrtermins:', err);
    }
  };

  const handleIcsImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icsText.trim()) return;

    try {
      const res = await api.waste.importIcs(activeLocationId, icsText);
      setImportStatus(res.message);
      setIcsText('');
      fetchPickups();
    } catch (err: any) {
      setImportStatus(`Fehler: ${err.message || 'ICS-Datei konnte nicht importiert werden.'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setIcsText(content);
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.waste.delete(id);
      setPickups((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Fehler beim Löschen des Termins:', err);
    }
  };

  const getDaysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getWasteInfo = (type: WasteType) => {
    switch (type) {
      case 'YELLOW':
        return {
          title: 'Gelber Sack / Wertstoff',
          emoji: '♻️',
          bg: 'bg-waste-yellow/15',
          border: 'border-waste-yellow/35',
          badge: 'bg-waste-yellow text-slate-950 font-bold',
          iconColor: 'text-amber-300',
        };
      case 'BIO':
        return {
          title: 'Biotonne (Grün/Braun)',
          emoji: '🍂',
          bg: 'bg-waste-bio/15',
          border: 'border-waste-bio/35',
          badge: 'bg-emerald-500 text-slate-950 font-bold',
          iconColor: 'text-emerald-300',
        };
      case 'PAPER':
        return {
          title: 'Papiertonne (Blau)',
          emoji: '📦',
          bg: 'bg-waste-paper/15',
          border: 'border-waste-paper/35',
          badge: 'bg-sky-500 text-slate-950 font-bold',
          iconColor: 'text-sky-300',
        };
      case 'REST':
      default:
        return {
          title: 'Restmülltonne (Schwarz)',
          emoji: '🗑️',
          bg: 'bg-surface-elevated',
          border: 'border-surface-border',
          badge: 'bg-surface-border text-surface-cream font-bold',
          iconColor: 'text-slate-300',
        };
    }
  };

  // Filter future or today's pickups
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingPickups = pickups.filter((p) => p.date >= todayStr);
  const nextPickup = upcomingPickups.length > 0 ? upcomingPickups[0] : null;
  const daysUntilNext = nextPickup ? getDaysUntil(nextPickup.date) : null;

  // 1-Day Advance Reminder: triggered if pickup is tomorrow (1 day) or today (0 days)
  const isAdvanceReminder = daysUntilNext !== null && (daysUntilNext === 1 || daysUntilNext === 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-bold text-amber-300 mb-2.5">
            <span>♻️</span>
            <span>Müllabfuhr & Termine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-surface-cream tracking-tight flex items-center gap-2.5">
            <Trash2 className="w-7 h-7 text-amber-400" />
            <span>Unser WG-Abfallkalender</span>
          </h1>
          <p className="text-xs sm:text-sm text-surface-muted mt-1.5 font-sans">
            Damit alle Tonnen rechtzeitig an die Straße gestellt werden ({activeLocation?.name || user?.locationName || 'Emsdetten'})
          </p>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-surface-elevated hover:bg-surface-elevated/80 text-surface-cream rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-surface-border shadow-xs hover:border-amber-500/30"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Termin eintragen</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIcsImport(!showIcsImport)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>ICS-Import 📥</span>
            </button>
          </div>
        )}
      </div>

      {/* 1-Day Advance Reminder Banner */}
      {isAdvanceReminder && nextPickup && (
        <div className="bg-gradient-to-r from-amber-950/40 via-surface-card to-surface-card border-2 border-amber-500/50 rounded-[2rem] p-5 sm:p-6 shadow-xl shadow-amber-950/20 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-rose-500 text-white rounded-2xl shrink-0 mt-0.5 shadow-lg shadow-amber-500/20">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-0.5 rounded-full">
                {daysUntilNext === 1 ? '1 Tag Vorlauf • Erinnerung' : 'Heute fällig!'}
              </span>
            </div>
            <h3 className="text-lg font-display font-bold text-surface-cream mt-1.5">
              {daysUntilNext === 1 ? (
                <>
                  Morgen wird die <span className="text-amber-400 underline decoration-amber-400/50">{getWasteInfo(nextPickup.wasteType).title}</span> geholt!
                </>
              ) : (
                <>
                  Heute wird die <span className="text-amber-400 underline decoration-amber-400/50">{getWasteInfo(nextPickup.wasteType).title}</span> abgeholt!
                </>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-surface-muted mt-1 leading-relaxed">
              {daysUntilNext === 1
                ? 'Bitte stelle die Tonne bzw. die Wertstoffsäcke heute Abend an die Straße (bis 6:00 Uhr morgens bereitstellen).'
                : 'Die Abholung erfolgt im Laufe des Tages. Nach der Leerung bitte wieder zurückstellen.'}
            </p>
          </div>
        </div>
      )}

      {/* Next Pickup Highlight Card */}
      {nextPickup && (
        <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/25">
              Nächste Abholung
            </span>
            <div
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                daysUntilNext === 0
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : daysUntilNext === 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                  : 'bg-surface-elevated text-surface-muted border border-surface-border'
              }`}
            >
              {daysUntilNext === 0
                ? 'Heute fällig!'
                : daysUntilNext === 1
                ? 'Morgen (heute Abend rausstellen!)'
                : `In ${daysUntilNext} Tagen`}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getWasteInfo(nextPickup.wasteType).bg} ${getWasteInfo(nextPickup.wasteType).iconColor} border ${getWasteInfo(nextPickup.wasteType).border} shrink-0 shadow-inner text-2xl`}
            >
              {getWasteInfo(nextPickup.wasteType).emoji}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-surface-cream">
                {getWasteInfo(nextPickup.wasteType).title}
              </h2>
              <div className="text-xs sm:text-sm text-surface-muted mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>
                  {new Date(nextPickup.date).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {nextPickup.notes && (
                <div className="text-xs text-amber-300/80 mt-1 italic">
                  Hinweis: {nextPickup.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Form */}
      {showAddForm && isStaff && (
        <form
          onSubmit={handleCreate}
          className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <h3 className="text-sm font-bold text-surface-cream">Abfuhrtermin manuell eintragen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-surface-muted mb-1">Datum</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-surface-cream focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-muted mb-1">Müllart / Tonne</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as WasteType)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-surface-cream focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="YELLOW">Gelber Sack / Wertstoff</option>
                <option value="BIO">Biotonne (Grün)</option>
                <option value="REST">Restmüll (Schwarz)</option>
                <option value="PAPER">Papiertonne (Blau)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-muted mb-1">Hinweis (optional)</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="z.B. ab 6:00 Uhr"
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-surface-cream placeholder-surface-muted/50 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-surface-elevated hover:bg-surface-elevated/80 text-surface-muted hover:text-surface-cream rounded-xl text-xs font-semibold border border-surface-border transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
            >
              Speichern
            </button>
          </div>
        </form>
      )}

      {/* ICS Import Form */}
      {showIcsImport && isStaff && (
        <form
          onSubmit={handleIcsImport}
          className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-surface-cream">
              ICS-Kalenderdatei importieren
            </h3>
            <span className="text-xs text-surface-muted">
              (z.B. digitaler Abfallkalender der Stadt Emsdetten / Kreis Steinfurt)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-muted mb-1">
              .ics-Datei auswählen oder Inhalt unten einfügen:
            </label>
            <input
              type="file"
              accept=".ics,text/calendar"
              onChange={handleFileUpload}
              className="block w-full text-xs text-surface-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-surface-elevated file:text-amber-300 hover:file:bg-surface-elevated/80 cursor-pointer"
            />
          </div>

          <div>
            <textarea
              rows={4}
              value={icsText}
              onChange={(e) => setIcsText(e.target.value)}
              placeholder="BEGIN:VCALENDAR... (oder Datei oben auswählen)"
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs font-mono text-surface-cream placeholder-surface-muted/50 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {importStatus && (
            <div className="text-xs p-3 rounded-xl bg-surface-elevated text-surface-cream font-medium border border-surface-border">
              {importStatus}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowIcsImport(false)}
              className="px-4 py-2 bg-surface-elevated hover:bg-surface-elevated/80 text-surface-muted hover:text-surface-cream rounded-xl text-xs font-semibold border border-surface-border transition-all"
            >
              Schließen
            </button>
            <button
              type="submit"
              disabled={!icsText.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              Termine einlesen
            </button>
          </div>
        </form>
      )}

      {/* Pickups Timeline */}
      {isLoading ? (
        <div className="py-20 text-center text-surface-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-500 border-t-transparent mb-2"></div>
          <div>Abfalltermine werden geladen...</div>
        </div>
      ) : pickups.length === 0 ? (
        <div className="bento-card rounded-[2.5rem] p-12 text-center border border-surface-border">
          <Trash2 className="w-12 h-12 text-surface-muted/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-surface-cream">Keine Abholtermine hinterlegt</h3>
          <p className="text-xs text-surface-muted mt-1">
            Lade eine ICS-Datei des Entsorgers hoch oder trage Termine manuell ein.
          </p>
        </div>
      ) : (
        <div className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl">
          <h3 className="text-base font-display font-bold text-surface-cream mb-5">
            Anstehende Abfuhrtermine ({pickups.length})
          </h3>

          <div className="divide-y divide-surface-border/60">
            {pickups.map((item) => {
              const info = getWasteInfo(item.wasteType);
              const days = getDaysUntil(item.date);
              const isPast = days < 0;

              return (
                <div
                  key={item.id}
                  className={`py-4 flex items-center justify-between gap-4 group transition-colors hover:bg-surface-elevated/40 px-3 rounded-2xl ${
                    isPast ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${info.bg} ${info.iconColor} border ${info.border} shrink-0 shadow-inner text-xl`}
                    >
                      {info.emoji}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-surface-cream">
                          {info.title}
                        </span>
                        {!isPast && days <= 1 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              days === 0
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            }`}
                          >
                            {days === 0 ? 'Heute Abholung' : 'Morgen (heute rausstellen!)'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-surface-muted flex items-center gap-2 mt-0.5 font-sans">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {new Date(item.date).toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        {item.notes && <span className="text-surface-muted/70">• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title="Termin löschen"
                      className="p-2 text-surface-muted hover:text-rose-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
