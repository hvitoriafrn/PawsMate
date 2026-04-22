import {
    createUserDocument,
    getAllUsers,
    getUserById,
    TimestampToDate,
    updateUserLocation,
    updateUserProfile,
} from '@/services/firebase/userService';

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    GeoPoint: jest.fn((lat, lon) => ({ latitude: lat, longitude: lon })),
    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
    setDoc: jest.fn(),
    Timestamp: { fromDate: jest.fn((d: Date) => d) },
    updateDoc: jest.fn(),
}));

import { getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// TimestampToDate 

describe('TimestampToDate', () => {
    it('calls toDate() when the timestamp has that method', () => {
        const date = new Date('2024-01-01');
        expect(TimestampToDate({ toDate: () => date })).toBe(date);
    });

    it('returns a Date when the timestamp has no toDate method', () => {
        expect(TimestampToDate(null)).toBeInstanceOf(Date);
        expect(TimestampToDate(undefined)).toBeInstanceOf(Date);
        expect(TimestampToDate('not a timestamp')).toBeInstanceOf(Date);
    });
});

// createUserDocument 

describe('createUserDocument', () => {
    it('calls setDoc once with the new user data', async () => {
        mockSetDoc.mockResolvedValue(undefined);

        await createUserDocument('uid1', 'test@test.com', 'Alice', 25, 'London');

        expect(mockSetDoc).toHaveBeenCalledTimes(1);
        const savedData = mockSetDoc.mock.calls[0][1];
        expect(savedData.uid).toBe('uid1');
        expect(savedData.email).toBe('test@test.com');
        expect(savedData.name).toBe('Alice');
    });

    it('uses the default bio when none is provided', async () => {
        mockSetDoc.mockResolvedValue(undefined);

        await createUserDocument('uid1', 'a@a.com', 'Alice', 25, 'London');

        const savedData = mockSetDoc.mock.calls[0][1];
        expect(savedData.bio).toBe('Pet lover! :) ');
    });

    it('throws when setDoc fails', async () => {
        mockSetDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(
            createUserDocument('uid1', 'a@a.com', 'Alice', 25, 'London')
        ).rejects.toThrow();
    });
});

// getUserById 
describe('getUserById', () => {
    it('returns the user when the document exists', async () => {
        const createdAt = { toDate: () => new Date('2024-01-01') };
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ uid: 'uid1', name: 'Alice', createdAt }),
        });

        const result = await getUserById('uid1');

        expect(result).not.toBeNull();
        expect(result?.uid).toBe('uid1');
        expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('returns null when the document does not exist', async () => {
        mockGetDoc.mockResolvedValue({ exists: () => false });

        expect(await getUserById('uid1')).toBeNull();
    });

    it('returns null when Firestore throws', async () => {
        mockGetDoc.mockRejectedValue(new Error('Firestore error'));

        expect(await getUserById('uid1')).toBeNull();
    });
});

// getAllUsers 
describe('getAllUsers', () => {
    it('returns mapped User objects', async () => {
        const createdAt = { toDate: () => new Date('2024-01-01') };
        mockGetDocs.mockResolvedValue({
            docs: [{ data: () => ({ uid: 'uid1', name: 'Alice', createdAt }) }],
        });

        const result = await getAllUsers();

        expect(result).toHaveLength(1);
        expect(result[0].uid).toBe('uid1');
        expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('returns an empty array when Firestore throws', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));

        expect(await getAllUsers()).toEqual([]);
    });
});

// updateUserProfile

describe('updateUserProfile', () => {
    it('calls updateDoc with the provided fields', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        await updateUserProfile('uid1', { name: 'Bob', bio: 'Hello!' });

        const update = mockUpdateDoc.mock.calls[0][1];
        expect(update.name).toBe('Bob');
        expect(update.bio).toBe('Hello!');
    });

    it('throws when updateDoc fails', async () => {
        mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(updateUserProfile('uid1', { name: 'Bob' })).rejects.toThrow();
    });
});

// updateUserLocation 

describe('updateUserLocation', () => {
    it('calls updateDoc with a GeoPoint and location string', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        await updateUserLocation('uid1', 51.5074, -0.1278, 'London');

        const update = mockUpdateDoc.mock.calls[0][1];
        expect(update.geopoint).toEqual({ latitude: 51.5074, longitude: -0.1278 });
        expect(update.location).toBe('London');
    });

    it('falls back to a coordinate string when no location name is given', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        await updateUserLocation('uid1', 51.5074, -0.1278);

        const update = mockUpdateDoc.mock.calls[0][1];
        expect(update.location).toBe('51.5074, -0.1278');
    });

    it('throws when updateDoc fails', async () => {
        mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(updateUserLocation('uid1', 0, 0)).rejects.toThrow();
    });
});
