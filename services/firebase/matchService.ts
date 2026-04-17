import { db } from '@/config/firebase';
import { Like, Match } from '@/types/database';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    limit,
    query,
    setDoc,
    Timestamp,
    where,
} from 'firebase/firestore';
import { COLLECTIONS } from './collections';

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
