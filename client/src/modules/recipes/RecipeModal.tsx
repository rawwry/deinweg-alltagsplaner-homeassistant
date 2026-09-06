import React, { useState } from 'react';
import { RecipeSummary } from '../../../../shared/types.js';
import { X, Clock, Users, ChefHat, Plus, Minus, BookOpen, Trash2 } from 'lucide-react';

interface RecipeModalProps {
  recipe: RecipeSummary | null;
  onClose: () => void;
  defaultServings?: number;
  isStaff?: boolean;
  onDelete?: (id: string, title: string) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  onClose,
  defaultServings = 6,
  isStaff = false,
  onDelete,
}) => {
  const [servings, setServings] = useState<number>(defaultServings);

  if (!recipe) return null;

  const baseServings = recipe.defaultServings || 4;
  const scale = servings / baseServings;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-gradient-to-br from-slate-800/70 via-slate-900 to-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80">
                {recipe.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {recipe.prepTimeMinutes || 30} Min
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              {recipe.title}
            </h2>
            {recipe.description && (
              <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                {recipe.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Servings Scaler - Strict Single Line (No Wrapping) */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 sm:p-3.5 flex flex-row items-center justify-between gap-2 flex-nowrap shadow-inner">
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <Users className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-slate-200 whitespace-nowrap">
                Zutaten skaliert für:
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl flex items-center justify-center text-slate-100 active:scale-95 transition-all shrink-0"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs sm:text-sm font-extrabold text-sky-300 px-1 text-center whitespace-nowrap">
                {servings} Personen
              </span>
              <button
                type="button"
                onClick={() => setServings((s) => s + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl flex items-center justify-center text-slate-100 active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
              <ChefHat className="w-4 h-4 text-sky-400" />
              <span>Benötigte Zutaten ({recipe.ingredients.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recipe.ingredients.map((item) => {
                const scaledAmount = Math.round(item.amount * scale * 10) / 10;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-800/70 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="font-bold text-sky-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 shadow-inner">
                      {scaledAmount} {item.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          {recipe.instructions && (
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-2.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Zubereitungsanleitung</span>
              </h3>
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-normal">
                {recipe.instructions}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {isStaff && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(recipe.id, recipe.title)}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Rezept löschen</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
