import React, { useState, useRef } from 'react';
import { RecipeSummary } from '../../../../shared/types.js';
import { X, Clock, Users, ChefHat, Plus, Minus, BookOpen, Trash2, Camera, Utensils } from 'lucide-react';
import { api } from '../../api/client.js';

interface RecipeModalProps {
  recipe: RecipeSummary | null;
  onClose: () => void;
  defaultServings?: number;
  isStaff?: boolean;
  onDelete?: (id: string, title: string) => void;
  onRecipeUpdated?: (updated: RecipeSummary) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  onClose,
  defaultServings = 6,
  isStaff = false,
  onDelete,
  onRecipeUpdated,
}) => {
  const [servings, setServings] = useState<number>(defaultServings);
  const [imageUrl, setImageUrl] = useState<string | null>(recipe?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!recipe) return null;

  const baseServings = recipe.defaultServings || 4;
  const scale = servings / baseServings;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const maxH = 500;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        if (h > maxH) {
          w = Math.round((w * maxH) / h);
          h = maxH;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

        try {
          setIsUploading(true);
          const updated = await api.food.updateRecipe(recipe.id, {
            ...recipe,
            imageUrl: dataUrl,
          });
          setImageUrl(dataUrl);
          if (onRecipeUpdated) onRecipeUpdated({ ...recipe, imageUrl: dataUrl });
        } catch (err: any) {
          alert('Fehler beim Aktualisieren des Bildes: ' + err.message);
        } finally {
          setIsUploading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-surface-card rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cover / Hero Image if available */}
        <div className="relative w-full bg-slate-950 border-b border-surface-border">
          {imageUrl ? (
            <div className="w-full h-52 sm:h-64 relative overflow-hidden">
              <img
                src={imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-black/30 to-black/60" />
            </div>
          ) : (
            <div className="w-full h-28 bg-gradient-to-r from-theme-subtle via-surface-card to-surface-card flex items-center justify-between px-6" />
          )}

          {/* Close Button top-right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-2xl transition-colors cursor-pointer z-10 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Staff: Change / Upload Image */}
          {isStaff && (
            <div className="absolute bottom-3 right-4 z-10">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
              >
                <Camera className="w-3.5 h-3.5 text-theme-primary" />
                <span>{isUploading ? 'Wird gespeichert...' : imageUrl ? 'Bild ändern' : 'Rezeptbild hinzufügen'}</span>
              </button>
            </div>
          )}

          {/* Recipe Title & Tags overlay */}
          <div className="absolute bottom-4 left-6 right-24 z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full badge-theme backdrop-blur-md">
                {recipe.category}
              </span>
              <span className="text-xs text-slate-200 flex items-center gap-1 font-mono bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-theme-primary" />
                ca. {recipe.prepTimeMinutes || 30} Min
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-tight drop-shadow-md">
              {recipe.title}
            </h2>
          </div>
        </div>

        {recipe.description && (
          <div className="px-6 pt-4 text-xs text-slate-300 leading-relaxed font-normal">
            {recipe.description}
          </div>
        )}

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Servings Scaler - Strict Single Line (No Wrapping) */}
          <div className="bg-surface-elevated/90 border border-surface-border rounded-2xl p-3 sm:p-3.5 flex flex-row items-center justify-between gap-2 flex-nowrap shadow-inner">
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <Users className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs sm:text-sm font-display font-semibold text-slate-200 whitespace-nowrap">
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
              <span className="text-xs sm:text-sm font-bold text-rose-300 px-1 text-center whitespace-nowrap font-mono">
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
            <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 mb-3">
              <ChefHat className="w-4 h-4 text-rose-400" />
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
                    <span className="font-bold text-rose-300 bg-surface-card px-2.5 py-1 rounded-lg border border-surface-border shadow-inner font-mono">
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
              <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 mb-2.5">
                <BookOpen className="w-4 h-4 text-rose-400" />
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
