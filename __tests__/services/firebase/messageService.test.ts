import { sendMessage, subscribeToMessages } from '@/services/firebase/messageService';

jest.mock('firebase/firestore', () => ({
    addDoc: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    orderBy: jest.fn(),
    onSnapshot: jest.fn(),
    query: jest.fn(),
    Timestamp: { now: jest.fn(() => new Date()) },
    updateDoc: jest.fn(),
}));

import { addDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const mockAddDoc = addDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// sendMessage

describe('sendMessage', () => {
    it('calls addDoc and updateDoc when sending a message', async () => {
        mockAddDoc.mockResolvedValue({});
        mockUpdateDoc.mockResolvedValue(undefined);

        await sendMessage('match1', 'user1', 'Hello!');

        expect(mockAddDoc).toHaveBeenCalledTimes(1);
        expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });

    it('trims whitespace from the message text', async () => {
        mockAddDoc.mockResolvedValue({});
        mockUpdateDoc.mockResolvedValue(undefined);

        await sendMessage('match1', 'user1', '  Hello!  ');

        const savedMessage = mockAddDoc.mock.calls[0][1];
        const matchUpdate = mockUpdateDoc.mock.calls[0][1];

        expect(savedMessage.text).toBe('Hello!');
        expect(matchUpdate.lastMessage).toBe('Hello!');
    });

    it('throws when Firestore rejects', async () => {
        mockAddDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(sendMessage('match1', 'user1', 'Hi')).rejects.toThrow();
    });
});

// subscribeToMessages 
describe('subscribeToMessages', () => {
    it('returns an unsubscribe function', () => {
        mockOnSnapshot.mockReturnValue(jest.fn());

        const result = subscribeToMessages('match1', jest.fn());

        expect(typeof result).toBe('function');
    });

    it('calls the callback with mapped Message objects on each snapshot', () => {
        const ts = { toDate: () => new Date('2024-06-01') };
        const snapshot = {
            docs: [{
                id: 'msg1',
                data: () => ({
                    matchId: 'match1',
                    senderId: 'user1',
                    text: 'Hey!',
                    createdAt: ts,
                    read: false,
                }),
            }],
        };

        mockOnSnapshot.mockImplementation((_q: unknown, cb: (s: typeof snapshot) => void) => {
            cb(snapshot);
            return jest.fn();
        });

        const onMessages = jest.fn();
        subscribeToMessages('match1', onMessages);

        expect(onMessages).toHaveBeenCalledWith([{
            id: 'msg1',
            matchId: 'match1',
            senderId: 'user1',
            text: 'Hey!',
            createdAt: new Date('2024-06-01'),
            read: false,
        }]);
    });

    it('defaults read to false when the field is missing', () => {
        const snapshot = {
            docs: [{
                id: 'msg2',
                data: () => ({
                    matchId: 'match1',
                    senderId: 'user2',
                    text: 'Hi',
                    createdAt: null,
                    // read field absent
                }),
            }],
        };

        mockOnSnapshot.mockImplementation((_q: unknown, cb: (s: typeof snapshot) => void) => {
            cb(snapshot);
            return jest.fn();
        });

        const onMessages = jest.fn();
        subscribeToMessages('match1', onMessages);

        expect(onMessages.mock.calls[0][0][0].read).toBe(false);
    });
});
