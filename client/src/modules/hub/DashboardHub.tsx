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
  AlertCircle,
  Lightbulb,
  Mail,
  MessageSquare,
  EyeOff,
  Wallet,
  UtensilsCrossed,
  ClipboardList,
  Bath,
  Shirt,
  Flower2,
  Bed,
  SprayCan,
  PiggyBank,
} from 'lucide-react';

export const BroomIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-indigo-400 stroke-[1.75]' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v8" />
    <path d="M8 10h8" />
    <path d="M8.5 10 6.5 19.5Q6.5 21 8 21h8q1.5 0 1.5-1.5L15.5 10" />
    <path d="M10.5 15v5" />
    <path d="M13.5 15v5" />
  </svg>
);

export const getChoreOutlineIcon = (task: any, className: string = 'w-5 h-5') => {
  if (task?.isChefkoch) {
    return <ChefHat className={`${className} text-rose-400 stroke-[1.75]`} />;
  }

  const iconStr = (task?.icon || '').trim();
  const title = (task?.title || '').toLowerCase();
  const desc = (task?.description || '').toLowerCase();

  // 1. Check explicit task.icon / emoji FIRST (User preference in settings)
  if (iconStr) {
    if (iconStr === '🧹' || /broom|besen|kehr|sweep/i.test(iconStr)) {
      return <BroomIcon className={`${className} text-indigo-400 stroke-[1.75]`} />;
    }
    if (['👨‍🍳', '👩‍🍳', '🍳'].includes(iconStr) || /chef/i.test(iconStr)) {
      return <ChefHat className={`${className} text-rose-400 stroke-[1.75]`} />;
    }
    if (['🍽️', '🍴'].includes(iconStr) || /utensil|teller|besteck|koch|essen/i.test(iconStr)) {
      return <UtensilsCrossed className={`${className} text-amber-400 stroke-[1.75]`} />;
    }
    if (iconStr === '🗑️' || /trash|m[uü]ll|abfall/i.test(iconStr)) {
      return <Trash2 className={`${className} text-emerald-400 stroke-[1.75]`} />;
    }
    if (iconStr === '🧼' || /seife|soap|spray|reinigung|putz/i.test(iconStr)) {
      return <SprayCan className={`${className} text-sky-400 stroke-[1.75]`} />;
    }
    if (iconStr === '🧺' || /w[aä]sche|laundry|shirt/i.test(iconStr)) {
      return <Shirt className={`${className} text-violet-400 stroke-[1.75]`} />;
    }
    if (iconStr === '✨' || iconStr === '⭐' || /sparkle|stern/i.test(iconStr)) {
      return <Sparkles className={`${className} text-amber-300 stroke-[1.75]`} />;
    }
    if (['🛏️', '🛌'].includes(iconStr) || /bed|bett/i.test(iconStr)) {
      return <Bed className={`${className} text-indigo-400 stroke-[1.75]`} />;
    }
    if (iconStr === '🛒' || /shopping|einkauf/i.test(iconStr)) {
      return <ShoppingCart className={`${className} text-emerald-400 stroke-[1.75]`} />;
    }
    if (['🌱', '🪴', '🌸', '🌻'].includes(iconStr) || /garden|garten|pflanz|blume/i.test(iconStr)) {
      return <Flower2 className={`${className} text-emerald-400 stroke-[1.75]`} />;
    }
    if (['🛁', '🚿'].includes(iconStr) || /bath|bad/i.test(iconStr)) {
      return <Bath className={`${className} text-sky-400 stroke-[1.75]`} />;
    }
  }

  // 2. Check TITLE heuristics (high priority - title defines the task)
  if (
    title.includes('zimmer') ||
    title.includes('saugen') ||
    title.includes('staub') ||
    title.includes('wisch') ||
    title.includes('putz') ||
    title.includes('kehr') ||
    title.includes('besen') ||
    title.includes('fegen') ||
    title.includes('reinigung') ||
    title.includes('ordnung')
  ) {
    return <BroomIcon className={`${className} text-indigo-400 stroke-[1.75]`} />;
  }
  if (
    title.includes('koch') ||
    title.includes('küche') ||
    title.includes('abwasch') ||
    title.includes('spül') ||
    title.includes('tisch') ||
    title.includes('teller') ||
    title.includes('essen')
  ) {
    return <UtensilsCrossed className={`${className} text-amber-400 stroke-[1.75]`} />;
  }
  if (
    title.includes('bad') ||
    title.includes('sanitär') ||
    title.includes('dusche') ||
    title.includes('waschbecken') ||
    title.includes('wc') ||
    title.includes('toilette')
  ) {
    return <Bath className={`${className} text-sky-400 stroke-[1.75]`} />;
  }
  if (
    title.includes('müll') ||
    title.includes('abfall') ||
    title.includes('tonne') ||
    title.includes('gelber sack') ||
    title.includes('altpapier')
  ) {
    return <Trash2 className={`${className} text-emerald-400 stroke-[1.75]`} />;
  }
  if (
    title.includes('wäsche') ||
    title.includes('waschen') ||
    title.includes('trockner') ||
    title.includes('bügel')
  ) {
    return <Shirt className={`${className} text-violet-400 stroke-[1.75]`} />;
  }
  if (
    title.includes('einkauf') ||
    title.includes('markt') ||
    title.includes('besorgen')
  ) {
    return <ShoppingCart className={`${className} text-emerald-400 stroke-[1.75]`} />;
  }
  if (
    title.includes('garten') ||
    title.includes('pflanz') ||
    title.includes('blumen') ||
    title.includes('beet')
  ) {
    return <Flower2 className={`${className} text-emerald-400 stroke-[1.75]`} />;
  }

  // 3. Check DESCRIPTION heuristics (secondary fallback)
  if (
    desc.includes('zimmer') ||
    desc.includes('saugen') ||
    desc.includes('staub') ||
    desc.includes('wisch') ||
    desc.includes('putz') ||
    desc.includes('kehr') ||
    desc.includes('fegen')
  ) {
    return <BroomIcon className={`${className} text-indigo-400 stroke-[1.75]`} />;
  }
  if (
    desc.includes('koch') ||
    desc.includes('küche') ||
    desc.includes('abwasch') ||
    desc.includes('spül')
  ) {
    return <UtensilsCrossed className={`${className} text-amber-400 stroke-[1.75]`} />;
  }
  if (
    desc.includes('bad') ||
    desc.includes('sanitär') ||
    desc.includes('dusche') ||
    desc.includes('wc') ||
    desc.includes('toilette')
  ) {
    return <Bath className={`${className} text-sky-400 stroke-[1.75]`} />;
  }
  if (
    desc.includes('müll') ||
    desc.includes('abfall') ||
    desc.includes('tonne') ||
    desc.includes('gelber sack') ||
    desc.includes('mülleimer')
  ) {
    return <Trash2 className={`${className} text-emerald-400 stroke-[1.75]`} />;
  }
  if (
    desc.includes('wäsche') ||
    desc.includes('waschen') ||
    desc.includes('trockner')
  ) {
    return <Shirt className={`${className} text-violet-400 stroke-[1.75]`} />;
  }
  if (
    desc.includes('einkauf') ||
    desc.includes('markt') ||
    desc.includes('besorgen')
  ) {
    return <ShoppingCart className={`${className} text-emerald-400 stroke-[1.75]`} />;
  }
  if (
    desc.includes('garten') ||
    desc.includes('pflanz') ||
    desc.includes('blumen')
  ) {
    return <Flower2 className={`${className} text-emerald-400 stroke-[1.75]`} />;
  }

  // 4. Custom emoji fallback if user entered non-standard emoji
  if (iconStr && iconStr.length <= 4) {
    return <span className="text-base select-none leading-none flex items-center justify-center">{iconStr}</span>;
  }

  return <CheckCircle2 className={`${className} text-indigo-400 stroke-[1.75]`} />;
};

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
  const isStaff = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'BETREUER';

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

  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(`flurfunk_last_read_${user?.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
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
    try {
      const storedRead = localStorage.getItem(`flurfunk_last_read_${user.id}`);
      if (storedRead) {
        setLastReadMap(JSON.parse(storedRead));
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

  const handleDismissNotification = async (note: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (note.category === 'ANKUENDIGUNG') return;

    const updated = Array.from(new Set([...dismissedTopicIds, note.id]));
    setDismissedTopicIds(updated);
    if (user?.id) {
      try {
        localStorage.setItem(`flurfunk_dismissed_${user.id}`, JSON.stringify(updated));
        const updatedRead = { ...lastReadMap, [note.id]: new Date().toISOString() };
        setLastReadMap(updatedRead);
        localStorage.setItem(`flurfunk_last_read_${user.id}`, JSON.stringify(updatedRead));
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
    // Non-announcements disappear from Home once clicked/opened - EXCEPT if awaiting caregiver response!
    const isAwaiting = !isResident && isAwaitingCaregiver(note);
    if (note.category !== 'ANKUENDIGUNG' && !isAwaiting) {
      const updated = Array.from(new Set([...dismissedTopicIds, note.id]));
      setDismissedTopicIds(updated);
      if (user?.id) {
        try {
          localStorage.setItem(`flurfunk_dismissed_${user.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
    }
    if (user?.id) {
      const updatedRead = { ...lastReadMap, [note.id]: new Date().toISOString() };
      setLastReadMap(updatedRead);
      try {
        localStorage.setItem(`flurfunk_last_read_${user.id}`, JSON.stringify(updatedRead));
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
    try {
      sessionStorage.setItem('flurfunk_focus_note_id', note.id);
    } catch {
      // ignore
    }
    setCurrentTab('notes');
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentYear = now.getFullYear();

  // Personalized user greeting
  const firstName = user?.name ? user.name.split(' ')[0] : 'du';
  const isResident = user?.role === 'BEWOHNER';

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

  // Synchronize localStorage with backend state to eliminate phantom completions
  useEffect(() => {
    if (!todayChores?.myTasks || !user?.id) return;
    setPersonalDoneChores((prev) => {
      let changed = false;
      const next = [...prev];
      todayChores.myTasks.forEach((t: any) => {
        const key = `${t.date || todayChores?.date || 'today'}_${t.templateId}`;
        if (t.isCompletedForMe === false && next.includes(key)) {
          const idx = next.indexOf(key);
          if (idx !== -1) {
            next.splice(idx, 1);
            changed = true;
          }
        } else if (t.isCompletedForMe === true && !next.includes(key)) {
          next.push(key);
          changed = true;
        }
      });
      if (changed) {
        try {
          localStorage.setItem(`resident_chores_done_${user.id}`, JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });
  }, [todayChores, user?.id]);

  const handleToggleChore = async (chore: any, residentIdToToggle?: string) => {
    const choreKey = `${chore.date || todayChores?.date || 'today'}_${chore.templateId}`;

    if (chore.templateId && !chore.templateId.startsWith('chefkoch_')) {
      try {
        const res = await api.chores.toggleComplete({
          assignmentId: chore.assignmentId || undefined,
          templateId: chore.templateId,
          date: chore.date || todayChores?.date,
          year: currentYear,
          weekNumber: currentWeek,
          dayOfWeek: currentDayOfWeek,
          locationId: activeLocationId,
          residentId: residentIdToToggle ?? (user?.role === 'BEWOHNER' ? user?.id : undefined),
        });

        if (res?.assignment) {
          const isDoneForMe = Boolean(res.assignment.isCompletedForMe);
          setPersonalDoneChores((prev) => {
            const next = isDoneForMe
              ? (prev.includes(choreKey) ? prev : [...prev, choreKey])
              : prev.filter((k) => k !== choreKey);
            if (user?.id) {
              try {
                localStorage.setItem(`resident_chores_done_${user.id}`, JSON.stringify(next));
              } catch {}
            }
            return next;
          });
        }

        const refreshed = await api.chores.today(activeLocationId);
        if (refreshed) {
          setTodayChores(refreshed);
        }
      } catch (err) {
        console.error('Fehler beim Abhaken der Aufgabe:', err);
      }
    } else {
      togglePersonalChore(choreKey);
    }
  };

  useEffect(() => {
    if (!activeLocationId) return;

    let isMounted = true;
    const pollRealtimeData = async () => {
      try {
        const [choresRes, notesRes] = await Promise.all([
          api.chores.today(activeLocationId).catch(() => null),
          api.notes.list(activeLocationId).catch(() => null),
        ]);
        if (isMounted) {
          if (choresRes) setTodayChores(choresRes);
          if (notesRes) setNotesList(notesRes);
        }
      } catch {
        // ignore background poll errors
      }
    };

    const interval = setInterval(pollRealtimeData, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollRealtimeData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [activeLocationId]);

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

  const refreshBudget = async () => {
    if (!activeLocationId) return;
    try {
      const budgetRes = await api.food.budget(activeLocationId, currentYear, currentWeek).catch(() => null);
      setBudgetSummary(budgetRes);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Budgets:', err);
    }
  };

  const todayMeal = mealPlan?.days?.find((d: any) => d.dayOfWeek === currentDayOfWeek);
  const openNotes = notesList.filter((n: any) => !n.isHiddenForMe && n.status !== 'DONE' && n.category !== 'ANKUENDIGUNG');

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

  // 1. Active Announcements (ANKUENDIGUNG) are ALWAYS displayed at the top as long as they are valid
  const activeAnnouncements = notesList
    .filter((note: any) => {
      if (note.isHiddenForMe) return false;
      if (note.category !== 'ANKUENDIGUNG') return false;
      // Must not be archived
      if (note.isArchived) return false;
      // Must not be marked DONE
      if (note.status === 'DONE') return false;
      // Must not be expired (check both isExpired flag and expiresAt timestamp)
      if (note.isExpired) return false;
      if (note.expiresAt && new Date(note.expiresAt).getTime() <= Date.now()) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Helper to determine if a note is currently awaiting caregiver response / open question
  const isAwaitingCaregiver = (n: any): boolean => {
    if (n.isArchived || n.status === 'DONE' || n.isHiddenForMe) return false;
    const messages = n.messages || [];
    const residentMessages = messages.filter((m: any) => m.authorRole === 'BEWOHNER');
    const hasStaffResponse = Boolean(n.caregiverResponse) || messages.some((m: any) => m.authorRole === 'BETREUER' || m.authorRole === 'ADMIN');

    if (n.category === 'ANKUENDIGUNG') {
      if (residentMessages.length === 0) return false;
      const lastMsg = messages[messages.length - 1];
      return lastMsg?.authorRole === 'BEWOHNER';
    }

    const isStaffAuthor = n.authorRole === 'BETREUER' || n.authorRole === 'ADMIN' || (user?.id ? n.authorId === user.id : false);
    if (isStaffAuthor) {
      if (residentMessages.length === 0) return false;
      const lastMsg = messages[messages.length - 1];
      return lastMsg?.authorRole === 'BEWOHNER';
    }

    if (!hasStaffResponse) {
      return true;
    }

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      return lastMsg?.authorRole === 'BEWOHNER';
    }

    return false;
  };

  const openQuestionsCount = !isResident ? notesList.filter(isAwaitingCaregiver).length : 0;

  // 2. Other Flurfunk notifications: Initial incoming messages for the recipient or open Rückfragen
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const otherNotifications = notesList
    .filter((note: any) => {
      if (note.isHiddenForMe) return false;
      if (note.category === 'ANKUENDIGUNG') return false;
      if (note.isArchived || note.status === 'DONE' || note.isExpired) return false;
      if (note.expiresAt && new Date(note.expiresAt).getTime() <= Date.now()) return false;

      // Privacy check for residents
      if (isResident) {
        if (note.isPrivate && note.residentId !== user?.id) return false;
      }

      // For caregivers: If this note is awaiting a caregiver reply (new note or open resident Rückfrage),
      // it MUST appear on the dashboard!
      if (!isResident && isAwaitingCaregiver(note)) {
        return true;
      }

      // Dismissed notes are not displayed as banner
      if (dismissedTopicIds.includes(note.id)) return false;

      // Sender (Person A) never sees incoming banner on their own dashboard
      if (note.authorId && user?.id && note.authorId === user.id) return false;

      // If Person B (the recipient/user) has written a reply to this note,
      // it must NO LONGER be displayed on the dashboard!
      const messages = note.messages || [];
      const userHasReplied = messages.some((m: any) => m.authorId === user?.id);
      const staffHasReplied = !isResident && (
        messages.some((m: any) => m.authorRole === 'BETREUER' || m.authorRole === 'ADMIN') ||
        Boolean(note.caregiverResponse)
      );
      if (userHasReplied || staffHasReplied) {
        return false;
      }

      // Initial direct/private note for the recipient is always shown until replied or dismissed
      if (note.isPrivate) {
        return true;
      }

      // Initial public notes within 7 days or if pinned
      const age = note.createdAt ? Date.now() - new Date(note.createdAt).getTime() : Infinity;
      return note.isPinned || age < SEVEN_DAYS_MS;
    })
    .sort((a: any, b: any) => {
      const aAwaiting = !isResident && isAwaitingCaregiver(a);
      const bAwaiting = !isResident && isAwaitingCaregiver(b);
      if (aAwaiting !== bAwaiting) return aAwaiting ? -1 : 1;
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // 3. Notes with new unread replies in active conversations
  // (From the moment a reply is written, a hint in the Flurfunk pill indicates new replies)
  const notesWithNewReplies = notesList.filter((note: any) => {
    if (note.isHiddenForMe) return false;
    if (note.isArchived || note.status === 'DONE' || note.isExpired) return false;
    if (!note.messages || note.messages.length === 0) return false;

    // Check if the current user is a participant or recipient in this conversation
    const isAuthor = note.authorId === user?.id;
    const isTargetResident = isResident && note.residentId === user?.id;
    const isStaffMember = !isResident;
    const hasUserReplied = (note.messages || []).some((m: any) => m.authorId === user?.id);

    // For staff members, ANY resident message in their WG (whether announcement, public note, or ticket) is relevant!
    // For residents, only notes they authored, are targeted to them, or they replied to.
    const isRelevant = isStaffMember || isAuthor || isTargetResident || hasUserReplied;
    if (!isRelevant) return false;

    // The latest message in the thread
    const lastMsg = note.messages[note.messages.length - 1];

    // Must be from someone else!
    // For staff: the latest message must be from a resident!
    // For residents: the latest message must be from staff / another user.
    const isFromOther = isStaffMember
      ? (lastMsg.authorRole === 'BEWOHNER' || lastMsg.authorId !== user?.id)
      : lastMsg.authorId !== user?.id;
    if (!isFromOther) return false;

    // Check if unread (either locally or on server)
    const lastRead = lastReadMap[note.id];
    const isUnreadLocally = !lastRead || new Date(lastMsg.createdAt).getTime() > new Date(lastRead).getTime();
    const isUnreadServer = note.hasUnreadResponse && note.respondedByUserId !== user?.id;

    return isUnreadLocally || isUnreadServer;
  });

  const handleOpenFlurfunkPill = async () => {
    if (notesWithNewReplies.length > 0) {
      const targetNote = notesWithNewReplies[0];
      if (user?.id) {
        const updatedRead = { ...lastReadMap, [targetNote.id]: new Date().toISOString() };
        setLastReadMap(updatedRead);
        try {
          localStorage.setItem(`flurfunk_last_read_${user.id}`, JSON.stringify(updatedRead));
        } catch (e) {}
      }
      if (targetNote.hasUnreadResponse) {
        try {
          await api.notes.markRead(targetNote.id);
          setNotesList((prev) =>
            prev.map((n) => (n.id === targetNote.id ? { ...n, hasUnreadResponse: false } : n))
          );
        } catch (e) {}
      }
      try {
        sessionStorage.setItem('flurfunk_focus_note_id', targetNote.id);
      } catch {}
    }
    setCurrentTab('notes');
  };

  // Displayed notifications: ALL active announcements are ALWAYS displayed at the top,
  // accompanied by other notifications
  const otherDisplayCount = Math.max(1, 3 - activeAnnouncements.length);
  const displayedOtherNotifications = otherNotifications.slice(0, otherDisplayCount);
  const displayedNotifications = [...activeAnnouncements, ...displayedOtherNotifications];
  const remainingNotificationsCount = otherNotifications.length - displayedOtherNotifications.length;

  const getBannerConfig = (note: any) => {
    // 1. ANKUENDIGUNG is always RED/ROSE with AlertCircle
    if (note.category === 'ANKUENDIGUNG') {
      return {
        badge: 'Wichtige Ankündigung',
        badgeClass: 'bg-rose-500/20 text-rose-200 border border-rose-500/40',
        containerClass: 'bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/40 hover:border-rose-400/80 shadow-rose-500/5',
        iconColor: 'text-rose-400',
        Icon: AlertCircle,
        senderName: note.authorName || 'Betreuer',
        headline: note.title,
        snippet: note.content,
        textClass: 'text-rose-200/90',
      };
    }

    // 2. Open resident follow-up question (Rückfrage) for staff
    const messages = note.messages || [];
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const isResidentRückfrage = Boolean(
      (user?.role === 'BETREUER' || user?.role === 'ADMIN') &&
      lastMsg &&
      lastMsg.authorRole === 'BEWOHNER'
    );
    if (isResidentRückfrage) {
      return {
        badge: 'Offene Rückfrage von Bewohner',
        badgeClass: 'bg-rose-500/20 text-rose-200 border border-rose-500/40',
        containerClass: 'bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/40 hover:border-rose-400/80 shadow-rose-500/5',
        iconColor: 'text-rose-400',
        Icon: MessageSquare,
        senderName: lastMsg.authorName || 'Bewohner',
        headline: `Rückfrage zu: ${note.title}`,
        snippet: lastMsg.content,
        textClass: 'text-rose-200/90',
      };
    }

    // 2. HINWEIS is always YELLOW/AMBER with Lightbulb
    if (note.category === 'HINWEIS') {
      return {
        badge: 'Wichtiger Hinweis',
        badgeClass: 'bg-amber-500/20 text-amber-200 border border-amber-500/40',
        containerClass: 'bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/40 hover:border-amber-400/80 shadow-amber-500/5',
        iconColor: 'text-amber-400',
        Icon: Lightbulb,
        senderName: note.authorName || 'Flurfunk',
        headline: note.title,
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
        badge: 'Neues Bewohner-Anliegen',
        badgeClass: 'bg-purple-500/20 text-purple-200 border border-purple-500/40',
        containerClass: 'bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/40 hover:border-purple-400/80 shadow-purple-500/5',
        iconColor: 'text-purple-400',
        Icon: Mail,
        senderName: note.authorName || note.residentName || 'Bewohner',
        headline: note.title || (note.content?.length > 40 ? note.content.slice(0, 37) + '...' : note.content) || 'Mitteilung',
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
        badge: 'Neue Betreuer-Antwort',
        badgeClass: 'bg-sky-500/20 text-sky-200 border border-sky-500/40',
        containerClass: 'bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/40 hover:border-sky-400/80 shadow-sky-500/5',
        iconColor: 'text-sky-400',
        Icon: MessageSquare,
        senderName: note.respondedByName || 'Betreuer',
        headline: `Zu deinem Beitrag: ${note.title}`,
        snippet: note.caregiverResponse,
        textClass: 'text-sky-200/90',
      };
    }

    // 5. Direct message from caregiver to resident
    const isDirect = Boolean(note.isDirectMessage || (note.isPrivate && note.residentId === user?.id));
    if (isDirect) {
      return {
        badge: 'Neue Direktnachricht',
        badgeClass: 'bg-sky-500/20 text-sky-200 border border-sky-500/40',
        containerClass: 'bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/40 hover:border-sky-400/80 shadow-sky-500/5',
        iconColor: 'text-sky-400',
        Icon: Mail,
        senderName: note.authorName || 'Betreuer',
        headline: note.title,
        snippet: note.content,
        textClass: 'text-sky-200/90',
      };
    }

    // 6. Default general note (ALLGEMEIN) - BLUE / SKY
    return {
      badge: 'Neuer Flurfunk-Beitrag',
      badgeClass: 'bg-sky-500/20 text-sky-200 border border-sky-500/40',
      containerClass: 'bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/40 hover:border-sky-400/80 shadow-sky-500/5',
      iconColor: 'text-sky-400',
      Icon: MessageSquare,
      senderName: note.authorName || 'Flurfunk',
      headline: note.title,
      snippet: note.content,
      textClass: 'text-sky-200/90',
    };
  };

  const wasteBentoCard = (
    <div key="bento-waste" className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
            <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
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
                ? 'bg-amber-900/25 border border-amber-700/50 scale-105 shadow-md shadow-amber-900/20'
                : 'opacity-40 hover:opacity-75'
            }`}
          >
            <WasteWheelieBin type="BIO" size="sm" animate={nextWaste?.wasteType === 'BIO'} />
            <span className="text-[10px] font-semibold text-amber-200 mt-1">Bio</span>
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
  );

  const flurfunkBentoCard = (
    <div key="bento-flurfunk" className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
            <MessageSquare className="w-3.5 h-3.5 stroke-[2]" />
            <span>Flurfunk</span>
          </span>
          {notesWithNewReplies.length > 0 ? (
            <span className="text-xs text-rose-200 font-bold bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 rounded-full font-sans flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {notesWithNewReplies.length} {notesWithNewReplies.length === 1 ? 'neue Antwort' : 'neue Antworten'}
            </span>
          ) : openNotes.length > 0 ? (
            <span className="text-xs text-rose-300 font-semibold bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-mono">
              {openNotes.length} offen
            </span>
          ) : null}
        </div>

        <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
          Mitteilungen & Notizen
        </h3>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
          Wichtige Absprachen, Termine und Wünsche für alle WG-Mitglieder.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {notesList && notesList.length > 0 ? (
            notesList.filter((n: any) => !n.isHiddenForMe).slice(0, 2).map((note: any, idx: number) => {
              let cardClass = 'bg-sky-500/10 border-sky-500/30 text-sky-200 hover:border-sky-400/60';
              let headerClass = 'text-sky-300 font-medium';
              let categoryLabel = 'Mitteilung';
              let CatIcon = MessageSquare;

              if (note.category === 'ANKUENDIGUNG') {
                cardClass = 'bg-rose-500/10 border-rose-500/30 text-rose-200 hover:border-rose-400/60';
                headerClass = 'text-rose-300 font-medium';
                categoryLabel = 'Ankündigung';
                CatIcon = AlertCircle;
              } else if (note.category === 'HINWEIS') {
                cardClass = 'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:border-amber-400/60';
                headerClass = 'text-amber-300 font-medium';
                categoryLabel = 'Hinweis';
                CatIcon = Lightbulb;
              }

              return (
                <div
                  key={note.id || idx}
                  onClick={() => handleOpenTopic(note)}
                  className={`p-4 rounded-2xl border shadow-inner transition-all hover:scale-[1.01] cursor-pointer ${cardClass}`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className={`flex items-center gap-1.5 truncate ${headerClass}`}>
                      <CatIcon className="w-3.5 h-3.5 shrink-0 stroke-[2.25]" />
                      <span className="truncate">{categoryLabel} · {note.authorName || 'WG-Mitglied'}</span>
                    </span>
                    <span className="text-[10px] font-mono opacity-60 shrink-0 ml-1">
                      {note.createdAt ? formatGermanDate(note.createdAt) : 'Aktuell'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium line-clamp-3">
                    {note.content || note.title}
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
  );

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

        {(notesWithNewReplies.length > 0 || openNotes.length > 0 || openQuestionsCount > 0) && (
          <div className="mt-4">
            {notesWithNewReplies.length > 0 ? (
              <button
                type="button"
                onClick={handleOpenFlurfunkPill}
                className="px-4 py-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-xs text-rose-200 font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-500/10 group animate-in fade-in"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <MessageSquare className="w-4 h-4 text-rose-300 stroke-[2.2]" />
                <span>
                  {notesWithNewReplies.length === 1
                    ? '1 neue Rückfrage im Flurfunk'
                    : `${notesWithNewReplies.length} neue Rückfragen im Flurfunk`}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform ml-0.5" />
              </button>
            ) : openQuestionsCount > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentTab('notes')}
                className="px-4 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-xs text-rose-200 font-medium transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-500/5 group"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <MessageSquare className="w-4 h-4 text-rose-400 stroke-[2]" />
                <span>
                  {openNotes.length} {openNotes.length === 1 ? 'Eintrag' : 'Einträge'} im Flurfunk
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-500/25 text-rose-300 font-bold text-[11px] border border-rose-500/30">
                  +{openQuestionsCount} {openQuestionsCount === 1 ? 'Rückfrage' : 'Rückfragen'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentTab('notes')}
                className="px-3.5 py-1.5 rounded-2xl bg-surface-card border border-rose-500/30 text-xs text-rose-300 font-medium hover:bg-surface-elevated transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <MessageSquare className="w-4 h-4 stroke-[2]" />
                <span>{openNotes.length} {openNotes.length === 1 ? 'Eintrag' : 'Einträge'} im Flurfunk</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Flurfunk Notification Banner (For both Caregivers and Residents) */}
      {displayedNotifications.length > 0 && (
        <div className="space-y-3">
          {displayedNotifications.map((note: any) => {
            const config = getBannerConfig(note);
            const IconComponent = config.Icon;
            const isAnnouncement = note.category === 'ANKUENDIGUNG';

            return (
              <div
                key={note.id}
                onClick={() => handleOpenTopic(note)}
                className={`${config.containerClass} rounded-3xl p-4 sm:p-5 shadow-lg flex items-start justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-200 cursor-pointer group transition-all`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Clean outline SVG icon */}
                  <div className="mt-0.5 shrink-0 flex items-center justify-center">
                    <IconComponent className={`w-6 h-6 ${config.iconColor} stroke-[1.75]`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Header meta row: Category Badge Pill & Sender Name */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${config.badgeClass} uppercase tracking-wider font-display shrink-0`}>
                        {config.badge}
                      </span>
                      {note.messages && note.messages.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-elevated border border-surface-border text-slate-200 shadow-xs">
                          <MessageSquare className="w-3 h-3 text-rose-400" />
                          <span>{note.messages.length} {note.messages.length === 1 ? 'Antwort' : 'Antworten'}</span>
                        </span>
                      )}
                      {!isResident && note.messages && note.messages.length > 0 && note.messages[note.messages.length - 1].authorRole === 'BEWOHNER' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white font-display shadow-xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>Neue Rückfrage</span>
                        </span>
                      )}
                      {!isAnnouncement && (
                        <span className="text-[11px] text-slate-300 font-medium">
                          von <strong className="text-white font-semibold">{config.senderName}</strong>
                        </span>
                      )}
                      {!isResident && isAnnouncement && note.expiresAt && (
                        <span className="text-[10px] text-rose-300/90 font-mono bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md">
                          Gültig bis {formatGermanDate(note.expiresAt)}
                        </span>
                      )}
                    </div>

                    {/* Title with NO quotation marks */}
                    <h4 className="text-sm font-semibold text-white group-hover:text-white transition-colors truncate">
                      {config.headline}
                    </h4>

                    {/* Snippet with NO quotation marks */}
                    <p className={`text-xs ${config.textClass} mt-1 line-clamp-2 italic font-sans`}>
                      {config.snippet}
                    </p>

                    {/* Latest reply snippet preview */}
                    {note.messages && note.messages.length > 0 && (
                      <div className="mt-2 text-[11px] text-rose-200/95 font-medium flex items-center gap-1.5 pt-1.5 border-t border-white/10">
                        <MessageSquare className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">
                          <strong>{note.messages[note.messages.length - 1].authorName} ({note.messages[note.messages.length - 1].authorRole === 'BEWOHNER' ? 'Bewohner/in' : 'Betreuer/in'}):</strong> „{note.messages[note.messages.length - 1].content}“
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right controls: Dismiss button with EyeOff (for non-announcements) */}
                {!isAnnouncement && (
                  <div className="shrink-0 flex items-center self-start sm:self-center pl-1 sm:pl-2">
                    <button
                      type="button"
                      onClick={(e) => handleDismissNotification(note, e)}
                      title="Mitteilung ausblenden"
                      className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <EyeOff className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                )}
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
                <MessageSquare className="w-3.5 h-3.5 text-rose-400 stroke-[2]" />
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
        const chefDishTitle = todayMeal?.recipe?.title || todayMeal?.customDishTitle || 'Gemeinschaftsessen';
        const chefkochChore = isTodayCook
          ? {
              templateId: `chefkoch_${todayChores?.date || formatGermanDate(now)}`,
              date: todayChores?.date || formatGermanDate(now),
              title: `Kochtraining: ${chefDishTitle}`,
              description: 'Du bist heute für die Zubereitung des Gemeinschaftsessens zuständig.',
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
                  <ClipboardList className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Deine Aufgaben</span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
                Deine heutigen Aufgaben
              </h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
                {residentTasksList.length === 0
                  ? 'Heute stehen keine anstehenden Aufgaben für dich an.'
                  : 'Hier siehst du deine eingeteilten Haushalts- und Alltagsdienste für den heutigen Tag.'}
              </p>

              {residentTasksList.length > 0 ? (
                <div
                  className={
                    residentTasksList.length === 1
                      ? 'w-full'
                      : residentTasksList.length === 2
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5'
                      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'
                  }
                >
                  {residentTasksList.map((task: any) => {
                    const choreKey = `${task.date || todayChores?.date || 'today'}_${task.templateId}`;
                    const isDone = task.isCompletedForMe !== undefined
                      ? Boolean(task.isCompletedForMe)
                      : (Boolean(task.isCompleted) || personalDoneChores.includes(choreKey));

                    if (residentTasksList.length === 1) {
                      return (
                        <div
                          key={task.templateId}
                          onClick={() => handleToggleChore(task, user?.id)}
                          className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none cursor-pointer group/task ${
                            isDone
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100 shadow-sm'
                              : 'bg-surface-elevated/70 hover:bg-surface-elevated border-surface-border hover:border-indigo-500/40 text-slate-100'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <div
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                                isDone
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-surface-card border border-surface-border text-indigo-400'
                              }`}
                            >
                              {getChoreOutlineIcon(task, 'w-6 h-6')}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span
                                  className={`text-sm sm:text-base font-semibold leading-snug break-words ${
                                    isDone ? 'line-through text-slate-400' : 'text-white'
                                  }`}
                                >
                                  {task.title}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                    isDone
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  }`}
                                >
                                  {isDone ? '✓ Erledigt' : 'Offen'}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words font-sans max-w-2xl">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center sm:self-center self-end">
                            <div
                              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 border font-semibold text-xs transition-all ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-xs'
                                  : 'border-slate-500 bg-surface-card/60 group-hover/task:border-indigo-400 text-slate-200'
                              }`}
                            >
                              {isDone ? (
                                <>
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  <span>Erledigt</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-slate-400 group-hover/task:bg-indigo-400 transition-colors" />
                                  <span>Als erledigt abhaken</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={task.templateId}
                        onClick={() => handleToggleChore(task, user?.id)}
                        className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3.5 select-none cursor-pointer group/task ${
                          isDone
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100 shadow-xs'
                            : 'bg-surface-elevated/70 hover:bg-surface-elevated border-surface-border hover:border-indigo-500/40 text-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                            {getChoreOutlineIcon(task, 'w-5 h-5')}
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
                  <span>Keine anstehenden Aufgaben für dich heute eingeteilt. Genieße deinen Tag!</span>
                </div>
              )}
            </div>

            {/* Resident Footer Action */}
            <div className="mt-5 pt-4 border-t border-surface-border/50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setCurrentTab('chores')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-surface-elevated hover:bg-white/10 border border-surface-border hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 font-sans shadow-xs group"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                <span>Aufgabenplan öffnen</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* STAFF ONLY: Heutige Aufgaben der WG */}
      {user?.role !== 'BEWOHNER' && todayChores?.todayItems && (
        <div className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                <ClipboardList className="w-3.5 h-3.5 stroke-[2]" />
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
              {todayChores.todayItems.map((task: any) => {
                const isAllDone = Boolean(task.isCompleted);
                const completedCount = task.completedCount || 0;
                const totalAssignedCount = task.totalAssignedCount || (task.assignedResidents?.length || 1);
                const isPartiallyDone = !isAllDone && completedCount > 0;

                return (
                  <div
                    key={task.templateId}
                    onClick={() => handleToggleChore(task)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 select-none ${
                      isAllDone
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-100 shadow-sm shadow-emerald-500/10'
                        : isPartiallyDone
                        ? 'bg-indigo-500/10 border-indigo-500/35 text-slate-100'
                        : 'bg-surface-elevated/60 border-surface-border hover:border-indigo-500/50 text-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">{getChoreOutlineIcon(task, 'w-5 h-5')}</div>
                        <div className="min-w-0">
                          <div className={`text-xs font-semibold truncate ${isAllDone ? 'text-emerald-200 font-bold' : 'text-white'}`}>
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {task.isAllResidents ? (
                              <span className={isAllDone ? 'text-emerald-300/80 font-medium' : 'text-indigo-300 font-medium'}>👥 Alle Bewohner</span>
                            ) : task.assignedResidents && task.assignedResidents.length > 0 ? (
                              <span className={`truncate max-w-[150px] font-medium ${isAllDone ? 'text-emerald-300/80' : 'text-indigo-300'}`}>
                                👤 {task.assignedResidents.map((r: any) => r.name).join(', ')}
                              </span>
                            ) : task.resident ? (
                              <span className={isAllDone ? 'text-emerald-300/80 font-medium' : 'text-indigo-300 font-medium'}>👤 {task.resident.name}</span>
                            ) : (
                              <span className="text-slate-500 italic">Niemand eingeteilt</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isAllDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold font-sans shadow-xs">
                            <Check className="w-3 h-3 text-emerald-300 stroke-[3]" />
                            <span>Erledigt</span>
                          </span>
                        ) : isPartiallyDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold font-sans shadow-xs">
                            <span>{completedCount}/{totalAssignedCount} erledigt</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium font-sans">
                            Offen
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Breakdown of residents when multiple or all residents are assigned */}
                    {task.assignedResidents && task.assignedResidents.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-surface-border/30">
                        {task.assignedResidents.map((r: any) => {
                          const rDone = (task.completedResidentIds || []).includes(r.id);
                          return (
                            <span
                              key={r.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleChore(task, r.id);
                              }}
                              title={
                                rDone
                                  ? `${r.name}: Erledigt (Klicken zum Umschalten)`
                                  : `${r.name}: Offen (Klicken zum Umschalten)`
                              }
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                                rDone
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                                  : 'bg-surface-card border-surface-border text-slate-400 hover:border-indigo-400/60'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${rDone ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                              <span className="truncate max-w-[80px]">{r.name}</span>
                              {rDone && <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Footer Action */}
          <div className="mt-5 pt-4 border-t border-surface-border/50 flex items-center justify-end">
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

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                <UtensilsCrossed className="w-3.5 h-3.5 stroke-[2]" />
                <span>Heute frisch auf den Tisch</span>
              </div>
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
            </div>

            {/* Chefkoch & Servings Info moved into the card body */}
            <div className="p-3.5 mb-4 rounded-2xl bg-surface-elevated/70 border border-surface-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-5 h-5 text-rose-400 stroke-[1.75]" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-sans">
                    Kochdienst
                  </div>
                  <div className="text-xs font-semibold text-rose-200">
                    {todayMeal?.cookName || 'Offen'}
                  </div>
                </div>
              </div>

              <div className="w-px h-7 bg-white/10" />

              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-slate-400 stroke-[1.75]" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-sans">
                    Portionen
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {todayMeal?.servings || 6} Portionen
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meal Footer Bar */}
          <div className="relative z-10 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setCurrentTab('mealplan')}
              className="btn-theme-gradient w-full py-2.5 rounded-2xl text-white font-semibold text-xs shadow-lg hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 font-sans"
            >
              <span>Kochplan & Rezepte</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bento 2: Shopping Radar & Basket (Directly integrated weekly budget, ample width, no preview clutter) */}
        {(() => {
          const totalWeeklyBudget = budgetSummary?.weeklyBudget ?? activeLocation?.weeklyBudget ?? 350;
          const spentWeeklyAmount =
            budgetSummary?.actualSpent !== null && budgetSummary?.actualSpent !== undefined
              ? budgetSummary.actualSpent
              : (budgetSummary?.estimatedShoppingCost ?? shoppingSummary?.totalEstimatedCost ?? 0);
          const remainingWeeklyBudget =
            budgetSummary?.remainingBudget != null
              ? budgetSummary.remainingBudget
              : Math.max(0, totalWeeklyBudget - spentWeeklyAmount);
          const percentWeeklySpent =
            totalWeeklyBudget > 0 ? Math.min(100, Math.round((spentWeeklyAmount / totalWeeklyBudget) * 100)) : 0;
          const isWeeklyReceiptRecorded =
            budgetSummary?.actualSpent !== null && budgetSummary?.actualSpent !== undefined;

          return (
            <div className="bento-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Header: Badge + Estimated Total */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider font-sans whitespace-nowrap">
                    <ShoppingCart className="w-3.5 h-3.5 stroke-[2]" />
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
                <p className="text-xs text-slate-300 mb-5 leading-relaxed font-sans">
                  Geplant bei <strong className="text-white font-semibold">{shoppingSummary?.supermarketName || 'Supermarkt'}</strong> für diese Woche.
                </p>

                {/* Harmoniously Integrated Weekly Budget (No box in a box, clear key metrics) */}
                <div
                  onClick={() => {
                    if (isStaff) {
                      setCurrentTab('budget');
                    }
                  }}
                  className={`pt-4 pb-1 border-t border-white/5 space-y-3.5 ${
                    isStaff ? 'cursor-pointer group/budget' : ''
                  }`}
                  title={isStaff ? 'Klicken, um Kasse & Budget zu öffnen' : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 font-display">
                      <Wallet className="w-4 h-4 text-emerald-400 stroke-[2]" />
                      <span>Aktuelles Wochenbudget</span>
                    </div>
                    {isStaff && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 group-hover/budget:bg-emerald-500/25 transition-colors">
                        Verwalten →
                      </span>
                    )}
                  </div>

                  {/* 3 Metrics: Gesamtbudget, Verwendet, Noch offen */}
                  <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
                    <div className="p-2.5 rounded-2xl bg-surface-elevated/60 border border-surface-border/60">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-medium truncate">
                        Gesamt
                      </div>
                      <div className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                        {totalWeeklyBudget.toFixed(0)} €
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-surface-elevated/60 border border-surface-border/60">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-medium truncate">
                        {isWeeklyReceiptRecorded ? 'Bon erfasst' : 'Verwendet'}
                      </div>
                      <div className="text-sm sm:text-base font-bold text-slate-200 font-mono mt-0.5">
                        {spentWeeklyAmount.toFixed(spentWeeklyAmount % 1 === 0 ? 0 : 2)} €
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono font-semibold truncate">
                        Noch offen
                      </div>
                      <div className="text-sm sm:text-base font-bold text-emerald-300 font-mono mt-0.5">
                        {remainingWeeklyBudget.toFixed(remainingWeeklyBudget % 1 === 0 ? 0 : 2)} €
                      </div>
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${percentWeeklySpent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{percentWeeklySpent}% verbraucht</span>
                      {isWeeklyReceiptRecorded && <span>✓ Kassenbon abgerechnet</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  onClick={() => setCurrentTab('shopping')}
                  className="w-full py-2.5 sm:py-3 rounded-2xl bg-surface-elevated hover:bg-white/10 border border-surface-border text-slate-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <span>Einkaufsliste öffnen</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Bento 3 & 4: Flurfunk and Waste Radar (Flurfunk is placed above Waste Radar for residents) */}
        {user?.role === 'BEWOHNER' ? (
          <>
            {flurfunkBentoCard}
            {wasteBentoCard}
          </>
        ) : (
          <>
            {wasteBentoCard}
            {flurfunkBentoCard}
          </>
        )}
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
