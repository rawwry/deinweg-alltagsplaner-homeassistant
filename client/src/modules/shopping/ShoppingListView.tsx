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
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-emerald-400" />
              <span>Konsolidierte Einkaufsliste</span>
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-950/60 text-emerald-400 rounded-full border border-emerald-800/40">
              KW {weekNumber} • {year}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Alle Zutaten der Woche summiert für den Einkauf am Montag ({activeLocation?.name || user?.locationName || 'Emsdetten'})
          </p>
        </div>

        {/* Week Switcher */}
        <div className="inline-flex items-center bg-slate-800/80 border border-slate-700/60 rounded-2xl p-1">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-bold text-slate-200">KW {weekNumber}</span>
          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress & Supermarket Price Estimate Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Progress Bar Card */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>Einkaufs-Fortschritt</span>
            <span className="text-emerald-400 font-bold">
              {checkedCount} von {totalCount} abgehakt ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Cost Estimate Card */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              Kalkulierte Gesamtkosten
            </div>
            <div className="text-xl font-extrabold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <Euro className="w-5 h-5 text-emerald-400" />
              <span>{shoppingData?.totalEstimatedCost?.toFixed(2) || '0.00'} €</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Richtpreise
            </span>
            <div className="text-xs font-semibold text-slate-300">
              {shoppingData?.supermarketName || 'Netto Marken-Discount'}
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Item Toggle */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 text-xs font-semibold rounded-2xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Zusätzlichen Artikel hinzufügen (Kaffee, Klopapier...)</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('mealplan')}
          className="text-xs text-sky-400 hover:text-sky-300 hover:underline font-semibold"
        >
          Zum Wochenplan
        </button>
      </div>

      {/* Add Custom Item Form */}
      {showAddCustom && (
        <form
          onSubmit={handleAddCustomItem}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3 animate-in fade-in duration-150"
        >
          <div className="text-xs font-bold text-slate-200">Zusatzartikel zur Einkaufsliste</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Artikelname (z.B. Kaffee Crema)"
              className="sm:col-span-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Menge (z.B. 2)"
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Einheit (Packung, l, kg)"
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      )}

      {/* Shopping List Categories */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent mb-2"></div>
          <div>Einkaufsliste wird geladen...</div>
        </div>
      ) : totalCount === 0 ? (
        <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">Noch keine Einkaufsliste für diese Woche</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Plane zuerst Gerichte im Wochenplan ein, um die Einkaufsliste automatisch generieren zu lassen.
          </p>
          <button
            type="button"
            onClick={() => setCurrentTab('mealplan')}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-500"
          >
            Gerichte planen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Custom Items Section */}
          {customItems.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Zusätzliche Besorgungen ({customItems.length})</span>
              </h3>
              <div className="divide-y divide-slate-800">
                {customItems.map((ci: any) => (
                  <div
                    key={ci.id}
                    className="py-2.5 flex items-center justify-between gap-3 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCustom(ci.id)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      {ci.isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 flex-shrink-0" />
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
                          <span className="text-xs text-slate-400 ml-2">
                            ({ci.amount} {ci.unit})
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustom(ci.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sky-400" />
                  <span>{categoryName}</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {items.filter((i) => i.isChecked).length} / {items.length} erledigt
                </span>
              </div>

              <div className="divide-y divide-slate-800">
                {items.map((item: any) => (
                  <div
                    key={item.ingredientId}
                    onClick={() => handleToggleIngredient(item.ingredientId, item.isChecked)}
                    className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/50 rounded-xl px-2 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      {item.isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 hover:text-emerald-400 flex-shrink-0" />
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
                        <div className="text-xs text-slate-400 font-medium">
                          Menge: {item.totalAmount} {item.unit}
                        </div>
                      </div>
                    </div>

                    {/* Estimated Netto Price */}
                    {item.estimatedPrice && (
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-xs font-bold ${
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
