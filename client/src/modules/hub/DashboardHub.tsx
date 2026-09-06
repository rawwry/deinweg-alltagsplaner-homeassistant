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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-primary-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-600/15">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Standort {activeLocation?.name || user?.locationName || 'Emsdetten'} • KW {currentWeek}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hallo, {user?.name}! 👋
            </h1>
            <p className="text-sky-100 text-sm mt-1 max-w-xl">
              Willkommen im Dein Weg Alltagsplaner. Hier siehst du auf einen Blick, was heute gekocht wird, welche Einkäufe anstehen und was im Haus wichtig ist.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="px-4 py-2.5 bg-white text-sky-700 hover:bg-sky-50 active:bg-sky-100 rounded-xl text-sm font-semibold shadow-md shadow-slate-900/10 transition-all flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <span>Zum Wochenplan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Today's Dish Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              Heute auf dem Tisch
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-800 line-clamp-1">
            {todayMeal?.recipe?.title || todayMeal?.customDishTitle || 'Noch nichts geplant'}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {todayMeal?.recipe?.description || 'Klicke auf den Wochenplan, um für heute ein leckeres Rezept auszuwählen.'}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Portionen: <span className="font-semibold text-slate-700">{todayMeal?.servings || 6} Personen</span>
            </div>
            {todayMeal?.cookName && (
              <div className="font-medium text-sky-600">
                Koch: {todayMeal.cookName}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="w-full mt-3 py-2 px-3 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Wochenplan ansehen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Shopping List Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Einkaufsliste
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-800">
            {shoppingSummary?.items?.length || 0} Zutaten konsolidiert
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Supermarkt: <span className="font-medium text-slate-700">{shoppingSummary?.supermarketName || 'Netto Marken-Discount'}</span>
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Geschätzte Kosten:</span>
            <span className="text-sm font-bold text-emerald-600">
              ~ {shoppingSummary?.totalEstimatedCost ? `${shoppingSummary.totalEstimatedCost.toFixed(2)} €` : '0.00 €'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="w-full mt-3 py-2 px-3 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Zur Einkaufsliste</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Waste Calendar & Notes Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Trash2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
              Nächste Tonne
            </span>
          </div>

          {nextWaste ? (
            <div>
              <div className="text-base font-bold text-slate-800">
                {nextWaste.wasteType === 'YELLOW' && '💛 Wertstoffsack / Gelbe Tonne'}
                {nextWaste.wasteType === 'BIO' && '💚 Biotonne'}
                {nextWaste.wasteType === 'REST' && '🖤 Restmüll'}
                {nextWaste.wasteType === 'PAPER' && '💙 Papiertonne'}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Termin: {nextWaste.date}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-base font-bold text-slate-800">Keine Termine</div>
              <div className="text-xs text-slate-500 mt-1">Keine anstehende Tonne hinterlegt.</div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Offene Betreuer-Notizen:</span>
            <span className="font-bold text-sky-600">{notesCount}</span>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('waste')}
            className="w-full mt-3 py-2 px-3 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Abfallkalender öffnen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Module Overview & Future Extension Slots */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">
          Modulare Alltagsbausteine
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Modulübersicht für ambulant betreute Wohngruppen
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="p-4 rounded-2xl border border-sky-100 bg-sky-50/50 hover:bg-sky-50 hover:border-sky-300 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-800">Essensplaner</div>
            <div className="text-xs text-slate-500 mt-0.5">Woche planen & portionieren</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-800">Einkaufsliste</div>
            <div className="text-xs text-slate-500 mt-0.5">Summierte Zutaten & Netto-Preise</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('recipes')}
            className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-800">Rezeptdatenbank</div>
            <div className="text-xs text-slate-500 mt-0.5">Lieblingsgerichte & Zubereitung</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('notes')}
            className="p-4 rounded-2xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-800">Notizen an Betreuer</div>
            <div className="text-xs text-slate-500 mt-0.5">To-Dos & Anliegen der Bewohner</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('waste')}
            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-800">Abfallkalender</div>
            <div className="text-xs text-slate-500 mt-0.5">Abfuhrtermine & ICS-Import</div>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Aktiv
            </span>
          </button>

          {/* Future expansion placeholders */}
          <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 text-left opacity-75">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-600">Putzpläne</div>
            <div className="text-xs text-slate-400 mt-0.5">Zimmer- & Gemeinschaftsaufgaben</div>
            <span className="inline-block mt-2 text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              Erweiterungsslot
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 text-left opacity-75">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-600">Terminkalender</div>
            <div className="text-xs text-slate-400 mt-0.5">Gemeinsame Ausflüge & Events</div>
            <span className="inline-block mt-2 text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              Erweiterungsslot
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 text-left opacity-75">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-600">PDF-Exporte</div>
            <div className="text-xs text-slate-400 mt-0.5">Aushänge für den Gruppenraum</div>
            <span className="inline-block mt-2 text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              Vorbereitet (/share)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
