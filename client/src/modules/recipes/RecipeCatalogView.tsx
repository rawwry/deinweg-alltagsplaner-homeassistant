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
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl shadow-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-sky-400" />
            <span>Rezeptdatenbank</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zentrale Rezeptsammlung mit Zutatenlisten und Zubereitungsanleitungen
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Mode Toggle (Grid vs List) */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Kachelansicht"
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Listenansicht"
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'list'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isStaff && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-all flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Neues Rezept anlegen</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rezept nach Name oder Zutat durchsuchen..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Display (Grid or List) */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-500 border-t-transparent mb-2"></div>
          <div>Rezepte werden geladen...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800">
          <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Keine Rezepte gefunden</h3>
          <p className="text-xs text-slate-500 mt-1">
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
              className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-md hover:shadow-xl hover:border-sky-500/60 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80">
                    {recipe.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {recipe.prepTimeMinutes || 30} Min
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors line-clamp-1">
                  {recipe.title}
                </h3>

                {recipe.description && (
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 text-slate-400" />
                  {recipe.ingredients.length} Zutaten
                </span>

                <button
                  type="button"
                  className="px-3 py-1.5 bg-slate-800 group-hover:bg-sky-600 text-slate-200 group-hover:text-white rounded-xl font-semibold transition-colors flex items-center gap-1 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Rezept öffnen</span>
                </button>
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
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm hover:border-sky-500/70 hover:bg-slate-850 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80 shrink-0">
                    {recipe.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors truncate">
                    {recipe.title}
                  </h3>
                </div>
                {recipe.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                    {recipe.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {recipe.prepTimeMinutes || 30} Min
                </span>
                <span className="flex items-center gap-1">
                  <ChefHat className="w-3.5 h-3.5 text-slate-400" />
                  {recipe.ingredients.length} Zutaten
                </span>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-slate-800 group-hover:bg-sky-600 text-slate-200 group-hover:text-white rounded-xl font-semibold transition-colors flex items-center gap-1 text-xs"
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
          onClose={() => setActiveRecipe(null)}
        />
      )}

      {/* Add Recipe Modal (Staff) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Neues Rezept anlegen</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecipe} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Titel des Gerichts</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="z.B. Lasagne al Forno"
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kategorie</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Zeit (Min)</label>
                  <input
                    type="number"
                    value={newPrepTime}
                    onChange={(e) => setNewPrepTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Basis-Port.</label>
                  <input
                    type="number"
                    value={newServings}
                    onChange={(e) => setNewServings(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Kurzbeschreibung</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Leckere Lasagne mit Béchamelsauce..."
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Zubereitungsschritte</label>
                <textarea
                  rows={4}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="1. Hackfleisch anbraten...&#10;2. Schichten..."
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold shadow-xs"
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
