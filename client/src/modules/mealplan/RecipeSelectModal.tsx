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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2 font-sans tracking-tight">
              <ChefHat className="w-5 h-5 text-rose-400" />
              <span>Gericht für {dayName} wählen</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Wähle ein Rezept aus der Datenbank oder trage ein eigenes Gericht ein.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-surface-elevated rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Dish Option */}
        <div className="p-4 sm:p-5 bg-surface-elevated/60 border-b border-surface-border font-sans">
          <div className="flex gap-2">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Eigenes freies Gericht (z.B. Dönerabend oder Reste-Essen)..."
              className="flex-1 px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 font-sans"
            />
            <button
              type="button"
              disabled={!customTitle.trim()}
              onClick={() => {
                onSelectRecipe(null, customTitle.trim());
                onClose();
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all shadow-md shadow-rose-500/20 cursor-pointer font-sans"
            >
              Übernehmen
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 sm:p-5 border-b border-surface-border space-y-3 font-sans">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rezept suchen (z. B. Spaghetti, Hähnchen, Gratin)..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-xs'
                    : 'bg-surface-elevated text-slate-400 hover:bg-surface-card hover:text-white border border-surface-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 font-sans">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              Rezepte werden geladen...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
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
                className="p-4 border border-surface-border bg-surface-elevated/60 hover:bg-surface-elevated rounded-2xl hover:border-rose-500/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {r.category}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100 group-hover:text-rose-300 transition-colors font-sans">
                      {r.title}
                    </h4>
                  </div>
                  {r.description && (
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1 font-normal font-sans">
                      {r.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-sans">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      ca. {r.prepTimeMinutes || 30} Min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {r.defaultServings} Port. (Basis)
                    </span>
                    <span>{r.ingredients.length} Zutaten</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-2 bg-surface-card group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-pink-500 text-slate-200 group-hover:text-white border border-surface-border rounded-xl text-xs font-semibold transition-all flex-shrink-0 cursor-pointer shadow-xs"
                >
                  Auswählen
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-elevated/80 border-t border-surface-border flex justify-between items-center text-xs font-sans">
          <button
            type="button"
            onClick={() => {
              onSelectRecipe(null);
              onClose();
            }}
            className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
          >
            Tag leeren (kein Gericht)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-card hover:bg-surface-elevated text-slate-300 border border-surface-border rounded-xl font-semibold cursor-pointer transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
