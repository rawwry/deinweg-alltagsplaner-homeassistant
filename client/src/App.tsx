import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LoginView } from './components/LoginView.js';
import { Header } from './components/layout/Header.js';
import { BottomNav } from './components/layout/BottomNav.js';
import { DesktopNav } from './components/layout/DesktopNav.js';
import { DashboardHub } from './modules/hub/DashboardHub.js';
import { MealPlanView } from './modules/mealplan/MealPlanView.js';
import { ShoppingListView } from './modules/shopping/ShoppingListView.js';
import { RecipeCatalogView } from './modules/recipes/RecipeCatalogView.js';
import { CaregiverNotesView } from './modules/notes/CaregiverNotesView.js';
import { WasteCalendarView } from './modules/waste/WasteCalendarView.js';
import { AdminManagementView } from './modules/admin/AdminManagementView.js';
import { RecipeModal } from './modules/recipes/RecipeModal.js';
import { api } from './api/client.js';
import { RecipeSummary } from '../../shared/types.js';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('hub');
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<RecipeSummary | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse mb-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>
        <div className="text-sm font-semibold text-slate-700">Dein Weg Alltagsplaner wird geladen...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleOpenRecipeDetail = async (recipeId: string) => {
    try {
      const data = await api.food.recipe(recipeId);
      setSelectedRecipeDetail(data);
    } catch (err) {
      console.error('Fehler beim Öffnen des Rezepts:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <DesktopNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'hub' && <DashboardHub setCurrentTab={setCurrentTab} />}
          {currentTab === 'mealplan' && (
            <MealPlanView
              setCurrentTab={setCurrentTab}
              onOpenRecipeDetail={handleOpenRecipeDetail}
            />
          )}
          {currentTab === 'shopping' && <ShoppingListView setCurrentTab={setCurrentTab} />}
          {currentTab === 'recipes' && <RecipeCatalogView />}
          {currentTab === 'notes' && <CaregiverNotesView />}
          {currentTab === 'waste' && <WasteCalendarView />}
          {currentTab === 'admin' && <AdminManagementView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Global Recipe Detail Modal if invoked */}
      {selectedRecipeDetail && (
        <RecipeModal
          recipe={selectedRecipeDetail}
          onClose={() => setSelectedRecipeDetail(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
