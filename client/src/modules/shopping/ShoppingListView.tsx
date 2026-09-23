import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Euro,
  Tag,
  Sparkles,
  ArrowRight,
  PiggyBank,
} from 'lucide-react';

interface ShoppingListViewProps {
  setCurrentTab: (tab: string) => void;
}

const getCategoryEmoji = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('obst') || cat.includes('gemüse')) return '🥦';
  if (cat.includes('milch') || cat.includes('käse') || cat.includes('eier')) return '🧀';
  if (cat.includes('fleisch') || cat.includes('fisch') || cat.includes('wurst')) return '🥩';
  if (cat.includes('brot') || cat.includes('back')) return '🥖';
  if (cat.includes('nudel') || cat.includes('pasta') || cat.includes('reis') || cat.includes('teig')) return '🍝';
  if (cat.includes('konserve') || cat.includes('hülse') || cat.includes('dose')) return '🥫';
  if (cat.includes('gewürz') || cat.includes('öl') || cat.includes('sauce')) return '🧂';
  if (cat.includes('tiefkühl') || cat.includes('frost')) return '❄️';
  if (cat.includes('getränk') || cat.includes('saft') || cat.includes('wasser')) return '🧃';
  if (cat.includes('haushalt') || cat.includes('hygiene') || cat.includes('drogerie')) return '🧻';
  return '🛒';
};

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({ setCurrentTab }) => {
  const { user, activeLocationId, activeLocation } = useAuth();
  const isStaff = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'BETREUER';

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

  const [shoppingData, setShoppingData] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2-second grace period before moving checked items to "Abgehakte Artikel"
  const [pendingMoveKeys, setPendingMoveKeys] = useState<Set<string>>(new Set());
  const pendingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // New custom item form
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customCategory, setCustomCategory] = useState('Sonstiges');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Clear pending timers on unmount or navigation
  useEffect(() => {
    pendingTimeoutsRef.current.forEach((t) => clearTimeout(t));
    pendingTimeoutsRef.current.clear();
    setPendingMoveKeys(new Set());
  }, [activeLocationId, year, weekNumber]);

  useEffect(() => {
    return () => {
      pendingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      pendingTimeoutsRef.current.clear();
    };
  }, []);

  const fetchShoppingAndBudget = async () => {
    try {
      setIsLoading(true);
      const [shopData, bData] = await Promise.all([
        api.food.shoppingList(activeLocationId, year, weekNumber),
        api.food.budget(activeLocationId, year, weekNumber).catch((e) => {
          console.warn('Budget konnte nicht geladen werden:', e);
          return null;
        }),
      ]);
      setShoppingData(shopData);
      setBudgetData(bData);
    } catch (err) {
      console.error('Fehler beim Laden der Einkaufsliste:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingAndBudget();
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

  const handleToggleIngredient = async (ingredientId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const itemKey = `recipe-${ingredientId}`;

    if (newStatus) {
      // User checked the item: keep in active list for 2 seconds before moving down
      if (pendingTimeoutsRef.current.has(itemKey)) {
        clearTimeout(pendingTimeoutsRef.current.get(itemKey)!);
      }
      setPendingMoveKeys((prev) => new Set(prev).add(itemKey));

      const timer = setTimeout(() => {
        setPendingMoveKeys((prev) => {
          const next = new Set(prev);
          next.delete(itemKey);
          return next;
        });
        pendingTimeoutsRef.current.delete(itemKey);
      }, 2000);

      pendingTimeoutsRef.current.set(itemKey, timer);
    } else {
      // User unchecked the item: restore immediately to active list
      if (pendingTimeoutsRef.current.has(itemKey)) {
        clearTimeout(pendingTimeoutsRef.current.get(itemKey)!);
        pendingTimeoutsRef.current.delete(itemKey);
      }
      setPendingMoveKeys((prev) => {
        if (!prev.has(itemKey)) return prev;
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
    }

    // Optimistic UI update
    setShoppingData((prev: any) => ({
      ...prev,
      items: (prev?.items || []).map((i: any) =>
        i.ingredientId === ingredientId ? { ...i, isChecked: newStatus } : i
      ),
    }));

    try {
      await api.food.toggleShoppingItem({
        locationId: activeLocationId,
        year,
        weekNumber,
        ingredientId,
        isChecked: newStatus,
      });
    } catch (err) {
      console.error('Fehler beim Abhaken des Artikels:', err);
      fetchShoppingAndBudget();
    }
  };

  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    try {
      await api.food.addCustomItem({
        locationId: activeLocationId,
        year,
        weekNumber,
        name: customName.trim(),
        amount: customAmount ? Number(customAmount) : undefined,
        unit: customUnit.trim() || undefined,
        category: customCategory,
      });

      setCustomName('');
      setCustomAmount('');
      setCustomUnit('');
      setShowAddCustom(false);
      fetchShoppingAndBudget();
    } catch (err) {
      console.error('Fehler beim Hinzufügen des Zusatzartikels:', err);
    }
  };

  const handleToggleCustom = async (id: string) => {
    const currentItem = (shoppingData?.customItems || []).find((ci: any) => ci.id === id);
    const newStatus = !currentItem?.isChecked;
    const itemKey = `custom-${id}`;

    if (newStatus) {
      // User checked custom item: keep in active list for 2 seconds before moving down
      if (pendingTimeoutsRef.current.has(itemKey)) {
        clearTimeout(pendingTimeoutsRef.current.get(itemKey)!);
      }
      setPendingMoveKeys((prev) => new Set(prev).add(itemKey));

      const timer = setTimeout(() => {
        setPendingMoveKeys((prev) => {
          const next = new Set(prev);
          next.delete(itemKey);
          return next;
        });
        pendingTimeoutsRef.current.delete(itemKey);
      }, 2000);

      pendingTimeoutsRef.current.set(itemKey, timer);
    } else {
      // User unchecked custom item: restore immediately to active list
      if (pendingTimeoutsRef.current.has(itemKey)) {
        clearTimeout(pendingTimeoutsRef.current.get(itemKey)!);
        pendingTimeoutsRef.current.delete(itemKey);
      }
      setPendingMoveKeys((prev) => {
        if (!prev.has(itemKey)) return prev;
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
    }

    // Optimistic UI update
    setShoppingData((prev: any) => ({
      ...prev,
      customItems: (prev?.customItems || []).map((ci: any) =>
        ci.id === id ? { ...ci, isChecked: newStatus } : ci
      ),
    }));

    try {
      await api.food.toggleCustomItem(id);
    } catch (err) {
      console.error('Fehler beim Umschalten des Zusatzartikels:', err);
      fetchShoppingAndBudget();
    }
  };

  const handleDeleteCustom = async (id: string) => {
    const itemKey = `custom-${id}`;
    if (pendingTimeoutsRef.current.has(itemKey)) {
      clearTimeout(pendingTimeoutsRef.current.get(itemKey)!);
      pendingTimeoutsRef.current.delete(itemKey);
    }
    setPendingMoveKeys((prev) => {
      if (!prev.has(itemKey)) return prev;
      const next = new Set(prev);
      next.delete(itemKey);
      return next;
    });

    try {
      await api.food.deleteCustomItem(id);
      fetchShoppingAndBudget();
    } catch (err) {
      console.error('Fehler beim Löschen des Zusatzartikels:', err);
    }
  };

  // Calculations
  const allItems = shoppingData?.items || [];
  const customItems = shoppingData?.customItems || [];
  const totalCount = allItems.length + customItems.length;
  const checkedCount =
    allItems.filter((i: any) => i.isChecked).length +
    customItems.filter((i: any) => i.isChecked).length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Partition items into active and completed (delayed by 2 seconds after being checked)
  const activeCustomItems = customItems.filter(
    (ci: any) => !ci.isChecked || pendingMoveKeys.has(`custom-${ci.id}`)
  );
  const completedCustomItems = customItems.filter(
    (ci: any) => ci.isChecked && !pendingMoveKeys.has(`custom-${ci.id}`)
  );

  const activeRecipeItems = allItems.filter(
    (item: any) => !item.isChecked || pendingMoveKeys.has(`recipe-${item.ingredientId}`)
  );
  const completedRecipeItems = allItems.filter(
    (item: any) => item.isChecked && !pendingMoveKeys.has(`recipe-${item.ingredientId}`)
  );

  const totalCompletedCount = completedCustomItems.length + completedRecipeItems.length;

  // Group active recipe items by category
  const activeCategoriesMap = new Map<string, any[]>();
  for (const item of activeRecipeItems) {
    const cat = item.category || 'Sonstiges';
    if (!activeCategoriesMap.has(cat)) {
      activeCategoriesMap.set(cat, []);
    }
    activeCategoriesMap.get(cat)!.push(item);
  }

  const activeCategoryList = Array.from(activeCategoriesMap.entries());

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Top Header Row: Title & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-300 mb-2 font-display">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Gemeinsame Einkaufsliste</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Einkauf & Vorräte
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
            Alle Zutaten und Haushaltsartikel für{' '}
            <span className="text-slate-200 font-medium">
              {activeLocation?.name || user?.locationName || 'unsere WG'}
            </span>
          </p>
        </div>

        {/* Week Switcher & Navigation */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="inline-flex items-center bg-surface-card border border-surface-border rounded-2xl p-1 shadow-sm">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-2 hover:bg-surface-elevated rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Vorherige Woche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white font-mono tracking-wide">
              KW {weekNumber} <span className="text-slate-500 font-normal">({year})</span>
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2 hover:bg-surface-elevated rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Nächste Woche"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="px-3.5 py-2 bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-300 hover:text-white rounded-2xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>Kochplan</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </div>

      {/* Einkaufswagen-Fortschritt (Übersichtlich und kompakt oben) */}
      <div className="bento-card rounded-[2rem] p-5 shadow-lg relative overflow-hidden group">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200 font-display min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-base shadow-xs shrink-0">
              🧺
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white truncate">Abgehakte Artikel</div>
              <div className="text-[11px] text-slate-400 font-sans truncate">
                {checkedCount} von {totalCount} Artikeln im Einkaufswagen
              </div>
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <span className="text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono whitespace-nowrap">
              {progressPercent}% erledigt
            </span>
          </div>
        </div>

        <div className="w-full h-2.5 bg-surface-elevated rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2.5 mt-2 border-t border-white/5">
          <span className="text-emerald-400/90 font-medium">✓ {checkedCount} im Korb</span>
          <span>{totalCount - checkedCount} noch zu besorgen</span>
        </div>
      </div>

      {/* Prominenter Button: Eigenen Artikel hinzufügen */}
      <button
        type="button"
        onClick={() => setShowAddCustom(!showAddCustom)}
        className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/20 transition-all cursor-pointer border border-emerald-400/30 select-none"
      >
        <Plus className="w-5 h-5 text-emerald-100 stroke-[2.5]" />
        <span>Eigenen Artikel hinzufügen</span>
      </button>

      {/* Add Custom Item Form */}
      {showAddCustom && (
        <form
          onSubmit={handleAddCustomItem}
          className="bento-card p-5 rounded-2xl border border-surface-border shadow-xl space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-display font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zusatzartikel zur Einkaufsliste hinzufügen</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              z.B. Kaffee, Obst, Drogerieartikel
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Artikelname (z.B. Hafermilch)"
              className="sm:col-span-2 px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
              autoFocus
            />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Menge (z.B. 2)"
              step="any"
              className="px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
            />
            <input
              type="text"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Einheit (z.B. Packung, Liter)"
              className="px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      )}

      {/* Shopping List Categories */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent mb-2" />
          <div>Einkaufsliste wird geladen...</div>
        </div>
      ) : totalCount === 0 ? (
        <div className="bento-card rounded-[2.5rem] p-12 text-center border border-surface-border shadow-xl">
          <div className="text-4xl mb-3">🛒 🥗 🥐</div>
          <h3 className="text-base font-display font-bold text-slate-200">Noch keine Einkaufsliste für diese Woche</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Sobald Gerichte im Kochplan eingetragen sind, stellt der Planer hier automatisch alle Zutaten übersichtlich zusammen!
          </p>
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-xs font-bold shadow-lg shadow-rose-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Gerichte im Kochplan wählen</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Custom Items Section */}
          {activeCustomItems.length > 0 && (
            <div className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-md">
              <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>Zusätzliche Besorgungen ({activeCustomItems.length})</span>
              </h3>
              <div className="divide-y divide-white/5">
                {activeCustomItems.map((ci: any) => (
                  <div
                    key={ci.id}
                    className={`py-3 flex items-center justify-between gap-3 group px-2 rounded-xl transition-all ${
                      ci.isChecked ? 'opacity-70' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCustom(ci.id)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                    >
                      {ci.isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-in zoom-in-75 duration-150" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 flex-shrink-0 transition-colors" />
                      )}
                      <span
                        className={`text-sm ${
                          ci.isChecked
                            ? 'line-through text-slate-400 font-medium'
                            : 'text-slate-200 font-medium'
                        }`}
                      >
                        {ci.name}
                        {(ci.amount || ci.unit) && (
                          <span className="text-xs text-slate-400 ml-2 font-mono">
                            ({ci.amount} {ci.unit})
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustom(ci.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aggregated Recipe Ingredients by Supermarket Category */}
          {activeCategoryList.map(([categoryName, items]) => (
            <div
              key={categoryName}
              className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-md"
            >
              <div className="flex items-center justify-between mb-3.5 border-b border-white/5 pb-3">
                <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                  <span className="text-base">{getCategoryEmoji(categoryName)}</span>
                  <span>{categoryName}</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold bg-surface-elevated px-3 py-1 rounded-full border border-surface-border font-mono">
                  {items.length} {items.length === 1 ? 'Artikel' : 'Artikel'}
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {items.map((item: any) => (
                  <div
                    key={item.ingredientId}
                    onClick={() => handleToggleIngredient(item.ingredientId, item.isChecked)}
                    className={`py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-elevated/70 rounded-2xl px-2.5 transition-all select-none ${
                      item.isChecked ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-in zoom-in-75 duration-150" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 hover:text-emerald-400 flex-shrink-0 transition-colors" />
                      )}
                      <div>
                        <span
                          className={`text-sm ${
                            item.isChecked
                              ? 'line-through text-slate-400 font-medium'
                              : 'text-slate-200 font-semibold'
                          }`}
                        >
                          {item.name}
                        </span>
                        <div className="text-xs text-slate-400 font-medium font-mono mt-0.5">
                          Menge: {item.totalAmount} {item.unit}
                        </div>
                      </div>
                    </div>

                    {/* Estimated Netto Price */}
                    {item.estimatedPrice != null && (
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-xs font-mono font-bold ${
                            item.isChecked ? 'text-slate-500' : 'text-slate-300'
                          }`}
                        >
                          ~ {item.estimatedPrice.toFixed(2)} €
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* All active items completed banner */}
          {activeRecipeItems.length === 0 && activeCustomItems.length === 0 && (
            <div className="bento-card rounded-[2.5rem] p-8 sm:p-10 text-center border border-emerald-500/20 bg-emerald-950/20 shadow-xl">
              <div className="text-4xl mb-2">🎉 🛒 ✨</div>
              <h3 className="text-base font-display font-bold text-emerald-300">
                Alles erledigt!
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                Alle Artikel für diese Woche wurden eingekauft und befinden sich unten bei den abgehakten Artikeln.
              </p>
            </div>
          )}

          {/* Abgehakte Artikel (Visuell reduziert, wiederherstellbar bei Klick) */}
          {totalCompletedCount > 0 && (
            <div className="bento-card rounded-[2rem] p-5 sm:p-6 border border-white/5 bg-surface-card/40 opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-display font-semibold text-slate-300">
                    Abgehakte Artikel ({totalCompletedCount})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-sans">
                  Antippen zum Wiederherstellen
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {/* Completed Custom Items */}
                {completedCustomItems.map((ci: any) => (
                  <div
                    key={ci.id}
                    className="py-2.5 px-2 flex items-center justify-between gap-3 group rounded-xl hover:bg-surface-elevated/40 transition-colors select-none"
                  >
                    <div
                      onClick={() => handleToggleCustom(ci.id)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                      title="Antippen, um wieder in die Einkaufsliste zu verschieben"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500/80 flex-shrink-0" />
                      <span className="text-xs sm:text-sm line-through text-slate-500">
                        {ci.name}
                        {(ci.amount || ci.unit) && (
                          <span className="text-[11px] text-slate-600 ml-2 font-mono">
                            ({ci.amount} {ci.unit})
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustom(ci.id)}
                      className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Endgültig löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Completed Recipe Ingredients */}
                {completedRecipeItems.map((item: any) => (
                  <div
                    key={item.ingredientId}
                    onClick={() => handleToggleIngredient(item.ingredientId, true)}
                    className="py-2.5 px-2 flex items-center justify-between gap-3 group rounded-xl hover:bg-surface-elevated/40 transition-colors cursor-pointer select-none"
                    title="Antippen, um wieder in die Einkaufsliste zu verschieben"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500/80 flex-shrink-0" />
                      <div>
                        <span className="text-xs sm:text-sm line-through text-slate-500">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-600 ml-2 font-mono">
                          ({item.totalAmount} {item.unit})
                        </span>
                      </div>
                    </div>
                    {item.estimatedPrice != null && (
                      <span className="text-[11px] font-mono text-slate-600">
                        ~ {item.estimatedPrice.toFixed(2)} €
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finanzen & Richtwerte (Gemeinsame Bento-Box für Kassenschätzung & Wochenbudget) */}
      <div className="pt-2">
        <div className="bento-card rounded-[2.5rem] p-5 sm:p-7 border border-surface-border shadow-xl relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Unified Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5 gap-2">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-200 font-display">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-sm shadow-xs shrink-0">
                💰
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Kasse & Wochenbudget</span>
                <span className="text-[11px] text-slate-400 font-sans block">
                  Finanzen und Richtwerte für diese Woche
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                budgetData?.isConfirmed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {budgetData?.isConfirmed ? 'Abgerechnet' : 'In Planung'}
            </span>
          </div>

          {/* 2-Column Grid inside the single card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 divide-y md:divide-y-0 md:divide-x divide-white/5">
            {/* Left Column: Kassen-Schätzung */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 font-display">
                    <span className="text-sm">🏷️</span>
                    <span>Kassen-Schätzung</span>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-elevated border border-surface-border text-slate-300 truncate max-w-[130px]">
                    {shoppingData?.supermarketName || 'Supermarkt'}
                  </span>
                </div>

                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-bold text-white font-mono">
                      {shoppingData?.totalEstimatedCost ? shoppingData.totalEstimatedCost.toFixed(2) : '0.00'}
                    </span>
                    <span className="text-lg font-bold text-slate-400 font-mono">€</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    Geschätzter Richtwert der Rezeptzutaten
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/5 mt-2 font-mono">
                <span>Zugeordneter Markt</span>
                <span className="text-slate-300 font-medium">
                  {shoppingData?.supermarketName || 'Standardmarkt'}
                </span>
              </div>
            </div>

            {/* Right Column: Wochenbudget */}
            <div className="flex flex-col justify-between pt-5 md:pt-0 md:pl-6">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 font-display">
                    <span className="text-sm">🪙</span>
                    <span>Verbleibendes Wochenbudget</span>
                  </div>
                </div>

                <div className="my-2">
                  <div className="text-3xl font-display font-bold text-white font-mono">
                    {budgetData?.remainingBudget != null ? `${budgetData.remainingBudget.toFixed(2)} €` : '...'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans">
                    {budgetData?.actualSpent != null
                      ? `Kassenbon erfasst: ${budgetData.actualSpent.toFixed(2)} €`
                      : `Zutaten-Kalkulation: ~${budgetData?.estimatedShoppingCost != null ? budgetData.estimatedShoppingCost.toFixed(2) : '0.00'} €`}
                  </div>
                </div>
              </div>

              {isStaff && (
                <div className="pt-3 border-t border-white/5 mt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentTab('budget')}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <PiggyBank className="w-3.5 h-3.5" />
                    <span>Kasse & Budget verwalten</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
