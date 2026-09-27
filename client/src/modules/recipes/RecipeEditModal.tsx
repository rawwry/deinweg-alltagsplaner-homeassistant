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
  Database,
  Search,
  Info,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface RecipeEditModalProps {
  recipe?: RecipeSummary | null;
  onClose: () => void;
  onSaved: (savedRecipe: RecipeSummary) => void;
}

interface EditableIngredient {
  id?: string;
  ingredientId?: string;
  name: string;
  amount: number | string;
  unit: string;
  notes?: string;
}

interface DbIngredient {
  id: string;
  name: string;
  category?: string;
  standardUnit?: string;
  pricePerUnit?: number;
  priceUnitSize?: number;
}

const DEFAULT_CATEGORIES = [
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
  const isNew = !recipe;

  const [title, setTitle] = useState(recipe?.title || '');
  const [category, setCategory] = useState(recipe?.category || 'Alltagsküche');
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(recipe?.prepTimeMinutes || 30);
  // Default servings is 1 portion (for automatic scaling in meal planner)
  const [defaultServings, setDefaultServings] = useState(recipe?.defaultServings ?? 1);
  const [description, setDescription] = useState(recipe?.description || '');
  const [instructions, setInstructions] = useState(recipe?.instructions || '');
  const [imageUrl, setImageUrl] = useState<string>(recipe?.imageUrl || '');
  const [ingredients, setIngredients] = useState<EditableIngredient[]>(
    recipe?.ingredients && recipe.ingredients.length > 0
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

  // Database Ingredients & Catalogs
  const [dbIngredients, setDbIngredients] = useState<DbIngredient[]>([]);
  const [showDbPickerModal, setShowDbPickerModal] = useState<boolean>(false);
  const [dbSearchTerm, setDbSearchTerm] = useState<string>('');
  const [dbSelectedCategory, setDbSelectedCategory] = useState<string>('ALLE');
  const [addedDbIds, setAddedDbIds] = useState<string[]>([]);

  // Inline autocomplete state for ingredient rows
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const loadData = async () => {
      try {
        const [cats, ings] = await Promise.all([
          api.food.categories().catch(() => []),
          api.food.ingredients().catch(() => []),
        ]);
        const names = cats.map((c: any) => c.name);
        if (recipe?.category && !names.includes(recipe.category)) {
          names.unshift(recipe.category);
        }
        setDbCategories(names);
        setDbIngredients(ings || []);
      } catch (e) {
        console.error('Fehler beim Laden der Stammdaten:', e);
      }
    };
    loadData();

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [recipe?.category]);

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

  const handleAddIngredient = (preset?: Partial<EditableIngredient>) => {
    setIngredients((prev) => [
      ...prev,
      {
        name: preset?.name || '',
        amount: preset?.amount !== undefined ? preset.amount : 100,
        unit: preset?.unit || 'g',
        notes: preset?.notes || '',
        ingredientId: preset?.ingredientId,
      },
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

  const selectDbIngredientForRow = (index: number, dbIng: DbIngredient) => {
    setIngredients((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              name: dbIng.name,
              unit: dbIng.standardUnit || item.unit || 'g',
              ingredientId: dbIng.id,
            }
          : item
      )
    );
    setActiveSuggestionIndex(null);
  };

  const handlePickFromCatalog = (dbIng: DbIngredient) => {
    // If there is an empty row, fill it; otherwise append a new row
    setIngredients((prev) => {
      const emptyIdx = prev.findIndex((item) => !item.name.trim());
      if (emptyIdx !== -1) {
        return prev.map((item, i) =>
          i === emptyIdx
            ? {
                ...item,
                name: dbIng.name,
                amount: item.amount || 100,
                unit: dbIng.standardUnit || 'g',
                ingredientId: dbIng.id,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          name: dbIng.name,
          amount: 100,
          unit: dbIng.standardUnit || 'g',
          notes: '',
          ingredientId: dbIng.id,
        },
      ];
    });

    setAddedDbIds((prev) => [...prev, dbIng.id]);
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

      // Filter and clean ingredients
      const cleanedIngredients = ingredients
        .filter((ing) => ing.name.trim() && Number(ing.amount) > 0)
        .map((ing) => {
          // If not explicitly set, check if name matches a database ingredient
          const matchedDb = ing.ingredientId
            ? null
            : dbIngredients.find(
                (d) => d.name.toLowerCase() === ing.name.trim().toLowerCase()
              );

          return {
            ingredientId: ing.ingredientId || matchedDb?.id,
            name: ing.name.trim(),
            amount: Number(ing.amount),
            unit: ing.unit.trim() || 'g',
            notes: ing.notes?.trim() || undefined,
          };
        });

      const payload = {
        title: title.trim(),
        category,
        description: description.trim() || null,
        instructions: instructions.trim() || null,
        prepTimeMinutes: Number(prepTimeMinutes) || 30,
        defaultServings: Number(defaultServings) || 1,
        imageUrl: imageUrl.trim() || null,
        ingredients: cleanedIngredients,
      };

      if (isNew) {
        const created = await api.food.createRecipe(payload);
        onSaved(created);
      } else {
        const updated = await api.food.updateRecipe(recipe.id, payload);
        onSaved(updated);
      }
      onClose();
    } catch (err: any) {
      console.error('Fehler beim Speichern des Rezepts:', err);
      setErrorMessage(err.message || 'Fehler beim Speichern des Rezepts.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered ingredients for the database picker modal
  const dbPickerCategories = ['ALLE', ...Array.from(new Set(dbIngredients.map((i) => i.category || 'Sonstiges')))];
  const filteredDbIngredients = dbIngredients.filter((ing) => {
    const matchSearch =
      !dbSearchTerm.trim() ||
      ing.name.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
      (ing.category && ing.category.toLowerCase().includes(dbSearchTerm.toLowerCase()));
    const matchCat = dbSelectedCategory === 'ALLE' || ing.category === dbSelectedCategory;
    return matchSearch && matchCat;
  });

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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-semibold text-white">
                {isNew ? 'Neues Rezept anlegen' : 'Rezept bearbeiten'}
              </h2>
              <p className="text-xs text-slate-400">
                {isNew
                  ? 'Erstelle ein neues Gericht mit Zutaten und Zubereitung für deine WG'
                  : 'Passe Titel, Bild, Zutaten und Zubereitung an'}
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

          {/* 1. Basisdaten: Titel & Kategorie */}
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
                placeholder="z. B. Spaghetti Bolognese, Gemüseauflauf..."
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Rezeptart / Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-theme-primary cursor-pointer"
              >
                {(dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat} className="bg-surface-card text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Kennzahlen: Kochzeit & Basis-Portionen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-theme-primary" />
                  Basis-Portionen
                </span>
                <span className="text-[10px] text-amber-300 font-medium bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full">
                  Standard: 1 Portion
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={defaultServings}
                  onChange={(e) => setDefaultServings(Number(e.target.value) || 1)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-theme-primary"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 pointer-events-none font-medium">
                  {defaultServings === 1 ? 'Portion (1 Person)' : 'Portionen'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Rezeptbild (Foto hochladen oder URL) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-theme-primary" />
                Rezeptbild (Foto oder Bild-URL)
              </span>
              {imageUrl && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" /> Foto hinterlegt
                </span>
              )}
            </label>

            <div className="bg-surface-elevated/50 border border-surface-border rounded-2xl p-4 space-y-3">
              {/* Photo Preview Banner */}
              {imageUrl ? (
                <div className="relative w-full aspect-video sm:h-52 rounded-2xl overflow-hidden border border-surface-border bg-black/60 shadow-inner group">
                  <img
                    src={imageUrl}
                    alt="Rezeptvorschau"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                    <span className="text-xs text-white font-medium drop-shadow-md">
                      Aktuelles Rezeptfoto
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Anderes Foto wählen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-3 py-1.5 bg-rose-500/80 hover:bg-rose-500 backdrop-blur-md text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Entfernen</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 sm:h-36 rounded-2xl border-2 border-dashed border-surface-border hover:border-theme-primary/50 bg-surface-card/60 hover:bg-surface-elevated flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white transition-all cursor-pointer select-none group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-surface-elevated group-hover:bg-theme-primary/20 group-hover:text-theme-primary flex items-center justify-center transition-colors">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold block text-slate-200 group-hover:text-white">
                      Foto hochladen oder aufnehmen
                    </span>
                    <span className="text-[11px] text-slate-500">
                      PNG, JPG oder WebP (wird automatisch für Mobilgeräte optimiert)
                    </span>
                  </div>
                </div>
              )}

              {/* Upload Controls & URL input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
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
                  className="px-3.5 py-2 bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <Camera className="w-4 h-4 text-theme-primary" />
                  <span>Foto auswählen</span>
                </button>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={imageUrl.startsWith('data:') ? '(Lokales Foto ausgewählt)' : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Oder Bild-URL einfügen (https://...)"
                    className="w-full bg-surface-card border border-surface-border rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Bild entfernen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Zutatenliste mit DB-Auswahl & 1-Portion-Hinweis */}
          <div className="space-y-3 pt-2 border-t border-surface-border">
            {/* Wichtiger Hinweis für 1-Portions-Mengen */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 shadow-xs">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <strong className="text-white font-semibold block mb-0.5">
                  Zutatenmengen bitte als Basis für 1 Portion angeben:
                </strong>
                Trage alle Zutatenmengen für <strong>eine einzelne Portion (1 Person)</strong> ein. In der wöchentlichen Kochplanung wird die Einkaufs- und Mengenkalkulation über die Portions-Buttons (+ / −) automatisch auf die gewünschte Personenzahl der WG hochgerechnet.
              </div>
            </div>

            {/* Action Bar for Ingredients */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-theme-primary" />
                <span>Zutaten ({ingredients.length})</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDbSearchTerm('');
                    setDbSelectedCategory('ALLE');
                    setShowDbPickerModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aus Lebensmittel-Katalog wählen</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddIngredient()}
                  className="px-3 py-1.5 bg-theme-primary/10 hover:bg-theme-primary/20 border border-theme-primary/30 text-theme-primary text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Zutat hinzufügen</span>
                </button>
              </div>
            </div>

            {/* Ingredients Rows */}
            <div className="space-y-2">
              {ingredients.map((item, index) => {
                const isLinked = Boolean(
                  item.ingredientId ||
                  dbIngredients.some(
                    (d) => d.name.toLowerCase() === item.name.trim().toLowerCase()
                  )
                );

                const currentQuery = item.name.toLowerCase().trim();
                const suggestions =
                  currentQuery.length > 0 && activeSuggestionIndex === index
                    ? dbIngredients
                        .filter((d) => d.name.toLowerCase().includes(currentQuery))
                        .slice(0, 6)
                    : [];

                return (
                  <div
                    key={index}
                    className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-surface-elevated/60 border border-surface-border p-2.5 rounded-2xl group/row hover:border-slate-600 transition-colors"
                  >
                    {/* Name with Autocomplete */}
                    <div className="relative flex-1 min-w-[140px]">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onFocus={() => setActiveSuggestionIndex(index)}
                          onChange={(e) => {
                            handleIngredientChange(index, 'name', e.target.value);
                            setActiveSuggestionIndex(index);
                          }}
                          placeholder="Zutat (z. B. Spaghetti, Hackfleisch...)"
                          className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary pr-8"
                        />
                        {isLinked && (
                          <div
                            className="absolute right-2.5 text-emerald-400"
                            title="Mit Lebensmittel-Katalog der Datenbank verknüpft"
                          >
                            <Database className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Dropdown Suggestions */}
                      {suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface-card border border-surface-border rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-surface-border max-h-48 overflow-y-auto">
                          <div className="p-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-surface-elevated flex items-center gap-1">
                            <Database className="w-3 h-3 text-emerald-400" />
                            <span>Vorschläge aus Lebensmittel-Katalog:</span>
                          </div>
                          {suggestions.map((sug) => (
                            <button
                              key={sug.id}
                              type="button"
                              onClick={() => selectDbIngredientForRow(index, sug)}
                              className="w-full text-left p-2 hover:bg-surface-elevated flex items-center justify-between text-xs text-slate-200 hover:text-white transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{sug.name}</span>
                                {sug.category && (
                                  <span className="text-[10px] text-slate-400 bg-surface-card px-1.5 py-0.5 rounded border border-surface-border">
                                    {sug.category}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-slate-400">
                                {sug.standardUnit || 'g'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Menge */}
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        value={item.amount}
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                        placeholder="Menge"
                        className="w-20 sm:w-24 bg-surface-card border border-surface-border rounded-xl px-2 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-theme-primary"
                        title="Menge für 1 Portion"
                      />

                      {/* Einheit */}
                      <input
                        type="text"
                        list={`units-${index}`}
                        value={item.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        placeholder="Einheit"
                        className="w-20 sm:w-24 bg-surface-card border border-surface-border rounded-xl px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-theme-primary"
                      />
                      <datalist id={`units-${index}`}>
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u} />
                        ))}
                      </datalist>

                      {/* Notiz / Hinweis */}
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleIngredientChange(index, 'notes', e.target.value)}
                        placeholder="Notiz (optional)"
                        className="hidden md:block w-32 bg-surface-card border border-surface-border rounded-xl px-2.5 py-2 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-theme-primary"
                      />

                      {/* Delete Row Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-surface-card hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-surface-border shrink-0"
                        title="Zutat entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Kurzbeschreibung & Zubereitungsschritte */}
          <div className="space-y-4 pt-2 border-t border-surface-border">
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-theme-primary" />
                Zubereitungsschritte
              </label>
              <textarea
                rows={5}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="1. Zwiebeln und Knoblauch fein würfeln...&#10;2. Hackfleisch scharf anbraten...&#10;3. Mit Tomaten ablöschen und 20 Min. köcheln lassen."
                className="w-full bg-surface-elevated border border-surface-border rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-theme-primary resize-y leading-relaxed font-sans"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-border bg-surface-elevated/60 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 bg-surface-card hover:bg-surface-elevated border border-surface-border text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="btn-theme-gradient px-6 py-2.5 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Wird gespeichert...' : isNew ? 'Rezept erstellen' : 'Änderungen speichern'}</span>
          </button>
        </div>
      </div>

      {/* Database Ingredient Picker Modal */}
      {showDbPickerModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-surface-card rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] flex flex-col border border-surface-border shadow-2xl overflow-hidden">
            {/* Picker Header */}
            <div className="p-5 border-b border-surface-border bg-surface-elevated/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Lebensmittel-Katalog
                  </h3>
                  <p className="text-xs text-slate-400">
                    Klicke auf eine Zutat, um sie direkt zu deinem Rezept hinzuzufügen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDbPickerModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-surface-card rounded-xl border border-surface-border cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Categories Filter */}
            <div className="p-4 border-b border-surface-border space-y-3 bg-surface-elevated/20">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={dbSearchTerm}
                  onChange={(e) => setDbSearchTerm(e.target.value)}
                  placeholder="Lebensmittel durchsuchen (z. B. Kartoffeln, Milch, Nudeln)..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-theme-primary"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
                {dbPickerCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDbSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      dbSelectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-surface-elevated text-slate-300 hover:bg-surface-card hover:text-white border border-surface-border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients Grid / List */}
            <div className="overflow-y-auto p-4 flex-1 divide-y divide-surface-border/50">
              {filteredDbIngredients.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                  <p>Keine Lebensmittel für diese Suche gefunden.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredDbIngredients.map((dbIng) => {
                    const alreadyInRecipe = ingredients.some(
                      (item) =>
                        item.ingredientId === dbIng.id ||
                        item.name.toLowerCase().trim() === dbIng.name.toLowerCase().trim()
                    );
                    const wasJustAdded = addedDbIds.includes(dbIng.id);

                    return (
                      <button
                        key={dbIng.id}
                        type="button"
                        onClick={() => handlePickFromCatalog(dbIng)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                          alreadyInRecipe || wasJustAdded
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                            : 'bg-surface-elevated/40 border-surface-border hover:bg-surface-elevated hover:border-slate-500 text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                              {dbIng.name}
                            </span>
                            {dbIng.category && (
                              <span className="text-[10px] text-slate-400 bg-surface-card px-1.5 py-0.2 rounded border border-surface-border shrink-0">
                                {dbIng.category}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Einheit: {dbIng.standardUnit || 'g'}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {alreadyInRecipe || wasJustAdded ? (
                            <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-xl bg-surface-card group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center text-xs font-bold transition-colors border border-surface-border">
                              <Plus className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Picker Footer */}
            <div className="p-4 border-t border-surface-border bg-surface-elevated/60 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                {ingredients.filter((i) => i.name.trim()).length} Zutaten im Rezept
              </span>
              <button
                type="button"
                onClick={() => setShowDbPickerModal(false)}
                className="btn-theme-gradient px-5 py-2 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                Fertig & Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
