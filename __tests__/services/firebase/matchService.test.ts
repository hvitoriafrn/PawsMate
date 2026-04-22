import {
    checkAndCreateMatch,
    createLike,
    getMatchesForUser,
    hasUserInteractedWithPet,
} from '@/services/firebase/matchService';

jest.mock('firebase/firestore', () => ({
    addDoc: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDocs: jest.fn(),
    limit: jest.fn(),
    query: jest.fn(),
    setDoc: jest.fn(),
    Timestamp: {
        fromDate: jest.fn((d: Date) => d),
        now: jest.fn(() => new Date()),
    },
    where: jest.fn(),
}));

import { addDoc, doc, getDocs, setDoc } from 'firebase/firestore';

const mockAddDoc = addDoc as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// createLike 
describe('createLike', () => {
    it('calls addDoc once when creating a like', async () => {
        mockAddDoc.mockResolvedValue({});

        await createLike('user1', 'pet1', 'owner1', 'userPet1', 'like');

        expect(mockAddDoc).toHaveBeenCalledTimes(1);
    });

    it('throws when Firestore rejects', async () => {
        mockAddDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(createLike('user1', 'pet1', 'owner1', 'userPet1', 'like')).rejects.toThrow();
    });
});

// hasUserInteractedWithPet

describe('hasUserInteractedWithPet', () => {
    it('returns true when the user has already interacted with the pet', async () => {
        mockGetDocs.mockResolvedValue({ empty: false });

        expect(await hasUserInteractedWithPet('user1', 'pet1')).toBe(true);
    });

    it('returns false when no prior interaction exists', async () => {
        mockGetDocs.mockResolvedValue({ empty: true });

        expect(await hasUserInteractedWithPet('user1', 'pet1')).toBe(false);
    });

    it('returns false (show the pet) when Firestore throws', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));

        expect(await hasUserInteractedWithPet('user1', 'pet1')).toBe(false);
    });
});

// checkAndCreateMatch 
describe('checkAndCreateMatch', () => {
    it('returns null when no mutual like is found', async () => {
        mockGetDocs.mockResolvedValue({ empty: true });

        expect(await checkAndCreateMatch('user1', 'pet1', 'user2', 'pet2')).toBeNull();
    });

    it('returns the existing match id when both users already matched', async () => {
        const existingMatchDoc = {
            id: 'existingMatch123',
            data: () => ({ userIds: ['user1', 'user2'] }),
        };

        mockGetDocs
            .mockResolvedValueOnce({ empty: false })                          // mutual like found
            .mockResolvedValueOnce({ docs: [existingMatchDoc] });             // match already exists

        const result = await checkAndCreateMatch('user1', 'pet1', 'user2', 'pet2');

        expect(result).toBe('existingMatch123');
        expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('creates a new match document and returns its id on mutual like', async () => {
        mockGetDocs
            .mockResolvedValueOnce({ empty: false })                          // mutual like found
            .mockResolvedValueOnce({ docs: [] });                             // no existing match

        mockDoc.mockReturnValue({ id: 'newMatch456' });
        mockSetDoc.mockResolvedValue(undefined);

        const result = await checkAndCreateMatch('user1', 'pet1', 'user2', 'pet2');

        expect(mockSetDoc).toHaveBeenCalledTimes(1);
        expect(result).toBe('newMatch456');
    });

    it('returns null when Firestore throws', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));

        expect(await checkAndCreateMatch('user1', 'pet1', 'user2', 'pet2')).toBeNull();
    });
});

// getMatchesForUser 

describe('getMatchesForUser', () => {
    it('returns mapped Match objects for the user', async () => {
        const ts = { toDate: () => new Date('2024-01-01') };
        const rawDoc = {
            id: 'match1',
            data: () => ({
                userIds: ['user1', 'user2'],
                petIds: ['pet1', 'pet2'],
                createdAt: ts,
                isActive: true,
                lastMessage: 'Hello!',
                lastMessageAt: ts,
                lastMessageSenderId: 'user1',
            }),
        };

        mockGetDocs.mockResolvedValue({ docs: [rawDoc] });

        const result = await getMatchesForUser('user1');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('match1');
        expect(result[0].userIds).toEqual(['user1', 'user2']);
        expect(result[0].lastMessage).toBe('Hello!');
    });

    it('returns an empty array when Firestore throws', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));

        expect(await getMatchesForUser('user1')).toEqual([]);
    });
});
