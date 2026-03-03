import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      hotelData: null,
      isAuthenticated: false,
      login: (userData, hotelData = null) => {
        set({ user: userData, hotelData: hotelData, isAuthenticated: true });
      },
      logout: () => {
        localStorage.clear();
        set({ user: null, hotelData: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

