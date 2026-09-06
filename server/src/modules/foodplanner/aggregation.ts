import { prisma } from '../../db.js';
import { ConsolidatedShoppingItem } from '../../../../shared/types.js';

export async function aggregateWeeklyShoppingList(
  locationId: string,
  year: number,
  weekNumber: number
) {
  // 1. Get location with default supermarket
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { defaultSupermarket: true },
  });

  if (!location) {
    throw new Error('Standort nicht gefunden');
  }

  const supermarketId = location.defaultSupermarketId || 'supermarket-netto';

  // 2. Get meal plan with days and recipes
  const mealPlan = await prisma.mealPlan.findUnique({
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
                include: {
                  ingredient: {
                    include: {
                      prices: {
                        where: { supermarketId },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // 3. Get check states for this week
  const checkedStates = await prisma.shoppingListItemState.findMany({
    where: {
      locationId,
      year,
      weekNumber,
    },
  });
  const checkMap = new Map<string, { isChecked: boolean; checkedByUserId?: string | null }>();
  for (const s of checkedStates) {
    checkMap.set(s.ingredientId, { isChecked: s.isChecked, checkedByUserId: s.checkedByUserId });
  }

  // 4. Aggregate ingredients from recipes across all days
  const aggregated = new Map<
    string,
    {
      ingredientId: string;
      name: string;
      category: string;
      unit: string;
      totalAmount: number;
      pricePerUnit?: number;
      priceUnitSize?: number;
    }
  >();

  if (mealPlan) {
    for (const day of mealPlan.days) {
      if (!day.recipe) continue;

      const plannedServings = day.servings || location.defaultServings || 4;
      const baseServings = day.recipe.defaultServings || 4;
      const scaleFactor = plannedServings / baseServings;

      for (const item of day.recipe.ingredients) {
        const scaledAmount = Math.round(item.amount * scaleFactor * 10) / 10;
        const ing = item.ingredient;
        const priceInfo = ing.prices[0];

        if (!aggregated.has(ing.id)) {
          aggregated.set(ing.id, {
            ingredientId: ing.id,
            name: ing.name,
            category: ing.category,
            unit: item.unit || ing.standardUnit,
            totalAmount: scaledAmount,
            pricePerUnit: priceInfo?.pricePerUnit,
            priceUnitSize: priceInfo?.unitSize,
          });
        } else {
          const current = aggregated.get(ing.id)!;
          current.totalAmount = Math.round((current.totalAmount + scaledAmount) * 10) / 10;
        }
      }
    }
  }

  // 5. Convert to ConsolidatedShoppingItem with price estimate
  let totalEstimatedCost = 0;
  const items: ConsolidatedShoppingItem[] = [];

  for (const val of aggregated.values()) {
    let estimatedPrice: number | null = null;
    if (val.pricePerUnit && val.priceUnitSize) {
      // Calculate units needed (e.g. 1000g / 500g unit size = 2 packs)
      const unitsNeeded = Math.ceil(val.totalAmount / val.priceUnitSize);
      estimatedPrice = Math.round(unitsNeeded * val.pricePerUnit * 100) / 100;
      totalEstimatedCost += estimatedPrice;
    }

    const checkInfo = checkMap.get(val.ingredientId);

    items.push({
      ingredientId: val.ingredientId,
      name: val.name,
      category: val.category,
      totalAmount: val.totalAmount,
      unit: val.unit,
      estimatedPrice,
      isChecked: checkInfo?.isChecked || false,
      checkedBy: checkInfo?.checkedByUserId || null,
    });
  }

  // Sort items by category and name
  items.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  // 6. Get custom shopping items
  const customItems = await prisma.customShoppingItem.findMany({
    where: {
      locationId,
      year,
      weekNumber,
    },
    orderBy: { createdAt: 'asc' },
  });

  return {
    locationId,
    year,
    weekNumber,
    supermarketName: location.defaultSupermarket?.name || 'Netto Marken-Discount',
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    items,
    customItems,
  };
}
