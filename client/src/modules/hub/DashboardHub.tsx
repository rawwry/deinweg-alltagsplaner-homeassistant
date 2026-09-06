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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-950/40 border border-sky-700/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-2.5 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Standort {activeLocation?.name || user?.locationName || 'Emsdetten'} • KW {currentWeek}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hallo, {user?.name}! 👋
            </h1>
            <p className="text-sky-200 text-sm mt-1 max-w-xl">
              Willkommen im Dein Weg Alltagsplaner. Hier siehst du auf einen Blick, was heute gekocht wird, welche Einkäufe anstehen und was im Haus wichtig ist.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-slate-950/30 transition-all flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <span>Zum Wochenplan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {/* Today's Dish Card */}
        <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-lg hover:border-slate-700/80 transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 bg-amber-950/50 text-amber-400 border border-amber-800/40 rounded-2xl shadow-inner">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-full">
                Heute auf dem Tisch
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100 line-clamp-1">
              {todayMeal?.recipe?.title || todayMeal?.customDishTitle || 'Noch nichts geplant'}
            </h3>

            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed min-h-[2rem]">
              {todayMeal?.recipe?.description || 'Klicke auf den Wochenplan, um für heute ein leckeres Rezept auszuwählen.'}
            </p>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <div>
                Portionen: <span className="font-semibold text-slate-200">{todayMeal?.servings || 6} Personen</span>
              </div>
              {todayMeal?.cookName ? (
                <div className="font-medium text-sky-400">
                  Koch: {todayMeal.cookName}
                </div>
              ) : (
                <div className="text-slate-500">
                  Kein Koch eingeteilt
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('mealplan')}
              className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:border-amber-500/50"
            >
              <span>Wochenplan ansehen</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Shopping List Summary Card */}
        <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-lg hover:border-slate-700/80 transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 rounded-2xl shadow-inner">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                Einkaufsliste
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100">
              {shoppingSummary?.items?.length || 0} Zutaten konsolidiert
            </h3>

            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed min-h-[2rem]">
              Supermarkt: <span className="font-semibold text-slate-200">{shoppingSummary?.supermarketName || 'Netto Marken-Discount'}</span>
            </p>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-slate-400">Geschätzte Kosten:</span>
              <span className="text-sm font-bold text-emerald-400">
                ~ {shoppingSummary?.totalEstimatedCost ? `${shoppingSummary.totalEstimatedCost.toFixed(2)} €` : '0.00 €'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('shopping')}
              className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:border-emerald-500/50"
            >
              <span>Zur Einkaufsliste</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Waste Calendar & Notes Summary */}
        <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-lg hover:border-slate-700/80 transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 bg-sky-950/50 text-sky-400 border border-sky-800/40 rounded-2xl shadow-inner">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2.5 py-1 rounded-full">
                Nächste Tonne
              </span>
            </div>

            {nextWaste ? (
              <div>
                <div className="text-base font-bold text-slate-100">
                  {nextWaste.wasteType === 'YELLOW' && '💛 Wertstoffsack / Gelb'}
                  {nextWaste.wasteType === 'BIO' && '💚 Biotonne'}
                  {nextWaste.wasteType === 'REST' && '🖤 Restmüll'}
                  {nextWaste.wasteType === 'PAPER' && '💙 Papiertonne'}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Termin: {nextWaste.date}</span>
                </div>

                {/* 1-day advance warning banner */}
                {daysUntilWaste === 1 && (
                  <div className="mt-2 px-2.5 py-1 bg-amber-950/80 border border-amber-800/80 rounded-xl text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 animate-pulse">
                    <span>⚠️</span>
                    <span className="truncate">Morgen Abholung! Heute rausstellen.</span>
                  </div>
                )}
                {daysUntilWaste === 0 && (
                  <div className="mt-2 px-2.5 py-1 bg-rose-950/80 border border-rose-800/80 rounded-xl text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                    <span>🚨</span>
                    <span className="truncate">Heute Abholung!</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-base font-bold text-slate-100">Keine Termine</div>
                <div className="text-xs text-slate-400 mt-1.5 min-h-[2rem]">Keine anstehende Tonne hinterlegt.</div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Offene Anliegen / Tickets:</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${notesCount > 0 ? 'bg-amber-950 text-amber-400 border border-amber-800/50' : 'text-slate-400'}`}>
                {notesCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('waste')}
              className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:border-sky-500/50"
            >
              <span>Abfallkalender öffnen</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Module Overview & Future Extension Slots */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 mb-1">
          Modulare Alltagsbausteine
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Modulübersicht für ambulant betreute Wohngruppen
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-sky-800 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-200 group-hover:text-sky-400 transition-colors">Essensplaner</div>
            <div className="text-xs text-slate-400 mt-0.5">Woche planen & portionieren</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-emerald-800 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">Einkaufsliste</div>
            <div className="text-xs text-slate-400 mt-0.5">Summierte Zutaten & Netto-Preise</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('recipes')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-indigo-800 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Rezeptdatenbank</div>
            <div className="text-xs text-slate-400 mt-0.5">Lieblingsgerichte & Zubereitung</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('notes')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-amber-800 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors">Notizen an Betreuer</div>
            <div className="text-xs text-slate-400 mt-0.5">To-Dos & Anliegen der Bewohner</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('waste')}
            className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-slate-700 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-200 group-hover:text-sky-400 transition-colors">Abfallkalender</div>
            <div className="text-xs text-slate-400 mt-0.5">Abfuhrtermine & ICS-Import</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          {/* Future expansion placeholders */}
          <div className="p-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 text-left opacity-70">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-400">Putzpläne</div>
            <div className="text-xs text-slate-500 mt-0.5">Zimmer- & Gemeinschaftsaufgaben</div>
            <span className="inline-block mt-2 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
              Erweiterungsslot
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 text-left opacity-70">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-400">Terminkalender</div>
            <div className="text-xs text-slate-500 mt-0.5">Gemeinsame Ausflüge & Events</div>
            <span className="inline-block mt-2 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
              Erweiterungsslot
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 text-left opacity-70">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-400">PDF-Exporte</div>
            <div className="text-xs text-slate-500 mt-0.5">Aushänge für den Gruppenraum</div>
            <span className="inline-block mt-2 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
              Vorbereitet (/share)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
