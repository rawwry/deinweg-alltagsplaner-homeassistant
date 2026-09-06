// API Client for Dein Weg Alltagsplaner

const TOKEN_KEY = 'deinweg_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use relative path so it works everywhere (standalone or behind proxies)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `./api/${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid
    setStoredToken(null);
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP Fehler ${response.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (body: { username: string; password: string; rememberMe?: boolean }) =>
      request<{ token: string; user: any }>('auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    setupStatus: () => request<{ setupRequired: boolean; userCount: number }>('auth/setup-status'),
    setup: (body: { username: string; name: string; email: string; password: string }) =>
      request<{ token: string; user: any }>('auth/setup', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    me: () => request<{ user: any }>('auth/me'),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  system: {
    info: () => request<{ name: string; version: string; modules: any[] }>('system/info'),
  },

  locations: {
    list: () => request<any[]>('locations'),
    create: (body: any) => request<any>('locations', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`locations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`locations/${id}`, { method: 'DELETE' }),
  },

  users: {
    list: (locationId?: string) => request<any[]>(`users${locationId ? `?locationId=${locationId}` : ''}`),
    create: (body: any) => request<any>('users', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (id: string, newPassword: string) =>
      request<{ success: boolean; message: string }>(`users/${id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      }),
  },

  admin: {
    getSmtp: () => request<any | null>('admin/smtp'),
    saveSmtp: (body: any) => request<any>('admin/smtp', { method: 'POST', body: JSON.stringify(body) }),
    testSmtp: (body: any) => request<{ success: boolean; message: string }>('admin/smtp/test', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  },

  food: {
    recipes: () => request<any[]>('food/recipes'),
    recipe: (id: string) => request<any>(`food/recipes/${id}`),
    createRecipe: (body: any) => request<any>('food/recipes', { method: 'POST', body: JSON.stringify(body) }),
    updateRecipe: (id: string, body: any) => request<any>(`food/recipes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteRecipe: (id: string) => request<{ success: boolean; message: string }>(`food/recipes/${id}`, { method: 'DELETE' }),
    ingredients: (supermarketId?: string) =>
      request<any[]>(`food/ingredients${supermarketId ? `?supermarketId=${supermarketId}` : ''}`),
    createIngredient: (body: any) => request<any>('food/ingredients', { method: 'POST', body: JSON.stringify(body) }),
    supermarkets: () => request<any[]>('food/supermarkets'),
    mealPlan: (locationId: string, year: number, weekNumber: number) =>
      request<any>(`food/mealplan?locationId=${locationId}&year=${year}&weekNumber=${weekNumber}`),
    mealplan: (locationId: string, year: number, weekNumber: number) =>
      request<any>(`food/mealplan?locationId=${locationId}&year=${year}&weekNumber=${weekNumber}`),
    updateMealPlanDay: (body: {
      mealPlanId: string;
      dayOfWeek: number;
      recipeId?: string | null;
      customDishTitle?: string | null;
      servings?: number;
      cookUserId?: string | null;
    }) => request<any>('food/mealplan/day', { method: 'PUT', body: JSON.stringify(body) }),
    shoppingList: (locationId: string, year: number, weekNumber: number) =>
      request<any>(`food/shopping-list?locationId=${locationId}&year=${year}&weekNumber=${weekNumber}`),
    toggleShoppingItem: (body: {
      locationId: string;
      year: number;
      weekNumber: number;
      ingredientId: string;
      isChecked: boolean;
    }) => request<any>('food/shopping-list/toggle-check', { method: 'POST', body: JSON.stringify(body) }),
    addCustomItem: (body: {
      locationId: string;
      year: number;
      weekNumber: number;
      name: string;
      amount?: number;
      unit?: string;
      category?: string;
    }) => request<any>('food/shopping-list/custom-item', { method: 'POST', body: JSON.stringify(body) }),
    toggleCustomItem: (id: string) => request<any>(`food/shopping-list/custom-item/${id}/toggle`, { method: 'PATCH' }),
    deleteCustomItem: (id: string) => request<any>(`food/shopping-list/custom-item/${id}`, { method: 'DELETE' }),
  },

  notes: {
    list: (locationId?: string, archived: boolean = false) =>
      request<any[]>(`notes?${locationId ? `locationId=${locationId}&` : ''}archived=${archived}`),
    countOpen: (locationId?: string) =>
      request<{ count: number }>(`notes/count-open${locationId ? `?locationId=${locationId}` : ''}`),
    create: (body: { title: string; content: string; locationId?: string }) =>
      request<any>('notes', { method: 'POST', body: JSON.stringify(body) }),
    respond: (id: string, response: string) =>
      request<any>(`notes/${id}/respond`, { method: 'POST', body: JSON.stringify({ response }) }),
    resolve: (id: string) =>
      request<any>(`notes/${id}/resolve`, { method: 'PATCH' }),
    reopen: (id: string) =>
      request<any>(`notes/${id}/reopen`, { method: 'PATCH' }),
    updateStatus: (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'DONE') =>
      request<any>(`notes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<any>(`notes/${id}`, { method: 'DELETE' }),
  },

  waste: {
    list: (locationId?: string) => request<any[]>(`waste${locationId ? `?locationId=${locationId}` : ''}`),
    create: (body: { locationId: string; date: string; wasteType: string; notes?: string }) =>
      request<any>('waste', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`waste/${id}`, { method: 'DELETE' }),
    importIcs: (locationId: string, icsContent: string) =>
      request<{ success: boolean; importedCount: number; message: string }>('waste/import-ics', {
        method: 'POST',
        body: JSON.stringify({ locationId, icsContent }),
      }),
  },
};
