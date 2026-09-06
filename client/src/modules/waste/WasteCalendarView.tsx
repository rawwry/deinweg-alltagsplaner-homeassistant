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
          bg: 'bg-amber-950/70',
          border: 'border-amber-700/80',
          badge: 'bg-amber-500 text-slate-950 font-bold',
          iconColor: 'text-amber-400',
        };
      case 'BIO':
        return {
          title: 'Biotonne (Grün/Braun)',
          bg: 'bg-emerald-950/70',
          border: 'border-emerald-700/80',
          badge: 'bg-emerald-500 text-slate-950 font-bold',
          iconColor: 'text-emerald-400',
        };
      case 'PAPER':
        return {
          title: 'Papiertonne (Blau)',
          bg: 'bg-sky-950/70',
          border: 'border-sky-700/80',
          badge: 'bg-sky-500 text-slate-950 font-bold',
          iconColor: 'text-sky-400',
        };
      case 'REST':
      default:
        return {
          title: 'Restmülltonne (Schwarz)',
          bg: 'bg-slate-800/80',
          border: 'border-slate-700',
          badge: 'bg-slate-700 text-slate-100 font-bold',
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
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl shadow-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-sky-400" />
            <span>Standort-Abfallkalender</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Abfuhrtermine & 1-Tag-Vorlauf-Erinnerungen ({activeLocation?.name || user?.locationName || 'Emsdetten'})
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Termin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIcsImport(!showIcsImport)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/30 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>ICS Import</span>
          </button>
        </div>
      </div>

      {/* 1-Day Advance Reminder Banner */}
      {isAdvanceReminder && nextPickup && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/50 to-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 shadow-lg shadow-amber-950/40 flex items-start gap-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shrink-0 mt-0.5 shadow-md">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-950/90 border border-amber-600/60 px-2.5 py-0.5 rounded-full">
                {daysUntilNext === 1 ? '1 Tag Vorlauf • Erinnerung' : 'Heute fällig!'}
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-100 mt-1">
              {daysUntilNext === 1 ? (
                <>
                  Morgen wird die <span className="underline decoration-amber-400">{getWasteInfo(nextPickup.wasteType).title}</span> geholt!
                </>
              ) : (
                <>
                  Heute wird die <span className="underline decoration-amber-400">{getWasteInfo(nextPickup.wasteType).title}</span> abgeholt!
                </>
              )}
            </h3>
            <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
              {daysUntilNext === 1
                ? 'Bitte stelle die Tonne bzw. die Wertstoffsäcke heute Abend an die Straße (bis 6:00 Uhr morgens bereitstellen).'
                : 'Die Abholung erfolgt im Laufe des Tages. Nach der Leerung bitte wieder zurückstellen.'}
            </p>
          </div>
        </div>
      )}

      {/* Next Pickup Highlight Card */}
      {nextPickup && (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl shadow-black/30">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-800">
              Nächste Abholung
            </span>
            <div
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                daysUntilNext === 0
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : daysUntilNext === 1
                  ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {daysUntilNext === 0
                ? 'Heute fällig!'
                : daysUntilNext === 1
                ? 'Morgen (heute Abend rausstellen!)'
                : `In ${daysUntilNext} Tagen`}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getWasteInfo(nextPickup.wasteType).bg} ${getWasteInfo(nextPickup.wasteType).iconColor} border ${getWasteInfo(nextPickup.wasteType).border} shrink-0 shadow-inner`}
            >
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {getWasteInfo(nextPickup.wasteType).title}
              </h2>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
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
                <div className="text-xs text-slate-400 mt-1 italic">
                  Hinweis: {nextPickup.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl shadow-black/20 space-y-3 animate-in fade-in duration-150"
        >
          <h3 className="text-sm font-bold text-slate-100">Abfuhrtermin manuell eintragen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Datum</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Müllart / Tonne</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as WasteType)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="YELLOW">Gelber Sack / Wertstoff</option>
                <option value="BIO">Biotonne (Grün)</option>
                <option value="REST">Restmüll (Schwarz)</option>
                <option value="PAPER">Papiertonne (Blau)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hinweis (optional)</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="z.B. ab 6:00 Uhr"
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Speichern
            </button>
          </div>
        </form>
      )}

      {/* ICS Import Form */}
      {showIcsImport && (
        <form
          onSubmit={handleIcsImport}
          className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl shadow-black/20 space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">
              ICS-Kalenderdatei importieren
            </h3>
            <span className="text-xs text-slate-400">
              (z.B. digitaler Abfallkalender der Stadt Emsdetten / Kreis Steinfurt)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              .ics-Datei auswählen oder Inhalt unten einfügen:
            </label>
            <input
              type="file"
              accept=".ics,text/calendar"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-950 file:text-sky-300 hover:file:bg-sky-900 cursor-pointer"
            />
          </div>

          <div>
            <textarea
              rows={4}
              value={icsText}
              onChange={(e) => setIcsText(e.target.value)}
              placeholder="BEGIN:VCALENDAR... (oder Datei oben auswählen)"
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {importStatus && (
            <div className="text-xs p-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium border border-slate-700">
              {importStatus}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowIcsImport(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Schließen
            </button>
            <button
              type="submit"
              disabled={!icsText.trim()}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              Termine einlesen
            </button>
          </div>
        </form>
      )}

      {/* Pickups Timeline */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-500 border-t-transparent mb-2"></div>
          <div>Abfalltermine werden geladen...</div>
        </div>
      ) : pickups.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800">
          <Trash2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Keine Abholtermine hinterlegt</h3>
          <p className="text-xs text-slate-500 mt-1">
            Lade eine ICS-Datei des Entsorgers hoch oder trage Termine manuell ein.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl shadow-black/20">
          <h3 className="text-sm font-bold text-slate-100 mb-4">
            Anstehende Abfuhrtermine ({pickups.length})
          </h3>

          <div className="divide-y divide-slate-800">
            {pickups.map((item) => {
              const info = getWasteInfo(item.wasteType);
              const days = getDaysUntil(item.date);
              const isPast = days < 0;

              return (
                <div
                  key={item.id}
                  className={`py-3.5 flex items-center justify-between gap-4 group ${
                    isPast ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${info.bg} ${info.iconColor} border ${info.border} shrink-0 shadow-inner`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">
                          {info.title}
                        </span>
                        {!isPast && days <= 1 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              days === 0
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                            }`}
                          >
                            {days === 0 ? 'Heute Abholung' : 'Morgen (heute rausstellen!)'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>
                          {new Date(item.date).toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        {item.notes && <span className="text-slate-500">• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title="Termin löschen"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
