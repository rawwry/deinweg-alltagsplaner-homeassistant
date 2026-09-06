import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { CaregiverNoteSummary } from '../../../../shared/types.js';
import { MessageSquareText, Plus, CheckCircle2, Clock, Trash2, Send, Filter, User } from 'lucide-react';

export const CaregiverNotesView: React.FC = () => {
  const { user, activeLocationId, activeLocation } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  const [notes, setNotes] = useState<CaregiverNoteSummary[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const data = await api.notes.list(activeLocationId);
      setNotes(data);
    } catch (err) {
      console.error('Fehler beim Laden der Notizen:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activeLocationId]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      await api.notes.create({
        title: title.trim(),
        content: content.trim(),
        locationId: activeLocationId,
      });

      setTitle('');
      setContent('');
      setShowAddForm(false);
      fetchNotes();
    } catch (err) {
      console.error('Fehler beim Erstellen der Notiz:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await api.notes.updateStatus(id, newStatus);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
      );
    } catch (err) {
      console.error('Fehler beim Ändern des Status:', err);
      fetchNotes();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.notes.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Fehler beim Löschen der Notiz:', err);
    }
  };

  const filtered = notes.filter((n) => {
    if (filterStatus === 'ALL') return true;
    return n.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-amber-400" />
            <span>Bewohner-Notizen & Betreuer-Infos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persönliche To-Dos, Termine und wichtige Mitteilungen an das Betreuerteam ({activeLocation?.name || user?.locationName || 'Emsdetten'})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Notiz verfassen</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateNote}
          className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm space-y-3 animate-in fade-in duration-150"
        >
          <h3 className="text-sm font-bold text-slate-100">Neue Mitteilung / To-Do</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Titel / Betreff</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Arzttermin am Donnerstag, Neue Schuhe benötigt..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Details & Beschreibung</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Genaue Beschreibung für die Betreuer..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Notiz absenden</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <Filter className="w-4 h-4 text-slate-500" />
        {['ALL', 'OPEN', 'IN_PROGRESS', 'DONE'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filterStatus === s
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-750'
            }`}
          >
            {s === 'ALL' && 'Alle'}
            {s === 'OPEN' && 'Offen'}
            {s === 'IN_PROGRESS' && 'In Bearbeitung'}
            {s === 'DONE' && 'Erledigt'}
          </button>
        ))}
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-500 border-t-transparent mb-2"></div>
          <div>Notizen werden geladen...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800">
          <MessageSquareText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Keine Notizen vorhanden</h3>
          <p className="text-xs text-slate-400 mt-1">
            Erstelle eine Notiz, um To-Dos oder Anliegen für die Betreuer festzuhalten.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((note) => (
            <div
              key={note.id}
              className={`bg-slate-900 rounded-3xl p-5 border shadow-sm transition-all ${
                note.status === 'DONE'
                  ? 'border-slate-850 opacity-60 bg-slate-950/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      note.status === 'OPEN'
                        ? 'bg-amber-950/70 text-amber-400 border border-amber-800/40'
                        : note.status === 'IN_PROGRESS'
                        ? 'bg-sky-950/70 text-sky-400 border border-sky-800/40'
                        : 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {note.status === 'OPEN' && 'Offen'}
                    {note.status === 'IN_PROGRESS' && 'In Bearbeitung'}
                    {note.status === 'DONE' && 'Erledigt'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(note.createdAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bewohner: {note.residentName}</span>
                </div>
              </div>

              <h3 className={`text-base font-bold text-slate-100 ${note.status === 'DONE' ? 'line-through text-slate-500' : ''}`}>
                {note.title}
              </h3>

              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line">
                {note.content}
              </p>

              {/* Status Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium text-[11px] mr-1">Status setzen:</span>
                  {note.status !== 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(note.id, 'OPEN')}
                      className="px-2 py-1 bg-slate-800 hover:bg-amber-950/60 hover:text-amber-300 text-slate-300 border border-slate-700/50 rounded-lg text-[11px] font-medium transition-colors"
                    >
                      Offen
                    </button>
                  )}
                  {note.status !== 'IN_PROGRESS' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(note.id, 'IN_PROGRESS')}
                      className="px-2 py-1 bg-slate-800 hover:bg-sky-950/60 hover:text-sky-300 text-slate-300 border border-slate-700/50 rounded-lg text-[11px] font-medium transition-colors"
                    >
                      In Bearbeitung
                    </button>
                  )}
                  {note.status !== 'DONE' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(note.id, 'DONE')}
                      className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Erledigt</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  title="Notiz löschen"
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
