import { db } from '@/config/firebase';
import { User } from '@/types/database';
import {
    collection,
    doc,
    GeoPoint,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS } from './collections';

// create a new user document in Firestore when a user signs up
export const createUserDocument = async (
    userId: string,
    email: string,
    name: string,
    age: number,
    location: string,
    bio?: string,
    termsAccepted: boolean = true,
    termsAcceptedAt: string = new Date().toISOString(),
): Promise<void> => {
    try {
        // create a reference to save the info
        const userRef = doc(db, COLLECTIONS.USERS, userId);

        // Build the user data object
        const userData: User = {
            uid: userId,
            email,
            name,
            age,
            location,
            geopoint: {
                latitude: 0, // placeholders for now
                longitude: 0
            },
            //default profile picture
            profilePicture: 'https://www.nicepng.com/png/full/115-1150821_default-avatar-comments-sign-in-icon-png.png',
            bio: bio || 'Pet lover! :) ', // default bio so it isn't empy if user doesn't provide a bio
            verified: false,
            isActive: true,
            createdAt: new Date(),
            interests: [],
            petIds:[],
            termsAccepted,
            termsAcceptedAt,
        };

        // Save to firestore!
        await setDoc(userRef, {
            ... userData,
            createdAt: Timestamp.fromDate(userData.createdAt)
        });

        // show the user has been created in console (for debugging)
        console.log('User doc created: ', userId);

    } catch (error) {
        console.error('Error creating a user doc', error);
        throw error;
    }
};

export const updateUserProfile = async (
    userId: string,
    data: {
        name?: string;
        bio?: string;
        profilePicture?: string;
        bannerPicture?: string;
  }
): Promise<void> => {
  try {
    // Create reference to the user's document
    const userRef = doc(db, 'users', userId);

    // Update only the specified fields
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('Profile updated successfully');

    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
  }
};

// Get user doc by ID
export const getUserById = async (userId: string): Promise<User | null > => {

    try {
        // Create a reference to the user doc
        const userRef = doc(db, COLLECTIONS.USERS, userId);
        // Gets the doc from Firestore
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            // if document exists, gets the data
            const data = userSnap.data();

            return {
                ... data,
                createdAt: data.createdAt.toDate()
            } as User;
        }
        // if it doesn't exist, returns null
        return null;

    } catch (error) {
            console.error('Error getting user: ', error);
            return null;
    }
};

// Get all the users (for testing!)
export const getAllUsers = async (): Promise <User[]> => {
    try {
        // Get the reference to the whole collection
        const usersRef = collection(db, COLLECTIONS.USERS);
        const snapshot = await getDocs(usersRef);

        // Get firestore data and transform it to user data
        return snapshot.docs.map(doc => ({
            ... doc.data(), // Gets all the fields from the document
            createdAt: doc.data().createdAt.toDate()
        } as User));

    } catch (error) {
        console.error('Error getting the users: ', error);
        return [];
    }
};

// Timestamp to date converter
export const TimestampToDate = (timestamp: any): Date => {

    // Check if timestamp exists and has the toDate method
    if (timestamp && timestamp.toDate) {
        // then convert the timestamp to Date
        return timestamp.toDate();
    }

    return new Date();
};

// Create or update user with location data:
export const updateUserLocation = async (
    userId: string,
    latitude: number,
    longitude: number,
    locationString?: string
): Promise<void> => {

    try {
        const userRef = doc(db, 'users', userId);

        await updateDoc(userRef, {
        // Store as Firestore geopoint
        geopoint: new GeoPoint(latitude,longitude),
        // Store readable location (for display)
        location: locationString || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        updatedAt: serverTimestamp(),
    });

    console.log('User location updated');
    } catch (error) {
        console.error('Error updating location: ', error);
        throw error;
    }
};

export const updateUserProfilePicture = async (
    userId: string,
    data: {
        name?: string,
        bio?: string,
        profilePicture?: string;
    }
): Promise<void> => {
    // Reference the user in Firestore
    try {
        const userRef = doc(db, 'users', userId);

        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        console.log('Profile updated correctly');
    } catch (error) {
        console.error('Error updating profile: ', error);
        throw error;
    }
};
