import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { CaregiverNoteSummary } from '../../../../shared/types.js';
import {
  MessageSquareText,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Send,
  User,
  Archive,
  RotateCcw,
  Bell,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const CaregiverNotesView: React.FC = () => {
  const { user, activeLocationId, activeLocation } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [notes, setNotes] = useState<CaregiverNoteSummary[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Response input state per ticket
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const isArchived = activeTab === 'ARCHIVE';
      const data = await api.notes.list(activeLocationId, isArchived);
      setNotes(data);
    } catch (err) {
      console.error('Fehler beim Laden der Tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activeLocationId, activeTab]);

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
      if (activeTab !== 'ACTIVE') {
        setActiveTab('ACTIVE');
      } else {
        fetchNotes();
      }
    } catch (err) {
      console.error('Fehler beim Erstellen der Notiz:', err);
    }
  };

  const handleSendReply = async (noteId: string) => {
    if (!replyText.trim()) return;

    try {
      setIsSubmittingReply(true);
      const updated = await api.notes.respond(noteId, replyText.trim());
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setReplyingId(null);
      setReplyText('');
    } catch (err: any) {
      alert(`Fehler beim Senden der Antwort: ${err.message || err}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleResolveTicket = async (id: string) => {
    try {
      await api.notes.resolve(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(`Fehler beim Lösen des Tickets: ${err.message || err}`);
    }
  };

  const handleReopenTicket = async (id: string) => {
    try {
      await api.notes.reopen(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(`Fehler beim Wiedereröffnen: ${err.message || err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchtest du diese Notiz wirklich endgültig löschen?')) {
      return;
    }
    try {
      await api.notes.delete(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Fehler beim Löschen der Notiz:', err);
    }
  };

  const openTicketsCount = activeTab === 'ACTIVE' ? notes.filter((n) => n.status !== 'DONE').length : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl shadow-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400 mb-2">
            <span className="text-sm">📌</span>
            <span>WG-Pinnwand & Mitteilungen</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-amber-400" />
            <span>Unsere WG-Pinnwand</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fragen, Notizen, Wünsche und Absprachen für Bewohner und Betreuer ({activeLocation?.name || user?.locationName || 'Emsdetten'})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Neue Notiz anpinnen</span>
        </button>
      </div>

      {/* Staff Alert Banner when there are open notes */}
      {isStaff && activeTab === 'ACTIVE' && openTicketsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/50 rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 shadow-md">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shrink-0 font-bold text-base">
            📌
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-amber-100">
              {openTicketsCount === 1 ? '1 neue Mitteilung wartet auf eine Antwort' : `${openTicketsCount} Mitteilungen warten auf eine Antwort`}
            </div>
            <p className="text-xs text-amber-200/70 mt-0.5">
              Antworte den Bewohnern oder hake erledigte Absprachen einfach ab.
            </p>
          </div>
        </div>
      )}

      {/* Tabs: Active vs Archive */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-2xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>📌</span>
            <span>Aktuelle Notizen</span>
            {activeTab === 'ACTIVE' && notes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950/40 text-slate-900">
                {notes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVE')}
            className={`px-4 py-2 rounded-2xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ARCHIVE'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>✅</span>
            <span>Erledigt & Archiviert</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline-block">
          {activeTab === 'ACTIVE' ? 'Offene Mitteilungen & Absprachen' : 'Erledigte Mitteilungen'}
        </span>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateNote}
          className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl shadow-black/20 space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>✏️</span>
              <span>Neue Notiz für die WG oder Betreuer schreiben</span>
            </h3>
            <span className="text-xs text-slate-400">Verfasser: {user?.name}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Betreff / Kurztitel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Termin beim Bürgeramt, Rezept vom Arzt abholen, Neue Zahnpasta..."
              className="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Genaue Beschreibung</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Was genau soll erledigt werden? Gibt es bestimmte Fristen oder Wünsche?"
              className="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Notiz anpinnen 📌</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-500 border-t-transparent mb-2"></div>
          <div>Pinnwand wird geladen...</div>
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 shadow-sm">
          {activeTab === 'ACTIVE' ? (
            <>
              <div className="text-4xl mb-3">🎉 📌 ☕</div>
              <h3 className="text-base font-bold text-slate-200">Alles erledigt & geklärt!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Die Pinnwand ist aktuell sauber. Wenn du ein Anliegen oder eine Frage hast, klicke einfach oben auf „Neue Notiz anpinnen“.
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">📁 🍃</div>
              <h3 className="text-base font-bold text-slate-200">Das Archiv ist leer</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Erledigte Notizen und geklärte Absprachen werden hier aufbewahrt.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const isReplying = replyingId === note.id;

            return (
              <div
                key={note.id}
                className={`bg-slate-900 rounded-3xl p-5 sm:p-6 border shadow-sm transition-all ${
                  note.isArchived
                    ? 'border-slate-800/80 bg-slate-950/40 opacity-75'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        note.isArchived
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : note.status === 'IN_PROGRESS'
                          ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-800/60 animate-pulse'
                      }`}
                    >
                      {note.isArchived ? 'Gelöst & Archiviert' : note.status === 'IN_PROGRESS' ? 'In Bearbeitung' : 'Neu / Offen'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(note.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Von: <span className="text-slate-200 font-semibold">{note.residentName}</span></span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-slate-100">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>

                {/* Caregiver Response Display */}
                {note.caregiverResponse && (
                  <div className="mt-4 p-4 bg-slate-950/60 border border-sky-900/40 rounded-2xl">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-sky-400 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-sky-400" />
                        Rückmeldung von {note.respondedByName || 'Betreuer'}
                      </span>
                      {note.respondedAt && (
                        <span className="text-[11px] text-slate-500">
                          {new Date(note.respondedAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {note.caregiverResponse}
                    </p>
                  </div>
                )}

                {/* Inline Reply Form (Caregivers) */}
                {isReplying && (
                  <div className="mt-4 p-4 bg-slate-950/80 border border-amber-800/60 rounded-2xl space-y-3 animate-in fade-in duration-150">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span>Rückmeldung an {note.residentName} verfassen</span>
                    </div>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="z.B. Termin ist vereinbart, ich komme morgen um 14 Uhr vorbei..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText('');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendReply(note.id)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Antwort speichern</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Caregiver Reply Toggle */}
                    {isStaff && !note.isArchived && !isReplying && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(note.id);
                          setReplyText(note.caregiverResponse || '');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-sky-950/70 hover:text-sky-300 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        <span>{note.caregiverResponse ? 'Antwort bearbeiten' : 'Rückmeldung geben'}</span>
                      </button>
                    )}

                    {/* Resolve Button (Active tab) */}
                    {!note.isArchived ? (
                      <button
                        type="button"
                        onClick={() => handleResolveTicket(note.id)}
                        className="px-3.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Als gelöst markieren & archivieren</span>
                      </button>
                    ) : (
                      /* Reopen Button (Archive tab) */
                      <button
                        type="button"
                        onClick={() => handleReopenTicket(note.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                        <span>Wiedereröffnen</span>
                      </button>
                    )}
                  </div>

                  {/* Delete Button */}
                  {(isStaff || note.residentId === user?.id) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      title="Ticket löschen"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
