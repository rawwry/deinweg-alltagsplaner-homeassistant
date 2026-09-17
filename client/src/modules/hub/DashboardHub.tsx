import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { formatGermanDate } from '../../utils/formatters.js';
import { WasteWheelieBin } from '../../components/waste/WasteWheelieBin.js';
import {
  Calendar,
  ShoppingCart,
  BookOpen,
  MessageSquareText,
  Trash2,
  ArrowRight,
  Sparkles,
  Users,
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  PlusCircle,
  Check,
  Circle,
  ListTodo,
  Banknote,
} from 'lucide-react';

interface DashboardHubProps {
  setCurrentTab: (tab: string) => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({ setCurrentTab }) => {
  const { user, activeLocation, activeLocationId } = useAuth();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [shoppingSummary, setShoppingSummary] = useState<any>(null);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [wasteSummary, setWasteSummary] = useState<any[]>([]);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [todayChores, setTodayChores] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [dismissedTopicIds, setDismissedTopicIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`flurfunk_dismissed_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [personalDoneChores, setPersonalDoneChores] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`resident_chores_done_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`flurfunk_dismissed_${user.id}`);
      if (stored) {
        setDismissedTopicIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    try {
      const storedChores = localStorage.getItem(`resident_chores_done_${user.id}`);
      if (storedChores) {
        setPersonalDoneChores(JSON.parse(storedChores));
      }
    } catch {
      // ignore
    }
  }, [user?.id]);

  const togglePersonalChore = (key: string) => {
    setPersonalDoneChores((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (user?.id) {
        try {
          localStorage.setItem(`resident_chores_done_${user.id}`, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  const handleDismissTopic = async (note: any) => {
    // If user is a resident: they resolve the note (mark as done/archived) and notify caregivers
    if (user?.role === 'BEWOHNER') {
      if (note.category === 'ANKUENDIGUNG') {
        return; // Residents cannot resolve or dismiss announcements
      }
      try {
        await api.notes.resolve(note.id);
        // Immediately remove from local list
        setNotesList((prev) => prev.filter((n) => n.id !== note.id));
      } catch (e) {
        console.error('Fehler beim Erledigen des Themas:', e);
      }
    }

    const updated = Array.from(new Set([...dismissedTopicIds, note.id]));
    setDismissedTopicIds(updated);
    if (user?.id) {
      try {
        localStorage.setItem(`flurfunk_dismissed_${user.id}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    if (note.hasUnreadResponse) {
      try {
        await api.notes.markRead(note.id);
        setNotesList((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, hasUnreadResponse: false } : n))
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleOpenTopic = async (note: any) => {
    // For announcements viewed by residents: do NOT dismiss/resolve when opening!
    if (user?.role !== 'BEWOHNER' || note.category !== 'ANKUENDIGUNG') {
      if (note.hasUnreadResponse) {
        try {
          await api.notes.markRead(note.id);
          setNotesList((prev) =>
            prev.map((n) => (n.id === note.id ? { ...n, hasUnreadResponse: false } : n))
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
    setCurrentTab('notes');
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentYear = now.getFullYear();

  // Personalized user greeting
  const firstName = user?.name ? user.name.split(' ')[0] : 'du';

  // Greeting by time of day
  const timeGreeting =
    currentHour >= 5 && currentHour < 11
      ? 'Guten Morgen'
      : currentHour >= 11 && currentHour < 17
      ? 'Guten Tag'
      : currentHour >= 17 && currentHour < 22
      ? 'Guten Abend'
      : 'Gute Nacht';

  const timeEmoji =
    currentHour >= 5 && currentHour < 11
      ? '☕'
      : currentHour >= 11 && currentHour < 17
      ? '☀️'
      : currentHour >= 17 && currentHour < 22
      ? '🍲'
      : '🌙';

  // Get current ISO calendar week
  const dateCopy = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = dateCopy.getUTCDay() || 7;
  dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1));
  const currentWeek = Math.ceil(((dateCopy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  // Day of week in Germany: 1=Mo, 7=So
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

  // Formatted date string in strict German format
  const formattedToday = formatGermanDate(now, { withWeekday: true });

  const handleToggleChore = async (chore: any) => {
    try {
      await api.chores.toggleComplete({
        assignmentId: chore.assignmentId || undefined,
        templateId: chore.templateId,
        date: chore.date,
        year: currentYear,
        weekNumber: currentWeek,
        dayOfWeek: currentDayOfWeek,
      });
      const refreshed = await api.chores.today(activeLocationId);
      setTodayChores(refreshed);
    } catch (err) {
      console.error('Fehler beim Abhaken der Aufgabe:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadOverview = async () => {
      try {
        setLoading(true);
        const [planRes, shopRes, wasteRes, notesRes, budgetRes, choresRes] = await Promise.all([
          api.food.mealplan(activeLocationId, currentYear, currentWeek).catch(() => null),
          api.food.shoppingList(activeLocationId, currentYear, currentWeek).catch(() => null),
          api.waste.list(activeLocationId).catch(() => []),
          api.notes.list(activeLocationId).catch(() => []),
          api.food.budget(activeLocationId, currentYear, currentWeek).catch(() => null),
          api.chores.today(activeLocationId).catch(() => null),
        ]);

        if (!isMounted) return;
        setMealPlan(planRes);
        setShoppingSummary(shopRes);
        setWasteSummary(wasteRes || []);
        setNotesList(notesRes || []);
        setBudgetSummary(budgetRes);
        setTodayChores(choresRes);
      } catch (err) {
        console.error('Fehler beim Laden des Dashboards:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOverview();
    return () => {
      isMounted = false;
    };
  }, [activeLocationId, currentYear, currentWeek]);

  const todayMeal = mealPlan?.days?.find((d: any) => d.dayOfWeek === currentDayOfWeek);
  const openNotes = notesList.filter((n: any) => n.status !== 'DONE');

  // Filter waste pickups to today or upcoming dates only (ignoring past dates)
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const upcomingWasteList = (wasteSummary || [])
    .filter((w: any) => {
      if (!w.date) return false;
      const target = new Date(w.date);
      target.setHours(0, 0, 0, 0);
      return target.getTime() >= todayDate.getTime();
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextWaste = upcomingWasteList.length > 0 ? upcomingWasteList[0] : null;

  // Calculate days until next waste pickup
  let daysUntilWaste: number | null = null;
  if (nextWaste?.date) {
    const target = new Date(nextWaste.date);
    target.setHours(0, 0, 0, 0);
    daysUntilWaste = Math.round((target.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Waste type title mapping
  const wasteTypeNames: Record<string, string> = {
    YELLOW: 'Wertstoff / Gelber Sack',
    BIO: 'Biotonne',
    PAPER: 'Altpapiertonne',
    REST: 'Restmülltonne',
  };

  // Filter new/active Flurfunk topics for both Caregivers and Residents
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const newFlurfunkNotifications = notesList.filter((note: any) => {
    if (note.isArchived || note.status === 'DONE' || note.isExpired) return false;
    // Do not alert authors about their own postings
    if (note.authorId && user?.id && note.authorId === user.id) return false;

    const isResident = user?.role === 'BEWOHNER';
    const isAnnouncement = note.category === 'ANKUENDIGUNG';

    // Residents cannot dismiss announcements - they must stay visible until caregiver removes them or deadline expires
    if (!isResident || !isAnnouncement) {
      if (dismissedTopicIds.includes(note.id)) return false;
    }

    // For Residents:
    if (isResident) {
      if (note.residentId === user?.id && note.hasUnreadResponse) return true;
      if (note.isPrivate && note.residentId !== user?.id) return false;
    }

    // Unread caregiver response or direct message
    if (note.hasUnreadResponse) return true;

    // Time window: either pinned or created within last 7 days
    const age = note.createdAt ? Date.now() - new Date(note.createdAt).getTime() : Infinity;
    return note.isPinned || age < SEVEN_DAYS_MS;
  });

  const displayedNotifications = newFlurfunkNotifications.slice(0, 3);
  const remainingNotificationsCount = newFlurfunkNotifications.length - displayedNotifications.length;

  const getBannerConfig = (note: any) => {
    // 1. ANKUENDIGUNG is always RED/ROSE
    if (note.category === 'ANKUENDIGUNG') {
      return {
        badge: '📢 Wichtige Ankündigung',
        badgeClass: 'bg-rose-500 text-white',
        containerClass: 'bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-surface-card border border-rose-500/50 shadow-rose-500/10 hover:border-rose-400/80',
        iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-500/30 text-white',
        icon: '📢',
        senderName: note.authorName || 'Betreuer',
        headline: `„${note.title}“`,
        snippet: note.content,
        textClass: 'text-rose-200/90',
      };
    }

    // 2. HINWEIS is always YELLOW/AMBER
    if (note.category === 'HINWEIS') {
      return {
        badge: '💡 Wichtiger Hinweis',
        badgeClass: 'bg-amber-500 text-slate-950 font-bold',
        containerClass: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-surface-card border border-amber-500/50 shadow-amber-500/10 hover:border-amber-400/80',
        iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/30 text-slate-950',
        icon: '💡',
        senderName: note.authorName || 'Flurfunk',
        headline: `„${note.title}“`,
        snippet: note.content,
        textClass: 'text-amber-200/90',
      };
    }

    // 3. Resident ticket viewed by staff (Betreuer / Admin)
    const isResidentTicket = Boolean(
      (user?.role === 'BETREUER' || user?.role === 'ADMIN') &&
      note.isPrivate &&
      (note.authorRole === 'BEWOHNER' || note.residentId)
    );
    if (isResidentTicket) {
      return {
        badge: '✉️ Neues Bewohner-Anliegen',
        badgeClass: 'bg-purple-500 text-white',
        containerClass: 'bg-gradient-to-r from-purple-500/20 via-violet-500/15 to-surface-card border border-purple-500/50 shadow-purple-500/10 hover:border-purple-400/80',
        iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/30 text-white',
        icon: '✉️',
        senderName: note.authorName || note.residentName || 'Bewohner',
        headline: `Anliegen: „${note.title}“`,
        snippet: note.content,
        textClass: 'text-purple-200/90',
      };
    }

    // 4. Resident receiving a response from caregiver to their own note
    const isReply = Boolean(
      user?.role === 'BEWOHNER' &&
      note.authorId === user?.id &&
      note.caregiverResponse &&
      note.hasUnreadResponse
    );
    if (isReply) {
      return {
        badge: '💬 Neue Betreuer-Antwort',
        badgeClass: 'bg-sky-500 text-white',
        containerClass: 'bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-surface-card border border-sky-500/50 shadow-sky-500/10 hover:border-sky-400/80',
        iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/30 text-white',
        icon: '💬',
        senderName: note.respondedByName || 'Betreuer',
        headline: `Zu deinem Beitrag: „${note.title}“`,
        snippet: note.caregiverResponse,
        textClass: 'text-sky-200/90',
      };
    }

    // 5. Direct message from caregiver to resident
    const isDirect = Boolean(note.isDirectMessage || (note.isPrivate && note.residentId === user?.id));
    if (isDirect) {
      return {
        badge: '✉️ Neue Direktnachricht',
        badgeClass: 'bg-sky-500 text-white',
        containerClass: 'bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-surface-card border border-sky-500/50 shadow-sky-500/10 hover:border-sky-400/80',
        iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/30 text-white',
        icon: '✉️',
        senderName: note.authorName || 'Betreuer',
        headline: `„${note.title}“`,
        snippet: note.content,
        textClass: 'text-sky-200/90',
      };
    }

    // 6. Default general note (ALLGEMEIN) - BLUE / SKY
    return {
      badge: '💬 Neuer Flurfunk-Beitrag',
      badgeClass: 'bg-sky-500 text-white',
      containerClass: 'bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-surface-card border border-sky-500/50 shadow-sky-500/10 hover:border-sky-400/80',
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/30 text-white',
      icon: '💬',
      senderName: note.authorName || 'Flurfunk',
      headline: `„${note.title}“`,
      snippet: note.content,
      textClass: 'text-sky-200/90',
    };
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto pb-10">
      {/* Top Welcome Headline (Centered) */}
      <div className="text-center flex flex-col items-center justify-center pt-2 pb-1">
        <div className="inline-flex items-center gap-2 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-2 font-sans">
          <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
          <span className="text-slate-300 font-medium">WG {activeLocation?.name || user?.locationName || 'Emsdetten'}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-medium">Kalenderwoche {currentWeek}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans flex items-center justify-center gap-2.5">
          <span>{timeGreeting}, {firstName}!</span>
          <span className="text-2xl sm:text-3xl filter drop-shadow-sm">{timeEmoji}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium leading-relaxed">
          {formattedToday} — Schön, dass du da bist.
        </p>

        {openNotes.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setCurrentTab('notes')}
              className="px-3.5 py-1.5 rounded-2xl bg-surface-card border border-rose-500/30 text-xs text-rose-300 font-medium hover:bg-surface-elevated transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>🔔</span>
              <span>{openNotes.length} {openNotes.length === 1 ? 'Eintrag' : 'Einträge'} im Flurfunk</span>
            </button>
          </div>
        )}
      </div>

      {/* Flurfunk Notification Banner (For both Caregivers and Residents) */}
      {displayedNotifications.length > 0 && (
        <div className="space-y-3">
          {displayedNotifications.map((note: any) => {
            const config = getBannerConfig(note);
            return (
              <div
                key={note.id}
                onClick={() => handleOpenTopic(note)}
                className={`${config.containerClass} rounded-3xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200 cursor-pointer group transition-all`}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-2xl ${config.iconBg} flex items-center justify-center shrink-0 shadow-md font-bold text-lg`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${config.badgeClass} uppercase tracking-wider font-display`}>
                        {config.badge}
                      </span>
                      <span className="text-xs text-slate-300 font-medium truncate">
                        von {config.senderName}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1 group-hover:text-white transition-colors truncate">
                      {config.headline}
                    </h4>
                    <p className={`text-xs ${config.textClass} mt-0.5 line-clamp-2 italic font-sans`}>
                      „{config.snippet}“
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center pl-2">
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}

          {remainingNotificationsCount > 0 && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setCurrentTab('notes')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-card border border-surface-border text-xs text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors font-medium cursor-pointer shadow-sm"
              >
                <span>🔔</span>
                <span>+ {remainingNotificationsCount} weitere {remainingNotificationsCount === 1 ? 'Mitteilung' : 'Mitteilungen'} im Flurfunk ansehen</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Today's Tasks Widget (Resident View) */}
      {user?.role === 'BEWOHNER' && todayChores && (() => {
        const isTodayCook = Boolean(user?.id && todayMeal?.cookUserId === user.id);
        const chefkochChore = isTodayCook
          ? {
              templateId: `chefkoch_${todayChores?.date || formatGermanDate(now)}`,
              date: todayChores?.date || formatGermanDate(now),
              title: `Chefkoch: ${todayMeal?.recipe?.title || todayMeal?.customDishTitle || 'Abendessen kochen'}`,
              description: 'Du bist heute als Chefkoch für die Zubereitung des gemeinsamen Essens eingeteilt!',
              icon: '👨‍🍳',
              isChefkoch: true,
            }
          : null;

        const residentTasksList = [
          ...(chefkochChore ? [chefkochChore] : []),
          ...(todayChores?.myTasks || []),
        ];

        return (
          <div className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                  <span>📋</span>
                  <span>Deine Aufgaben</span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
                Was heute ansteht
              </h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
                {residentTasksList.length === 0
                  ? 'Heute stehen keine anstehenden Aufgaben für dich an.'
                  : 'Hier siehst du deine eingeteilten Haushalts- und Alltagsdienste für den heutigen Tag.'}
              </p>

              {residentTasksList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {residentTasksList.map((task: any) => {
                    const choreKey = `${task.date || 'today'}_${task.templateId}`;
                    const isDone = personalDoneChores.includes(choreKey);

                    return (
                      <div
                        key={task.templateId}
                        onClick={() => togglePersonalChore(choreKey)}
                        className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3.5 select-none cursor-pointer group/task ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-surface-elevated/70 hover:bg-surface-elevated border-surface-border hover:border-indigo-500/40 text-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-xl shrink-0 shadow-xs mt-0.5">
                            {task.icon || '🧹'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm font-semibold leading-snug break-words ${
                                isDone ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {task.title}
                            </div>
                            {task.description && (
                              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed break-words whitespace-normal font-sans">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-500 bg-surface-card/60 group-hover/task:border-indigo-400'
                            }`}
                            title={isDone ? 'Als unerledigt markieren' : 'Als erledigt abhaken'}
                          >
                            {isDone ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-500 group-hover/task:bg-indigo-400 transition-colors" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 bg-surface-elevated/30 rounded-2xl border border-surface-border/50 flex items-center justify-center gap-2 font-sans">
                  <span>☕ Keine anstehenden Aufgaben für dich heute eingeteilt. Genieße deinen Tag!</span>
                </div>
              )}
            </div>

            {/* Clean modern footer action */}
            <div className="mt-5 pt-4 border-t border-surface-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                Einteilung für die gesamte Woche im Aufgabenplan
              </span>
              <button
                type="button"
                onClick={() => setCurrentTab('chores')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-surface-elevated hover:bg-white/10 border border-surface-border hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow-xs group"
              >
                <ListTodo className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                <span>Aufgabenplan öffnen</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Today's Tasks Widget (Caregiver / Staff View) */}
      {user?.role !== 'BEWOHNER' && todayChores && (
        <div className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                <span>📋</span>
                <span>Heutige Aufgaben</span>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-elevated text-indigo-300 border border-surface-border font-mono self-start sm:self-auto">
                {todayChores.completedCount} von {todayChores.totalCount} erledigt
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
                Heutige Aufgaben der WG
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Überblick über alle eingeteilten Haushalts- & Alltagsaufgaben von heute.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {todayChores.todayItems.map((task: any) => (
                <div
                  key={task.templateId}
                  onClick={() => handleToggleChore(task)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                    task.isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-surface-elevated/60 border-surface-border hover:border-indigo-500/50 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{task.icon || '🧹'}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${task.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        {task.isAllResidents ? (
                          <span className="text-indigo-300 font-medium">👥 Alle Bewohner</span>
                        ) : task.assignedResidents && task.assignedResidents.length > 0 ? (
                          <span className="text-indigo-300 font-medium truncate max-w-[150px]">
                            👤 {task.assignedResidents.map((r: any) => r.name).join(', ')}
                          </span>
                        ) : task.resident ? (
                          <span className="text-indigo-300 font-medium">👤 {task.resident.name}</span>
                        ) : (
                          <span className="text-slate-500 italic">Niemand eingeteilt</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {task.isCompleted ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        Erledigt ✅
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium">
                        Offen
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Footer Action */}
          <div className="mt-5 pt-4 border-t border-surface-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
              Wöchentliche Einteilung und Zuweisungen für alle Wochentage
            </span>
            <button
              type="button"
              onClick={() => setCurrentTab('chores')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-surface-elevated hover:bg-white/10 border border-surface-border hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow-xs group"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              <span>Aufgabenplan verwalten</span>
            </button>
          </div>
        </div>
      )}

      {/* Balanced 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Bento 1: Bistro Hero Meal Spotlight */}
        <div className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
          {/* Ambient warm glow */}
          <div className="absolute -right-16 -top-16 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-6 top-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-9xl select-none">
            🍳
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                <span>🍽️</span>
                <span>Heute frisch auf den Tisch</span>
              </div>
              <span className="text-xs font-medium text-slate-400 hidden sm:inline font-sans">
                {todayMeal?.customDishTitle ? 'Individuelles Gericht' : 'Gemeinsames Abendessen'}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-white group-hover:text-rose-300 transition-colors leading-snug mb-1.5 font-sans tracking-tight">
              {todayMeal?.recipe?.title || todayMeal?.customDishTitle || 'Heute Selbstversorgung'}
            </h3>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              {todayMeal?.recipe?.description ||
                (todayMeal?.customDishTitle
                  ? 'Frei gewähltes Gericht ohne festes Rezept.'
                  : 'Heute kocht jeder nach eigenem Wunsch, oder ihr tragt im Kochplan noch euer Lieblingsessen ein!')}
            </p>

            {/* Culinary Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {todayMeal?.recipe?.prepTimeMinutes ? (
                <span className="px-3 py-1 rounded-xl bg-surface-elevated/80 border border-surface-border text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>ca. {todayMeal.recipe.prepTimeMinutes} Min.</span>
                </span>
              ) : null}

              {todayMeal?.recipe?.isVegetarian ? (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
                  🌿 Vegetarisch
                </span>
              ) : null}

              {todayMeal?.recipe?.isVegan ? (
                <span className="px-3 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-xs text-teal-300 font-medium">
                  🌱 Vegan
                </span>
              ) : null}

              <span className="px-3 py-1 rounded-xl bg-surface-elevated/80 border border-surface-border text-xs text-slate-300 font-medium">
                ⭐ WG-Favorit
              </span>
            </div>
          </div>

          {/* Meal Footer Bar */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-sm shadow-inner">
                  👨‍🍳
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-sans">
                    Chefkoch heute
                  </div>
                  <div className="text-xs font-semibold text-rose-200">
                    {todayMeal?.cookName || 'Team / Offen'}
                  </div>
                </div>
              </div>

              <div className="w-px h-7 bg-white/10 hidden sm:block" />

              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-sans">
                  Portionen
                </div>
                <div className="text-xs font-semibold text-white flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{todayMeal?.servings || 6} Portionen</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('mealplan')}
              className="btn-theme-gradient w-full sm:w-auto px-5 py-2.5 rounded-2xl text-white font-semibold text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 font-sans"
            >
              <span>Kochplan & Rezepte</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bento 2: Shopping Radar & Basket (Paired with Food spotlight, ample width, no text wraps) */}
        <div className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                <span>🛒</span>
                <span>Einkaufskorb</span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                ~ {shoppingSummary?.totalEstimatedCost ? `${shoppingSummary.totalEstimatedCost.toFixed(2)} €` : '0.00 €'}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
              {shoppingSummary?.items?.length || 0}{' '}
              {shoppingSummary?.items?.length === 1 ? 'Artikel auf der Einkaufsliste' : 'Artikel auf der Einkaufsliste'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              Geplant bei <strong className="text-white font-semibold">{shoppingSummary?.supermarketName || 'Supermarkt'}</strong> für diese Woche.
            </p>

            {/* Weekly Budget Status Widget (Clean horizontal layout with ample space) */}
            {budgetSummary && (
              <div className="p-3.5 mb-4 rounded-2xl bg-surface-elevated/80 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-wide">
                      Aktuelles Wochenbudget
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      Noch {budgetSummary.remainingBudget.toFixed(2)} € übrig
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 font-sans">
                    von {budgetSummary.weeklyBudget.toFixed(0)} €
                  </span>
                </div>
              </div>
            )}

            {/* Quick Preview Items */}
            <div className="space-y-2 mb-4">
              {shoppingSummary?.items && shoppingSummary.items.length > 0 ? (
                shoppingSummary.items.slice(0, 3).map((item: any, idx: number) => {
                  const itemName = item.name || item.title || 'Artikel';
                  const itemAmount = item.totalAmount ?? item.amount;
                  return (
                    <div
                      key={item.ingredientId || item.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-elevated/70 border border-surface-border text-xs"
                    >
                      <span className="flex items-center gap-2 text-slate-200 font-medium truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="truncate">
                          {itemName}
                          {itemAmount !== undefined && itemAmount !== null && itemAmount !== '' ? (
                            <span className="text-slate-400 font-normal ml-1.5">
                              ({[itemAmount, item.unit].filter(Boolean).join(' ')})
                            </span>
                          ) : item.unit ? (
                            <span className="text-slate-400 font-normal ml-1.5">
                              ({item.unit})
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="text-slate-400 font-mono flex-shrink-0 ml-2">
                        {item.estimatedPrice ? `${item.estimatedPrice.toFixed(2)} €` : '—'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-3.5 rounded-2xl bg-surface-elevated/50 border border-surface-border text-xs text-slate-400 text-center font-medium">
                  Alle Einkäufe erledigt! 🎉
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="w-full py-2.5 rounded-2xl bg-surface-elevated hover:bg-white/10 border border-surface-border text-slate-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <span>Einkaufsliste öffnen</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>

        {/* Bento 3: Visual Waste Radar (Clean header without confusing negative day counter) */}
        <div className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                <span>🗑️</span>
                <span>Abfall-Radar</span>
              </span>
            </div>

            <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
              {nextWaste ? `Nächste Abholung: ${wasteTypeNames[nextWaste.wasteType] || 'Abfalltermin'}` : 'Keine anstehende Abfuhr'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              {nextWaste
                ? daysUntilWaste === 1
                  ? 'Bitte heute Abend nach dem Abendessen vor das Tor stellen.'
                  : daysUntilWaste === 0
                  ? 'Steht heute zur Abholung bereit!'
                  : `Nächste Leerung am ${formatGermanDate(nextWaste.date, { withWeekday: true })}.`
                : 'Aktuell steht in den nächsten Tagen keine Abholung an.'}
            </p>

            {/* Visual Authentic Wheelie Bins Showcase */}
            <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-surface-border mb-4 flex items-center justify-around gap-2">
              {/* Gelber Sack / Wertstoff */}
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  nextWaste?.wasteType === 'YELLOW'
                    ? 'bg-yellow-500/15 border border-yellow-500/40 scale-105 shadow-md shadow-yellow-500/10'
                    : 'opacity-40 hover:opacity-75'
                }`}
              >
                <WasteWheelieBin type="YELLOW" size="sm" animate={nextWaste?.wasteType === 'YELLOW'} />
                <span className="text-[10px] font-semibold text-yellow-300 mt-1">Gelb</span>
              </div>

              {/* Biotonne */}
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  nextWaste?.wasteType === 'BIO'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 scale-105 shadow-md shadow-emerald-500/10'
                    : 'opacity-40 hover:opacity-75'
                }`}
              >
                <WasteWheelieBin type="BIO" size="sm" animate={nextWaste?.wasteType === 'BIO'} />
                <span className="text-[10px] font-semibold text-emerald-300 mt-1">Bio</span>
              </div>

              {/* Altpapier */}
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  nextWaste?.wasteType === 'PAPER'
                    ? 'bg-sky-500/15 border border-sky-500/40 scale-105 shadow-md shadow-sky-500/10'
                    : 'opacity-40 hover:opacity-75'
                }`}
              >
                <WasteWheelieBin type="PAPER" size="sm" animate={nextWaste?.wasteType === 'PAPER'} />
                <span className="text-[10px] font-semibold text-sky-300 mt-1">Papier</span>
              </div>

              {/* Restmüll */}
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  nextWaste?.wasteType === 'REST'
                    ? 'bg-slate-500/15 border border-slate-500/40 scale-105 shadow-md shadow-slate-500/10'
                    : 'opacity-40 hover:opacity-75'
                }`}
              >
                <WasteWheelieBin type="REST" size="sm" animate={nextWaste?.wasteType === 'REST'} />
                <span className="text-[10px] font-semibold text-slate-300 mt-1">Rest</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('waste')}
            className="w-full py-2.5 rounded-2xl bg-surface-elevated hover:bg-white/10 border border-surface-border text-slate-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <span>Abfallkalender öffnen</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>

        {/* Bento 4: WG Bulletin Sticky Board (Flurfunk) */}
        <div className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                  <span>💬</span>
                  <span>Flurfunk & Notizen</span>
                </span>
                {openNotes.length > 0 && (
                  <span className="text-xs text-rose-300 font-semibold bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-mono">
                    {openNotes.length} offen
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline font-medium font-sans">WG-Pinnwand</span>
            </div>

            <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
              Mitteilungen & Notizen
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              Wichtige Absprachen, Termine und Wünsche für alle WG-Mitglieder.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {notesList && notesList.length > 0 ? (
                notesList.slice(0, 2).map((note: any, idx: number) => {
                  const categoryLabel =
                    note.category === 'ANKUENDIGUNG'
                      ? '📢 Ankündigung'
                      : note.category === 'HINWEIS'
                      ? '💡 Hinweis'
                      : note.category === 'FRAGE'
                      ? '❓ Frage'
                      : '💬 Notiz';
                  return (
                    <div
                      key={note.id || idx}
                      className="p-4 rounded-2xl border shadow-inner bg-theme-subtle border-theme text-slate-100"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="text-theme font-medium">
                          {categoryLabel} · {note.authorName || 'WG-Mitglied'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {note.createdAt ? formatGermanDate(note.createdAt) : 'Aktuell'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium line-clamp-3">
                        „{note.content || note.title}“
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="sm:col-span-2 p-4 rounded-2xl bg-surface-elevated/60 border border-surface-border text-center">
                  <p className="text-xs text-slate-300 font-medium">
                    Alles ruhig im Flurfunk! Noch keine Einträge vorhanden.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Trage einen Wunsch, eine Frage oder eine Erinnerung für die Gruppe ein.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('notes')}
            className="w-full py-2.5 rounded-2xl bg-surface-elevated hover:bg-white/10 border border-surface-border text-slate-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <span>Zum Flurfunk</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </div>

      {/* Compact WG Areas Quick Access Bento Dock */}
      <div className="bento-card rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold px-2 self-start md:self-center">
          <Sparkles className="w-4 h-4 text-theme-primary shrink-0" />
          <span className="font-sans font-bold">Schnellzugriff:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full md:w-auto md:flex-1">
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-surface-border hover:border-theme text-slate-200 hover:text-white text-xs font-medium transition-all group cursor-pointer"
          >
            <ChefHat className="w-3.5 h-3.5 text-theme-primary group-hover:scale-110 transition-transform" />
            <span className="truncate">Kochplan</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-surface-border hover:border-emerald-500/40 text-slate-200 hover:text-white text-xs font-medium transition-all group cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Einkaufsliste</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('recipes')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-surface-border hover:border-amber-500/40 text-slate-200 hover:text-white text-xs font-medium transition-all group cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Rezepte</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('notes')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-surface-border hover:border-violet-500/40 text-slate-200 hover:text-white text-xs font-medium transition-all group cursor-pointer"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Flurfunk</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('waste')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-surface-border hover:border-sky-500/40 text-slate-200 hover:text-white text-xs font-medium transition-all group cursor-pointer col-span-2 sm:col-span-1"
          >
            <Trash2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Abfallkalender</span>
          </button>
        </div>
      </div>
    </div>
  );
};
