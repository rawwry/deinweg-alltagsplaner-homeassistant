import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { RecipeSummary } from '../../../../shared/types.js';
import { X, Search, Clock, Users, ChefHat } from 'lucide-react';

interface RecipeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipeId: string | null, customTitle?: string) => void;
  dayName: string;
}

export const RecipeSelectModal: React.FC<RecipeSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectRecipe,
  dayName,
}) => {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALLE');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const data = await api.food.recipes();
        setRecipes(data);
      } catch (err) {
        console.error('Fehler beim Laden der Rezepte:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecipes();
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['ALLE', ...Array.from(new Set(recipes.map((r) => r.category)))];

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALLE' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-sky-400" />
              <span>Gericht für {dayName} wählen</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Wähle ein Rezept aus der Datenbank oder trage ein eigenes Gericht ein.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Dish Option */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Eigenes freies Gericht (z.B. Dönerabend oder Reste-Essen)..."
              className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              disabled={!customTitle.trim()}
              onClick={() => {
                onSelectRecipe(null, customTitle.trim());
                onClose();
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              Übernehmen
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rezept suchen (z. B. Spaghetti, Hähnchen, Gratin)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Rezepte werden geladen...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Keine passenden Rezepte gefunden.
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  onSelectRecipe(r.id);
                  onClose();
                }}
                className="p-3.5 border border-slate-800 bg-slate-900/60 rounded-2xl hover:border-sky-600 hover:bg-sky-950/20 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
                      {r.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                      {r.title}
                    </h4>
                  </div>
                  {r.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {r.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {r.prepTimeMinutes || 30} Min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {r.defaultServings} Port. (Basis)
                    </span>
                    <span>{r.ingredients.length} Zutaten</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 bg-slate-800 group-hover:bg-sky-600 group-hover:text-white text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold transition-colors flex-shrink-0"
                >
                  Auswählen
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => {
              onSelectRecipe(null);
              onClose();
            }}
            className="text-rose-400 hover:text-rose-300 font-medium"
          >
            Tag leeren (kein Gericht)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 rounded-xl font-medium"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
