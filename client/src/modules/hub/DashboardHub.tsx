import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { Calendar, ShoppingCart, BookOpen, MessageSquareText, Trash2, ArrowRight, Sparkles, CheckCircle2, Clock } from 'lucide-react';

interface DashboardHubProps {
  setCurrentTab: (tab: string) => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({ setCurrentTab }) => {
  const { user, activeLocation, activeLocationId } = useAuth();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [shoppingSummary, setShoppingSummary] = useState<any>(null);
  const [wasteSummary, setWasteSummary] = useState<any[]>([]);
  const [notesCount, setNotesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentYear = now.getFullYear();
  // Get current ISO calendar week
  const dateCopy = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = dateCopy.getUTCDay() || 7;
  dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1));
  const currentWeek = Math.ceil((((dateCopy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  // Day of week in Germany: 1=Mo, 7=So
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

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
        setNotesCount((notesRes || []).filter((n: any) => n.status !== 'DONE').length);
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
  }, [activeLocationId]);

  const todayMeal = mealPlan?.days?.find((d: any) => d.dayOfWeek === currentDayOfWeek);
  const nextWaste = wasteSummary.length > 0 ? wasteSummary[0] : null;

  // Calculate days until next waste pickup
  let daysUntilWaste: number | null = null;
  if (nextWaste?.date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextWaste.date);
    target.setHours(0, 0, 0, 0);
    daysUntilWaste = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-8">
      {/* Welcome Banner with Playful Warmth */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-950/30 border border-white/10">
        {/* Decorative background glow spots */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold mb-3 border border-white/20 shadow-xs">
              <span className="text-sm">🏡</span>
              <span>WG {activeLocation?.name || user?.locationName || 'Emsdetten'}</span>
              <span className="opacity-60">•</span>
              <span className="text-amber-200">KW {currentWeek}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>Hallo, {user?.name}!</span>
              <span className="inline-block animate-bounce text-2xl sm:text-3xl">👋</span>
            </h1>
            <p className="text-sky-100 text-sm sm:text-base mt-2 max-w-xl font-medium leading-relaxed">
              Schön, dass du da bist! Hier ist euer WG-Planer: Schau nach, was heute Leckeres gekocht wird, was auf dem Einkaufszettel steht oder welche Tonne heute dran ist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setCurrentTab('mealplan')}
              className="px-5 py-3 bg-white hover:bg-sky-50 active:bg-sky-100 text-indigo-900 rounded-2xl text-sm font-bold shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Wochenplan ansehen</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {/* Today's Dish Card */}
        <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md hover:shadow-xl hover:border-amber-500/40 transition-all flex flex-col justify-between h-full group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-gradient-to-tr from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 rounded-2xl shadow-inner group-hover:scale-105 transition-transform text-lg">
                🍳
              </div>
              <span className="text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span>Heute auf dem Tisch</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
              {todayMeal?.recipe?.title || todayMeal?.customDishTitle || 'Heute Selbstversorgung / Frei'}
            </h3>

            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed min-h-[2rem]">
              {todayMeal?.recipe?.description || (todayMeal?.customDishTitle ? 'Frei gewähltes Gericht ohne festes Rezept.' : 'Heute wird individuell gekocht oder im Wochenplan kann noch etwas eingetragen werden!')}
            </p>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 bg-slate-800/40 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 font-medium">
                <span>👥</span>
                <span>{todayMeal?.servings || 6} Portionen</span>
              </div>
              {todayMeal?.cookName ? (
                <div className="font-semibold text-sky-400 flex items-center gap-1">
                  <span>👨‍🍳</span>
                  <span>Koch: {todayMeal.cookName}</span>
                </div>
              ) : (
                <div className="text-slate-400 flex items-center gap-1">
                  <span>👨‍🍳</span>
                  <span>Team / Offen</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('mealplan')}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 hover:border-amber-500/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Zum Speiseplan</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Shopping List Summary Card */}
        <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md hover:shadow-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between h-full group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl shadow-inner group-hover:scale-105 transition-transform text-lg">
                🛒
              </div>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span>Einkaufsliste</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
              {shoppingSummary?.items?.length || 0} Sachen auf unserer Liste
            </h3>

            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed min-h-[2rem]">
              Einkauf bei: <span className="font-semibold text-slate-200">{shoppingSummary?.supermarketName || 'Supermarkt'}</span>
            </p>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-3 bg-slate-800/40 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 flex items-center gap-1">
                <span>💳</span>
                <span>Geschätzte Kosten:</span>
              </span>
              <span className="text-sm font-extrabold text-emerald-400">
                ~ {shoppingSummary?.totalEstimatedCost ? `${shoppingSummary.totalEstimatedCost.toFixed(2)} €` : '0.00 €'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('shopping')}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Einkaufsliste öffnen</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Waste Calendar & Notes Summary */}
        <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md hover:shadow-xl hover:border-sky-500/40 transition-all flex flex-col justify-between h-full group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-gradient-to-tr from-sky-500/20 to-indigo-500/10 text-sky-400 border border-sky-500/30 rounded-2xl shadow-inner group-hover:scale-105 transition-transform text-lg">
                🚛
              </div>
              <span className="text-xs font-bold text-sky-300 bg-sky-950/70 border border-sky-800/60 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span>Müllabfuhr</span>
              </span>
            </div>

            {nextWaste ? (
              <div>
                <div className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                  {nextWaste.wasteType === 'YELLOW' && 'Wertstoff / Gelber Sack'}
                  {nextWaste.wasteType === 'BIO' && 'Biotonne'}
                  {nextWaste.wasteType === 'REST' && 'Restmüll'}
                  {nextWaste.wasteType === 'PAPER' && 'Papiertonne'}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nächster Termin: {nextWaste.date}</span>
                </div>

                {/* Warnings */}
                {daysUntilWaste === 1 && (
                  <div className="mt-2.5 px-3 py-1.5 bg-amber-950/80 border border-amber-800 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2 animate-pulse">
                    <span className="text-sm">⚠️</span>
                    <span className="truncate">Morgen Abholung! Bitte heute rausstellen.</span>
                  </div>
                )}
                {daysUntilWaste === 0 && (
                  <div className="mt-2.5 px-3 py-1.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                    <span className="text-sm">🚨</span>
                    <span className="truncate">Heute Abholung!</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-base sm:text-lg font-bold text-slate-100">Alles sauber! 🍃</div>
                <div className="text-xs text-slate-400 mt-1.5 min-h-[2rem]">Aktuell steht keine Müllabfuhr an.</div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 bg-slate-800/40 p-2 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1">
                <span>📌</span>
                <span>Pinnwand & Notizen:</span>
              </span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${notesCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'}`}>
                {notesCount} offen
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('waste')}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 hover:border-sky-500/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Müllkalender öffnen</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
            </button>
          </div>
        </div>
      </div>

      {/* WG Areas and Quick Shortcuts */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Schnellzugriff auf unsere WG-Bereiche</span>
              <span>🎨</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Alles für einen entspannten und organisierten Alltag in der Gruppe
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-sky-700/60 text-left transition-all group hover:scale-[1.02] shadow-xs"
          >
            <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center mb-3 text-xl group-hover:scale-110 transition-transform shadow-md shadow-sky-600/20">
              🗓️
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">Wochenplan</div>
            <div className="text-xs text-slate-400 mt-1">Gerichte für alle Tage planen & Köche einteilen</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-emerald-700/60 text-left transition-all group hover:scale-[1.02] shadow-xs"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3 text-xl group-hover:scale-110 transition-transform shadow-md shadow-emerald-600/20">
              🛒
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">Einkaufsliste</div>
            <div className="text-xs text-slate-400 mt-1">Zutaten im Supermarkt abhaken & Kosten prüfen</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('recipes')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-indigo-700/60 text-left transition-all group hover:scale-[1.02] shadow-xs"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 text-xl group-hover:scale-110 transition-transform shadow-md shadow-indigo-600/20">
              📖
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">Rezepte</div>
            <div className="text-xs text-slate-400 mt-1">Lieblingsgerichte der WG mit Zutaten & Zubereitung</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('notes')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-amber-700/60 text-left transition-all group hover:scale-[1.02] shadow-xs"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-3 text-xl group-hover:scale-110 transition-transform shadow-md shadow-amber-600/20">
              📌
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">WG-Pinnwand</div>
            <div className="text-xs text-slate-400 mt-1">Fragen, Ideen und Mitteilungen an Betreuer</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('waste')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-teal-700/60 text-left transition-all group hover:scale-[1.02] shadow-xs"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-3 text-xl group-hover:scale-110 transition-transform shadow-md shadow-teal-600/20">
              🚛
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">Müllkalender</div>
            <div className="text-xs text-slate-400 mt-1">Nächste Abholungen & Tonnenübersicht</div>
          </button>
        </div>
      </div>
    </div>
  );
};
