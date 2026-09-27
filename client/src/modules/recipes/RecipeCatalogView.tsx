import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { RecipeSummary } from '../../../../shared/types.js';
import { RecipeModal } from './RecipeModal.js';
import { RecipeEditModal } from './RecipeEditModal.js';
import {
  BookOpen,
  Search,
  Clock,
  Plus,
  Utensils,
  Eye,
  ChefHat,
  X,
  LayoutGrid,
  List,
  Trash2,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';

export const RecipeCatalogView: React.FC = () => {
  const { user, activeLocation } = useAuth();
  const isStaff = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'BETREUER';

  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALLE');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeRecipe, setActiveRecipe] = useState<RecipeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteRecipe = async (e: React.MouseEvent, recipeId: string, recipeTitle: string) => {
    e.stopPropagation();
    if (!window.confirm(`Möchtest du das Rezept "${recipeTitle}" wirklich unwiderruflich löschen?`)) {
      return;
    }

    try {
      setDeletingId(recipeId);
      await api.food.deleteRecipe(recipeId);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      if (activeRecipe?.id === recipeId) {
        setActiveRecipe(null);
      }
    } catch (err: any) {
      alert(`Fehler beim Löschen des Rezepts: ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Add Recipe Modal State (Staff only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

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

  const fetchCategories = async () => {
    try {
      const cats = await api.food.categories();
      setDbCategories(cats);
    } catch (err) {
      console.error('Fehler beim Laden der Kategorien:', err);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchCategories();
  }, []);

  const categories = [
    'ALLE',
    ...Array.from(
      new Set([
        ...dbCategories.map((c: any) => c.name),
        ...recipes.map((r) => r.category),
      ])
    ),
  ];

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALLE' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });


  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-surface-card rounded-[2.5rem] p-6 border border-surface-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/15 border border-rose-500/30 rounded-full text-xs font-semibold text-rose-300 mb-2 font-display">
            <span>📖</span>
            <span>Lieblingsgerichte & Ideen</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-rose-400" />
            <span>Unsere Rezeptsammlung</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Leckere Gerichte der WG mit Zutatenlisten und einfachen Zubereitungsschritten
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Mode Toggle (Grid vs List) */}
          <div className="flex items-center bg-surface-elevated/90 p-1 rounded-2xl border border-surface-border">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Kachelansicht"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Listenansicht"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isStaff && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-500/25 transition-all flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Neues Rezept eintragen</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bento-card rounded-[2rem] p-5 border border-surface-border space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rezept nach Name oder Zutat durchsuchen..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-surface-border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {categories.map((cat) => {
            const count =
              cat === 'ALLE'
                ? recipes.length
                : recipes.filter((r) => r.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm ring-1 ring-white/20'
                    : 'bg-surface-elevated text-slate-300 hover:bg-surface-card hover:text-white border border-surface-border'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected ? 'bg-black/25 text-white' : 'bg-surface-card text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipes Display (Grid or List) */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-rose-500 border-t-transparent mb-2" />
          <div>Rezepte werden geladen...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bento-card rounded-[2.5rem] p-12 text-center border border-surface-border">
          <Utensils className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-display font-semibold text-slate-200">Keine Rezepte gefunden</h3>
          <p className="text-xs text-slate-400 mt-1">
            Versuche einen anderen Suchbegriff oder eine andere Kategorie.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => setActiveRecipe(recipe)}
              className="bento-card rounded-[2.2rem] overflow-hidden border border-surface-border shadow-md hover:shadow-xl cursor-pointer transition-all flex flex-col justify-between group"
            >
              {/* Recipe Cover Image or Placeholder Header */}
              <div className="w-full h-44 relative bg-slate-950 overflow-hidden border-b border-surface-border shrink-0">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-surface-elevated via-surface-card to-surface-elevated flex flex-col items-center justify-center gap-1.5 text-slate-500 group-hover:text-theme-primary transition-colors">
                    <Utensils className="w-8 h-8 opacity-40" />
                    <span className="text-[11px] font-sans font-medium text-slate-500">Kein Bild hinterlegt</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full badge-theme backdrop-blur-md">
                    {recipe.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3 z-10">
                  <span className="text-xs text-slate-200 flex items-center gap-1 font-mono bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5 text-theme-primary" />
                    ca. {recipe.prepTimeMinutes || 30} Min
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-display font-semibold text-slate-100 group-hover:text-theme-primary transition-colors line-clamp-1">
                    {recipe.title}
                  </h3>

                  {recipe.description && (
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed font-normal">
                      {recipe.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ChefHat className="w-3.5 h-3.5 text-theme-primary" />
                    <span>{recipe.ingredients.length} Zutaten</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {isStaff && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRecipe(e, recipe.id, recipe.title)}
                        disabled={deletingId === recipe.id}
                        title="Rezept löschen"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-surface-elevated group-hover:btn-theme-gradient text-slate-200 group-hover:text-white rounded-xl font-semibold transition-all flex items-center gap-1 text-xs cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Öffnen</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => setActiveRecipe(recipe)}
              className="bento-card rounded-[2rem] p-3 sm:p-4 border border-surface-border shadow-sm cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-14 h-14 rounded-2xl object-cover ring-1 ring-surface-border shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center text-slate-500 shrink-0 border border-surface-border">
                    <Utensils className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full badge-theme shrink-0">
                      {recipe.category}
                    </span>
                    <h3 className="text-base font-display font-semibold text-slate-100 group-hover:text-theme-primary transition-colors truncate">
                      {recipe.title}
                    </h3>
                  </div>
                  {recipe.description && (
                    <p className="text-xs text-slate-300 line-clamp-1 leading-relaxed font-normal">
                      {recipe.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-theme-primary" />
                  {recipe.prepTimeMinutes || 30} Min
                </span>
                <span className="flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 text-slate-400" />
                  {recipe.ingredients.length} Zutaten
                </span>
                {isStaff && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteRecipe(e, recipe.id, recipe.title)}
                    disabled={deletingId === recipe.id}
                    title="Rezept löschen"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-surface-elevated group-hover:btn-theme-gradient text-slate-200 group-hover:text-white rounded-xl font-semibold transition-all flex items-center gap-1 text-xs cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Öffnen</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Details Modal */}
      {activeRecipe && (
        <RecipeModal
          recipe={activeRecipe}
          defaultServings={activeLocation?.defaultServings || 6}
          isStaff={isStaff}
          onDelete={(id, title) => handleDeleteRecipe({ stopPropagation: () => {} } as any, id, title)}
          onRecipeUpdated={(updated) => {
            setActiveRecipe(updated);
            setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          }}
          onClose={() => setActiveRecipe(null)}
        />
      )}

      {/* Add Recipe Modal (Staff) */}
      {showAddModal && (
        <RecipeEditModal
          recipe={null}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchRecipes();
          }}
        />
      )}
    </div>
  );
};
