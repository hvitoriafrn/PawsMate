import { db } from '@/config/firebase';
import { Event, EventType, PetType } from '@/types/database';
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDocs,
    GeoPoint,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { COLLECTIONS } from './collections';

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
