// Import necessary modules and components

// including user store and redirect component
import { useUserStore } from '@/store/userStore';
// Import the user's store (from zustand) to check authentication status
import { Redirect } from 'expo-router';

// This is the first component that runs when the app starts
export default function Index() {
  //it gets the user from the store
  const { user } = useUserStore();

  // If user is logged in, go to main app
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, go to welcome screen (in this case the landing page)
  return <Redirect href="/auth/landingPage" />;
}