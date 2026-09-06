import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { WastePickupSummary, WasteType } from '../../../../shared/types.js';
import { Trash2, Calendar, Plus, Upload, Clock, Trash, AlertCircle, CheckCircle } from 'lucide-react';

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
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          badge: 'bg-amber-400 text-amber-950',
          iconColor: 'text-amber-500',
        };
      case 'BIO':
        return {
          title: 'Biotonne (Grün/Braun)',
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          badge: 'bg-emerald-500 text-white',
          iconColor: 'text-emerald-600',
        };
      case 'PAPER':
        return {
          title: 'Papiertonne (Blau)',
          bg: 'bg-sky-50',
          border: 'border-sky-300',
          badge: 'bg-sky-500 text-white',
          iconColor: 'text-sky-600',
        };
      case 'REST':
      default:
        return {
          title: 'Restmülltonne (Schwarz)',
          bg: 'bg-slate-100',
          border: 'border-slate-300',
          badge: 'bg-slate-800 text-white',
          iconColor: 'text-slate-700',
        };
    }
  };

  // Filter future or today's pickups
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingPickups = pickups.filter((p) => p.date >= todayStr);
  const nextPickup = upcomingPickups.length > 0 ? upcomingPickups[0] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-sky-600" />
            <span>Standort-Abfallkalender</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Abfuhrtermine für Restmüll, Biomüll, Papiertonne & Wertstoffsack ({activeLocation?.name || user?.locationName || 'Emsdetten'})
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Termin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIcsImport(!showIcsImport)}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>ICS Import</span>
          </button>
        </div>
      </div>

      {/* Next Pickup Highlight Card */}
      {nextPickup && (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 border-2 border-sky-300 shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Nächste Abholung
            </span>
            <div className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-full">
              {getDaysUntil(nextPickup.date) === 0
                ? 'Heute fällig!'
                : getDaysUntil(nextPickup.date) === 1
                ? 'Morgen an die Straße stellen!'
                : `In ${getDaysUntil(nextPickup.date)} Tagen`}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getWasteInfo(nextPickup.wasteType).bg} ${getWasteInfo(nextPickup.wasteType).iconColor} border ${getWasteInfo(nextPickup.wasteType).border}`}>
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {getWasteInfo(nextPickup.wasteType).title}
              </h2>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                <div className="text-xs text-slate-600 mt-1 italic">
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
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 animate-in fade-in duration-150"
        >
          <h3 className="text-sm font-bold text-slate-800">Abfuhrtermin manuell eintragen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Datum</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Müllart / Tonne</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as WasteType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="YELLOW">Gelber Sack / Wertstoff</option>
                <option value="BIO">Biotonne (Grün)</option>
                <option value="REST">Restmüll (Schwarz)</option>
                <option value="PAPER">Papiertonne (Blau)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Hinweis (optional)</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="z.B. ab 6:00 Uhr"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs"
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
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              ICS-Kalenderdatei importieren
            </h3>
            <span className="text-xs text-slate-400">
              (z.B. digitaler Abfallkalender der Stadt Emsdetten / Kreis Steinfurt)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              .ics-Datei auswählen oder Inhalt unten einfügen:
            </label>
            <input
              type="file"
              accept=".ics,text/calendar"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
            />
          </div>

          <div>
            <textarea
              rows={4}
              value={icsText}
              onChange={(e) => setIcsText(e.target.value)}
              placeholder="BEGIN:VCALENDAR... (oder Datei oben auswählen)"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {importStatus && (
            <div className="text-xs p-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium">
              {importStatus}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowIcsImport(false)}
              className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
            >
              Schließen
            </button>
            <button
              type="submit"
              disabled={!icsText.trim()}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              Termine einlesen
            </button>
          </div>
        </form>
      )}

      {/* Pickups Timeline */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-600 border-t-transparent mb-2"></div>
          <div>Abfalltermine werden geladen...</div>
        </div>
      ) : pickups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Keine Abholtermine hinterlegt</h3>
          <p className="text-xs text-slate-500 mt-1">
            Lade eine ICS-Datei des Entsorgers hoch oder trage Termine manuell ein.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Anstehende Abfuhrtermine ({pickups.length})
          </h3>

          <div className="divide-y divide-slate-100">
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
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${info.bg} ${info.iconColor} border ${info.border} flex-shrink-0`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          {info.title}
                        </span>
                        {!isPast && days <= 2 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {days === 0 ? 'Heute' : days === 1 ? 'Morgen' : 'In 2 Tagen'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(item.date).toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        {item.notes && <span className="text-slate-400">• {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title="Termin löschen"
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
