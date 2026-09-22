import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { CaregiverNoteSummary, NoteCategory } from '../../../../shared/types.js';
import { formatGermanDate, formatGermanDateTime } from '../../utils/formatters.js';
import {
  MessageSquareText,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Send,
  User,
  RotateCcw,
  MessageSquare,
  Lock,
  Globe,
  Check,
  Pin,
  ChevronDown,
  ChevronUp,
  Calendar,
  Pencil,
  AlertCircle,
  Lightbulb,
  X,
  Eye,
  EyeOff,
  Archive,
  Radio,
} from 'lucide-react';

const NOTE_CATEGORIES: {
  id: NoteCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  buttonClass: string;
  cardClass: string;
}[] = [
  {
    id: 'ANKUENDIGUNG',
    label: 'Ankündigung',
    icon: AlertCircle,
    badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
    buttonClass: 'border-rose-500/50 text-rose-200 bg-rose-500/20',
    cardClass: 'bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/40 hover:border-rose-400/80 text-rose-200 shadow-md shadow-rose-500/5',
  },
  {
    id: 'HINWEIS',
    label: 'Hinweis',
    icon: Lightbulb,
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    buttonClass: 'border-amber-500/50 text-amber-200 bg-amber-500/20',
    cardClass: 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/40 hover:border-amber-400/80 text-amber-200 shadow-md shadow-amber-500/5',
  },
  {
    id: 'ALLGEMEIN',
    label: 'Mitteilung',
    icon: MessageSquare,
    badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
    buttonClass: 'border-sky-500/50 text-sky-200 bg-sky-500/20',
    cardClass: 'bg-sky-500/10 hover:bg-sky-500/15 border-sky-500/40 hover:border-sky-400/80 text-sky-200 shadow-md shadow-sky-500/5',
  },
];

const sortNotes = (items: CaregiverNoteSummary[]): CaregiverNoteSummary[] => {
  return [...items].sort((a, b) => {
    const pA = a.category === 'ANKUENDIGUNG' ? 2 : a.isPinned ? 1 : 0;
    const pB = b.category === 'ANKUENDIGUNG' ? 2 : b.isPinned ? 1 : 0;
    if (pA !== pB) return pB - pA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const CaregiverNotesView: React.FC = () => {
  const { user, activeLocationId, activeLocation } = useAuth();
  const isStaff = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'BETREUER';

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HIDDEN' | 'ARCHIVE'>('ACTIVE');
  const [notes, setNotes] = useState<CaregiverNoteSummary[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('ALLGEMEIN');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Set of expanded card IDs (collapsible messages)
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());

  // Edit note state (staff only)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<NoteCategory>('ALLGEMEIN');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editResidentId, setEditResidentId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
      const sorted = sortNotes(data);
      setNotes(sorted);

      // Auto-mark unread notes as read
      data
        .filter((n) => n.hasUnreadResponse && (!n.respondedByUserId || n.respondedByUserId !== user?.id))
        .forEach((n) => {
          api.notes.markRead(n.id).catch(() => {});
        });

      if (user?.id) {
        try {
          const lastRead: Record<string, string> = JSON.parse(
            localStorage.getItem(`flurfunk_last_read_${user.id}`) || '{}'
          );
          data.forEach((n) => {
            const lastMsg = n.messages && n.messages.length > 0 ? n.messages[n.messages.length - 1] : null;
            if (lastMsg) {
              lastRead[n.id] = new Date(lastMsg.createdAt).toISOString();
            }
          });
          localStorage.setItem(`flurfunk_last_read_${user.id}`, JSON.stringify(lastRead));
        } catch (e) {
          console.error(e);
        }
      }

      // Check if arriving from DashboardHub with a focused note ID
      try {
        const focusId = sessionStorage.getItem('flurfunk_focus_note_id');
        if (focusId) {
          setExpandedNoteIds((prev) => new Set(prev).add(focusId));
          sessionStorage.removeItem('flurfunk_focus_note_id');
          setTimeout(() => {
            const el = document.getElementById(`note-${focusId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 250);
        }
      } catch {
        // ignore
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

  const toggleExpand = (id: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleTogglePin = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.notes.togglePin(id);
      setNotes((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, isPinned: res.isPinned } : n));
        return sortNotes(updated);
      });
    } catch (err: any) {
      alert(`Fehler beim Ändern des Pin-Status: ${err.message || err}`);
    }
  };

  const getFutureDateString = (daysAhead: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().substring(0, 10);
  };

  const handleStartEdit = (note: CaregiverNoteSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const effectiveCategory = (note.category === 'DRINGEND' ? 'ANKUENDIGUNG' : note.category) as NoteCategory || 'ALLGEMEIN';
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(effectiveCategory);
    setEditIsPinned(note.isPinned);
    // Expiry date is ONLY used for announcements
    setEditExpiresAt(effectiveCategory === 'ANKUENDIGUNG' && note.expiresAt ? note.expiresAt.substring(0, 10) : '');
    setEditIsPrivate(Boolean(note.isPrivate));
    setEditResidentId(note.residentId);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent, noteId: string) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;

    try {
      setIsSavingEdit(true);
      const isAnnouncement = editCategory === 'ANKUENDIGUNG';
      const updated = await api.notes.update(noteId, {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
        isPinned: editIsPinned,
        // Only announcements can have a deadline; all other categories have expiresAt cleared (null)
        expiresAt: isAnnouncement && editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        isPrivate: editIsPrivate,
        residentId: (editIsPrivate && editResidentId) ? editResidentId : undefined,
      });

      setNotes((prev) => {
        const next = prev.map((n) => (n.id === noteId ? updated : n));
        return sortNotes(next);
      });
      setEditingNoteId(null);
    } catch (err: any) {
      alert(`Fehler beim Speichern der Notiz: ${err.message || err}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = content.trim();
    if (!finalContent) return;

    let finalTitle = title.trim();
    if (!finalTitle) {
      finalTitle = finalContent.length > 40 ? finalContent.slice(0, 37) + '...' : finalContent;
    }

    if (isStaff && isPrivate && !targetResidentId) {
      alert('Bitte wähle einen Bewohner aus, an den die Mitteilung gerichtet ist.');
      return;
    }

    try {
      const isAnnouncement = isStaff && category === 'ANKUENDIGUNG';
      await api.notes.create({
        title: finalTitle,
        content: finalContent,
        locationId: activeLocationId,
        residentId: isStaff && isPrivate ? targetResidentId : undefined,
        isPrivate,
        category: isStaff ? category : 'ALLGEMEIN',
        isPinned: isStaff ? isPinned : false,
        // Only announcements can have an expiry date
        expiresAt: isStaff && isAnnouncement && expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });

      setTitle('');
      setContent('');
      setCategory('ALLGEMEIN');
      setIsPinned(false);
      setExpiresAt('');
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
      setExpandedNoteIds((prev) => new Set(prev).add(noteId));

      if (user?.id) {
        try {
          const dismissed: string[] = JSON.parse(localStorage.getItem(`flurfunk_dismissed_${user.id}`) || '[]');
          if (!dismissed.includes(noteId)) {
            localStorage.setItem(`flurfunk_dismissed_${user.id}`, JSON.stringify([...dismissed, noteId]));
          }
          const lastRead: Record<string, string> = JSON.parse(localStorage.getItem(`flurfunk_last_read_${user.id}`) || '{}');
          lastRead[noteId] = new Date().toISOString();
          localStorage.setItem(`flurfunk_last_read_${user.id}`, JSON.stringify(lastRead));
        } catch (e) {
          console.error(e);
        }
      }
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

  const handleHideNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isHiddenForMe: true } : n)));
      await api.notes.hide(id);
    } catch (err: any) {
      console.error('Fehler beim Ausblenden:', err);
      alert(`Fehler beim Ausblenden: ${err.message || err}`);
      fetchNotes();
    }
  };

  const handleUnhideNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isHiddenForMe: false } : n)));
      await api.notes.unhide(id);
    } catch (err: any) {
      console.error('Fehler beim Wieder-Einblenden:', err);
      alert(`Fehler beim Wieder-Einblenden: ${err.message || err}`);
      fetchNotes();
    }
  };

  const activeNotes = notes.filter((n) => !n.isHiddenForMe);
  const hiddenNotes = notes.filter((n) => Boolean(n.isHiddenForMe));
  const displayedNotes = activeTab === 'HIDDEN' ? hiddenNotes : (activeTab === 'ACTIVE' ? activeNotes : notes);

  const isAwaitingCaregiverResponse = (n: CaregiverNoteSummary): boolean => {
    if (n.isArchived || n.status === 'DONE' || n.isHiddenForMe) return false;

    const messages = n.messages || [];
    const residentMessages = messages.filter((m) => m.authorRole === 'BEWOHNER');
    const hasStaffResponse = Boolean(n.caregiverResponse) || messages.some((m) => m.authorRole === 'BETREUER' || m.authorRole === 'ADMIN');

    // 1. Announcements (ANKUENDIGUNG): Informational broadcasts, not inquiries.
    // They only need staff response if a resident asked something in the thread and staff hasn't answered yet.
    if (n.category === 'ANKUENDIGUNG') {
      if (residentMessages.length === 0) return false;
      const lastMsg = messages[messages.length - 1];
      return lastMsg?.authorRole === 'BEWOHNER';
    }

    // 2. Posts authored by staff (caregivers or admins):
    // Staff does not need to answer their own post.
    const isStaffAuthor = n.authorRole === 'BETREUER' || n.authorRole === 'ADMIN' || (user?.id ? n.authorId === user.id : false);
    if (isStaffAuthor) {
      if (residentMessages.length === 0) return false;
      const lastMsg = messages[messages.length - 1];
      return lastMsg?.authorRole === 'BEWOHNER';
    }

    // 3. Notes created by residents:
    // If staff has not yet replied or responded:
    if (!hasStaffResponse) {
      return true;
    }

    // If staff replied previously, check if resident replied again afterwards
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      return lastMsg?.authorRole === 'BEWOHNER';
    }

    return false;
  };

  const openTicketsCount = activeTab === 'ACTIVE' ? activeNotes.filter(isAwaitingCaregiverResponse).length : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-surface-card rounded-[2.5rem] p-6 border border-surface-border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/15 border border-rose-500/30 rounded-full text-xs font-semibold text-rose-300 mb-2 font-display">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
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
          <div className="p-2.5 bg-rose-500 text-white rounded-2xl shrink-0 font-bold text-base shadow-sm flex items-center justify-center">
            <Pin className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-display font-semibold text-rose-200">
              {openTicketsCount === 1 ? '1 offene Bewohner-Rückfrage wartet auf eine Antwort' : `${openTicketsCount} offene Bewohner-Rückfragen warten auf eine Antwort`}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Antworte den Bewohnern auf ihre Fragen oder hake erledigte Absprachen einfach ab.
            </p>
          </div>
        </div>
      )}

      {/* Tabs: Active vs Hidden vs Archive - Centered Modern Segmented Control */}
      <div className="flex items-center justify-center w-full border-b border-surface-border/70 pb-4">
        <div className="bg-surface-card/95 p-1.5 rounded-2xl border border-surface-border/80 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto shadow-sm">
          {/* 1. Aktuelle Notizen */}
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
              activeTab === 'ACTIVE'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated/70'
            }`}
          >
            <Pin className="w-4 h-4 shrink-0" />
            <span>Aktuelle Notizen</span>
            {activeNotes.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono transition-colors ${
                  activeTab === 'ACTIVE' ? 'bg-black/25 text-white' : 'bg-surface-elevated text-slate-300'
                }`}
              >
                {activeNotes.length}
              </span>
            )}
          </button>

          {/* 2. Ausgeblendet (Nur für Betreuer/Admin) */}
          {isStaff && (
            <button
              type="button"
              onClick={() => setActiveTab('HIDDEN')}
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
                activeTab === 'HIDDEN'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-surface-elevated/70'
              }`}
            >
              <EyeOff className="w-4 h-4 shrink-0" />
              <span>Ausgeblendet</span>
              {hiddenNotes.length > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono transition-colors ${
                    activeTab === 'HIDDEN' ? 'bg-black/25 text-white' : 'bg-slate-700/80 text-slate-300'
                  }`}
                >
                  {hiddenNotes.length}
                </span>
              )}
            </button>
          )}

          {/* 3. Erledigt & Archiv */}
          <button
            type="button"
            onClick={() => setActiveTab('ARCHIVE')}
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
              activeTab === 'ARCHIVE'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated/70'
            }`}
          >
            <Archive className="w-4 h-4 shrink-0" />
            <span>Erledigt & Archiv</span>
            {activeTab === 'ARCHIVE' && notes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-black/25 text-white">
                {notes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        !isStaff ? (
          /* RESIDENT NOTE FORM - Simplified, accessible, mobile-first */
          <form
            onSubmit={handleCreateNote}
            className="bento-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 border border-surface-border shadow-xl space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm sm:text-base font-display font-bold text-white flex items-center gap-2">
                <span className="text-base sm:text-lg">💬</span>
                <span>Nachricht schreiben</span>
              </h3>
              <span className="text-xs text-slate-400">Verfasser: <strong className="text-slate-200">{user?.name}</strong></span>
            </div>

            {/* Recipient selection - Two simple buttons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 font-display">
                Wer soll deine Nachricht lesen?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    !isPrivate
                      ? 'bg-rose-500/20 border-rose-500 text-white shadow-sm ring-1 ring-rose-500/50'
                      : 'bg-surface-elevated border-surface-border text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${!isPrivate ? 'bg-rose-500 text-white' : 'bg-surface-card text-slate-400'}`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>An alle in der WG</span>
                      {!isPrivate && <Check className="w-3.5 h-3.5 text-rose-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Für alle Bewohner und Betreuer
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isPrivate
                      ? 'bg-purple-500/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-surface-elevated border-surface-border text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isPrivate ? 'bg-purple-600 text-white' : 'bg-surface-card text-slate-400'}`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Nur an Betreuer</span>
                      {isPrivate && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Privat nur an das Betreuer-Team
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Optional Topic Field - Above message textarea like in an email */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-white font-display">
                Thema (optional):
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="freiwillige Betreffzeile"
                className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border focus:border-rose-500/50 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans"
              />
            </div>

            {/* Big Message Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-white font-display">
                Deine Nachricht:
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Schreibe hier, was du fragen oder mitteilen möchtest..."
                rows={4}
                className="w-full px-4 py-3 bg-surface-elevated border border-surface-border focus:border-rose-500/50 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans resize-none"
                required
              />
            </div>

            {/* Actions for Residents */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setIsPrivate(false);
                  setTitle('');
                  setContent('');
                }}
                className="px-4 py-2.5 bg-surface-elevated hover:bg-surface-card text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Nachricht abschicken</span>
              </button>
            </div>
          </form>
        ) : (
          /* STAFF FORM - Full controls with categories, pin, expiry date */
          <form
            onSubmit={handleCreateNote}
            className="bento-card rounded-[2.5rem] p-6 sm:p-7 border border-surface-border shadow-xl space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-rose-400" />
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
                      <span>Direkt an Bewohner</span>
                      {isPrivate && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Vertrauliche Mitteilung gezielt an einen Bewohner dieser WG.
                    </p>
                  </div>
                </button>
              </div>

              {/* Resident dropdown when caregiver sends direct note */}
              {isPrivate && (
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

            {/* Category selection - Only staff can choose categories, residents write Mitteilungen */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 font-display">
                Art des Beitrags (Kategorie)
              </label>
              <div className="flex flex-wrap gap-2">
                {NOTE_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  const CatIcon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        if (cat.id !== 'ANKUENDIGUNG') {
                          setExpiresAt('');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? `${cat.buttonClass} ring-2 ring-rose-500/40 scale-102 font-bold`
                          : 'bg-surface-elevated border-surface-border text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CatIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caregiver extra settings: Pin & Expiry */}
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-surface-border cursor-pointer hover:border-surface-hover transition-colors">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500/40 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Oben anpinnen</span>
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Bleibt immer oben an erster Stelle im Flurfunk
                  </span>
                </div>
              </label>

              {/* Ablaufdatum / Frist: NUR BEI ANKÜNDIGUNGEN */}
              {category === 'ANKUENDIGUNG' && (
                <div>
                  {expiresAt ? (
                    <div className="p-3.5 rounded-2xl bg-surface-elevated border border-rose-500/30 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5 font-display">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          <span>Frist / Ablaufdatum</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setExpiresAt('')}
                          className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-surface-card transition-colors cursor-pointer"
                          title="Frist entfernen"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Frist entfernen</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="date"
                              value={expiresAt}
                              onChange={(e) => setExpiresAt(e.target.value)}
                              style={{ colorScheme: 'dark' }}
                              className="w-full h-10 min-h-[40px] px-3.5 py-2 bg-surface-card border border-surface-border focus:border-rose-500/50 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans"
                            />
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setExpiresAt(getFutureDateString(3))}
                              className="px-2.5 py-2 bg-surface-card hover:bg-surface-hover border border-surface-border rounded-xl text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              +3 Tage
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpiresAt(getFutureDateString(7))}
                              className="px-2.5 py-2 bg-surface-card hover:bg-surface-hover border border-surface-border rounded-xl text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              +1 Woche
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpiresAt(getFutureDateString(14))}
                              className="px-2.5 py-2 bg-surface-card hover:bg-surface-hover border border-surface-border rounded-xl text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              +2 Wochen
                            </button>
                          </div>
                        </div>
                        {expiresAt && (
                          <div className="text-[11px] text-rose-300 font-mono flex items-center gap-1.5 pt-0.5">
                            <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Gültig bis: <strong className="text-white font-semibold">{formatGermanDate(expiresAt)}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-surface-elevated/60 border border-dashed border-surface-border hover:border-surface-hover flex items-center justify-between gap-3 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-slate-400 shrink-0">
                          <Calendar className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Keine Frist festgelegt</div>
                          <div className="text-[11px] text-slate-400">Ankündigung bleibt dauerhaft im Flurfunk aktiv</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpiresAt(getFutureDateString(7))}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Frist setzen</span>
                      </button>
                    </div>
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
                  setCategory('ALLGEMEIN');
                  setIsPinned(false);
                  setExpiresAt('');
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
        )
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-rose-500 border-t-transparent mb-2" />
          <div>Flurfunk wird geladen...</div>
        </div>
      ) : displayedNotes.length === 0 ? (
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
          ) : activeTab === 'HIDDEN' ? (
            <>
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-surface-elevated/70 border border-surface-border flex items-center justify-center text-slate-400">
                <EyeOff className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-display font-semibold text-slate-200">Keine ausgeblendeten Beiträge</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Du hast aktuell keine Mitteilungen ausgeblendet. Alle aktiven Flurfunk-Nachrichten sind in der Übersicht sichtbar.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-surface-elevated/70 border border-surface-border flex items-center justify-center text-slate-400">
                <Archive className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base font-display font-semibold text-slate-200">Das Archiv ist leer</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Erledigte Notizen und geklärte Absprachen werden hier aufbewahrt.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Helpful info banner in HIDDEN tab */}
          {isStaff && activeTab === 'HIDDEN' && (
            <div className="bg-surface-card/90 border border-surface-border rounded-3xl p-4 flex items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-slate-400 shrink-0">
                  <EyeOff className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <strong className="text-white block font-display">Persönlich ausgeblendete Beiträge</strong>
                  <span className="text-slate-400 text-[11px]">
                    Diese Beiträge sind nur für dein Profil verborgen. Sobald ein Bewohner eine neue Nachricht in den Beitrag schreibt, wird er automatisch wieder in den aktuellen Notizen angezeigt.
                  </span>
                </div>
              </div>
            </div>
          )}

          {displayedNotes.map((note) => {
            const isExpanded = expandedNoteIds.has(note.id);
            const hasMessages = note.messages && note.messages.length > 0;
            const canReply = !note.isArchived;
            const categoryConfig = NOTE_CATEGORIES.find((c) => c.id === note.category) ||
              (note.category === 'DRINGEND' ? NOTE_CATEGORIES[0] : NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1]);
            const isDirect = note.isPrivate && (note.authorRole === 'BETREUER' || note.authorRole === 'ADMIN' || note.isDirectMessage);
            const isAuthorOrAdmin = isStaff && (note.authorId === user?.id || user?.role === 'ADMIN');
            const isEditing = editingNoteId === note.id;
            const isAwaiting = isStaff && isAwaitingCaregiverResponse(note);
            const latestMsg = note.messages && note.messages.length > 0 ? note.messages[note.messages.length - 1] : null;

            return (
              <div
                key={note.id}
                id={`note-${note.id}`}
                className={`rounded-[2.5rem] p-5 sm:p-6 border shadow-md backdrop-blur-md transition-all ${
                  note.isArchived
                    ? 'border-surface-border opacity-70 bg-surface-card'
                    : categoryConfig.cardClass
                } ${
                  isAwaiting
                    ? 'ring-2 ring-rose-500 shadow-xl shadow-rose-500/20 border-rose-500/70'
                    : note.isPinned && !note.isArchived
                    ? 'ring-2 ring-rose-500/40'
                    : ''
                }`}
              >
                {isEditing ? (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300">
                          <Pencil className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-sm font-bold text-white font-display">
                          Beitrag bearbeiten
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSavingEdit}
                        className="px-2.5 py-1 rounded-xl bg-surface-elevated hover:bg-surface-card border border-surface-border text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                        <span>Abbrechen</span>
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => handleSaveEdit(e, note.id)}
                      className="space-y-3.5"
                    >
                      {/* Category Selector */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Kategorie
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {NOTE_CATEGORIES.map((cat) => {
                            const CatIcon = cat.icon;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setEditCategory(cat.id);
                                  if (cat.id !== 'ANKUENDIGUNG') {
                                    setEditExpiresAt('');
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  editCategory === cat.id
                                    ? `${cat.buttonClass} ring-2 ring-rose-500/40 font-bold scale-102`
                                    : 'bg-surface-card border-surface-border text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <CatIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">Titel</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans"
                          required
                        />
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">Inhalt</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="w-full px-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans resize-none"
                          required
                        />
                      </div>

                      {/* Pin & Expiry */}
                      <div className="space-y-3 pt-1">
                        {isStaff && (
                          <label className="flex items-center gap-3 p-3 rounded-2xl bg-surface-card border border-surface-border cursor-pointer hover:border-surface-hover transition-colors">
                            <input
                              type="checkbox"
                              checked={editIsPinned}
                              onChange={(e) => setEditIsPinned(e.target.checked)}
                              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500/40 cursor-pointer"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                                <Pin className="w-3.5 h-3.5 text-rose-400" />
                                <span>Oben anpinnen</span>
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                Bleibt immer oben an erster Stelle im Flurfunk
                              </span>
                            </div>
                          </label>
                        )}

                        {/* Ablaufdatum / Frist: NUR FÜR ANKÜNDIGUNGEN */}
                        {isStaff && editCategory === 'ANKUENDIGUNG' && (
                          <div>
                            {editExpiresAt ? (
                              <div className="p-3.5 rounded-2xl bg-surface-card border border-rose-500/30 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5 font-display">
                                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Frist / Ablaufdatum</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setEditExpiresAt('')}
                                    className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                                    title="Frist entfernen"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Frist entfernen</span>
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <div className="relative flex-1">
                                      <input
                                        type="date"
                                        value={editExpiresAt}
                                        onChange={(e) => setEditExpiresAt(e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                        className="w-full h-10 min-h-[40px] px-3.5 py-2 bg-surface-elevated border border-surface-border focus:border-rose-500/50 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setEditExpiresAt(getFutureDateString(3))}
                                        className="px-2.5 py-2 bg-surface-elevated hover:bg-surface-hover border border-surface-border rounded-xl text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                                      >
                                        +3 Tage
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditExpiresAt(getFutureDateString(7))}
                                        className="px-2.5 py-2 bg-surface-elevated hover:bg-surface-hover border border-surface-border rounded-xl text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                                      >
                                        +1 Woche
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditExpiresAt(getFutureDateString(14))}
                                        className="px-2.5 py-2 bg-surface-elevated hover:bg-surface-hover border border-surface-border rounded-xl text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                                      >
                                        +2 Wochen
                                      </button>
                                    </div>
                                  </div>
                                  {editExpiresAt && (
                                    <div className="text-[11px] text-rose-300 font-mono flex items-center gap-1.5 pt-0.5">
                                      <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                      <span>Gültig bis: <strong className="text-white font-semibold">{formatGermanDate(editExpiresAt)}</strong></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-2xl bg-surface-card/60 border border-dashed border-surface-border hover:border-surface-hover flex items-center justify-between gap-3 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center text-slate-400 shrink-0">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-slate-200">Keine Frist festgelegt</div>
                                    <div className="text-[11px] text-slate-400">Ankündigung bleibt dauerhaft im Flurfunk aktiv</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditExpiresAt(getFutureDateString(7))}
                                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Frist setzen</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                          className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Abbrechen
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingEdit}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer transition-all disabled:opacity-50"
                        >
                          {isSavingEdit ? 'Speichert...' : 'Änderungen speichern'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* Top Header Row: Badges on Left, Single Details Toggle on Right */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                        {/* Category Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-display shrink-0 ${categoryConfig.badgeClass}`}>
                          <categoryConfig.icon className="w-3 h-3 stroke-[2.5]" />
                          <span>{categoryConfig.label}</span>
                        </span>

                        {/* Open Question / Needs Staff Response Badge */}
                        {isAwaiting && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm font-display shrink-0 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>Rückfrage von {latestMsg ? latestMsg.authorName : (note.authorName || 'Bewohner')}</span>
                          </span>
                        )}

                        {/* Pinned Badge (interactive for staff) */}
                        {note.isPinned && (
                          <button
                            type="button"
                            onClick={(e) => {
                              if (isStaff) handleTogglePin(note.id, e);
                            }}
                            disabled={!isStaff}
                            title={isStaff ? 'Pin lösen' : 'Angepinnter Beitrag'}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors font-display shrink-0 ${
                              isStaff
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 cursor-pointer'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-default'
                            }`}
                          >
                            <Pin className="w-3 h-3 fill-current" />
                            <span>Angepinnt</span>
                          </button>
                        )}

                        {/* Visibility Badge (Direct or Caregivers Only) */}
                        {note.isPrivate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-display shrink-0">
                            <Lock className="w-3 h-3 text-purple-400" />
                            <span>{isDirect ? 'Direkt' : 'Nur Betreuer'}</span>
                          </span>
                        )}

                        {/* Expiry Badge */}
                        {note.category === 'ANKUENDIGUNG' && note.expiresAt && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-elevated text-slate-400 border border-surface-border shrink-0">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Bis {formatGermanDate(note.expiresAt)}</span>
                          </span>
                        )}

                        {/* Status Badge (no 'Offen' - only In Bearbeitung or Archiviert) */}
                        {note.isArchived ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-display bg-surface-elevated text-slate-400 border border-surface-border shrink-0">
                            Archiviert
                          </span>
                        ) : note.status === 'IN_PROGRESS' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-display bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0">
                            In Bearbeitung
                          </span>
                        ) : null}

                        {/* Hidden Badge */}
                        {note.isHiddenForMe && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 font-display shrink-0">
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            <span>Ausgeblendet</span>
                          </span>
                        )}
                      </div>

                      {/* Header Actions on Right */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Staff Unhide Button */}
                        {isStaff && note.isHiddenForMe && (
                          <button
                            type="button"
                            onClick={(e) => handleUnhideNote(note.id, e)}
                            title="Diesen Beitrag wieder für mich einblenden"
                            className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-rose-300" />
                            <span>Wieder einblenden</span>
                          </button>
                        )}

                        {/* Staff Hide Button */}
                        {isStaff && !note.isArchived && !note.isHiddenForMe && (
                          <button
                            type="button"
                            onClick={(e) => handleHideNote(note.id, e)}
                            title="Für mich ausblenden (nur für dein Profil verborgen)"
                            className="px-2 py-1 rounded-xl bg-surface-elevated/70 hover:bg-surface-card border border-surface-border text-slate-400 hover:text-slate-200 text-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span className="hidden sm:inline text-[11px]">Ausblenden</span>
                          </button>
                        )}

                        {/* Details / Einklappen Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(note.id)}
                          className="px-2.5 py-1 rounded-xl bg-surface-elevated hover:bg-surface-card border border-surface-border text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs shrink-0"
                          aria-label={isExpanded ? 'Einklappen' : 'Details anzeigen'}
                        >
                          <span className="text-[11px] font-medium">{isExpanded ? 'Einklappen' : 'Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    {/* Author & Timestamp row */}
                    {!isExpanded && (
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 gap-2">
                        {note.category !== 'ANKUENDIGUNG' ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0"
                              style={{
                                backgroundColor: note.authorAvatarColor || (note.authorRole === 'BETREUER' || note.authorRole === 'ADMIN' ? '#f43f5e' : '#3b82f6'),
                              }}
                            >
                              {(note.authorName || note.residentName || 'WG').charAt(0)}
                            </div>
                            <div className="truncate text-slate-300 font-medium text-xs">
                              <span className="text-white font-semibold">{note.authorName || 'WG-Mitglied'}</span>
                              {isDirect && note.residentName && (
                                <span className="text-purple-300 font-medium"> → {note.residentName}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div />
                        )}

                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0 ml-auto">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatGermanDateTime(note.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3
                      onClick={() => toggleExpand(note.id)}
                      className="text-base sm:text-lg font-display font-semibold text-white cursor-pointer hover:text-rose-300 transition-colors leading-snug"
                    >
                      {note.title}
                    </h3>

                    {/* Collapsed Snippet or Expanded Full Content */}
                    {!isExpanded ? (
                      <div className="mt-2">
                        <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed font-normal">
                          {note.content}
                        </p>

                        {/* Direct Latest Message Preview Card when thread has messages */}
                        {hasMessages && latestMsg && (
                          <div
                            onClick={() => toggleExpand(note.id)}
                            className={`mt-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                              isAwaiting
                                ? 'bg-rose-500/15 border-rose-500/35 hover:bg-rose-500/25 text-rose-100 shadow-sm'
                                : 'bg-surface-elevated/70 border-surface-border hover:bg-surface-elevated text-slate-300'
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 mt-0.5"
                              style={{
                                backgroundColor:
                                  latestMsg.authorAvatarColor ||
                                  (latestMsg.authorRole === 'BEWOHNER' ? '#3b82f6' : '#f43f5e'),
                              }}
                            >
                              {latestMsg.authorName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="font-semibold text-white text-[11px] truncate flex items-center gap-1.5">
                                  <span>{latestMsg.authorName}</span>
                                  <span className={`text-[10px] font-normal px-1.5 py-0.2 rounded-md ${
                                    latestMsg.authorRole === 'BEWOHNER'
                                      ? 'bg-sky-500/20 text-sky-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {latestMsg.authorRole === 'BEWOHNER' ? 'Bewohner/in' : 'Betreuer/in'}
                                  </span>
                                  {isAwaiting && (
                                    <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded-md">
                                      Neu
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {formatGermanDateTime(latestMsg.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                                „{latestMsg.content}“
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            {hasMessages ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(note.id)}
                                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                                  isAwaiting
                                    ? 'text-rose-200 bg-rose-500/25 border border-rose-500/50 font-bold'
                                    : 'text-slate-300 bg-surface-elevated border border-surface-border hover:text-white'
                                }`}
                              >
                                <MessageSquare className="w-3 h-3 text-rose-400" />
                                <span>{note.messages!.length} {note.messages!.length === 1 ? 'Antwort' : 'Antworten'}</span>
                                {isAwaiting && (
                                  <span className="text-[10px] text-rose-300 font-bold ml-0.5">(Rückfrage offen)</span>
                                )}
                              </button>
                            ) : note.caregiverResponse ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(note.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-rose-500/20"
                              >
                                <MessageSquare className="w-3 h-3 text-rose-400" />
                                <span>1 Antwort</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                <MessageSquare className="w-3 h-3 text-slate-600" />
                                <span>Keine Antworten</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isAuthorOrAdmin && !note.isArchived && (
                              <button
                                type="button"
                                onClick={(e) => handleStartEdit(note, e)}
                                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-amber-400/10 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Bearbeiten</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* EXPANDED VIEW: Streamlined chat stream */
                      <div className="mt-3.5 space-y-3.5 animate-in fade-in duration-150">
                        {/* Conversation Stream */}
                        <div className="space-y-3">
                          {/* 1. Opening message (Author's Note) */}
                          <div className="flex gap-2.5 items-start">
                            {note.category !== 'ANKUENDIGUNG' && (
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 mt-0.5 shadow-xs"
                                style={{
                                  backgroundColor: note.authorAvatarColor || (note.authorRole === 'BETREUER' || note.authorRole === 'ADMIN' ? '#f43f5e' : '#3b82f6'),
                                }}
                              >
                                {(note.authorName || note.residentName || 'WG').charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {note.category !== 'ANKUENDIGUNG' ? (
                                    <>
                                      <span className="text-xs font-semibold text-white truncate">
                                        {note.authorName || 'WG-Mitglied'}
                                      </span>
                                      {isDirect && note.residentName && (
                                        <span className="text-purple-300 font-normal text-[11px] truncate">
                                          → {note.residentName}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs font-semibold text-rose-300 truncate flex items-center gap-1.5">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                      Ankündigung
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {formatGermanDateTime(note.createdAt)}
                                </span>
                              </div>
                              <div className="p-3 rounded-2xl rounded-tl-sm bg-surface-elevated/80 border border-surface-border/60 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                                {note.content}
                              </div>
                            </div>
                          </div>

                          {/* 2. Thread replies */}
                          {hasMessages && (
                            <div className="space-y-3 pl-3 sm:pl-4 border-l-2 border-surface-border/40 ml-3.5">
                              {note.messages!.map((msg) => {
                                const isStaffMsg = msg.authorRole === 'BETREUER' || msg.authorRole === 'ADMIN';
                                return (
                                  <div key={msg.id} className="flex gap-2.5 items-start">
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0 mt-0.5 shadow-xs"
                                      style={{ backgroundColor: msg.authorAvatarColor || (isStaffMsg ? '#f43f5e' : '#3b82f6') }}
                                    >
                                      {msg.authorName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className={`text-xs font-semibold truncate ${isStaffMsg ? 'text-rose-300' : 'text-slate-200'}`}>
                                            {msg.authorName}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                          {formatGermanDateTime(msg.createdAt)}
                                        </span>
                                      </div>
                                      <div
                                        className={`p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed whitespace-pre-line ${
                                          isStaffMsg
                                            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-100'
                                            : 'bg-surface-elevated/60 border border-surface-border/50 text-slate-200'
                                        }`}
                                      >
                                        {msg.content}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 3. Legacy response fallback */}
                          {!hasMessages && note.caregiverResponse && (
                            <div className="space-y-3 pl-3 sm:pl-4 border-l-2 border-surface-border/40 ml-3.5">
                              <div className="flex gap-2.5 items-start">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0 mt-0.5 bg-rose-500 shadow-xs">
                                  {(note.respondedByName || 'B').charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-xs font-semibold text-rose-300 truncate">
                                        {note.respondedByName || 'Betreuer'}
                                      </span>
                                    </div>
                                    {note.respondedAt && (
                                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                        {formatGermanDateTime(note.respondedAt)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed whitespace-pre-line bg-rose-500/10 border border-rose-500/20 text-rose-100">
                                    {note.caregiverResponse}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Inline Thread Reply Input */}
                        {canReply && (
                          <div className="pt-2 flex items-center gap-2">
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
                              placeholder="Antworten..."
                              className="flex-1 px-3.5 py-2 bg-surface-elevated/90 border border-surface-border/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50 font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendThreadMessage(note.id)}
                              disabled={!threadReplyInputs[note.id]?.trim() || isSubmittingMap[note.id]}
                              title="Antwort senden"
                              aria-label="Antwort senden"
                              className="p-2 bg-rose-500 hover:bg-rose-400 disabled:opacity-30 text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Streamlined Action Bar */}
                        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                          <div>
                            {!note.isArchived ? (
                              (!isStaff && (note.category === 'ANKUENDIGUNG' || (note.authorId !== user?.id && note.residentId !== user?.id))) ? null : (
                                <button
                                  type="button"
                                  onClick={() => handleResolveTicket(note.id)}
                                  className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{isStaff ? 'Als erledigt archivieren' : 'Als erledigt markieren'}</span>
                                </button>
                              )
                            ) : (
                              (isStaff || note.authorId === user?.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleReopenTicket(note.id)}
                                  className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-card text-slate-300 border border-surface-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Wiedereröffnen</span>
                                </button>
                              )
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-slate-400">
                            {/* Staff Hide/Unhide Toggle */}
                            {isStaff && (
                              <button
                                type="button"
                                onClick={(e) =>
                                  note.isHiddenForMe ? handleUnhideNote(note.id, e) : handleHideNote(note.id, e)
                                }
                                title={
                                  note.isHiddenForMe
                                    ? 'Diesen Beitrag wieder für mich einblenden'
                                    : 'Diesen Beitrag für mich ausblenden (bleibt für andere sichtbar)'
                                }
                                aria-label={
                                  note.isHiddenForMe ? 'Wieder einblenden' : 'Für mich ausblenden'
                                }
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  note.isHiddenForMe
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {note.isHiddenForMe ? (
                                  <Eye className="w-3.5 h-3.5 text-rose-300" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Staff Pin Toggle */}
                            {isStaff && !note.isArchived && (
                              <button
                                type="button"
                                onClick={(e) => handleTogglePin(note.id, e)}
                                title={note.isPinned ? 'Pin lösen' : 'Oben anpinnen'}
                                aria-label={note.isPinned ? 'Pin lösen' : 'Oben anpinnen'}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  note.isPinned
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current text-rose-400' : ''}`} />
                              </button>
                            )}

                            {/* Author/Admin Edit */}
                            {isAuthorOrAdmin && !note.isArchived && (
                              <button
                                type="button"
                                onClick={(e) => handleStartEdit(note, e)}
                                title="Beitrag bearbeiten"
                                aria-label="Beitrag bearbeiten"
                                className="p-1.5 rounded-lg hover:text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                              </button>
                            )}

                            {/* Staff Delete */}
                            {isStaff && (
                              <button
                                type="button"
                                onClick={() => handleDelete(note.id)}
                                title="Beitrag löschen"
                                aria-label="Beitrag löschen"
                                className="p-1.5 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
