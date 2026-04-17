import { db } from '@/config/firebase';
import { Message } from '@/types/database';
import {
    addDoc,
    collection,
    doc,
    orderBy,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS } from './collections';

// Save message to firestore and update the match doc with the last message preview
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
