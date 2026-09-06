import { Router, Request, Response } from 'express';
import { prisma } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole, enforceLocationAccess } from '../../middleware/rbac.js';
import { aggregateWeeklyShoppingList } from './aggregation.js';

const router = Router();

// Helper to determine target location for a request
function resolveLocationId(req: Request): string | null {
  const queryLoc = (req.query.locationId as string) || (req.body.locationId as string);
  if (req.user?.role === 'BEWOHNER') {
    if (queryLoc && queryLoc !== req.user.locationId) {
      return null; // Resident attempted to access another location!
    }
    return req.user.locationId || 'location-emsdetten';
  }
  return queryLoc || req.user?.locationId || 'location-emsdetten';
}

// ==================== REZEPTE ====================

router.get('/recipes', requireAuth, async (_req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { isArchived: false },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
      orderBy: { title: 'asc' },
    });

    const formatted = recipes.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      instructions: r.instructions,
      category: r.category,
      defaultServings: r.defaultServings,
      prepTimeMinutes: r.prepTimeMinutes,
      imageUrl: r.imageUrl,
      ingredients: r.ingredients.map((ri) => ({
        id: ri.id,
        ingredientId: ri.ingredientId,
        name: ri.ingredient.name,
        amount: ri.amount,
        unit: ri.unit,
        category: ri.ingredient.category,
        notes: ri.notes,
      })),
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden der Rezepte:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Rezepte.' });
  }
});

router.get('/recipes/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Rezept nicht gefunden.' });
    }

    return res.json({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      category: recipe.category,
      defaultServings: recipe.defaultServings,
      prepTimeMinutes: recipe.prepTimeMinutes,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients.map((ri) => ({
        id: ri.id,
        ingredientId: ri.ingredientId,
        name: ri.ingredient.name,
        amount: ri.amount,
        unit: ri.unit,
        category: ri.ingredient.category,
        notes: ri.notes,
      })),
    });
  } catch (err) {
    console.error('Fehler beim Laden des Rezepts:', err);
    return res.status(500).json({ error: 'Fehler beim Laden des Rezepts.' });
  }
});

router.post('/recipes', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { title, description, instructions, category, defaultServings, prepTimeMinutes, imageUrl, ingredients } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Titel ist erforderlich.' });
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        instructions,
        category: category || 'Alltagsküche',
        defaultServings: Number(defaultServings) || 4,
        prepTimeMinutes: Number(prepTimeMinutes) || 30,
        imageUrl,
      },
    });

    if (Array.isArray(ingredients)) {
      for (const item of ingredients) {
        if (!item.ingredientId || !item.amount) continue;
        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            ingredientId: item.ingredientId,
            amount: Number(item.amount),
            unit: item.unit || 'g',
            notes: item.notes,
          },
        });
      }
    }

    return res.json(recipe);
  } catch (err) {
    console.error('Fehler beim Erstellen des Rezepts:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen des Rezepts.' });
  }
});

router.put('/recipes/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, instructions, category, defaultServings, prepTimeMinutes, imageUrl, ingredients } = req.body;

    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        title,
        description,
        instructions,
        category,
        defaultServings: Number(defaultServings),
        prepTimeMinutes: Number(prepTimeMinutes),
        imageUrl,
      },
    });

    if (Array.isArray(ingredients)) {
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
      for (const item of ingredients) {
        if (!item.ingredientId || !item.amount) continue;
        await prisma.recipeIngredient.create({
          data: {
            recipeId: id,
            ingredientId: item.ingredientId,
            amount: Number(item.amount),
            unit: item.unit || 'g',
            notes: item.notes,
          },
        });
      }
    }

    return res.json(recipe);
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Rezepts:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren des Rezepts.' });
  }
});

router.delete('/recipes/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      return res.status(404).json({ error: 'Rezept nicht gefunden.' });
    }

    // Delete recipe - RecipeIngredients cascade, MealPlanDays set recipeId to null
    await prisma.recipe.delete({ where: { id } });
    return res.json({ success: true, message: `Rezept "${recipe.title}" erfolgreich gelöscht.` });
  } catch (err) {
    console.error('Fehler beim Löschen des Rezepts:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen des Rezepts.' });
  }
});

// ==================== ZUTATEN & SUPERMÄRKTE ====================

router.get('/ingredients', requireAuth, async (req: Request, res: Response) => {
  try {
    const supermarketId = (req.query.supermarketId as string) || 'supermarket-netto';

    const ingredients = await prisma.ingredient.findMany({
      include: {
        prices: {
          where: { supermarketId },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      standardUnit: i.standardUnit,
      pricePerUnit: i.prices[0]?.pricePerUnit,
      priceUnitSize: i.prices[0]?.unitSize,
      supermarketId,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Fehler beim Laden der Zutaten:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Zutaten.' });
  }
});

router.post('/ingredients', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { name, category, standardUnit, pricePerUnit, unitSize, supermarketId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name der Zutat ist erforderlich.' });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        category: category || 'Sonstiges',
        standardUnit: standardUnit || 'g',
      },
    });

    if (pricePerUnit && supermarketId) {
      await prisma.ingredientPrice.create({
        data: {
          ingredientId: ingredient.id,
          supermarketId,
          pricePerUnit: Number(pricePerUnit),
          unitSize: Number(unitSize) || 1,
          unit: standardUnit || 'Stück',
        },
      });
    }

    return res.json(ingredient);
  } catch (err) {
    console.error('Fehler beim Erstellen der Zutat:', err);
    return res.status(500).json({ error: 'Fehler beim Erstellen der Zutat.' });
  }
});

router.put('/ingredients/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, standardUnit, pricePerUnit, unitSize, supermarketId } = req.body;

    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Zutat nicht gefunden.' });
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        category: category || undefined,
        standardUnit: standardUnit || undefined,
      },
    });

    if (supermarketId && pricePerUnit !== undefined && pricePerUnit !== null && pricePerUnit !== '') {
      await prisma.ingredientPrice.upsert({
        where: {
          ingredientId_supermarketId: {
            ingredientId: id,
            supermarketId,
          },
        },
        update: {
          pricePerUnit: Number(pricePerUnit),
          unitSize: Number(unitSize) || 1,
          unit: standardUnit || existing.standardUnit || 'Stück',
        },
        create: {
          ingredientId: id,
          supermarketId,
          pricePerUnit: Number(pricePerUnit),
          unitSize: Number(unitSize) || 1,
          unit: standardUnit || existing.standardUnit || 'Stück',
        },
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Zutat:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren der Zutat.' });
  }
});

router.delete('/ingredients/:id', requireAuth, requireRole('ADMIN', 'BETREUER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Zutat nicht gefunden.' });
    }

    await prisma.ingredient.delete({ where: { id } });
    return res.json({ success: true, message: 'Zutat erfolgreich gelöscht.' });
  } catch (err) {
    console.error('Fehler beim Löschen der Zutat:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen der Zutat.' });
  }
});

router.post('/ingredients/clear-all', requireAuth, requireRole('ADMIN', 'BETREUER'), async (_req: Request, res: Response) => {
  try {
    await prisma.ingredientPrice.deleteMany({});
    await prisma.recipeIngredient.deleteMany({});
    const count = await prisma.ingredient.deleteMany({});
    return res.json({ success: true, message: `${count.count} Zutaten erfolgreich gelöscht.` });
  } catch (err) {
    console.error('Fehler beim Leeren des Zutatenkatalogs:', err);
    return res.status(500).json({ error: 'Fehler beim Leeren des Zutatenkatalogs.' });
  }
});

router.get('/supermarkets', requireAuth, async (_req: Request, res: Response) => {
  try {
    const markets = await prisma.supermarket.findMany({ orderBy: { name: 'asc' } });
    return res.json(markets);
  } catch (err) {
    console.error('Fehler beim Laden der Supermärkte:', err);
    return res.status(500).json({ error: 'Fehler beim Laden der Supermärkte.' });
  }
});

// ==================== WOCHENPLANER (MEAL PLAN) ====================

router.get('/mealplan', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    if (!locationId) {
      return res.status(403).json({ error: 'Zugriff auf fremden Standort verweigert.' });
    }

    const year = Number(req.query.year) || new Date().getFullYear();
    const weekNumber = Number(req.query.weekNumber) || 36;

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) {
      return res.status(404).json({ error: 'Standort nicht gefunden.' });
    }

    let mealPlan = await prisma.mealPlan.findUnique({
      where: {
        locationId_year_weekNumber: {
          locationId,
          year,
          weekNumber,
        },
      },
      include: {
        days: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: { ingredient: true },
                },
              },
            },
          },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    // Auto-create empty week if none exists yet
    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: {
          locationId,
          year,
          weekNumber,
          notes: `Wochenplan KW ${weekNumber}`,
        },
        include: {
          days: {
            include: {
              recipe: {
                include: {
                  ingredients: {
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
        },
      });

      // Create entries for days 1 to 7
      for (let day = 1; day <= 7; day++) {
        await prisma.mealPlanDay.create({
          data: {
            mealPlanId: mealPlan.id,
            dayOfWeek: day,
            servings: location.defaultServings || 6,
          },
        });
      }

      // Re-fetch created days
      mealPlan = await prisma.mealPlan.findUnique({
        where: { id: mealPlan.id },
        include: {
          days: {
            include: {
              recipe: {
                include: {
                  ingredients: {
                    include: { ingredient: true },
                  },
                },
              },
            },
            orderBy: { dayOfWeek: 'asc' },
          },
        },
      }) as any;
    }

    // Attach cook user names
    const cookIds = mealPlan!.days.map((d) => d.cookUserId).filter(Boolean) as string[];
    const cookUsers = cookIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: cookIds } }, select: { id: true, name: true } })
      : [];
    const cookMap = new Map(cookUsers.map((u) => [u.id, u.name]));

    const formattedDays = mealPlan!.days.map((d) => ({
      id: d.id,
      dayOfWeek: d.dayOfWeek,
      recipeId: d.recipeId,
      customDishTitle: d.customDishTitle,
      servings: d.servings,
      cookUserId: d.cookUserId,
      cookName: d.cookUserId ? cookMap.get(d.cookUserId) || null : null,
      recipe: d.recipe
        ? {
            id: d.recipe.id,
            title: d.recipe.title,
            description: d.recipe.description,
            category: d.recipe.category,
            defaultServings: d.recipe.defaultServings,
            prepTimeMinutes: d.recipe.prepTimeMinutes,
            imageUrl: d.recipe.imageUrl,
            ingredients: d.recipe.ingredients.map((ri) => ({
              id: ri.id,
              ingredientId: ri.ingredientId,
              name: ri.ingredient.name,
              amount: ri.amount,
              unit: ri.unit,
              category: ri.ingredient.category,
            })),
          }
        : null,
    }));

    return res.json({
      id: mealPlan!.id,
      locationId: mealPlan!.locationId,
      locationName: location.name,
      year: mealPlan!.year,
      weekNumber: mealPlan!.weekNumber,
      notes: mealPlan!.notes,
      defaultServings: location.defaultServings,
      days: formattedDays,
    });
  } catch (err) {
    console.error('Fehler beim Laden des Wochenplans:', err);
    return res.status(500).json({ error: 'Fehler beim Laden des Wochenplans.' });
  }
});

router.put('/mealplan/day', requireAuth, async (req: Request, res: Response) => {
  try {
    const { mealPlanId, dayOfWeek, recipeId, customDishTitle, servings, cookUserId } = req.body;

    if (!mealPlanId || !dayOfWeek) {
      return res.status(400).json({ error: 'mealPlanId und dayOfWeek sind erforderlich.' });
    }

    const mealPlan = await prisma.mealPlan.findUnique({ where: { id: mealPlanId } });
    if (!mealPlan) {
      return res.status(404).json({ error: 'Wochenplan nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER' && req.user!.locationId !== mealPlan.locationId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    const updated = await prisma.mealPlanDay.upsert({
      where: {
        mealPlanId_dayOfWeek: {
          mealPlanId,
          dayOfWeek: Number(dayOfWeek),
        },
      },
      update: {
        recipeId: recipeId !== undefined ? recipeId : undefined,
        customDishTitle: customDishTitle !== undefined ? customDishTitle : undefined,
        servings: servings !== undefined ? Number(servings) : undefined,
        cookUserId: cookUserId !== undefined ? cookUserId : undefined,
      },
      create: {
        mealPlanId,
        dayOfWeek: Number(dayOfWeek),
        recipeId: recipeId || null,
        customDishTitle: customDishTitle || null,
        servings: Number(servings) || 6,
        cookUserId: cookUserId || null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Wochentags:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren des Wochentags.' });
  }
});

// ==================== KONSOLIDIERTE EINKAUFSLISTE ====================

router.get('/shopping-list', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = resolveLocationId(req);
    if (!locationId) {
      return res.status(403).json({ error: 'Zugriff auf fremden Standort verweigert.' });
    }

    const year = Number(req.query.year) || new Date().getFullYear();
    const weekNumber = Number(req.query.weekNumber) || 36;

    const data = await aggregateWeeklyShoppingList(locationId, year, weekNumber);
    return res.json(data);
  } catch (err) {
    console.error('Fehler beim Aggregieren der Einkaufsliste:', err);
    return res.status(500).json({ error: 'Fehler beim Aggregieren der Einkaufsliste.' });
  }
});

router.post('/shopping-list/toggle-check', requireAuth, async (req: Request, res: Response) => {
  try {
    const { locationId, year, weekNumber, ingredientId, isChecked } = req.body;

    const locId = locationId || req.user!.locationId;
    if (req.user!.role === 'BEWOHNER' && req.user!.locationId !== locId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    const updated = await prisma.shoppingListItemState.upsert({
      where: {
        locationId_year_weekNumber_ingredientId: {
          locationId: locId,
          year: Number(year),
          weekNumber: Number(weekNumber),
          ingredientId,
        },
      },
      update: {
        isChecked: !!isChecked,
        checkedByUserId: isChecked ? req.user!.id : null,
        checkedAt: isChecked ? new Date() : null,
      },
      create: {
        locationId: locId,
        year: Number(year),
        weekNumber: Number(weekNumber),
        ingredientId,
        isChecked: !!isChecked,
        checkedByUserId: isChecked ? req.user!.id : null,
        checkedAt: isChecked ? new Date() : null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Fehler beim Umschalten des Abhak-Status:', err);
    return res.status(500).json({ error: 'Fehler beim Umschalten des Status.' });
  }
});

router.post('/shopping-list/custom-item', requireAuth, async (req: Request, res: Response) => {
  try {
    const { locationId, year, weekNumber, name, amount, unit, category } = req.body;

    const locId = locationId || req.user!.locationId;
    if (req.user!.role === 'BEWOHNER' && req.user!.locationId !== locId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name des Artikels ist erforderlich.' });
    }

    const item = await prisma.customShoppingItem.create({
      data: {
        locationId: locId,
        year: Number(year),
        weekNumber: Number(weekNumber),
        name,
        amount: amount ? Number(amount) : null,
        unit: unit || null,
        category: category || 'Sonstiges',
      },
    });

    return res.json(item);
  } catch (err) {
    console.error('Fehler beim Hinzufügen des Zusatzartikels:', err);
    return res.status(500).json({ error: 'Fehler beim Hinzufügen des Artikels.' });
  }
});

router.patch('/shopping-list/custom-item/:id/toggle', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.customShoppingItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Artikel nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER' && req.user!.locationId !== item.locationId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    const updated = await prisma.customShoppingItem.update({
      where: { id },
      data: { isChecked: !item.isChecked },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Fehler beim Abhaken des Zusatzartikels:', err);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren.' });
  }
});

router.delete('/shopping-list/custom-item/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.customShoppingItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Artikel nicht gefunden.' });
    }

    if (req.user!.role === 'BEWOHNER' && req.user!.locationId !== item.locationId) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    await prisma.customShoppingItem.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Zusatzartikels:', err);
    return res.status(500).json({ error: 'Fehler beim Löschen des Artikels.' });
  }
});

export default router;
