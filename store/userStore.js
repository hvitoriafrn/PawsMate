// Import Zustand's 'create' function. 
import { create } from 'zustand';

export const useUserStore = create((set) => ({
  // Current logged-in user
  user: null,
  
  // Loading state
  isLoading: false,
  
  // Error state
  error: null,
  
  // Set user after login
  setUser: (userData) => set({ user: userData, error: null }),
  
  // Set loading state
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Set error
  setError: (error) => set({ error }),
  
  // Logout
  logout: () => set({ user: null, error: null }),
}));