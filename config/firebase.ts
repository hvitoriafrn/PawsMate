// Import Firebase functions
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; //access firebase's authentication service system
import { getFirestore } from 'firebase/firestore'; // access firebase's firestore db service

// Your web app's Firebase configuration. All created and provided by Firebase, these were copied and pasted here.
// These are unique to the firebases project created for PawsMate.
const firebaseConfig = {
  apiKey: "***REMOVED***",
  authDomain: "pawsmate-fad42.firebaseapp.com",
  projectId: "pawsmate-fad42",
  storageBucket: "pawsmate-fad42.firebasestorage.app",
  messagingSenderId: "230565182355",
  appId: "1:230565182355:web:af2a87391dd517bdfc4666"
};

// Initialise Firebase - this creates the connection.
const app = initializeApp(firebaseConfig);

// Initialise and export Firebase Authentication and export it, gives access to login,signup and logout functions
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;