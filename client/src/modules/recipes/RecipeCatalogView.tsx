import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../api/client.js';
import { RecipeSummary } from '../../../../shared/types.js';
import { RecipeModal } from './RecipeModal.js';
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
} from 'lucide-react';

export const RecipeCatalogView: React.FC = () => {
  const { user, activeLocation } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

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
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Alltagsküche');
  const [newDescription, setNewDescription] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newPrepTime, setNewPrepTime] = useState('30');
  const [newServings, setNewServings] = useState('4');

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

  useEffect(() => {
    fetchRecipes();
  }, []);

  const categories = ['ALLE', ...Array.from(new Set(recipes.map((r) => r.category)))];

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALLE' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.food.createRecipe({
        title: newTitle.trim(),
        category: newCategory,
        description: newDescription.trim() || undefined,
        instructions: newInstructions.trim() || undefined,
        prepTimeMinutes: Number(newPrepTime) || 30,
        defaultServings: Number(newServings) || 4,
        ingredients: [],
      });

      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewInstructions('');
      fetchRecipes();
    } catch (err) {
      console.error('Fehler beim Anlegen des Rezepts:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-surface-card rounded-[2.5rem] p-6 border border-surface-border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-xs font-bold text-amber-300 mb-2 font-display">
            <span>📖</span>
            <span>Lieblingsgerichte & Ideen</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
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
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
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
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
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
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Neues Rezept eintragen</span>
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
            className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-surface-border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                  : 'bg-surface-elevated text-slate-400 hover:bg-surface-card hover:text-white border border-surface-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Display (Grid or List) */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-amber-500 border-t-transparent mb-2" />
          <div>Rezepte werden geladen...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bento-card rounded-[2.5rem] p-12 text-center border border-surface-border">
          <Utensils className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-display font-bold text-slate-200">Keine Rezepte gefunden</h3>
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
              className="bento-card rounded-[2rem] p-6 border border-surface-border shadow-md hover:shadow-xl cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {recipe.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    ca. {recipe.prepTimeMinutes || 30} Min
                  </span>
                </div>

                <h3 className="text-base font-display font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                  {recipe.title}
                </h3>

                {recipe.description && (
                  <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                    {recipe.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 text-amber-400" />
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
                    className="px-3.5 py-1.5 bg-surface-elevated group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-rose-500 text-slate-200 group-hover:text-white rounded-xl font-bold transition-all flex items-center gap-1 text-xs cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Öffnen</span>
                  </button>
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
              className="bento-card rounded-[2rem] p-4 sm:p-5 border border-surface-border shadow-sm cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                    {recipe.category}
                  </span>
                  <h3 className="text-base font-display font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                    {recipe.title}
                  </h3>
                </div>
                {recipe.description && (
                  <p className="text-xs text-slate-300 line-clamp-1 leading-relaxed font-normal">
                    {recipe.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
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
                  className="px-3.5 py-1.5 bg-surface-elevated group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-rose-500 text-slate-200 group-hover:text-white rounded-xl font-bold transition-all flex items-center gap-1 text-xs cursor-pointer shadow-xs"
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
          onClose={() => setActiveRecipe(null)}
        />
      )}

      {/* Add Recipe Modal (Staff) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-[2.5rem] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-surface-border space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-surface-border pb-3.5">
              <h3 className="text-base font-display font-bold text-white">Neues Rezept anlegen</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecipe} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-display">Titel des Gerichts</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="z.B. Lasagne al Forno"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 font-display">Kategorie</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 font-display">Zeit (Min)</label>
                  <input
                    type="number"
                    value={newPrepTime}
                    onChange={(e) => setNewPrepTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 font-display">Basis-Port.</label>
                  <input
                    type="number"
                    value={newServings}
                    onChange={(e) => setNewServings(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-display">Kurzbeschreibung</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Leckere Lasagne mit Béchamelsauce..."
                  className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-display">Zubereitungsschritte</label>
                <textarea
                  rows={4}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="1. Hackfleisch anbraten...&#10;2. Schichten..."
                  className="w-full px-3.5 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-sans"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2.5 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-surface-elevated hover:bg-surface-card text-slate-300 rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
