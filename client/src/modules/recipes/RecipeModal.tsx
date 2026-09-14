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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-surface-card rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-start justify-between bg-gradient-to-br from-amber-500/10 via-surface-card to-surface-card">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {recipe.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                ca. {recipe.prepTimeMinutes || 30} Min
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-white">
              {recipe.title}
            </h2>
            {recipe.description && (
              <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed font-normal">
                {recipe.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-surface-elevated rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Servings Scaler - Strict Single Line (No Wrapping) */}
          <div className="bg-surface-elevated/90 border border-surface-border rounded-2xl p-3 sm:p-3.5 flex flex-row items-center justify-between gap-2 flex-nowrap shadow-inner">
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm font-display font-bold text-slate-200 whitespace-nowrap">
                Zutaten skaliert für:
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-surface-card hover:bg-surface-elevated border border-surface-border rounded-xl flex items-center justify-center text-slate-100 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs sm:text-sm font-extrabold text-amber-300 px-1 text-center whitespace-nowrap font-mono">
                {servings} Personen
              </span>
              <button
                type="button"
                onClick={() => setServings((s) => s + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-surface-card hover:bg-surface-elevated border border-surface-border rounded-xl flex items-center justify-center text-slate-100 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-sm font-display font-bold text-white flex items-center gap-2 mb-3">
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>Benötigte Zutaten ({recipe.ingredients.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recipe.ingredients.map((item) => {
                const scaledAmount = Math.round(item.amount * scale * 10) / 10;
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-surface-elevated/70 border border-surface-border rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="font-bold text-amber-300 bg-surface-card px-2.5 py-1 rounded-lg border border-surface-border shadow-inner font-mono">
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
              <h3 className="text-sm font-display font-bold text-white flex items-center gap-2 mb-2.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Zubereitungsanleitung</span>
              </h3>
              <div className="bg-surface-elevated/60 rounded-2xl p-4 sm:p-5 border border-surface-border text-xs text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                {recipe.instructions}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-elevated/80 border-t border-surface-border flex items-center justify-between">
          {isStaff && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(recipe.id, recipe.title)}
              className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            className="px-5 py-2 bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
