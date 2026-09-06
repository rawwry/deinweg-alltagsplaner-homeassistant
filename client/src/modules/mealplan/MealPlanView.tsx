import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { RecipeSelectModal } from './RecipeSelectModal.js';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Users,
  Clock,
  Plus,
  Minus,
  ChefHat,
  Utensils,
  Sparkles,
} from 'lucide-react';

interface MealPlanViewProps {
  setCurrentTab: (tab: string) => void;
  onOpenRecipeDetail?: (recipeId: string) => void;
}

const DAY_NAMES = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];

export const MealPlanView: React.FC<MealPlanViewProps> = ({ setCurrentTab, onOpenRecipeDetail }) => {
  const { user, activeLocationId, activeLocation } = useAuth();

  // Get current ISO calendar week
  const getInitialWeek = () => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  };

  const initial = getInitialWeek();
  const [year, setYear] = useState(initial.year);
  const [weekNumber, setWeekNumber] = useState(initial.week);

  const [mealPlan, setMealPlan] = useState<any>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1);

  const fetchPlan = async () => {
    try {
      setIsLoading(true);
      const [planData, usersData] = await Promise.all([
        api.food.mealplan(activeLocationId, year, weekNumber),
        api.users.list(activeLocationId).catch(() => []),
      ]);
      setMealPlan(planData);
      setResidents(usersData);
    } catch (err) {
      console.error('Fehler beim Laden des Wochenplans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [activeLocationId, year, weekNumber]);

  const handlePrevWeek = () => {
    if (weekNumber === 1) {
      setYear((y) => y - 1);
      setWeekNumber(52);
    } else {
      setWeekNumber((w) => w - 1);
    }
  };

  const handleNextWeek = () => {
    if (weekNumber >= 52) {
      setYear((y) => y + 1);
      setWeekNumber(1);
    } else {
      setWeekNumber((w) => w + 1);
    }
  };

  const handleResetToCurrent = () => {
    const cur = getInitialWeek();
    setYear(cur.year);
    setWeekNumber(cur.week);
  };

  const handleUpdateServings = async (dayOfWeek: number, currentServings: number, delta: number) => {
    const newServings = Math.max(1, currentServings + delta);
    try {
      // Optimistic update
      setMealPlan((prev: any) => ({
        ...prev,
        days: prev.days.map((d: any) =>
          d.dayOfWeek === dayOfWeek ? { ...d, servings: newServings } : d
        ),
      }));

      await api.food.updateMealPlanDay({
        mealPlanId: mealPlan.id,
        dayOfWeek,
        servings: newServings,
      });
    } catch (err) {
      console.error('Fehler beim Ändern der Portionen:', err);
      fetchPlan();
    }
  };

  const handleUpdateCook = async (dayOfWeek: number, cookUserId: string | null) => {
    try {
      const cookName = residents.find((r) => r.id === cookUserId)?.name || null;
      setMealPlan((prev: any) => ({
        ...prev,
        days: prev.days.map((d: any) =>
          d.dayOfWeek === dayOfWeek ? { ...d, cookUserId, cookName } : d
        ),
      }));

      await api.food.updateMealPlanDay({
        mealPlanId: mealPlan.id,
        dayOfWeek,
        cookUserId,
      });
    } catch (err) {
      console.error('Fehler beim Zuweisen des Kochs:', err);
      fetchPlan();
    }
  };

  const handleSelectRecipe = async (recipeId: string | null, customDishTitle?: string) => {
    try {
      await api.food.updateMealPlanDay({
        mealPlanId: mealPlan.id,
        dayOfWeek: selectedDayOfWeek,
        recipeId: recipeId || null,
        customDishTitle: customDishTitle || null,
      });
      fetchPlan();
    } catch (err) {
      console.error('Fehler beim Zuweisen des Rezepts:', err);
    }
  };

  // Helper to calculate date for day of week
  const getDateForDay = (dayOfWeek: number): string => {
    // 1=Mon, 7=Sun
    const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    const target = new Date(ISOweekStart);
    target.setDate(ISOweekStart.getDate() + (dayOfWeek - 1));
    return target.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-sky-400" />
              <span>Wochenplan</span>
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 bg-sky-950/60 text-sky-400 rounded-full border border-sky-800/40">
              KW {weekNumber} • {year}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Essensplanung für {activeLocation?.name || user?.locationName || 'Emsdetten'} (Standard: {activeLocation?.defaultServings || 6} Personen)
          </p>
        </div>

        {/* Week Navigator & Shopping CTA */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex items-center bg-slate-800/80 border border-slate-700/60 rounded-2xl p-1">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
              title="Vorherige Woche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetToCurrent}
              className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Heute
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
              title="Nächste Woche"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-2xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Einkaufsliste</span>
          </button>
        </div>
      </div>

      {/* Days List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-500 border-t-transparent mb-2"></div>
          <div>Wochenplan wird geladen...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {DAY_NAMES.map((dayName, idx) => {
            const dayOfWeek = idx + 1;
            const dayData = mealPlan?.days?.find((d: any) => d.dayOfWeek === dayOfWeek);
            const hasRecipe = !!dayData?.recipe;
            const hasCustom = !!dayData?.customDishTitle;
            const dateStr = getDateForDay(dayOfWeek);

            return (
              <div
                key={dayOfWeek}
                className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-sm hover:border-slate-750 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Day info & Recipe title */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-slate-100">
                      {dayName}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {dateStr}
                    </span>
                    {hasRecipe && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-400 border border-sky-800/40">
                        {dayData.recipe.category}
                      </span>
                    )}
                  </div>

                  {hasRecipe ? (
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        <span>{dayData.recipe.title}</span>
                      </h3>
                      {dayData.recipe.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {dayData.recipe.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {dayData.recipe.prepTimeMinutes || 30} Min
                        </span>
                        <span>{dayData.recipe.ingredients?.length || 0} Zutaten</span>
                        {onOpenRecipeDetail && (
                          <button
                            type="button"
                            onClick={() => onOpenRecipeDetail(dayData.recipe.id)}
                            className="text-sky-400 hover:text-sky-300 hover:underline font-semibold"
                          >
                            Rezept ansehen
                          </button>
                        )}
                      </div>
                    </div>
                  ) : hasCustom ? (
                    <div>
                      <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>{dayData.customDishTitle}</span>
                      </h3>
                      <span className="text-xs text-slate-500">Freies Gericht (kein Rezept hinterlegt)</span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic py-1">
                      Noch kein Gericht geplant
                    </div>
                  )}
                </div>

                {/* Right: Servings & Cook Assignment & Action Button */}
                <div className="flex flex-wrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80 justify-between md:justify-end">
                  {/* Servings Counter */}
                  <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-1">
                    <span className="text-[11px] text-slate-400 pl-2 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      Portionen:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateServings(dayOfWeek, dayData?.servings || 6, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-700 rounded-xl shadow-xs text-slate-200 hover:bg-slate-600 active:scale-95 transition-transform"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-100">
                      {dayData?.servings || 6}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateServings(dayOfWeek, dayData?.servings || 6, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-slate-700 rounded-xl shadow-xs text-slate-200 hover:bg-slate-600 active:scale-95 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cook Selector */}
                  <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-2xl px-2.5 py-1 text-xs">
                    <ChefHat className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={dayData?.cookUserId || ''}
                      onChange={(e) => handleUpdateCook(dayOfWeek, e.target.value || null)}
                      className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="" className="bg-slate-800 text-slate-200">Koch: Offen / Team</option>
                      {residents.map((r) => (
                        <option key={r.id} value={r.id} className="bg-slate-800 text-slate-200">
                          Koch: {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Choose / Change Dish Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDayOfWeek(dayOfWeek);
                      setModalOpen(true);
                    }}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      hasRecipe || hasCustom
                        ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                    }`}
                  >
                    <span>{hasRecipe || hasCustom ? 'Ändern' : '+ Gericht wählen'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <RecipeSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dayName={DAY_NAMES[selectedDayOfWeek - 1] || 'Wochentag'}
        onSelectRecipe={handleSelectRecipe}
      />
    </div>
  );
};
