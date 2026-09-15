import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RecipeSummary } from '../../../../shared/types.js';
import { api } from '../../api/client.js';
import {
  X,
  Camera,
  Plus,
  Trash2,
  Save,
  Clock,
  Users,
  ChefHat,
  BookOpen,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface RecipeEditModalProps {
  recipe: RecipeSummary;
  onClose: () => void;
  onSaved: (updated: RecipeSummary) => void;
}

interface EditableIngredient {
  id?: string;
  ingredientId?: string;
  name: string;
  amount: number | string;
  unit: string;
  notes?: string;
}

const CATEGORIES = [
  'Alltagsküche',
  'Pasta',
  'Fleisch',
  'Geflügel',
  'Vegetarisch',
  'Eintopf',
  'Schnelle Küche',
  'Fisch',
  'Süßspeise',
  'Salat',
  'Suppe',
  'Auflauf',
];

const COMMON_UNITS = ['g', 'kg', 'ml', 'l', 'Stück', 'Dose', 'Packung', 'Bund', 'TL', 'EL', 'Prise'];

export const RecipeEditModal: React.FC<RecipeEditModalProps> = ({
  recipe,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState(recipe.title || '');
  const [category, setCategory] = useState(recipe.category || 'Alltagsküche');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(recipe.prepTimeMinutes || 30);
  const [defaultServings, setDefaultServings] = useState(recipe.defaultServings || 4);
  const [description, setDescription] = useState(recipe.description || '');
  const [instructions, setInstructions] = useState(recipe.instructions || '');
  const [imageUrl, setImageUrl] = useState<string>(recipe.imageUrl || '');
  const [ingredients, setIngredients] = useState<EditableIngredient[]>(
    recipe.ingredients && recipe.ingredients.length > 0
      ? recipe.ingredients.map((ing) => ({
          id: ing.id,
          ingredientId: ing.ingredientId,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.notes || '',
        }))
      : [{ name: '', amount: 100, unit: 'g', notes: '' }]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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
          w = Math.round((h * maxH) / h);
          h = maxH;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setImageUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { name: '', amount: 1, unit: 'Stück', notes: '' },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: keyof EditableIngredient,
    value: any
  ) => {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Bitte gib einen Rezepttitel ein.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      // Filter valid ingredients
      const cleanedIngredients = ingredients
        .filter((ing) => ing.name.trim() && Number(ing.amount) > 0)
        .map((ing) => ({
          ingredientId: ing.ingredientId,
          name: ing.name.trim(),
          amount: Number(ing.amount),
          unit: ing.unit.trim() || 'g',
          notes: ing.notes?.trim() || undefined,
        }));

      const payload = {
        title: title.trim(),
        category,
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        prepTimeMinutes: Number(prepTimeMinutes) || 30,
        defaultServings: Number(defaultServings) || 4,
        imageUrl: imageUrl.trim() || null,
        ingredients: cleanedIngredients,
      };

      const updated = await api.food.updateRecipe(recipe.id, payload);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      console.error('Fehler beim Aktualisieren des Rezepts:', err);
      setErrorMessage(err.message || 'Fehler beim Speichern des Rezepts.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] min-h-screen min-h-[100dvh] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-surface-card rounded-[2.5rem] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border bg-surface-elevated/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-semibold text-white">
                Rezept bearbeiten
              </h2>
              <p className="text-xs text-slate-400">
                Passe Titel, Bild, Zutaten und Zubereitung an
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-surface-card hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer border border-surface-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Basisdaten: Titel & Kategorie */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Rezepttitel <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Spaghetti Bolognese"
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-theme-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kennzahlen: Kochzeit & Portionen */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-theme-primary" />
                Zubereitungszeit (Minuten)
              </label>
              <input
                type="number"
                min="5"
                max="360"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value) || 0)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-theme-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-theme-primary" />
                Standard-Portionen
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={defaultServings}
                onChange={(e) => setDefaultServings(Number(e.target.value) || 1)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-theme-primary"
              />
            </div>
          </div>

          {/* Rezeptbild */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-theme-primary" />
              Rezeptbild
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface-elevated/60 border border-surface-border rounded-2xl p-3">
              {imageUrl ? (
                <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-surface-border shrink-0">
                  <img src={imageUrl} alt="Rezeptvorschau" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-rose-300 rounded-lg cursor-pointer"
                    title="Bild entfernen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-20 rounded-xl border border-dashed border-surface-border bg-surface-card flex flex-col items-center justify-center text-slate-500 shrink-0 text-xs">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span>Kein Bild</span>
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-theme-primary" />
                    <span>Foto hochladen</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Oder Bild-URL direkt eingeben (https://...)"
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary"
                />
              </div>
            </div>
          </div>

          {/* Kurzbeschreibung */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Kurzbeschreibung (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ein kurzer appetitlicher Teaser oder Besonderheit des Gerichts..."
              className="w-full bg-surface-elevated border border-surface-border rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary resize-none leading-relaxed"
            />
          </div>

          {/* Zutatenliste (dynamisch) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-theme-primary" />
                Zutaten ({ingredients.length})
              </label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-2.5 py-1 bg-theme-primary/10 hover:bg-theme-primary/20 border border-theme-primary/30 text-theme-primary text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Zutat hinzufügen</span>
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-surface-elevated/60 border border-surface-border p-2 rounded-xl"
                >
                  {/* Name */}
                  <input
                    type="text"
                    required
                    value={item.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    placeholder="Zutat (z.B. Hackfleisch)"
                    className="flex-1 min-w-[120px] bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary"
                  />

                  {/* Menge */}
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={item.amount}
                    onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                    placeholder="Menge"
                    className="w-20 bg-surface-card border border-surface-border rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-theme-primary"
                  />

                  {/* Einheit */}
                  <input
                    type="text"
                    list={`units-${index}`}
                    value={item.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    placeholder="Einheit"
                    className="w-24 bg-surface-card border border-surface-border rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-theme-primary"
                  />
                  <datalist id={`units-${index}`}>
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>

                  {/* Delete Row Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-surface-card hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer border border-surface-border"
                    title="Zutat entfernen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Zubereitungsanleitung */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-theme-primary" />
              Zubereitungsschritte
            </label>
            <textarea
              rows={6}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Schritt 1: Zwiebeln anbraten...&#10;Schritt 2: Tomatensauce hinzugeben..."
              className="w-full bg-surface-elevated border border-surface-border rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary resize-y leading-relaxed"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-surface-border bg-surface-elevated/60 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-theme-primary hover:bg-theme-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-theme-primary/20 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Wird gespeichert...' : 'Änderungen speichern'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
