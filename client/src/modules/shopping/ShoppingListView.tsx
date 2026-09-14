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
  const [isLoading, setIsLoading] = useState(true);

  // New custom item form
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customCategory, setCustomCategory] = useState('Sonstiges');
  const [showAddCustom, setShowAddCustom] = useState(false);

  const fetchShoppingList = async () => {
    try {
      setIsLoading(true);
      const data = await api.food.shoppingList(activeLocationId, year, weekNumber);
      setShoppingData(data);
    } catch (err) {
      console.error('Fehler beim Laden der Einkaufsliste:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingList();
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
      fetchShoppingList();
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
      fetchShoppingList();
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
      fetchShoppingList();
    }
  };

  const handleDeleteCustom = async (id: string) => {
    try {
      await api.food.deleteCustomItem(id);
      fetchShoppingList();
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
      {/* Top Header Card */}
      <div className="bg-surface-card rounded-[2.5rem] p-6 border border-surface-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <span>Gemeinsame Einkaufsliste</span>
            </h1>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-500/15 text-emerald-300 rounded-full border border-emerald-500/30 font-mono">
              KW {weekNumber} • {year}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 font-normal">
            Alle Zutaten und Haushaltsartikel für unsere WG-Woche ({activeLocation?.name || user?.locationName || 'Emsdetten'})
          </p>
        </div>

        {/* Week Switcher */}
        <div className="inline-flex items-center bg-surface-elevated/80 border border-surface-border rounded-2xl p-1 shadow-inner">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-2 hover:bg-surface-card rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-bold text-white font-mono">KW {weekNumber}</span>
          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2 hover:bg-surface-card rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress & Supermarket Price Estimate Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Progress Bar Card */}
        <div className="bento-card rounded-[2rem] p-5 border border-surface-border">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2.5">
            <span className="flex items-center gap-1.5">
              <span>🧺</span>
              <span className="font-display font-bold">Im Einkaufswagen</span>
            </span>
            <span className="text-emerald-400 font-bold font-mono">
              {checkedCount} von {totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-surface-elevated rounded-full overflow-hidden border border-surface-border/60">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cost Estimate Card */}
        <div className="bento-card rounded-[2rem] p-5 border border-surface-border flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 font-display">
              <Euro className="w-3.5 h-3.5 text-emerald-400" />
              <span>Geschätzter Kassenbetrag</span>
            </div>
            <div className="text-xl font-display font-extrabold text-white flex items-center gap-1.5 mt-1 font-mono">
              <span>{shoppingData?.totalEstimatedCost?.toFixed(2) || '0.00'} €</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">
              Supermarkt
            </span>
            <div className="text-xs font-bold text-amber-200">
              {shoppingData?.supermarketName || 'Supermarkt'}
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Item Toggle */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-200 hover:text-white border border-surface-border text-xs font-bold rounded-2xl transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Zusätzlichen Artikel hinzufügen (Kaffee, Obst, Drogerie...)</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('mealplan')}
          className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-semibold cursor-pointer"
        >
          Zum Wochenplan →
        </button>
      </div>

      {/* Add Custom Item Form */}
      {showAddCustom && (
        <form
          onSubmit={handleAddCustomItem}
          className="bento-card p-5 rounded-[2rem] border border-surface-border shadow-xl space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="text-xs font-display font-bold text-white">Zusatzartikel zur Einkaufsliste</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Artikelname (z.B. Kaffee Crema)"
              className="sm:col-span-2 px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
            />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Menge (z.B. 2)"
              className="px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
            />
            <input
              type="text"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Einheit (Packung, l, kg)"
              className="px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
            Sobald Gerichte im Wochenplan eingetragen sind, stellt der Planer hier automatisch alle Zutaten übersichtlich zusammen!
          </p>
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Gerichte im Wochenplan wählen</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Custom Items Section */}
          {customItems.length > 0 && (
            <div className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-md">
              <h3 className="text-sm font-display font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
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
                <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-2">
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
    </div>
  );
};
