import { auth } from '@/config/firebase';
import { createUserDocument, getUserById } from '@/services/firebase/userService';
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { setUser, setProfile } = useUserStore();
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Listen to authentication state changes, single source of truth for both
  // the Firebase Auth user and the Firestore profile (covers login, signup, app restart)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let firestoreDoc = await getUserById(firebaseUser.uid);

        // Auth account exists but Firestore document is missing: the signup Firestore
        // write failed partway through (network drop, permissions blip, Android backgrounding).
        // Create a stub document so the user isn't stuck in a broken "No user data found" state.
        if (!firestoreDoc) {
          console.warn('No Firestore doc for authenticated user, creating stub document');
          try {
            await createUserDocument(
              firebaseUser.uid,
              firebaseUser.email ?? '',
              firebaseUser.displayName ?? 'User',
              0,
              '',
            );
            firestoreDoc = await getUserById(firebaseUser.uid);
          } catch (err) {
            console.error('Failed to create stub user document:', err);
          }
        }

        setProfile(firestoreDoc ?? null);
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  if (!isAuthReady) {
    return null;
  }

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