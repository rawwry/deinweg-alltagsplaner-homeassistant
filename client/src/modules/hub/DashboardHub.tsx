import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
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
} from 'lucide-react';

interface DashboardHubProps {
  setCurrentTab: (tab: string) => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({ setCurrentTab }) => {
  const { user, activeLocation, activeLocationId } = useAuth();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [shoppingSummary, setShoppingSummary] = useState<any>(null);
  const [wasteSummary, setWasteSummary] = useState<any[]>([]);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentHour = now.getHours();
  const currentYear = now.getFullYear();

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

  // Formatted date string
  const formattedToday = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  useEffect(() => {
    let isMounted = true;
    const loadOverview = async () => {
      try {
        setLoading(true);
        const [planRes, shopRes, wasteRes, notesRes] = await Promise.all([
          api.food.mealplan(activeLocationId, currentYear, currentWeek).catch(() => null),
          api.food.shoppingList(activeLocationId, currentYear, currentWeek).catch(() => null),
          api.waste.list(activeLocationId).catch(() => []),
          api.notes.list(activeLocationId).catch(() => []),
        ]);

        if (!isMounted) return;
        setMealPlan(planRes);
        setShoppingSummary(shopRes);
        setWasteSummary(wasteRes || []);
        setNotesList(notesRes || []);
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
  const nextWaste = wasteSummary.length > 0 ? wasteSummary[0] : null;
  const openNotes = notesList.filter((n: any) => n.status !== 'DONE');

  // Calculate days until next waste pickup
  let daysUntilWaste: number | null = null;
  if (nextWaste?.date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextWaste.date);
    target.setHours(0, 0, 0, 0);
    daysUntilWaste = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Waste type title mapping
  const wasteTypeNames: Record<string, string> = {
    YELLOW: 'Wertstoff / Gelber Sack',
    BIO: 'Biotonne',
    PAPER: 'Altpapiertonne',
    REST: 'Restmülltonne',
  };

  return (
    <div className="space-y-7 max-w-6xl mx-auto pb-10">
      {/* Top Welcome Headline */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-1">
        <div>
          <div className="inline-flex items-center gap-2 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-1.5 font-sans">
            <span>{timeEmoji} {timeGreeting}, WG {activeLocation?.name || user?.locationName || 'Emsdetten'}!</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium">{formattedToday} · KW {currentWeek}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
            Was steht heute im Alltag an?
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {openNotes.length > 0 && (
            <button
              type="button"
              onClick={() => setCurrentTab('notes')}
              className="px-3.5 py-1.5 rounded-2xl bg-surface-card border border-rose-500/30 text-xs text-rose-300 font-medium hover:bg-surface-elevated transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>🔔</span>
              <span>{openNotes.length} {openNotes.length === 1 ? 'Notiz' : 'Notizen'} an der Pinnwand</span>
            </button>
          )}
        </div>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Bento 1: Bistro Hero Meal Spotlight (Span 2) */}
        <div className="bento-card lg:col-span-2 rounded-[2.5rem] p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
          {/* Ambient warm glow */}
          <div className="absolute -right-16 -top-16 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-6 top-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-9xl select-none">
            🍳
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <span>🍽️</span>
                <span>Heute frisch auf den Tisch</span>
              </div>
              <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                {todayMeal?.customDishTitle ? 'Individuelles Gericht' : 'Gemeinsames Abendessen'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold text-white group-hover:text-rose-300 transition-colors leading-tight mb-3 font-sans tracking-tight">
              {todayMeal?.recipe?.title || todayMeal?.customDishTitle || 'Heute Selbstversorgung'}
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed max-w-xl mb-6 font-normal font-sans">
              {todayMeal?.recipe?.description ||
                (todayMeal?.customDishTitle
                  ? 'Frei gewähltes Gericht ohne festes Rezept.'
                  : 'Heute kocht jeder nach eigenem Wunsch, oder ihr tragt im Wochenplan noch euer Lieblingsessen ein!')}
            </p>

            {/* Culinary Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
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
          <div className="relative z-10 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-rose-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 font-sans"
            >
              <span>Wochenplan & Rezepte ansehen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bento 2: Visual Waste Radar (Span 1) */}
        <div className="bento-card rounded-[2.5rem] p-7 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-semibold uppercase tracking-wider font-sans">
                Abfall-Radar
              </span>
              {nextWaste ? (
                daysUntilWaste === 0 ? (
                  <span className="text-xs font-semibold text-rose-400 bg-rose-950/80 border border-rose-800 px-2.5 py-0.5 rounded-full animate-pulse">
                    Heute Abholung!
                  </span>
                ) : daysUntilWaste === 1 ? (
                  <span className="text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full animate-pulse">
                    Morgen!
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400 bg-surface-elevated px-2.5 py-0.5 rounded-full border border-surface-border">
                    In {daysUntilWaste} Tagen
                  </span>
                )
              ) : (
                <span className="text-xs text-slate-400 font-medium">Alles erledigt</span>
              )}
            </div>

            <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
              {nextWaste ? wasteTypeNames[nextWaste.wasteType] || 'Abfalltermin' : 'Keine Abfuhr'}
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed font-sans">
              {nextWaste
                ? daysUntilWaste === 1
                  ? 'Bitte heute Abend nach dem Abendessen vor das Tor stellen.'
                  : daysUntilWaste === 0
                  ? 'Steht heute zur Abholung bereit!'
                  : `Nächste Leerung am ${nextWaste.date}.`
                : 'Aktuell steht in den nächsten Tagen keine Abholung an.'}
            </p>

            {/* Visual Color-Coded Bins Showcase */}
            <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-surface-border mb-4 flex items-center justify-around gap-2">
              {/* Gelber Sack / Wertstoff */}
              <div
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  nextWaste?.wasteType === 'YELLOW'
                    ? 'bg-yellow-500/20 border border-yellow-500/50 scale-105 shadow-md shadow-yellow-500/20'
                    : 'opacity-40'
                }`}
              >
                <div className="w-8 h-10 rounded-lg bg-yellow-400 border-2 border-yellow-300 flex items-center justify-center text-slate-950 font-bold text-xs shadow-inner">
                  ♻️
                </div>
                <span className="text-[10px] font-semibold text-yellow-300">Gelb</span>
              </div>

              {/* Biotonne */}
              <div
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  nextWaste?.wasteType === 'BIO'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 scale-105 shadow-md shadow-emerald-500/20'
                    : 'opacity-40'
                }`}
              >
                <div className="w-8 h-10 rounded-lg bg-emerald-700 border-2 border-emerald-600 flex items-center justify-center text-white text-[11px] shadow-inner">
                  🍂
                </div>
                <span className="text-[10px] font-semibold text-emerald-300">Bio</span>
              </div>

              {/* Altpapier */}
              <div
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  nextWaste?.wasteType === 'PAPER'
                    ? 'bg-sky-500/20 border border-sky-500/50 scale-105 shadow-md shadow-sky-500/20'
                    : 'opacity-40'
                }`}
              >
                <div className="w-8 h-10 rounded-lg bg-sky-600 border-2 border-sky-500 flex items-center justify-center text-white text-[11px] shadow-inner">
                  📦
                </div>
                <span className="text-[10px] font-semibold text-sky-300">Papier</span>
              </div>

              {/* Restmüll */}
              <div
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  nextWaste?.wasteType === 'REST'
                    ? 'bg-slate-500/20 border border-slate-500/50 scale-105 shadow-md shadow-slate-500/20'
                    : 'opacity-40'
                }`}
              >
                <div className="w-8 h-10 rounded-lg bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-white text-[11px] shadow-inner">
                  🗑️
                </div>
                <span className="text-[10px] font-semibold text-slate-300">Rest</span>
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

        {/* Bento 3: Shopping Radar & Basket (Span 1) */}
        <div className="bento-card rounded-[2.5rem] p-7 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider font-sans">
                Einkaufskorb
              </span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                ~ {shoppingSummary?.totalEstimatedCost ? `${shoppingSummary.totalEstimatedCost.toFixed(2)} €` : '0.00 €'}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-white mb-1.5 font-sans tracking-tight">
              {shoppingSummary?.items?.length || 0}{' '}
              {shoppingSummary?.items?.length === 1 ? 'Artikel auf der Liste' : 'Artikel auf der Liste'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              Geplant bei <strong className="text-white font-semibold">{shoppingSummary?.supermarketName || 'Supermarkt'}</strong> für diese Woche.
            </p>

            {/* Quick Preview Items */}
            <div className="space-y-2 mb-4">
              {shoppingSummary?.items && shoppingSummary.items.length > 0 ? (
                shoppingSummary.items.slice(0, 3).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-elevated/70 border border-surface-border text-xs"
                  >
                    <span className="flex items-center gap-2 text-slate-200 font-medium truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="truncate">{item.title} ({item.amount} {item.unit})</span>
                    </span>
                    <span className="text-slate-400 font-mono flex-shrink-0 ml-2">
                      {item.estimatedPrice ? `${item.estimatedPrice.toFixed(2)} €` : '—'}
                    </span>
                  </div>
                ))
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
            <span>Einkaufsliste abhaken</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>

        {/* Bento 4: WG Bulletin Sticky Board (Span 2) */}
        <div className="bento-card lg:col-span-2 rounded-[2.5rem] p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider font-sans">
                  WG-Pinnwand & Notizen
                </span>
                {openNotes.length > 0 && (
                  <span className="text-xs text-rose-300 font-semibold bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-mono">
                    {openNotes.length} offen
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline font-medium">Mitteilungen, Wünsche & Alltag</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {notesList && notesList.length > 0 ? (
                notesList.slice(0, 2).map((note: any, idx: number) => {
                  const isStaffNote = note.isStaffOnly || note.category === 'BETREUUNG';
                  return (
                    <div
                      key={note.id || idx}
                      className={`p-4 rounded-2xl border shadow-inner ${
                        idx === 0
                          ? 'bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/30 text-rose-100'
                          : 'bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/30 text-pink-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className={idx === 0 ? 'text-rose-300' : 'text-pink-300'}>
                          {isStaffNote ? 'Betreuer-Notiz' : 'WG-Notiz'} · {note.authorName || 'WG-Mitglied'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {note.createdAt ? new Date(note.createdAt).toLocaleDateString('de-DE') : 'Aktuell'}
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
                    Alles ruhig an der Pinnwand! Noch keine Notizen vorhanden.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Trage einen Wunsch, eine Frage oder eine Erinnerung für die Gruppe ein.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-white/5 text-xs gap-3 font-sans">
            <span className="text-slate-400 font-medium">
              Alle Bewohner und Betreuer können Zettel und Wünsche anheften.
            </span>
            <button
              type="button"
              onClick={() => setCurrentTab('notes')}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-surface-elevated hover:bg-white/10 border border-surface-border text-slate-200 hover:text-white font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:border-rose-500/30"
            >
              <span>+ Zur WG-Pinnwand</span>
            </button>
          </div>
        </div>
      </div>

      {/* WG Areas and Quick Shortcuts (Warm Living Bento Tiles) */}
      <div className="bento-card rounded-[2.5rem] p-7 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 font-sans tracking-tight">
              <span>Schnellzugriff auf unsere WG-Bereiche</span>
              <Sparkles className="w-4 h-4 text-rose-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Alles für einen entspannten, gemeinsamen Alltag in der Wohngruppe
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="p-5 rounded-2xl border border-surface-border bg-surface-elevated/50 hover:bg-surface-elevated hover:border-rose-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/10 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-rose-500/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-semibold text-slate-100 group-hover:text-rose-300 transition-colors font-sans">
              Wochenplan
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">Gerichte planen & Köche einteilen</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="p-5 rounded-2xl border border-surface-border bg-surface-elevated/50 hover:bg-surface-elevated hover:border-emerald-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/30">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors font-sans">
              Einkaufsliste
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">Zutaten abhaken & Preise prüfen</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('recipes')}
            className="p-5 rounded-2xl border border-surface-border bg-surface-elevated/50 hover:bg-surface-elevated hover:border-pink-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/10 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-pink-500/30">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-semibold text-slate-100 group-hover:text-pink-300 transition-colors font-sans">
              Rezepte
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">Lieblingsgerichte mit Zubereitung</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('notes')}
            className="p-5 rounded-2xl border border-surface-border bg-surface-elevated/50 hover:bg-surface-elevated hover:border-fuchsia-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-fuchsia-500/10 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-rose-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-fuchsia-500/30">
              <MessageSquareText className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-semibold text-slate-100 group-hover:text-fuchsia-300 transition-colors font-sans">
              WG-Pinnwand
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">Mitteilungen & Anliegen notieren</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('waste')}
            className="p-5 rounded-2xl border border-surface-border bg-surface-elevated/50 hover:bg-surface-elevated hover:border-cyan-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-sky-500/30">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors font-sans">
              Abfallkalender
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">Nächste Abholungen & Tonnen</div>
          </button>
        </div>
      </div>
    </div>
  );
};
