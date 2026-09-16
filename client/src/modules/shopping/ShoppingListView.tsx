import React, { useEffect, useState } from 'react';
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
import { LocationBudgetModal } from './LocationBudgetModal.js';

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
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New custom item form
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customCategory, setCustomCategory] = useState('Sonstiges');
  const [showAddCustom, setShowAddCustom] = useState(false);

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

    // Optimistic UI update
    setShoppingData((prev: any) => ({
      ...prev,
      items: prev.items.map((i: any) =>
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
    // Optimistic UI update
    setShoppingData((prev: any) => ({
      ...prev,
      customItems: prev.customItems.map((ci: any) =>
        ci.id === id ? { ...ci, isChecked: !ci.isChecked } : ci
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

  // Group recipe items by category
  const categoriesMap = new Map<string, any[]>();
  for (const item of allItems) {
    const cat = item.category || 'Sonstiges';
    if (!categoriesMap.has(cat)) {
      categoriesMap.set(cat, []);
    }
    categoriesMap.get(cat)!.push(item);
  }

  const categoryList = Array.from(categoriesMap.entries());

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
            <span>Wochenplan</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </div>

      {/* 3 Balanced Bento Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Card 1: Einkaufswagen & Fortschritt */}
        <div className="bento-card rounded-[2rem] p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 font-display">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-sm shadow-xs">
                  🧺
                </div>
                <span>Einkaufswagen</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                {progressPercent}%
              </span>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-display font-bold text-white font-mono">
                  {checkedCount}
                </span>
                <span className="text-slate-400 text-xs font-medium font-sans">
                  von {totalCount} Artikel abgehakt
                </span>
              </div>
              <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden mt-3 border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-3 border-t border-white/5 mt-2">
            <span className="text-emerald-400/90 font-medium">✓ {checkedCount} erledigt</span>
            <span>{totalCount - checkedCount} noch offen</span>
          </div>
        </div>

        {/* Card 2: Kassen-Schätzung & Supermarkt */}
        <div className="bento-card rounded-[2rem] p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 font-display">
                <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center text-sm shadow-xs">
                  🏷️
                </div>
                <span>Kassen-Schätzung</span>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-elevated border border-surface-border text-slate-300 truncate max-w-[120px]">
                {shoppingData?.supermarketName || 'Supermarkt'}
              </span>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-white font-mono">
                  {shoppingData?.totalEstimatedCost ? shoppingData.totalEstimatedCost.toFixed(2) : '0.00'}
                </span>
                <span className="text-lg font-bold text-slate-400 font-mono">€</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-sans">
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

        {/* Card 3: WG-Wochenbudget & Sonderkasse */}
        <div className="bento-card rounded-[2rem] p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 font-display">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center text-sm shadow-xs">
                  🪙
                </div>
                <span>WG-Wochenbudget</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  budgetData?.isConfirmed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {budgetData?.isConfirmed ? 'Abgeschlossen' : 'Verfügbar'}
              </span>
            </div>

            <div className="my-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-display font-bold text-emerald-400 font-mono">
                  {budgetData ? budgetData.remainingBudget.toFixed(2) : '—'}
                </span>
                <span className="text-lg font-bold text-emerald-400/80 font-mono">€</span>
                <span className="text-slate-400 text-xs font-medium ml-1">frei</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-sans">
                {user?.role === 'BEWOHNER'
                  ? 'Noch verfügbar für den Wocheneinkauf'
                  : `von ${budgetData ? `${budgetData.weeklyBudget.toFixed(0)} €` : '350 €'} Wochensatz`}
              </p>
            </div>
          </div>

          {/* Caregiver cashbox management button (staff only) */}
          {(user?.role === 'ADMIN' || user?.role === 'BETREUER') && (
            <div className="pt-3 border-t border-white/5 mt-2">
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>WG-Kasse verwalten</span>
                <ArrowRight className="w-3 h-3 text-emerald-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar: Category summary and quick-add toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-card/70 border border-surface-border rounded-2xl px-4 py-3 shadow-sm">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="font-semibold text-slate-200 font-display">Übersicht:</span>
          <span className="font-mono text-slate-300">{categoryList.length} Kategorien</span>
          {customItems.length > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-rose-300 font-medium font-sans">
                {customItems.length} zusätzliche Besorgung(en)
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Eigenen Artikel hinzufügen</span>
        </button>
      </div>

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
              className="sm:col-span-2 px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
              autoFocus
            />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Menge (z.B. 2)"
              step="any"
              className="px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
            />
            <input
              type="text"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Einheit (z.B. Packung, Liter)"
              className="px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="px-4 py-1.5 bg-surface-elevated hover:bg-surface-card text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
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
            Sobald Gerichte im Wochenplan eingetragen sind, stellt der Planer hier automatisch alle Zutaten übersichtlich zusammen!
          </p>
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-xs font-bold shadow-lg shadow-rose-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Gerichte im Wochenplan wählen</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Custom Items Section */}
          {customItems.length > 0 && (
            <div className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-md">
              <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>Zusätzliche Besorgungen ({customItems.length})</span>
              </h3>
              <div className="divide-y divide-white/5">
                {customItems.map((ci: any) => (
                  <div
                    key={ci.id}
                    className="py-3 flex items-center justify-between gap-3 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCustom(ci.id)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                    >
                      {ci.isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 flex-shrink-0 transition-colors" />
                      )}
                      <span
                        className={`text-sm ${
                          ci.isChecked
                            ? 'line-through text-slate-500'
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
          {categoryList.map(([categoryName, items]) => (
            <div
              key={categoryName}
              className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-md"
            >
              <div className="flex items-center justify-between mb-3.5 border-b border-white/5 pb-3">
                <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2">
                  <span className="text-base">{getCategoryEmoji(categoryName)}</span>
                  <span>{categoryName}</span>
                </h3>
                <span className="text-xs text-slate-300 font-semibold bg-surface-elevated px-3 py-1 rounded-full border border-surface-border font-mono">
                  {items.filter((i) => i.isChecked).length} / {items.length} erledigt
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {items.map((item: any) => (
                  <div
                    key={item.ingredientId}
                    onClick={() => handleToggleIngredient(item.ingredientId, item.isChecked)}
                    className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-elevated/70 rounded-2xl px-2.5 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      {item.isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 hover:text-emerald-400 flex-shrink-0 transition-colors" />
                      )}
                      <div>
                        <span
                          className={`text-sm ${
                            item.isChecked
                              ? 'line-through text-slate-500'
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
                    {item.estimatedPrice && (
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
        </div>
      )}

      {/* WG-Budget & Sonderkasse Modal */}
      <LocationBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        locationId={activeLocationId}
        locationName={activeLocation?.name || user?.locationName || 'unsere WG'}
        year={year}
        weekNumber={weekNumber}
        isStaff={user?.role === 'ADMIN' || user?.role === 'BETREUER'}
        onBudgetUpdated={fetchShoppingAndBudget}
      />
    </div>
  );
};
