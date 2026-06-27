import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  profilePhoto: string | null;
  role: string;
  isVerified: boolean;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      _hasHydrated: false,
      setAuth: (token, user) => set({ token, user, isLoggedIn: true }),
      setToken: (token) => set({ token, isLoggedIn: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isLoggedIn: false }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'aqar-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
