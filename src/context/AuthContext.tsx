import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoading: boolean;
  switchRole: (role: Role) => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateTasteProfile: (profile: Partial<User['tasteProfile']>) => Promise<void>;
  refreshUser: () => Promise<void>;
  reservationsCount: number;
  setReservationsCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reservationsCount, setReservationsCount] = useState(1);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
      const reservations = await api.getMyReservations();
      setReservationsCount(reservations.length);
    } catch (err) {
      console.error('Failed to load user session', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const loggedUser = await api.login(credentials);
      setUser(loggedUser);
      const reservations = await api.getMyReservations();
      setReservationsCount(reservations.length);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.logout();
      // Default to guest demo user or refresh
      await fetchUser();
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (targetRole: Role) => {
    try {
      setIsLoading(true);
      const switchedUser = await api.switchDemoUser(targetRole);
      setUser(switchedUser);
      const reservations = await api.getMyReservations();
      setReservationsCount(reservations.length);
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTasteProfile = async (profile: Partial<User['tasteProfile']>) => {
    try {
      const updatedUser = await api.updateTasteProfile(profile);
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to update taste profile', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'customer',
        isLoading,
        switchRole,
        login,
        logout,
        updateTasteProfile,
        refreshUser: fetchUser,
        reservationsCount,
        setReservationsCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
