import React, { useState } from 'react';
import { RecipeSummary } from '../../../../shared/types.js';
import { X, Clock, Users, ChefHat, Plus, Minus, BookOpen } from 'lucide-react';

interface RecipeModalProps {
  recipe: RecipeSummary | null;
  onClose: () => void;
  defaultServings?: number;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  onClose,
  defaultServings = 6,
}) => {
  const [servings, setServings] = useState<number>(defaultServings);

  if (!recipe) return null;

  const baseServings = recipe.defaultServings || 4;
  const scale = servings / baseServings;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-br from-sky-50/50 to-white">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                {recipe.category}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {recipe.prepTimeMinutes || 30} Min
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {recipe.title}
            </h2>
            {recipe.description && (
              <p className="text-xs text-slate-500 mt-1 max-w-lg">
                {recipe.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Servings Scaler */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-700">
                Zutaten skaliert für:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-extrabold text-slate-900 w-16 text-center">
                {servings} Personen
              </span>
              <button
                type="button"
                onClick={() => setServings((s) => s + 1)}
                className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <ChefHat className="w-4 h-4 text-sky-600" />
              <span>Benötigte Zutaten ({recipe.ingredients.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recipe.ingredients.map((item) => {
                const scaledAmount = Math.round(item.amount * scale * 10) / 10;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-sky-700 bg-white px-2 py-1 rounded-lg border border-slate-200/80">
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
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2.5">
                <BookOpen className="w-4 h-4 text-sky-600" />
                <span>Zubereitungsanleitung</span>
              </h3>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                {recipe.instructions}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
