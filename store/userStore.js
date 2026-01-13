import { create } from 'zustand';

// This store manages user-related data across the app
export const useUserStore = create((set) => ({
  // Current logged-in user
  user: null,
  
  // Function to set/update user
  setUser: (userData) => set({ user: userData }),
  
  // Function to log out
  logout: () => set({ user: null }),
}));