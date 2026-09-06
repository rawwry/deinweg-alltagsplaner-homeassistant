export type UserRole = 'ADMIN' | 'BETREUER' | 'BEWOHNER';

export interface UserSummary {
  id: string;
  username: string;
  email?: string | null;
  name: string;
  role: UserRole;
  locationId?: string | null;
  locationName?: string | null;
  avatarColor?: string | null;
}

export interface SetupStatusResponse {
  setupRequired: boolean;
  userCount: number;
}

export interface SmtpSettingSummary {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  hasPassword: boolean;
  fromEmail: string;
  fromName: string;
  configured?: boolean;
}

export interface LocationSummary {
  id: string;
  name: string;
  address?: string | null;
  defaultSupermarketId?: string | null;
  defaultServings: number;
  residentCount?: number;
}

export interface SupermarketItem {
  id: string;
  name: string;
  isGlobal: boolean;
}

export interface IngredientSummary {
  id: string;
  name: string;
  category: string;
  standardUnit: string;
  pricePerUnit?: number;
  priceUnitSize?: number;
  supermarketId?: string;
}

export interface RecipeIngredientSummary {
  id: string;
  ingredientId: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  notes?: string | null;
}

export interface RecipeSummary {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  category: string;
  defaultServings: number;
  prepTimeMinutes?: number | null;
  imageUrl?: string | null;
  ingredients: RecipeIngredientSummary[];
}

export interface MealPlanDaySummary {
  id: string;
  dayOfWeek: number; // 1 = Montag ... 7 = Sonntag
  recipeId?: string | null;
  recipe?: RecipeSummary | null;
  customDishTitle?: string | null;
  servings: number;
  cookUserId?: string | null;
  cookName?: string | null;
}

export interface MealPlanSummary {
  id: string;
  locationId: string;
  year: number;
  weekNumber: number;
  notes?: string | null;
  days: MealPlanDaySummary[];
}

export interface ConsolidatedShoppingItem {
  ingredientId: string;
  name: string;
  category: string;
  totalAmount: number;
  unit: string;
  estimatedPrice?: number | null;
  isChecked: boolean;
  checkedBy?: string | null;
}

export interface CustomShoppingItemSummary {
  id: string;
  name: string;
  amount?: number | null;
  unit?: string | null;
  category: string;
  isChecked: boolean;
}

export interface CaregiverNoteSummary {
  id: string;
  locationId: string;
  locationName?: string;
  residentId: string;
  residentName: string;
  title: string;
  content: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  isArchived: boolean;
  caregiverResponse?: string | null;
  respondedByName?: string | null;
  respondedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export type WasteType = 'REST' | 'BIO' | 'PAPER' | 'YELLOW';

export interface WastePickupSummary {
  id: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  wasteType: WasteType;
  notes?: string | null;
}
