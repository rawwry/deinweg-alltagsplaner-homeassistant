import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { CaregiverNoteSummary } from '../../../../shared/types.js';
import { formatGermanDateTime } from '../../utils/formatters.js';
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
  Lock,
  Globe,
  Check,
} from 'lucide-react';

export const CaregiverNotesView: React.FC = () => {
  const { user, activeLocationId, activeLocation } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [notes, setNotes] = useState<CaregiverNoteSummary[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Response input state per ticket
  const [threadReplyInputs, setThreadReplyInputs] = useState<Record<string, string>>({});
  const [isSubmittingMap, setIsSubmittingMap] = useState<Record<string, boolean>>({});

  const [residents, setResidents] = useState<any[]>([]);
  const [targetResidentId, setTargetResidentId] = useState<string>('');

  useEffect(() => {
    if (isStaff && activeLocationId) {
      api.users.list(activeLocationId)
        .then((users) => {
          const resList = (users || []).filter((u: any) => u.role === 'BEWOHNER');
          setResidents(resList);
          if (resList.length > 0) {
            setTargetResidentId(resList[0].id);
          }
        })
        .catch((e) => console.warn('Konnte Bewohner nicht laden:', e));
    }
  }, [isStaff, activeLocationId]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const isArchived = activeTab === 'ARCHIVE';
      const data = await api.notes.list(activeLocationId, isArchived);
      setNotes(data);

      // Auto-mark unread notes as read for resident
      if (!isStaff) {
        data.filter(n => n.hasUnreadResponse && n.residentId === user?.id).forEach(n => {
          api.notes.markRead(n.id).catch(() => {});
        });
      }
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

    if (isStaff && isPrivate && !targetResidentId) {
      alert('Bitte wähle einen Bewohner aus, an den die Mitteilung gerichtet ist.');
      return;
    }

    try {
      await api.notes.create({
        title: title.trim(),
        content: content.trim(),
        locationId: activeLocationId,
        residentId: isStaff && isPrivate ? targetResidentId : undefined,
        isPrivate,
      });

      setTitle('');
      setContent('');
      setIsPrivate(false);
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

  const handleSendThreadMessage = async (noteId: string) => {
    const text = threadReplyInputs[noteId]?.trim();
    if (!text) return;

    try {
      setIsSubmittingMap((prev) => ({ ...prev, [noteId]: true }));
      const updated = await api.notes.addMessage(noteId, text);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setThreadReplyInputs((prev) => ({ ...prev, [noteId]: '' }));
    } catch (err: any) {
      alert(`Fehler beim Senden der Antwort: ${err.message || err}`);
    } finally {
      setIsSubmittingMap((prev) => ({ ...prev, [noteId]: false }));
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/15 border border-rose-500/30 rounded-full text-xs font-semibold text-rose-300 mb-2 font-display">
            <span className="text-sm">📻</span>
            <span>Flurfunk & Mitteilungen</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-rose-400" />
            <span>Unser Flurfunk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fragen, Notizen, Wünsche und Absprachen für Bewohner und Betreuer ({activeLocation?.name || user?.locationName || 'Emsdetten'})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-500/25 transition-all self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Neuen Beitrag verfassen</span>
        </button>
      </div>

      {/* Staff Alert Banner when there are open notes */}
      {isStaff && activeTab === 'ACTIVE' && openTicketsCount > 0 && (
        <div className="bg-gradient-to-r from-rose-500/15 via-surface-card to-surface-card border border-rose-500/40 rounded-3xl p-5 flex items-center gap-3.5 shadow-md">
          <div className="p-2.5 bg-rose-500 text-white rounded-2xl shrink-0 font-bold text-base shadow-sm">
            📌
          </div>
          <div className="flex-1">
            <div className="text-sm font-display font-semibold text-rose-200">
              {openTicketsCount === 1 ? '1 neue Mitteilung wartet auf eine Antwort' : `${openTicketsCount} Mitteilungen warten auf eine Antwort`}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Antworte den Bewohnern oder hake erledigte Absprachen einfach ab.
            </p>
          </div>
        </div>
      )}

      {/* Tabs: Active vs Archive - Modern Segmented Control */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
        <div className="bg-surface-card/90 p-1.5 rounded-2xl border border-surface-border flex items-center gap-1.5 w-full sm:w-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated/60'
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
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'ARCHIVE'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated/60'
            }`}
          >
            <span>✅</span>
            <span>Erledigt & Archiv</span>
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
            <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
              <span>✏️</span>
              <span>Neuen Beitrag für den Flurfunk schreiben</span>
            </h3>
            <span className="text-xs text-slate-400">Verfasser: <strong className="text-slate-200">{user?.name}</strong></span>
          </div>

          {/* Visibility Option */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 font-display">
              Sichtbarkeit des Beitrags
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  !isPrivate
                    ? 'bg-rose-500/15 border-rose-500/40 text-white shadow-sm'
                    : 'bg-surface-elevated border-surface-border text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${!isPrivate ? 'bg-rose-500 text-white' : 'bg-surface-card text-slate-400'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Öffentlich für alle</span>
                    {!isPrivate && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Für alle Bewohner und Betreuer der WG sichtbar.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  isPrivate
                    ? 'bg-purple-500/15 border-purple-500/40 text-white shadow-sm'
                    : 'bg-surface-elevated border-surface-border text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isPrivate ? 'bg-purple-600 text-white' : 'bg-surface-card text-slate-400'}`}>
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{isStaff ? 'Direkt an Bewohner' : 'Privat an Betreuer'}</span>
                    {isPrivate && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {isStaff
                      ? 'Vertrauliche Mitteilung gezielt an einen Bewohner dieser WG.'
                      : 'Nur für dich und das Betreuer-Team des Standorts sichtbar.'}
                  </p>
                </div>
              </button>
            </div>

            {/* Resident dropdown when caregiver sends direct note */}
            {isStaff && isPrivate && (
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1.5 mt-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-purple-300 font-display flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Empfänger (Bewohner auswählen):</span>
                </label>
                {residents.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">
                    Keine Bewohner mit Rolle „BEWOHNER“ an diesem Standort registriert.
                  </div>
                ) : (
                  <select
                    value={targetResidentId}
                    onChange={(e) => setTargetResidentId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer font-sans"
                    required
                  >
                    {residents.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                        {r.name} (@{r.username})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-display">Betreff / Kurztitel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Worum geht es? (z.B. Arzttermin, Waffeleisen leihen, Einkaufswunsch...)"
              className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-display">Nachricht / Anliegen</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Schreibe hier deine Nachricht ausführlicher..."
              rows={4}
              className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setIsPrivate(false);
              }}
              className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              Beitrag veröffentlichen
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-rose-500 border-t-transparent mb-2" />
          <div>Flurfunk wird geladen...</div>
        </div>
      ) : notes.length === 0 ? (
        <div className="bento-card rounded-[2.5rem] p-12 text-center border border-surface-border shadow-xl">
          {activeTab === 'ACTIVE' ? (
            <>
              {/* Relaxing person icon (Flaticon 5522984) */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center p-3.5 shadow-inner">
                <img
                  src="/relax-empty.png"
                  alt="Entspannung"
                  className="w-12 h-12 object-contain opacity-85 invert filter brightness-125 select-none pointer-events-none"
                />
              </div>
              <h3 className="text-base font-display font-semibold text-slate-200">Aktuell kein Flurfunk</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Keine offenen Mitteilungen oder Anliegen vorhanden. Wenn du etwas besprechen möchtest, klicke einfach oben auf „Neuen Beitrag verfassen“.
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">📁 🍃</div>
              <h3 className="text-base font-display font-semibold text-slate-200">Das Archiv ist leer</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Erledigte Notizen und geklärte Absprachen werden hier aufbewahrt.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const hasMessages = note.messages && note.messages.length > 0;
            const canReply = !note.isArchived;

            return (
              <div
                key={note.id}
                className={`bento-card rounded-[2.5rem] p-6 sm:p-7 border shadow-md transition-all ${
                  note.isArchived
                    ? 'border-surface-border opacity-75'
                    : note.isPrivate
                    ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent'
                    : note.status === 'IN_PROGRESS'
                    ? 'border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-transparent'
                    : 'border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-transparent hover:border-rose-500/50'
                }`}
              >
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-display ${
                        note.isArchived
                          ? 'bg-surface-elevated text-slate-400 border border-surface-border'
                          : note.status === 'IN_PROGRESS'
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {note.isArchived ? 'Gelöst & Archiviert' : note.status === 'IN_PROGRESS' ? 'In Bearbeitung' : 'Neu / Offen'}
                    </span>

                    {/* Visibility Badge */}
                    {note.isPrivate ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-display">
                        <Lock className="w-3 h-3 text-purple-400" />
                        <span>{isStaff ? `Direkt an ${note.residentName}` : 'Nur für Betreuer'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-slate-400 border border-surface-border flex items-center gap-1 font-display">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>Öffentlich</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {formatGermanDateTime(note.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <User className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {note.isPrivate ? 'An: ' : 'Von: '}
                      <span className="text-white font-bold">{note.residentName}</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-display font-semibold text-white">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line font-normal">
                  {note.content}
                </p>

                {/* Thread / Conversation History */}
                {hasMessages ? (
                  <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2.5">
                    <div className="text-[11px] font-display font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                      <span>Gesprächsverlauf ({note.messages!.length})</span>
                    </div>

                    <div className="space-y-2">
                      {note.messages!.map((msg) => {
                        const isStaffMsg = msg.authorRole === 'BETREUER' || msg.authorRole === 'ADMIN';
                        return (
                          <div
                            key={msg.id}
                            className={`p-3.5 rounded-2xl border text-xs ${
                              isStaffMsg
                                ? 'bg-rose-500/10 border-rose-500/25 ml-2 sm:ml-5'
                                : 'bg-surface-elevated/70 border-surface-border mr-2 sm:mr-5'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0"
                                  style={{ backgroundColor: msg.authorAvatarColor || (isStaffMsg ? '#f43f5e' : '#3b82f6') }}
                                >
                                  {msg.authorName.charAt(0)}
                                </div>
                                <span className="font-semibold text-slate-200">
                                  {msg.authorName}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 font-bold rounded-md uppercase tracking-wider ${
                                    isStaffMsg
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  }`}
                                >
                                  {isStaffMsg ? 'Betreuer' : 'Bewohner'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatGermanDateTime(msg.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-200 whitespace-pre-line leading-relaxed pl-7 font-normal">
                              {msg.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : note.caregiverResponse ? (
                  /* Legacy response fallback if no messages array yet */
                  <div className="mt-4 p-4 sm:p-5 bg-surface-elevated/70 border border-rose-500/30 rounded-2xl">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-display font-bold text-rose-300 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-rose-400" />
                        Rückmeldung von {note.respondedByName || 'Betreuer'}
                      </span>
                      {note.respondedAt && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatGermanDateTime(note.respondedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                      {note.caregiverResponse}
                    </p>
                  </div>
                ) : null}

                {/* Inline Thread Reply Input (for Active Notes) */}
                {canReply && (
                  <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center gap-2">
                    <input
                      type="text"
                      value={threadReplyInputs[note.id] || ''}
                      onChange={(e) =>
                        setThreadReplyInputs((prev) => ({ ...prev, [note.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendThreadMessage(note.id);
                        }
                      }}
                      placeholder="Auf Mitteilung antworten..."
                      className="flex-1 px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendThreadMessage(note.id)}
                      disabled={!threadReplyInputs[note.id]?.trim() || isSubmittingMap[note.id]}
                      className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Antworten</span>
                    </button>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    {/* Resolve Button (Active tab) */}
                    {!note.isArchived ? (
                      <button
                        type="button"
                        onClick={() => handleResolveTicket(note.id)}
                        className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Als erledigt markieren & archivieren</span>
                      </button>
                    ) : (
                      /* Reopen Button (Archive tab) */
                      <button
                        type="button"
                        onClick={() => handleReopenTicket(note.id)}
                        className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-200 border border-surface-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
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
