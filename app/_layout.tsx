// import the necessary modules and components
import { auth } from '@/config/firebase';
import { getUserById } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export {
  // Catches crashes and displays an error screen
  ErrorBoundary
} from 'expo-router';

// export const unstable_settings = {
//   // When the app loads, it will navigate to the landing page first
//   initialRouteName: 'auth/landingPage',
// };

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Main layout component with font loading and splash screen handling
export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // If the font loading fails, throw the error
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide the splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // If fonts are not loaded yet, render nothing
  if (!loaded) {
    return null;
  }
 
  // Render the main navigation layout
  return <RootLayoutNav />;
}

// This is the actual navigation layout structure
function RootLayoutNav() {
  const colorScheme = useColorScheme(); // checks the device's color scheme (dark or light mode enabled)
  const { setUser, setProfile } = useUserStore();
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Listen to authentication state changes, single source of truth for both
  // the Firebase Auth user and the Firestore profile (covers login, signup, app restart)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const firestoreDoc = await getUserById(firebaseUser.uid);
        setProfile(firestoreDoc ?? null);
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
    });

    // Cleanup the listener on unmount, helps prevent memory leaks
    return unsubscribe;
  }, []);

  //  Don't render anything until auth state is determined
  if (!isAuthReady) {
    return null;  
  }

  // applies the appropriate theme based on the device's color scheme
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
       <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/landingPage" />
        <Stack.Screen name="auth/login" options={{ headerShown: true, title: 'Sign In' }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: true, title: 'Create Account' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}