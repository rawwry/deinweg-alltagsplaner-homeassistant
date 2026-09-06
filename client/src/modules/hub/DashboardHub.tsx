import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import {
  Calendar,
  ShoppingCart,
  ShoppingBag,
  BookOpen,
  MessageSquareText,
  Trash2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  ChefHat,
  Users,
  CreditCard,
  AlertTriangle,
  CalendarCheck,
} from 'lucide-react';

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
    <div className="space-y-6 max-w-6xl mx-auto pb-6 sm:pb-8">
      {/* Welcome Banner with Modern Ambient Glow */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-sky-950/40 to-slate-900/90 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-black/40 border border-sky-500/20 backdrop-blur-xl">
        {/* Ambient background light orbs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 backdrop-blur-md rounded-full text-xs font-bold mb-3 border border-slate-700/80 shadow-inner">
              <span className="text-slate-200">WG {activeLocation?.name || user?.locationName || 'Emsdetten'}</span>
              <span className="opacity-40">•</span>
              <span className="text-sky-300 font-mono">KW {currentWeek}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>Hallo, {user?.name}!</span>
              <span className="inline-block animate-bounce text-2xl sm:text-3xl">👋</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl font-normal leading-relaxed">
              Hier ist euer WG-Planer: Schau nach, was heute Leckeres gekocht wird, was auf der Einkaufsliste steht oder welcher Abfalltermin ansteht.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setCurrentTab('mealplan')}
              className="px-5 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-sky-600/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Wochenplan ansehen</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Highlights Grid (Centered Minimalist Icons & Subtle Animations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {/* Box 1: Today's Meal */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-800/90 shadow-xl hover:shadow-2xl hover:border-amber-500/40 hover:shadow-amber-950/20 transition-all duration-300 flex flex-col justify-between h-full group text-center">
          <div>
            {/* Category Pill Tag */}
            <div className="flex justify-center mb-3">
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-800/60 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-inner">
                Heute auf dem Tisch
              </span>
            </div>

            {/* Centered Minimalist Vector Icon with Subtle Micro-Animation */}
            <div className="relative my-3 flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-105 group-hover:bg-amber-500/20 group-hover:border-amber-500/50 group-hover:shadow-amber-500/10 transition-all duration-300">
                <UtensilsCrossed className="w-8 h-8 transition-transform duration-300 group-hover:rotate-6" />
              </div>
              <div className="absolute inset-0 max-w-[4rem] mx-auto bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1 px-1">
              {todayMeal?.recipe?.title || todayMeal?.customDishTitle || 'Heute Selbstversorgung'}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed min-h-[2.5rem] px-2">
              {todayMeal?.recipe?.description || (todayMeal?.customDishTitle ? 'Frei gewähltes Gericht ohne festes Rezept.' : 'Heute wird individuell gekocht oder im Wochenplan kann noch etwas eingetragen werden!')}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-3.5 bg-slate-950/60 px-3.5 py-2.5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{todayMeal?.servings || 6} Portionen</span>
              </div>
              {todayMeal?.cookName ? (
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate max-w-[110px]">Koch: {todayMeal.cookName}</span>
                </div>
              ) : (
                <div className="text-slate-400 flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-slate-500" />
                  <span>Team / Offen</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('mealplan')}
              className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 hover:border-amber-500/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm group-hover:shadow-amber-950/40 cursor-pointer"
            >
              <span>Zum Wochenplan</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Box 2: Shopping List */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-800/90 shadow-xl hover:shadow-2xl hover:border-emerald-500/40 hover:shadow-emerald-950/20 transition-all duration-300 flex flex-col justify-between h-full group text-center">
          <div>
            {/* Category Pill Tag */}
            <div className="flex justify-center mb-3">
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-inner">
                Einkaufsliste
              </span>
            </div>

            {/* Centered Minimalist Vector Icon with Subtle Micro-Animation */}
            <div className="relative my-3 flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-105 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10 transition-all duration-300">
                <ShoppingBag className="w-8 h-8 transition-transform duration-300 group-hover:-rotate-6" />
              </div>
              <div className="absolute inset-0 max-w-[4rem] mx-auto bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1 px-1">
              {shoppingSummary?.items?.length || 0} {shoppingSummary?.items?.length === 1 ? 'Artikel vorgemerkt' : 'Artikel auf der Liste'}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed min-h-[2.5rem] px-2">
              Geplanter Einkauf bei <span className="font-semibold text-slate-200">{shoppingSummary?.supermarketName || 'Supermarkt'}</span>
              {(shoppingSummary?.items?.length || 0) > 0 ? ' – alles übersichtlich sortiert für den nächsten WG-Einkauf.' : ' – die Liste ist aktuell leer.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-3.5 bg-slate-950/60 px-3.5 py-2.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Geschätzte Kosten:</span>
              </span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                ~ {shoppingSummary?.totalEstimatedCost ? `${shoppingSummary.totalEstimatedCost.toFixed(2)} €` : '0.00 €'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('shopping')}
              className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm group-hover:shadow-emerald-950/40 cursor-pointer"
            >
              <span>Einkaufsliste öffnen</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Box 3: Waste Calendar */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-800/90 shadow-xl hover:shadow-2xl hover:border-sky-500/40 hover:shadow-sky-950/20 transition-all duration-300 flex flex-col justify-between h-full group text-center">
          <div>
            {/* Category Pill Tag */}
            <div className="flex justify-center mb-3">
              <span className="text-[11px] font-bold text-sky-300 bg-sky-950/70 border border-sky-800/60 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-inner">
                Nächste Abfuhr
              </span>
            </div>

            {/* Centered Minimalist Vector Icon with Subtle Micro-Animation */}
            <div className="relative my-3 flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/15 via-indigo-500/10 to-transparent border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner group-hover:scale-105 group-hover:bg-sky-500/20 group-hover:border-sky-500/50 group-hover:shadow-sky-500/10 transition-all duration-300">
                <Trash2 className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 max-w-[4rem] mx-auto bg-sky-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-sky-500/20 transition-colors" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-1 px-1">
              {nextWaste ? (
                <>
                  {nextWaste.wasteType === 'YELLOW' && 'Wertstoff / Gelber Sack'}
                  {nextWaste.wasteType === 'BIO' && 'Biotonne'}
                  {nextWaste.wasteType === 'REST' && 'Restmülltonne'}
                  {nextWaste.wasteType === 'PAPER' && 'Altpapiertonne'}
                </>
              ) : (
                'Alles sauber!'
              )}
            </h3>

            {/* Subtitle / Urgency Alert */}
            <div className="min-h-[2.5rem] flex flex-col justify-center items-center mt-2 px-2">
              {nextWaste ? (
                daysUntilWaste === 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Heute Abholung!</span>
                  </span>
                ) : daysUntilWaste === 1 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Morgen Abholung! Bitte heute rausstellen.</span>
                  </span>
                ) : (
                  <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nächster Termin: {nextWaste.date}</span>
                  </div>
                )
              ) : (
                <span className="text-xs text-slate-400">Aktuell steht keine Müllabfuhr an.</span>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-3.5 bg-slate-950/60 px-3.5 py-2.5 rounded-2xl border border-slate-800/80">
              <span className="flex items-center gap-1.5 font-medium text-slate-400">
                <MessageSquareText className="w-3.5 h-3.5 text-slate-400" />
                <span>WG-Pinnwand:</span>
              </span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full text-xs font-mono ${
                  notesCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'text-slate-400'
                }`}
              >
                {notesCount} {notesCount === 1 ? 'Eintrag' : 'Einträge'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('waste')}
              className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 hover:border-sky-500/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm group-hover:shadow-sky-950/40 cursor-pointer"
            >
              <span>Abfallkalender öffnen</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* WG Areas and Quick Shortcuts (Clean Vector Tiles) */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-800/90 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Schnellzugriff auf unsere WG-Bereiche</span>
              <Sparkles className="w-4 h-4 text-sky-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Alles für einen entspannten und organisierten Alltag in der Wohngruppe
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/60 hover:border-sky-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-950/30 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-sky-600/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">Wochenplan</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">Gerichte planen & Köche einteilen</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/60 hover:border-emerald-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-950/30 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-emerald-600/30">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">Einkaufsliste</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">Zutaten abhaken & Preise prüfen</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('recipes')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/60 hover:border-indigo-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-950/30 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-indigo-600/30">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">Rezepte</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">Lieblingsgerichte mit Zubereitung</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('notes')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/60 hover:border-amber-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-950/30 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-amber-600/30">
              <MessageSquareText className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">WG-Pinnwand</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">Mitteilungen & Anliegen notieren</div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('waste')}
            className="p-5 rounded-2xl border border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/60 hover:border-teal-500/50 text-left transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-teal-950/30 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-teal-600/30">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">Abfallkalender</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">Nächste Abholungen & Tonnen</div>
          </button>
        </div>
      </div>
    </div>
  );
};
