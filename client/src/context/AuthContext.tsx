import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, setStoredToken } from '../api/client.js';
import { UserSummary, LocationSummary } from '../../../shared/types.js';

interface AuthContextType {
  user: UserSummary | null;
  isLoading: boolean;
  isSetupRequired: boolean;
  activeLocationId: string;
  locations: LocationSummary[];
  activeLocation: LocationSummary | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  handleSetupComplete: (user: UserSummary, token: string) => Promise<void>;
  logout: () => void;
  setActiveLocationId: (locationId: string) => void;
  refreshLocations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [activeLocationId, setActiveLocationIdState] = useState<string>('');

  const initAuth = async () => {
    try {
      // 1. Check if first-run setup is required
      const status = await api.auth.setupStatus();
      if (status.setupRequired) {
        setIsSetupRequired(true);
        setIsLoading(false);
        return;
      }

      setIsSetupRequired(false);

      // 2. If token exists, fetch current user
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { user: userData } = await api.auth.me();
      setUser(userData);

      const locs = await api.locations.list();
      setLocations(locs);

      // Set initial active location
      if (userData.role === 'BEWOHNER') {
        if (userData.locationId) {
          setActiveLocationIdState(userData.locationId);
        }
      } else {
        const savedLoc = localStorage.getItem('deinweg_active_location');
        if (savedLoc && locs.some((l: LocationSummary) => l.id === savedLoc)) {
          setActiveLocationIdState(savedLoc);
        } else if (locs.length > 0) {
          setActiveLocationIdState(locs[0].id);
        }
      }
    } catch (err) {
      console.error('Fehler bei Initialisierung:', err);
      setStoredToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = async (newUser: UserSummary, token: string) => {
    setStoredToken(token);
    setUser(newUser);
    setIsSetupRequired(false);
    try {
      const locs = await api.locations.list();
      setLocations(locs);
      if (locs.length > 0) {
        setActiveLocationIdState(locs[0].id);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Standorte nach Setup:', err);
    }
  };

  useEffect(() => {
    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
    const res = await api.auth.login({ username, password, rememberMe });
    setStoredToken(res.token);
    setUser(res.user);

    const locs = await api.locations.list();
    setLocations(locs);

    if (res.user.role === 'BEWOHNER' && res.user.locationId) {
      setActiveLocationIdState(res.user.locationId);
    } else if (locs.length > 0) {
      const targetLoc = locs.find((l: LocationSummary) => l.id === res.user.locationId) || locs[0];
      setActiveLocationIdState(targetLoc.id);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const setActiveLocationId = (id: string) => {
    if (user?.role === 'BEWOHNER') return; // Resident cannot switch
    setActiveLocationIdState(id);
    localStorage.setItem('deinweg_active_location', id);
  };

  const refreshLocations = async () => {
    try {
      const locs = await api.locations.list();
      setLocations(locs);
    } catch (err) {
      console.error('Fehler beim Neuladen der Standorte:', err);
    }
  };

  const activeLocation = locations.find((l) => l.id === activeLocationId) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSetupRequired,
        activeLocationId,
        locations,
        activeLocation,
        login,
        handleSetupComplete,
        logout,
        setActiveLocationId,
        refreshLocations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  }
  return context;
};
