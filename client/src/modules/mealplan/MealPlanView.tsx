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
  Settings,
  X,
  Check,
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

const WEEKDAY_ITEMS = [
  { id: 1, label: 'Mo', name: 'Montag' },
  { id: 2, label: 'Di', name: 'Dienstag' },
  { id: 3, label: 'Mi', name: 'Mittwoch' },
  { id: 4, label: 'Do', name: 'Donnerstag' },
  { id: 5, label: 'Fr', name: 'Freitag' },
  { id: 6, label: 'Sa', name: 'Samstag' },
  { id: 7, label: 'So', name: 'Sonntag' },
];

const formatCookingDays = (daysStr?: string | null): string => {
  if (!daysStr) return 'Mo - So (7 Tage)';
  const days = daysStr
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  if (days.length === 0) return 'Keine Kochtage';
  if (days.length === 7) return 'Mo - So (7 Tage)';
  if (days.length === 5 && days[0] === 1 && days[4] === 5) return 'Mo - Fr (5 Tage)';
  if (days.length === 4 && days[0] === 1 && days[3] === 4) return 'Mo - Do (4 Tage)';
  const names = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  return days.map((d) => names[d - 1]).join(', ') + ` (${days.length} Tage)`;
};

export const MealPlanView: React.FC<MealPlanViewProps> = ({ setCurrentTab, onOpenRecipeDetail }) => {
  const { user, activeLocationId, activeLocation, refreshLocations } = useAuth();

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

  // Cooking days config
  const parseCookingDays = (daysStr?: string | null): number[] => {
    if (!daysStr) return [1, 2, 3, 4, 5, 6, 7];
    const parsed = daysStr
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 7);
    return parsed.length > 0 ? parsed : [1, 2, 3, 4, 5, 6, 7];
  };

  const configuredCookingDays = parseCookingDays(activeLocation?.cookingDays);
  const [showAllDays, setShowAllDays] = useState(false);

  // Quick Location Settings Modal state
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [editDays, setEditDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [editServings, setEditServings] = useState<number>(6);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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

  const handleOpenLocationSettings = () => {
    if (!activeLocation) return;
    setEditDays(parseCookingDays(activeLocation.cookingDays));
    setEditServings(activeLocation.defaultServings || 6);
    setShowLocationSettings(true);
  };

  const handleSaveLocationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLocation) return;
    if (editDays.length === 0) {
      alert('Bitte wähle mindestens einen Kochtag aus.');
      return;
    }
    try {
      setIsSavingSettings(true);
      const sortedDays = [...editDays].sort((a, b) => a - b).join(',');
      await api.locations.update(activeLocation.id, {
        cookingDays: sortedDays,
        defaultServings: Number(editServings) || 6,
      });
      await refreshLocations();
      setShowLocationSettings(false);
    } catch (err: any) {
      alert(`Fehler beim Speichern der Standort-Einstellungen: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setEditDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
    );
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

  const isCurrentWeek = weekNumber === initial.week && year === initial.year;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span className="text-2xl">🗓️</span>
              <span>Unser Wochenplan</span>
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 bg-sky-950/60 text-sky-400 rounded-full border border-sky-800/40">
              KW {weekNumber} • {year}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gemeinsam kochen & genießen in {activeLocation?.name || user?.locationName || 'der WG'} • {configuredCookingDays.length} Kochtage ({formatCookingDays(activeLocation?.cookingDays)}) • {activeLocation?.defaultServings || 6} Portionen
          </p>
        </div>

        {/* Week Navigator & Actions */}
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
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                isCurrentWeek
                  ? 'bg-sky-950 text-sky-300 border border-sky-700/60 shadow-xs'
                  : 'text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
              title={isCurrentWeek ? 'Aktuelle Woche wird angezeigt' : 'Zur aktuellen Woche springen'}
            >
              KW {weekNumber}
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

          {(user?.role === 'BETREUER' || user?.role === 'ADMIN') && activeLocation && (
            <button
              type="button"
              onClick={handleOpenLocationSettings}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-2xl text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Kochtage & Portionen für diesen Standort anpassen"
            >
              <Settings className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Plan-Tage</span>
            </button>
          )}

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

      {/* Kochtage info & toggle if < 7 days */}
      {configuredCookingDays.length < 7 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs">
          <div className="text-slate-400">
            Geplante Kochtage für {activeLocation?.name}:{' '}
            <strong className="text-slate-200 font-semibold">
              {formatCookingDays(activeLocation?.cookingDays)}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => setShowAllDays(!showAllDays)}
            className="text-sky-400 hover:text-sky-300 font-semibold self-start sm:self-auto hover:underline"
          >
            {showAllDays
              ? `Nur geplante Kochtage anzeigen (${configuredCookingDays.length})`
              : `Alle 7 Tage anzeigen (inkl. Selbstversorgung)`}
          </button>
        </div>
      )}

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
            const isConfiguredDay = configuredCookingDays.includes(dayOfWeek);
            const dayData = mealPlan?.days?.find((d: any) => d.dayOfWeek === dayOfWeek);
            const hasRecipe = !!dayData?.recipe;
            const hasCustom = !!dayData?.customDishTitle;
            const dateStr = getDateForDay(dayOfWeek);

            // If not a cooking day and no meal planned, check if we should hide it
            if (!showAllDays && !isConfiguredDay && !hasRecipe && !hasCustom) {
              return null;
            }

            // Inactive cooking day with no planned recipe -> Selbstversorgung card
            if (!isConfiguredDay && !hasRecipe && !hasCustom) {
              return (
                <div
                  key={dayOfWeek}
                  className="bg-slate-900/60 rounded-3xl p-4 sm:p-5 border border-dashed border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-80 hover:opacity-100"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-300">{dayName}</span>
                      <span className="text-xs text-slate-500 font-mono">{dateStr}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-800/40">
                        🍽️ Selbstversorgung
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      An diesem Tag findet am Standort kein gemeinsames Kochen statt (individuelle Selbstversorgung).
                    </p>
                  </div>

                  <div className="pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayOfWeek(dayOfWeek);
                        setModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700/60 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Trotzdem Gericht planen</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={dayOfWeek}
                className={`bg-slate-900 rounded-3xl p-4 sm:p-5 border ${
                  !isConfiguredDay
                    ? 'border-amber-900/50 bg-slate-900/90 shadow-amber-950/20 shadow-xs'
                    : 'border-slate-800'
                } shadow-sm hover:border-slate-750 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                {/* Left: Day info & Recipe title */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
                    {!isConfiguredDay && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/50">
                        Zusatz-Kochen (an Selbstversorgungs-Tag)
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

      {/* Quick Location Settings Modal */}
      {showLocationSettings && activeLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-800 text-sky-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Plan-Einstellungen: {activeLocation.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kochtage und Standard-Portionen für diesen Standort
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationSettings(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocationSettings} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gemeinsame Kochtage (Plan-Umfang)
                </label>
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                  {WEEKDAY_ITEMS.map((d) => {
                    const isSelected = editDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDay(d.id)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-sky-600 border-sky-500 text-white shadow-xs'
                            : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        title={d.name}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500">Schnellauswahl:</span>
                  <button
                    type="button"
                    onClick={() => setEditDays([1, 2, 3, 4, 5, 6, 7])}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                  >
                    Mo - So (7)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDays([1, 2, 3, 4, 5])}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                  >
                    Mo - Fr (5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDays([1, 2, 3, 4])}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                  >
                    Mo - Do (4)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Nicht gewählte Tage werden im Wochenplan als <strong>Selbstversorgung</strong> markiert.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Standard-Portionen
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editServings}
                  onChange={(e) => setEditServings(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLocationSettings(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {isSavingSettings ? 'Speichere...' : 'Einstellungen speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Selection Modal */}
      <RecipeSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dayName={DAY_NAMES[selectedDayOfWeek - 1] || 'Wochentag'}
        onSelectRecipe={handleSelectRecipe}
      />
    </div>
  );
};
