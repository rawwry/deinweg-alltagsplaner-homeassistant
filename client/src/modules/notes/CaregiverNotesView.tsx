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
      <div className="bg-surface-card rounded-[2.5rem] p-6 border border-surface-border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-xs font-bold text-amber-300 mb-2 font-display">
            <span className="text-sm">📌</span>
            <span>WG-Pinnwand & Mitteilungen</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
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
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Neue Notiz anpinnen</span>
        </button>
      </div>

      {/* Staff Alert Banner when there are open notes */}
      {isStaff && activeTab === 'ACTIVE' && openTicketsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-surface-card to-surface-card border border-amber-500/40 rounded-3xl p-5 flex items-center gap-3.5 shadow-md">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shrink-0 font-bold text-base shadow-sm">
            📌
          </div>
          <div className="flex-1">
            <div className="text-sm font-display font-bold text-amber-200">
              {openTicketsCount === 1 ? '1 neue Mitteilung wartet auf eine Antwort' : `${openTicketsCount} Mitteilungen warten auf eine Antwort`}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Antworte den Bewohnern oder hake erledigte Absprachen einfach ab.
            </p>
          </div>
        </div>
      )}

      {/* Tabs: Active vs Archive */}
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-2xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-surface-elevated text-slate-400 hover:text-white border border-surface-border'
            }`}
          >
            <span>📌</span>
            <span>Aktuelle Notizen</span>
            {activeTab === 'ACTIVE' && notes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/30 text-white font-mono">
                {notes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVE')}
            className={`px-4 py-2 rounded-2xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ARCHIVE'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-surface-elevated text-slate-400 hover:text-white border border-surface-border'
            }`}
          >
            <span>✅</span>
            <span>Erledigt & Archiviert</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline-block font-medium">
          {activeTab === 'ACTIVE' ? 'Offene Mitteilungen & Absprachen' : 'Erledigte Mitteilungen'}
        </span>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateNote}
          className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
              <span>✏️</span>
              <span>Neue Notiz für die WG oder Betreuer schreiben</span>
            </h3>
            <span className="text-xs text-slate-400">Verfasser: <strong className="text-slate-200">{user?.name}</strong></span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-display">Betreff / Kurztitel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Termin beim Bürgeramt, Rezept vom Arzt abholen, Neue Zahnpasta..."
              className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-display">Genaue Beschreibung</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Was genau soll erledigt werden? Gibt es bestimmte Fristen oder Wünsche?"
              className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-sans"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>Notiz anpinnen 📌</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-500 border-t-transparent mb-2" />
          <div>Pinnwand wird geladen...</div>
        </div>
      ) : notes.length === 0 ? (
        <div className="bento-card rounded-[2.5rem] p-12 text-center border border-surface-border shadow-xl">
          {activeTab === 'ACTIVE' ? (
            <>
              <div className="text-4xl mb-3">🎉 📌 ☕</div>
              <h3 className="text-base font-display font-bold text-slate-200">Alles erledigt & geklärt!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Die Pinnwand ist aktuell sauber. Wenn du ein Anliegen oder eine Frage hast, klicke einfach oben auf „Neue Notiz anpinnen“.
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">📁 🍃</div>
              <h3 className="text-base font-display font-bold text-slate-200">Das Archiv ist leer</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
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
                className={`bento-card rounded-[2.5rem] p-6 sm:p-7 border shadow-md transition-all ${
                  note.isArchived
                    ? 'border-surface-border opacity-75'
                    : note.status === 'IN_PROGRESS'
                    ? 'border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-transparent'
                    : 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent hover:border-amber-500/50'
                }`}
              >
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-display ${
                        note.isArchived
                          ? 'bg-surface-elevated text-slate-400 border border-surface-border'
                          : note.status === 'IN_PROGRESS'
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {note.isArchived ? 'Gelöst & Archiviert' : note.status === 'IN_PROGRESS' ? 'In Bearbeitung' : 'Neu / Offen'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
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
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Von: <span className="text-white font-bold">{note.residentName}</span></span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-display font-bold text-white">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line font-normal">
                  {note.content}
                </p>

                {/* Caregiver Response Display */}
                {note.caregiverResponse && (
                  <div className="mt-4 p-4 sm:p-5 bg-surface-elevated/70 border border-amber-500/30 rounded-2xl">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-display font-bold text-amber-300 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        Rückmeldung von {note.respondedByName || 'Betreuer'}
                      </span>
                      {note.respondedAt && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(note.respondedAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                      {note.caregiverResponse}
                    </p>
                  </div>
                )}

                {/* Inline Reply Form (Caregivers) */}
                {isReplying && (
                  <div className="mt-4 p-4 sm:p-5 bg-surface-card border border-amber-500/40 rounded-2xl space-y-3 animate-in fade-in duration-150">
                    <div className="text-xs font-display font-bold text-amber-300 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span>Rückmeldung an {note.residentName} verfassen</span>
                    </div>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="z.B. Termin ist vereinbart, ich komme morgen um 14 Uhr vorbei..."
                      className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-sans"
                    />
                    <div className="flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText('');
                        }}
                        className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendReply(note.id)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Antwort speichern</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    {/* Caregiver Reply Toggle */}
                    {isStaff && !note.isArchived && !isReplying && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(note.id);
                          setReplyText(note.caregiverResponse || '');
                        }}
                        className="px-3.5 py-2 bg-surface-elevated hover:bg-surface-card hover:text-amber-300 text-slate-200 border border-surface-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>{note.caregiverResponse ? 'Antwort bearbeiten' : 'Rückmeldung geben'}</span>
                      </button>
                    )}

                    {/* Resolve Button (Active tab) */}
                    {!note.isArchived ? (
                      <button
                        type="button"
                        onClick={() => handleResolveTicket(note.id)}
                        className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Als gelöst markieren & archivieren</span>
                      </button>
                    ) : (
                      /* Reopen Button (Archive tab) */
                      <button
                        type="button"
                        onClick={() => handleReopenTicket(note.id)}
                        className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-200 border border-surface-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Wiedereröffnen</span>
                      </button>
                    )}
                  </div>

                  {/* Delete Button */}
                  {(isStaff || note.residentId === user?.id) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      title="Notiz löschen"
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors cursor-pointer"
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
