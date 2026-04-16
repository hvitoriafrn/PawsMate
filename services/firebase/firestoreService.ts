// firestoreService.ts, functions to interact with Firestore database
// This file includes all the functions required to interact with Firestore

// Import necessary modules

import { db } from '@/config/firebase';
import { Event, EventType, Like, Match, Message, Pet, PetType, User } from '@/types/database';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection, doc,
    GeoPoint,
    getDoc, getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';



// Firestore collections
const COLLECTIONS = { 
    USERS: 'users', 
    PETS: 'pets', 
    LIKES: 'likes',
    MATCHES: 'matches',
    CHATS: 'chats',
    EVENTS: 'events'
}; 

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

// Create Pet when a user adds a new pet to their profile

export const createPet = async ( petData: {
    ownerId: string;
    name: string;
    breed: string;
    age: number;
    type?: string,
    size?: string,
    gender?:string,
    photo?:string,
    photos?: string[];
    personalityTraits?: string[];
    lookingFor?: string[];
    healthInfo?: {
        vaccinated?: boolean;
        spayedNeutered?: boolean;
        healthNotes?: string;
    };
    verification?: {
        microchipNumber?: string;
        verifiedAt?: null;
        verified?: boolean;
    };
}): Promise<string> => {
    try {
        // Get reference to pets collection
        const petsRef = collection(db, 'pets');

        // Create a new ref with the autogenerated ID 
        const newPetRef = doc(petsRef);

        // Use date for immediate reads
        const now = new Date();

        // Get the owner's location to be stored with the pet
        let ownerGeopoint = null;
        try {
            const owner = await getUserById(petData.ownerId);
            if (owner?.geopoint) {
                ownerGeopoint = owner.geopoint;
            }
        } catch (error) {
            console.warn('could not get user location: ', error);
        }

        // Build the pet object
        const pet = {
            ...petData,
            id: newPetRef.id,
            photo: petData.photo || 'https://freepng.com/uploads/images/202311/vector-cute-doghappy-face-brown-color-png_1020x-3867.jpg',
            type: petData.type || 'Dog',
            size: petData.size || 'Medium',
            gender: petData.gender || 'Male',
            bio: `Meet ${petData.name}!`,
            personalityTraits: petData.personalityTraits || [],
            lookingFor: petData.lookingFor || [],
            healthInfo: petData.healthInfo || {
                vaccinated: false,
                spayedNeutered: false,
                healthNotes: '',
            },
            verification: petData.verification || {
                verified: false,
                microchipNumber: '',
                verifiedAt: null,
            },
            isActive: true,
            createdAt: now,
            updatedAt: now,
            ownerGeopoint: ownerGeopoint,
        };

        //Save the pet doc to Firestore
        await setDoc(newPetRef, pet);

        // console log
        console.log('Pet created')

        // add this pet to the user's petIds array
        const userRef = doc(db, 'users', petData.ownerId);
        await updateDoc(userRef, {
            // Only add to array if the value doesn't already exist (this prevents duplicates)
            petIds: arrayUnion(newPetRef.id),
        });

        console.log('Pet ID added to users array');

        return newPetRef.id;

    } catch (error) {
        console.error('Error creating the pet: ', error)
        throw error;
    }
    
};

// Updates pet info

export const updatePet = async (
    petId: string, 
    data: {
        name?: string;
        breed?: string;
        age?: number;
        type?: string;
        size?: string;
        gender?: string;
        photo?: string;
        photos?: string[];
        bio?: string;
        personalityTraits?: string[];
        lookingFor?: string[];
        healthInfo?: {
            vaccinated?: boolean;
            spayedNeutered?: boolean;
            healthNotes?: string;
        };
        verification?: {
            microchipNumber?: string;
            verifiedAt?: Date | null;
            verified?: boolean;
        };
    }
): Promise<void> => {
    try {
        // Create ref to the pet document
        const petRef = doc(db, COLLECTIONS.PETS, petId);

        //Update only the fields that were provided
        await updateDoc(petRef, {
            ...data, 
            updatedAt: new Date(),
        });

        console.log('Pet updated successfully: ', petId);
    } catch (error) {
        console.error('Error updating pet: ', error);
        throw error;
    }
};

//Delete a pet
export const deletePet = async (petId: string): Promise<void> => {
    try {
        // First, get the pet to find the owner
        const petRef = doc(db, COLLECTIONS.PETS, petId);
        const petSnap = await getDoc(petRef);

        if (!petSnap.exists()) {
            throw new Error('Pet not found');
        }

        const petData = petSnap.data();
        const ownerId = petData.ownerId;

        //  Mark as inactive
        await updateDoc(petRef, {
            isActive: false,
            updatedAt: new Date(),
        });

        // Remove the pet ID from the user's array of petIds
        const userRef = doc(db, COLLECTIONS.USERS, ownerId);
        await updateDoc(userRef, {
            petIds: arrayRemove(petId),
            updatedAt: serverTimestamp(),
        })

        console.log('Pet deleted successfully: ', petId);
    } catch (error) {
        console.error('Error deleting pet: ', error);
        throw error;
    }
}

// Get the active pets (for the explore screen)
export const getActivePets = async (): Promise<Pet[]> => {
    try {
        const petsRef = collection(db, COLLECTIONS.PETS);

        // Build the query
        const q = query(
            petsRef, 
            where('isActive', '==', true),
            
            //orderBy('createdAt', 'desc')
        );

        // Executes the query 
        const snapshot = await getDocs(q);

        // Turns the docs from firestore to pet objects
        return snapshot.docs.map(doc => {
            const data = doc.data();
            
        //Helper for timestamps
            const toDate = (timestamp: any): Date => {
                if (!timestamp) return new Date();
                if (timestamp instanceof Date) return timestamp;
                if (typeof timestamp.toDate === 'function') return timestamp.toDate();
                return new Date();
            };

            return { 
                id: doc.id,
                ...data,
                createdAt: toDate(data.createdAt),
                updatedAt: toDate(data.updatedAt),
                verification: {
                    verified: data.verification?.verified || false,
                    microchipNumber: data.verification?.microchipNumber || '',
                    verifiedAt: data.verification?.verifiedAt?.toDate() || null
                }
            } as Pet;
        });
    } catch (error) {
        console.error('Error getting pets: ', error)
        return[];
    }
};

// Get Pets by owner ID 
export const getPetsByOwnerId = async (ownerId: string): Promise<Pet[]> => {
    try {
        const petsRef = collection(db, 'pets');
        // Get the collection reference
        const q = query(
            petsRef, 
            where('ownerId', '==', ownerId),
            where('isActive', '==', true)
        );

        // Execute query 
        const snapshot = await getDocs(q);

        const pets = snapshot.docs.map((doc) => {
            const data = doc.data();


            // Helper function to safely convert timestamps to Date
            const toDate = (timestamp: any): Date => {
                if (!timestamp) return new Date();
                if (timestamp instanceof Date) return timestamp;
                if (typeof timestamp.toDate === 'function') return timestamp.toDate();
                return new Date();
            };
            
            // Build pet object with all fields having defaults
            const pet: Pet = {
                id: data.id || doc.id,
                ownerId: data.ownerId || ownerId,
                name: data.name || 'Unknown',
                breed: data.breed || 'Unknown',
                age: data.age || 0,
                type: data.type || 'Dog',
                size: data.size || 'Medium',
                gender: data.gender || 'Male',
                photo: data.photo || 'https://placedog.net/400',
                photos: Array.isArray(data.photos) ? data.photos : [],
                bio: data.bio || `Meet ${data.name || 'this pet'}!`,
                personalityTraits: Array.isArray(data.personalityTraits) ? data.personalityTraits : [],
                lookingFor: Array.isArray(data.lookingFor) ? data.lookingFor : [],
                
                healthInfo: {
                vaccinated: data.healthInfo?.vaccinated || false,
                spayedNeutered: data.healthInfo?.spayedNeutered || false,
                healthNotes: data.healthInfo?.healthNotes || '',
                },
                
                verification: {
                verified: data.verification?.verified || false,
                microchipNumber: data.verification?.microchipNumber || '',
                verifiedAt: data.verification?.verifiedAt ? toDate(data.verification.verifiedAt) : null,
                },
                
                isActive: data.isActive !== undefined ? data.isActive : true,
                createdAt: toDate(data.createdAt),
                updatedAt: toDate(data.updatedAt),
            };
            
            // Add optional ownerGeopoint if it exists
            if (data.ownerGeopoint) {
                pet.ownerGeopoint = data.ownerGeopoint;
            }
            
            return pet;
            });

            console.log('Returning', pets.length, 'pets');
            return pets;
            
        } catch (error) {
            console.error('Error in getPetsByOwnerId:', error);
            throw error;
        }
        };

// Creates likes
export const createLike = async (
    userId: string, 
    petId: string, 
    ownerId: string, 
    userPetId: string, 
    action: 'like' | 'pass'
): Promise<void> => {

    try {
        const likesRef = collection(db, COLLECTIONS.LIKES);

        // Building the like data object
        const likeData: Omit<Like, 'id'> = {
            userId, 
            petId,
            ownerId,
            userPetId,
            action,
            matched: false,
            createdAt: new Date(),
        };

        // Save to firestore with auto-generated ID
        await addDoc(likesRef, {
            ...likeData,
            createdAt: Timestamp.fromDate(likeData.createdAt)
        });

        console.log('Like recorded for pet: ', petId);

    } catch (error) {
        console.error('Error creating like: ', error);
        throw error;
    }
};


// Prevent showing pet a user has already liked or passed on
export const hasUserInteractedWithPet = async (
    userId: string,
    petId: string
): Promise<boolean> => {

    try {
        const likesRef = collection(db, COLLECTIONS.LIKES);

        const q = query(
            likesRef, 
            where('userId', '==', userId),
            where('petId', '==', petId),
            limit(1) // no need to check if there's more than one
        );

        // Check if documents were found

        // Execute the query
        const snapshot = await getDocs(q);

        // If snapshot is empty, then there was no interaction
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking interaction: ', error);

        // if there's an error, show the pet
        return false;
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

}

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

// When a user changes their location, update ownerGeopoint on all their active pets
// so that distance filtering on the explore screen stays accurate
export const updatePetsOwnerGeopoint = async (
    userId: string,
    latitude: number,
    longitude: number
): Promise<void> => {
    try {
        const petsRef = collection(db, COLLECTIONS.PETS);
        const q = query(
            petsRef,
            where('ownerId', '==', userId),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        // Update all pets at the same time
        await Promise.all(
            snapshot.docs.map(petDoc =>
                updateDoc(petDoc.ref, {
                    ownerGeopoint: new GeoPoint(latitude, longitude),
                })
            )
        );

        console.log('Updated ownerGeopoint for', snapshot.docs.length, 'pets');
    } catch (error) {
        console.error('Error updating pets geopoint:', error);
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

// An example so I don't forget: 

// converting to firestore data 
// const data = doc.data();
// const createdDate = timestampToDate(data.createdAt);

// converting from firestore data
// const verifiedDate = timestampToDate(data.verifiedAt);

// check if there's a record of likes that would create a match 

export const checkAndCreateMatch = async (

    likerUserId: string, // the person doing the like
    likerPetId: string, // which pet
    likedOwnerId: string, // the owner of the liked pet
    likePetId: string // the pet that was liked
): Promise<string | null> => {

    try {
        const likesRef = collection(db, COLLECTIONS.LIKES);

        // Query to find if the user already liked the pet
        const q = query(
            likesRef,
            where('userId', '==', likedOwnerId), // the other user 
            where('petId','==', likerPetId), // if they liked my pet
            where('action', '==', 'like'),
            limit(1)
        );

        const snapshot = await getDocs(q)

        // if no mutual likes found, no match 
        if (snapshot.empty) {
            console.log('No match yet. User did not like back');
            return null;
        }

        // Check if a match already exists between these users
        const matchesRef = collection(db, COLLECTIONS.MATCHES);

        const existingMatchQuery = query(
            matchesRef,
            where('userIds', 'array-contains', likerUserId),
            where('isActive', '==', true),
        );

        const existingMatchSnapshot = await getDocs(existingMatchQuery);

        const existingMatch = existingMatchSnapshot.docs.find(doc => 
            doc.data().userIds.includes(likedOwnerId)
        );

        if (existingMatch) {
            console.log('A match between these users already exists: ', existingMatch.id)
            return existingMatch.id;
        }

        // match found, then create the doc and log on console for debugging
        console.log('Mutual like found! Match created')

        // doc() without an ID argument will generate a unique ID
        const newMatchRef = doc(matchesRef);

        await setDoc(newMatchRef ,{ 
            id: newMatchRef.id,
            userIds: [likerUserId,likedOwnerId],
            petIds: [likerPetId, likePetId],
            createdAt: Timestamp.now(),
            isActive: true,
            lastMessage: null, 
            lastMessageAt: null,
            lastMessageSenderId: null,
        });

        console.log('Match created:', newMatchRef.id);
        // Returns the ID so explore screen knows which chat to open
        return newMatchRef.id;

    } catch (error) {
        console.error('Error in checkAndCreateMatch:', error);
        return null;
    }
};

// Get all active matches for a specific user 
// This is to show all the conversations in the 'messages screen'

export const getMatchesForUser = async (userId: string): Promise<Match[]> => {
    try {
        const matchesRef = collection(db, COLLECTIONS.MATCHES);

        const q = query(
            matchesRef,
            where('userIds', 'array-contains', userId), // find the matches where this user is involved
            where('isActive', '==', true) // only show active matches
        );

        const snapshot = await getDocs(q);

        // Convert the firestore document
        return snapshot.docs.map(doc => {
            const data = doc.data();

            // Helper to convert the firestore timestampts to JS date objects
            const toDate = (ts: any): Date => {
                if (!ts) return new Date();
                if (ts instanceof Date) return ts;
                if (typeof ts.toDate === 'function') return ts.toDate();
                return new Date(); 
            };

            return {
                id: doc.id,
                userIds: data.userIds || [],
                petIds: data.petIds || [],
                createdAt: toDate(data.createdAt),
                isActive: data.isActive ?? true,
                lastMessage: data.lastMessage || null,
                lastMessageAt: data.lastMessageAt ? toDate(data.lastMessageAt) : null,
                lastMessageSenderId: data.lastMessageSenderId || null,
            } as Match;
        });

    } catch (error) {
        console.error('Error fetching matches:', error);
        return [];
    }
};

// Save message to firestore and update the match doc with the last mesaage preview
// for the conversations list 

export const sendMessage = async (
    matchId: string, 
    senderId: string, 
    text: string
): Promise<void> => {
    try{

        // path to access the subcollection that is inside this match
        const messagesRef = collection(db, COLLECTIONS.MATCHES, matchId, 'messages');

        // Save the new message
        await addDoc(messagesRef, {
            matchId,
            senderId,
            text: text.trim(),
            createdAt: Timestamp.now(),
            read: false,
        });

        //Update the parent match doc with the last message preview 
        const matchRef = doc(db, COLLECTIONS.MATCHES, matchId);
        await updateDoc(matchRef, {
            lastMessage: text.trim(),
            lastMessageAt: Timestamp.now(),
            lastMessageSenderId: senderId,
        });

        console.log('Message sent in match:', matchId)

    } catch (error) {
        console.error('Error sending the message', error);
        throw error;
    }
};

// Get all active events from Firestore
export const getEvents = async (): Promise<Event[]> => {
    try {
        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        // No orderBy, this avoids needing a composite index; sort client-side instead
        const q = query(eventsRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            const toDate = (ts: any): Date => {
                if (!ts) return new Date();
                if (ts instanceof Date) return ts;
                if (typeof ts.toDate === 'function') return ts.toDate();
                return new Date();
            };
            return {
                id: doc.id,
                ...data,
                date: toDate(data.date),
                createdAt: toDate(data.createdAt),
                updatedAt: toDate(data.updatedAt),
                attendees: data.attendees || [],
            } as Event;
        });
    } catch (error) {
        console.error('Error getting events:', error);
        return [];
    }
};

// Create a new event (admin only)
export const createEvent = async (data: {
    title: string;
    description: string;
    type: EventType;
    date: Date;
    location: string;
    latitude: number;
    longitude: number;
    maxAttendees?: number;
    breed?: string;
    petType?: PetType;
    createdBy: string;
    createdByName?: string;
    imageUrl?: string;
}): Promise<string> => {
    try {
        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        const newRef = doc(eventsRef);
        const now = new Date();

        await setDoc(newRef, {
            id: newRef.id,
            title: data.title,
            description: data.description,
            type: data.type,
            date: Timestamp.fromDate(data.date),
            location: data.location,
            geopoint: new GeoPoint(data.latitude, data.longitude),
            createdBy: data.createdBy,
            createdByName: data.createdByName || 'PawsMate',
            imageUrl: data.imageUrl || null,
            attendees: [],
            maxAttendees: data.maxAttendees || null,
            breed: data.breed || null,
            petType: data.petType || null,
            isActive: true,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
        });

        console.log('Event created:', newRef.id);
        return newRef.id;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};

// Update an existing event (admin only)
export const updateEvent = async (eventId: string, data: Partial<{
    title: string;
    description: string;
    type: EventType;
    date: Date;
    location: string;
    latitude: number;
    longitude: number;
    maxAttendees: number;
    breed: string;
    petType: PetType;
    imageUrl: string;
}>): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
        const update: any = { ...data, updatedAt: serverTimestamp() };

        // Convert date to Timestamp if provided
        if (data.date) update.date = Timestamp.fromDate(data.date);

        // Convert lat/lon to GeoPoint if provided
        if (data.latitude !== undefined && data.longitude !== undefined) {
            update.geopoint = new GeoPoint(data.latitude, data.longitude);
            delete update.latitude;
            delete update.longitude;
        }

        // Firestore rejects undefined values, replace with null
        for (const key of Object.keys(update)) {
            if (update[key] === undefined) update[key] = null;
        }

        await updateDoc(eventRef, update);
        console.log('Event updated:', eventId);
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

// Soft-delete an event (admin only)
export const deleteEvent = async (eventId: string): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
        await updateDoc(eventRef, { isActive: false, updatedAt: serverTimestamp() });
        console.log('Event deleted:', eventId);
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

// Join an event
export const joinEvent = async (eventId: string, userId: string): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
        await updateDoc(eventRef, { attendees: arrayUnion(userId) });
    } catch (error) {
        console.error('Error joining event:', error);
        throw error;
    }
};

// Leave an event
export const leaveEvent = async (eventId: string, userId: string): Promise<void> => {
    try {
        const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
        await updateDoc(eventRef, { attendees: arrayRemove(userId) });
    } catch (error) {
        console.error('Error leaving event:', error);
        throw error;
    }
};

// Get pets with pending microchip verification (admin only)
export const getPendingVerificationPets = async (): Promise<Pet[]> => {
    try {
        const petsRef = collection(db, COLLECTIONS.PETS);
        const q = query(
            petsRef,
            where('isActive', '==', true),
            where('verification.verified', '==', false),
        );
        const snapshot = await getDocs(q);

        const toDate = (ts: any): Date => {
            if (!ts) return new Date();
            if (ts instanceof Date) return ts;
            if (typeof ts.toDate === 'function') return ts.toDate();
            return new Date();
        };

        // Only return pets that actually have a microchip number submitted
        return snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: toDate(data.createdAt),
                    updatedAt: toDate(data.updatedAt),
                    verification: {
                        verified: data.verification?.verified || false,
                        microchipNumber: data.verification?.microchipNumber || '',
                        verifiedAt: data.verification?.verifiedAt ? toDate(data.verification.verifiedAt) : null,
                    },
                } as Pet;
            })
            .filter(pet => pet.verification.microchipNumber && pet.verification.microchipNumber.trim() !== '');
    } catch (error) {
        console.error('Error getting pending verifications:', error);
        return [];
    }
};

// Approve or reject a microchip verification (admin only)
export const updatePetVerification = async (
    petId: string,
    approved: boolean,
    adminId: string
): Promise<void> => {
    try {
        const petRef = doc(db, COLLECTIONS.PETS, petId);
        await updateDoc(petRef, {
            'verification.verified': approved,
            'verification.verifiedAt': approved ? Timestamp.now() : null,
            'verification.verifiedBy': approved ? adminId : null,
            updatedAt: serverTimestamp(),
        });
        console.log(`Pet ${petId} verification ${approved ? 'approved' : 'rejected'}`);
    } catch (error) {
        console.error('Error updating verification:', error);
        throw error;
    }
};

// Set up a real time listener for when users talk in chat
// Using onSnapshot so it updates it automatically instead of having to manually refresh

export const subscribeToMessages = (
    matchId: string, 
    onMessages: (messages: Message[]) => void  // callback is called every time messages update
): (() => void) => { 

    const messagesRef = collection(db, COLLECTIONS.MATCHES, matchId, 'messages');

    // sort the messages with oldest at the top and newest at bottom
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    // onSnapshot returns the unsubscribe function directly
    const unsubscribe = onSnapshot(q, (snapshot) => {

        // convert every document to the message type
        const messages: Message[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                matchId: data.matchId, 
                senderId: data.senderId,
                text: data.text,
                createdAt: data.createdAt?.toDate() || new Date(),
                read: data.read || false,
            };
        });

        // Call the callback to update the react state in chat screen
        onMessages(messages);
    });

    return unsubscribe;
}





