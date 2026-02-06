// Import Firebase functions
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "***REMOVED***",
  authDomain: "pawsmate-fad42.firebaseapp.com",
  projectId: "pawsmate-fad42",
  storageBucket: "pawsmate-fad42.firebasestorage.app",
  messagingSenderId: "230565182355",
  appId: "1:230565182355:web:af2a87391dd517bdfc4666"
};

// Initialise Firebase app
const app = initializeApp(firebaseConfig);

// Initialise Auth with persistence 
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Firestore stays the same
export const db = getFirestore(app);

export default app;