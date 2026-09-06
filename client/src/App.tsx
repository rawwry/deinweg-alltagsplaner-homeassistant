import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LoginView } from './components/LoginView.js';
import { InitialSetupView } from './components/InitialSetupView.js';
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
import { Footer } from './components/layout/Footer.js';
import { api } from './api/client.js';
import { RecipeSummary } from '../../shared/types.js';
import logoImg from './assets/logo.png';

const AppContent: React.FC = () => {
  const { user, isLoading, isSetupRequired, handleSetupComplete } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('hub');
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<RecipeSummary | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex justify-center mb-4">
          <img src={logoImg} alt="Dein Weg" className="h-10 sm:h-12 w-auto object-contain animate-pulse" />
        </div>
        <div className="text-sm font-semibold text-slate-300">Dein Weg Alltagsplaner wird geladen...</div>
      </div>
    );
  }

  if (isSetupRequired) {
    return <InitialSetupView onComplete={handleSetupComplete} />;
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
    <div className="h-screen h-[100dvh] bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-h-0 overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <DesktopNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-0 overflow-y-auto">
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

      {/* Modern Footer with Copyright & Links (Always visible) */}
      <Footer />

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
