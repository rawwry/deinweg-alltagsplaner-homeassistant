import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
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
  const { user, isLoading, isSetupRequired, handleSetupComplete, activeLocation } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('hub');
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<RecipeSummary | null>(null);
  const isStaff = user?.role === 'ADMIN' || user?.role === 'BETREUER';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0b10] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 max-w-sm mx-auto bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex justify-center mb-4 relative z-10">
          <img src={logoImg} alt="Dein Weg" className="h-12 w-auto object-contain animate-pulse drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]" />
        </div>
        <div className="text-sm font-medium text-rose-200/90 relative z-10 font-sans tracking-wide">
          Deine WG: Alltagsplaner wird geladen...
        </div>
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
    <div className="h-screen h-[100dvh] bg-[#0c0b10] text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Top Header */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-h-0 overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <DesktopNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-0 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">
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
          </div>

          {/* Footer at end of page content (not pinned/sticky) */}
          <Footer />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Global Recipe Detail Modal if invoked */}
      {selectedRecipeDetail && (
        <RecipeModal
          recipe={selectedRecipeDetail}
          defaultServings={activeLocation?.defaultServings || 6}
          isStaff={isStaff}
          onRecipeUpdated={(updated) => setSelectedRecipeDetail(updated)}
          onClose={() => setSelectedRecipeDetail(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
