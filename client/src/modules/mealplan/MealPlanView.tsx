import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { RecipeSelectModal } from './RecipeSelectModal.js';
import { formatGermanDate } from '../../utils/formatters.js';
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
    if (newServings === currentServings) return;
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
    return formatGermanDate(target);
  };

  const isCurrentWeek = weekNumber === initial.week && year === initial.year;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Top Controls Bar */}
      <div className="bg-surface-card rounded-[2.5rem] p-6 border border-surface-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2 font-sans tracking-tight">
              <ChefHat className="w-6 h-6 text-rose-400" />
              <span>Unser Kochplan</span>
            </h1>
            <span className="text-xs font-semibold px-3 py-1 bg-rose-500/15 text-rose-300 rounded-full border border-rose-500/30 font-mono">
              KW {weekNumber} • {year}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 font-medium font-sans">
            Gemeinsam kochen & genießen in {activeLocation?.name || user?.locationName || 'der WG'} • {configuredCookingDays.length} Kochtage ({formatCookingDays(activeLocation?.cookingDays)}) • {activeLocation?.defaultServings || 6} Portionen
          </p>
        </div>

        {/* Week Navigator & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex items-center bg-surface-elevated/80 border border-surface-border rounded-2xl p-1 shadow-inner">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-2 hover:bg-surface-card rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Vorherige Woche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetToCurrent}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                isCurrentWeek
                  ? 'bg-rose-500/20 text-white border border-rose-500/40 shadow-xs'
                  : 'text-slate-300 hover:bg-surface-card hover:text-white'
              }`}
              title={isCurrentWeek ? 'Aktuelle Woche wird angezeigt' : 'Zur aktuellen Woche springen'}
            >
              KW {weekNumber}
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2 hover:bg-surface-card rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Nächste Woche"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {(user?.role === 'BETREUER' || user?.role === 'ADMIN') && activeLocation && (
            <button
              type="button"
              onClick={handleOpenLocationSettings}
              className="p-2.5 bg-surface-elevated hover:bg-surface-card border border-surface-border rounded-2xl text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Kochtage & Portionen für diesen Standort anpassen"
            >
              <Settings className="w-4 h-4 text-rose-400" />
              <span className="hidden md:inline">Plan-Tage</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCurrentTab('shopping')}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition-all cursor-pointer font-sans"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Einkaufsliste</span>
          </button>
        </div>
      </div>

      {/* Kochtage info & toggle if < 7 days - Hidden on mobile */}
      {configuredCookingDays.length < 7 && (
        <div className="hidden sm:flex sm:flex-row sm:items-center justify-between gap-2 px-2 text-xs">
          <div className="text-slate-400 font-medium">
            Geplante Kochtage für {activeLocation?.name}:{' '}
            <strong className="text-slate-200 font-semibold">
              {formatCookingDays(activeLocation?.cookingDays)}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => setShowAllDays(!showAllDays)}
            className="text-rose-400 hover:text-rose-300 font-semibold self-start sm:self-auto hover:underline cursor-pointer"
          >
            {showAllDays
              ? `Nur geplante Kochtage anzeigen (${configuredCookingDays.length})`
              : `Alle 7 Tage anzeigen (inkl. Selbstversorgung)`}
          </button>
        </div>
      )}

      {/* Days List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-rose-500 border-t-transparent mb-2" />
          <div>Kochplan wird geladen...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const todayStr = formatGermanDate(new Date());

            return DAY_NAMES.map((dayName, idx) => {
              const dayOfWeek = idx + 1;
              const isConfiguredDay = configuredCookingDays.includes(dayOfWeek);
              const dayData = mealPlan?.days?.find((d: any) => d.dayOfWeek === dayOfWeek);
              const hasRecipe = !!dayData?.recipe;
              const hasCustom = !!dayData?.customDishTitle;
              const dateStr = getDateForDay(dayOfWeek);
              const isToday = isCurrentWeek && dateStr === todayStr;

              // If not a cooking day and no meal planned, check if we should hide it
              if (!showAllDays && !isConfiguredDay && !hasRecipe && !hasCustom) {
                return null;
              }

              // Inactive cooking day with no planned recipe -> Selbstversorgung card
              if (!isConfiguredDay && !hasRecipe && !hasCustom) {
                return (
                  <div
                    key={dayOfWeek}
                    className="bg-surface-card/60 rounded-[2.5rem] p-5 sm:p-6 border border-dashed border-rose-500/25 hover:border-rose-500/45 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80 hover:opacity-100 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <span className="text-base font-display font-semibold text-slate-300 font-sans">
                          {dayName}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{dateStr}</span>
                        {isToday && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wide uppercase">
                            Heute
                          </span>
                        )}
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-elevated text-rose-300 border border-rose-500/30">
                          🍽️ Selbstversorgung
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans font-medium">
                        An diesem Tag findet am Standort kein gemeinsames Kochen statt (individuelle Selbstversorgung).
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-0 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayOfWeek(dayOfWeek);
                          setModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white bg-surface-elevated hover:bg-surface-card border border-surface-border transition-colors inline-flex items-center gap-1.5 cursor-pointer font-sans hover:border-theme"
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
                  className={`bento-card rounded-[2.5rem] p-5 sm:p-6 md:p-7 border ${
                    !isConfiguredDay
                      ? 'border-rose-500/30 bg-gradient-to-r from-rose-500/5 to-transparent shadow-rose-950/20'
                      : 'border-surface-border'
                  } shadow-lg transition-all group overflow-hidden`}
                >
                  {/* Day Card Header: Tag, Datum, Heute-Badge, Kategorie-Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base sm:text-lg font-display font-bold text-white tracking-tight">
                        {dayName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-medium">
                        {dateStr}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wide uppercase">
                          Heute
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasRecipe && (
                        <span className="text-xs font-semibold px-3 py-0.5 rounded-full badge-theme">
                          {dayData.recipe.category}
                        </span>
                      )}
                      {!isConfiguredDay && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full badge-theme">
                          Zusatz-Kochen
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Content: Left (Recipe details & 16:9 Image) vs Right (Stacked identical-width Controls) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    {/* Left: Recipe presentation */}
                    <div className="flex-1 min-w-0">
                      {hasRecipe ? (
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                          {/* 16:9 Recipe Image on Desktop and Mobile */}
                          {dayData.recipe.imageUrl ? (
                            <div className="w-full sm:w-56 md:w-60 lg:w-64 aspect-video rounded-2xl overflow-hidden shrink-0 shadow-lg ring-1 ring-white/10 group-hover:ring-theme/40 transition-all bg-slate-950 relative">
                              <img
                                src={dayData.recipe.imageUrl}
                                alt={dayData.recipe.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {onOpenRecipeDetail && (
                                <button
                                  type="button"
                                  onClick={() => onOpenRecipeDetail(dayData.recipe.id)}
                                  className="absolute inset-0 bg-black/20 hover:bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-semibold gap-1.5 backdrop-blur-xs"
                                >
                                  <Utensils className="w-4 h-4 text-theme-primary" />
                                  <span>Rezept öffnen</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="w-full sm:w-56 md:w-60 lg:w-64 aspect-video rounded-2xl bg-surface-elevated/70 border border-surface-border flex flex-col items-center justify-center text-slate-500 shrink-0 gap-1.5 shadow-inner">
                              <Utensils className="w-6 h-6 text-theme-primary opacity-40" />
                              <span className="text-[11px] text-slate-400 font-medium">Rezept ohne Bild</span>
                            </div>
                          )}

                          {/* Recipe metadata & descriptions */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <h3 className="text-base sm:text-xl font-display font-bold text-slate-100 group-hover:text-theme-primary transition-colors flex items-center gap-2 tracking-tight">
                              <Utensils className="w-4 h-4 text-theme-primary flex-shrink-0" />
                              <span className="truncate">{dayData.recipe.title}</span>
                            </h3>
                            {dayData.recipe.description && (
                              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed font-normal font-sans line-clamp-2">
                                {dayData.recipe.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-400 pt-2 border-t border-white/5 font-sans flex-wrap">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-theme-primary" />
                                ca. {dayData.recipe.prepTimeMinutes || 30} Min
                              </span>
                              <span>{dayData.recipe.ingredients?.length || 0} Zutaten</span>
                              {onOpenRecipeDetail && (
                                <button
                                  type="button"
                                  onClick={() => onOpenRecipeDetail(dayData.recipe.id)}
                                  className="text-theme hover:underline font-semibold cursor-pointer flex items-center gap-1 ml-auto sm:ml-0"
                                >
                                  <span>Rezept ansehen</span>
                                  <span>→</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : hasCustom ? (
                        <div className="space-y-2 py-2">
                          <h3 className="text-lg font-display font-bold text-theme-primary flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-theme-primary flex-shrink-0" />
                            <span>{dayData.customDishTitle}</span>
                          </h3>
                          <p className="text-xs text-slate-400 font-sans italic">
                            Freies Gericht (kein Rezept aus der Rezeptedatenbank)
                          </p>
                        </div>
                      ) : (
                        <div className="py-4 flex items-center gap-3 text-slate-400 italic text-sm font-sans">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                          <span>Noch kein Gericht für diesen Tag eingetragen.</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Servings & Cook Assignment & Action Button (Identical Width Column) */}
                    <div className="w-full md:w-52 lg:w-56 shrink-0 flex flex-col gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                      {/* Mobile: 2-column grid / Desktop: stacked */}
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
                        {/* Servings Counter (Identical full width) */}
                        <div className="w-full bg-surface-elevated/90 border border-surface-border rounded-2xl px-3 py-2 flex items-center justify-between shadow-inner">
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 font-sans">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Portionen</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateServings(dayOfWeek, dayData?.servings || 6, -1)}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-surface-card rounded-xl text-slate-200 hover:text-white hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 sm:w-6 text-center text-xs font-bold text-white font-mono">
                              {dayData?.servings || 6}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateServings(dayOfWeek, dayData?.servings || 6, 1)}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-surface-card rounded-xl text-slate-200 hover:text-white hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Cook Selector (Identical full width) */}
                        <div className="w-full bg-surface-elevated/90 border border-surface-border rounded-2xl px-3 py-2 flex items-center gap-2 text-xs shadow-inner">
                          <ChefHat className="w-3.5 h-3.5 text-theme-primary shrink-0" />
                          <select
                            value={dayData?.cookUserId || ''}
                            onChange={(e) => handleUpdateCook(dayOfWeek, e.target.value || null)}
                            className="w-full bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 font-sans truncate text-xs"
                          >
                            <option value="" className="bg-surface-card text-slate-200">Koch: Offen / Team</option>
                            {residents.map((r) => (
                              <option key={r.id} value={r.id} className="bg-surface-card text-slate-200">
                                Koch: {r.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Choose / Change Dish Button (Identical full width) */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayOfWeek(dayOfWeek);
                          setModalOpen(true);
                        }}
                        className={`w-full py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-sm ${
                          hasRecipe || hasCustom
                            ? 'bg-surface-elevated hover:bg-surface-card text-slate-200 hover:text-white border border-surface-border hover:border-theme'
                            : 'btn-theme-gradient text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{hasRecipe || hasCustom ? 'Gericht ändern' : 'Gericht wählen'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Quick Location Settings Modal */}
      {showLocationSettings &&
        activeLocation &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowLocationSettings(false);
            }}
            className="fixed inset-0 z-[100] min-h-screen min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          >
            <div className="bg-surface-card border border-surface-border rounded-[2.5rem] p-6 sm:p-7 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white font-sans">
                    Plan-Einstellungen: {activeLocation.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Kochtage und Standard-Portionen für diesen Standort
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationSettings(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocationSettings} className="mt-5 space-y-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-sans">
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
                        className={`py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 border-rose-400 text-white shadow-sm'
                            : 'bg-surface-elevated/80 border-surface-border text-slate-400 hover:bg-surface-card hover:text-slate-200'
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
                    className="px-2.5 py-1 rounded-xl bg-surface-elevated hover:bg-surface-card text-[10px] text-slate-300 border border-surface-border transition-colors cursor-pointer"
                  >
                    Mo - So (7)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDays([1, 2, 3, 4, 5])}
                    className="px-2.5 py-1 rounded-xl bg-surface-elevated hover:bg-surface-card text-[10px] text-slate-300 border border-surface-border transition-colors cursor-pointer"
                  >
                    Mo - Fr (5)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDays([1, 2, 3, 4])}
                    className="px-2.5 py-1 rounded-xl bg-surface-elevated hover:bg-surface-card text-[10px] text-slate-300 border border-surface-border transition-colors cursor-pointer"
                  >
                    Mo - Do (4)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Nicht gewählte Tage werden im Kochplan als <strong className="text-rose-300 font-semibold">Selbstversorgung</strong> markiert.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-sans">
                  Standard-Portionen
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editServings}
                  onChange={(e) => setEditServings(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLocationSettings(false)}
                  className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-500/25 cursor-pointer font-sans"
                >
                  {isSavingSettings ? 'Speichere...' : 'Einstellungen speichern'}
                </button>
              </div>
            </form>
            </div>
          </div>,
          document.body
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
