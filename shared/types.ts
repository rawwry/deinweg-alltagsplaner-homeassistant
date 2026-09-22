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
  avatarUrl?: string | null;
  birthday?: string | null;
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
  residentReplyTemplateSubject?: string;
  residentReplyTemplateBody?: string;
  caregiverNotificationTemplateSubject?: string;
  caregiverNotificationTemplateBody?: string;
  configured?: boolean;
}

export interface LocationSummary {
  id: string;
  name: string;
  address?: string | null;
  defaultSupermarketId?: string | null;
  defaultSupermarketName?: string | null;
  defaultServings: number;
  cookingDays?: string | null;
  weeklyBudget?: number;
  residentCount?: number;
  residents?: {
    id: string;
    name: string;
    username: string;
    avatarColor?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
  }[];
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

export interface CaregiverNoteMessageSummary {
  id: string;
  noteId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatarColor?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export type NoteCategory = 'ALLGEMEIN' | 'ANKUENDIGUNG' | 'HINWEIS';

export interface CaregiverNoteSummary {
  id: string;
  locationId: string;
  locationName?: string;
  authorId?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  authorAvatarColor?: string | null;
  authorAvatarUrl?: string | null;
  residentId: string;
  residentName: string;
  title: string;
  content: string;
  category: NoteCategory | string;
  isPinned: boolean;
  expiresAt?: string | null;
  isExpired?: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  isArchived: boolean;
  isPrivate?: boolean;
  isDirectMessage?: boolean;
  isHiddenForMe?: boolean;
  hiddenAt?: string | null;
  hasUnreadResponse?: boolean;
  caregiverResponse?: string | null;
  respondedByName?: string | null;
  respondedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  messages?: CaregiverNoteMessageSummary[];
}

export type WasteType = 'REST' | 'BIO' | 'PAPER' | 'YELLOW';

export interface WastePickupSummary {
  id: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  wasteType: WasteType;
  notes?: string | null;
}

export interface LocationSavingsTransactionSummary {
  id: string;
  locationId: string;
  date: string;
  amount: number;
  type: 'EXPENSE' | 'DEPOSIT';
  category: string;
  purpose: string;
  recordedById?: string | null;
  createdAt: string;
}

export interface LocationBudgetSummary {
  locationId: string;
  year: number;
  weekNumber: number;
  weeklyBudget: number;
  estimatedShoppingCost: number;
  actualSpent?: number | null;
  receiptNote?: string | null;
  isConfirmed: boolean;
  effectiveSpent: number;
  remainingBudget: number;
  totalSavingsBalance: number;
  confirmedSurplusTotal: number;
  extraTransactionsTotal: number;
  recentTransactions: LocationSavingsTransactionSummary[];
}

