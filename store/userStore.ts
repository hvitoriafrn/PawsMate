import { User as FirestoreUser } from '@/types/database';
import { User as FirebaseUser } from 'firebase/auth';
import { create } from 'zustand';

interface UserStore {
  // Firebase Auth user available immediately after login, used for uid/auth state
  user: FirebaseUser | null;
  // Firestore user document loaded after auth, contains geopoint, isAdmin, etc.
  profile: FirestoreUser | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: FirestoreUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  profile: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user, error: null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, profile: null, error: null }),
}));
