import {
    createPet,
    deletePet,
    getActivePets,
    getPendingVerificationPets,
    getPetsByOwnerId,
    updatePet,
    updatePetVerification,
    updatePetsOwnerGeopoint,
} from '@/services/firebase/petService';

jest.mock('firebase/firestore', () => ({
    arrayRemove: jest.fn((v) => ({ _remove: v })),
    arrayUnion: jest.fn((v) => ({ _union: v })),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    GeoPoint: jest.fn((lat, lon) => ({ latitude: lat, longitude: lon })),
    query: jest.fn(),
    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
    setDoc: jest.fn(),
    Timestamp: { now: jest.fn(() => new Date()) },
    updateDoc: jest.fn(),
    where: jest.fn(),
}));

jest.mock('@/services/firebase/userService', () => ({
    getUserById: jest.fn(),
}));

import { getUserById } from '@/services/firebase/userService';
import { getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockGetUserById = getUserById as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// createPet 

describe('createPet', () => {
    const petInput = { ownerId: 'user1', name: 'Buddy', breed: 'Labrador', age: 3 };

    it('calls setDoc and updateDoc, then returns the new pet id', async () => {
        mockGetUserById.mockResolvedValue({ geopoint: { latitude: 51.5, longitude: -0.1 } });
        const newRef = { id: 'pet123' };
        const { doc } = require('firebase/firestore');
        doc.mockReturnValue(newRef);
        mockSetDoc.mockResolvedValue(undefined);
        mockUpdateDoc.mockResolvedValue(undefined);

        const id = await createPet(petInput);

        expect(mockSetDoc).toHaveBeenCalledTimes(1);
        expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
        expect(id).toBe('pet123');
    });

    it('stores the owner geopoint when getUserById returns a location', async () => {
        mockGetUserById.mockResolvedValue({ geopoint: { latitude: 51.5, longitude: -0.1 } });
        const { doc } = require('firebase/firestore');
        doc.mockReturnValue({ id: 'pet1' });
        mockSetDoc.mockResolvedValue(undefined);
        mockUpdateDoc.mockResolvedValue(undefined);

        await createPet(petInput);

        const savedPet = mockSetDoc.mock.calls[0][1];
        expect(savedPet.ownerGeopoint).toEqual({ latitude: 51.5, longitude: -0.1 });
    });

    it('sets ownerGeopoint to null when the owner has no location', async () => {
        mockGetUserById.mockResolvedValue(null);
        const { doc } = require('firebase/firestore');
        doc.mockReturnValue({ id: 'pet1' });
        mockSetDoc.mockResolvedValue(undefined);
        mockUpdateDoc.mockResolvedValue(undefined);

        await createPet(petInput);

        const savedPet = mockSetDoc.mock.calls[0][1];
        expect(savedPet.ownerGeopoint).toBeNull();
    });

    it('throws when setDoc fails', async () => {
        mockGetUserById.mockResolvedValue(null);
        const { doc } = require('firebase/firestore');
        doc.mockReturnValue({ id: 'pet1' });
        mockSetDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(createPet(petInput)).rejects.toThrow();
    });
});

// updatePet

describe('updatePet', () => {
    it('calls updateDoc with the provided fields', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        await updatePet('pet1', { name: 'Max', age: 4 });

        const update = mockUpdateDoc.mock.calls[0][1];
        expect(update.name).toBe('Max');
        expect(update.age).toBe(4);
    });

    it('throws when updateDoc fails', async () => {
        mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(updatePet('pet1', { name: 'Max' })).rejects.toThrow();
    });
});

// deletePet

describe('deletePet', () => {
    it('marks the pet inactive and removes it from the owner petIds', async () => {
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ ownerId: 'user1' }),
        });
        mockUpdateDoc.mockResolvedValue(undefined);

        await deletePet('pet1');

        expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
        const petUpdate = mockUpdateDoc.mock.calls[0][1];
        expect(petUpdate.isActive).toBe(false);
    });

    it('throws when the pet document does not exist', async () => {
        mockGetDoc.mockResolvedValue({ exists: () => false });

        await expect(deletePet('pet1')).rejects.toThrow('Pet not found');
    });

    it('throws when Firestore fails', async () => {
        mockGetDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(deletePet('pet1')).rejects.toThrow();
    });
});

// getActivePets 
describe('getActivePets', () => {
    it('returns mapped Pet objects for all active pets', async () => {
        const ts = { toDate: () => new Date('2024-01-01') };
        mockGetDocs.mockResolvedValue({
            docs: [{
                id: 'pet1',
                data: () => ({
                    ownerId: 'user1', name: 'Buddy', breed: 'Lab', age: 3,
                    type: 'Dog', size: 'Large', gender: 'Male',
                    photo: '', personalityTraits: [], lookingFor: [],
                    healthInfo: {}, verification: { verified: false, microchipNumber: '' },
                    isActive: true, createdAt: ts, updatedAt: ts,
                }),
            }],
        });

        const result = await getActivePets();

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Buddy');
        expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('returns an empty array when Firestore throws', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));

        expect(await getActivePets()).toEqual([]);
    });
});

// getPetsByOwnerId 

describe('getPetsByOwnerId', () => {
    it('returns pets with safe defaults applied', async () => {
        const ts = { toDate: () => new Date('2024-01-01') };
        mockGetDocs.mockResolvedValue({
            docs: [{
                id: 'pet1',
                data: () => ({
                    ownerId: 'user1',
                    createdAt: ts, updatedAt: ts,
                    // most fields deliberately missing to test defaults
                }),
            }],
        });

        const result = await getPetsByOwnerId('user1');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Unknown');
        expect(result[0].type).toBe('Dog');
        expect(result[0].personalityTraits).toEqual([]);
    });

    it('throws when Firestore fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));

        await expect(getPetsByOwnerId('user1')).rejects.toThrow();
    });
});

// updatePetsOwnerGeopoint 

describe('updatePetsOwnerGeopoint', () => {
    it('updates the geopoint on all active pets for the user', async () => {
        const petDoc = { ref: 'petRef1' };
        mockGetDocs.mockResolvedValue({ empty: false, docs: [petDoc] });
        mockUpdateDoc.mockResolvedValue(undefined);

        await updatePetsOwnerGeopoint('user1', 51.5, -0.1);

        expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
        expect(mockUpdateDoc).toHaveBeenCalledWith('petRef1', {
            ownerGeopoint: { latitude: 51.5, longitude: -0.1 },
        });
    });

    it('does nothing when the user has no active pets', async () => {
        mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

        await updatePetsOwnerGeopoint('user1', 51.5, -0.1);

        expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('throws when Firestore fails', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));

        await expect(updatePetsOwnerGeopoint('user1', 0, 0)).rejects.toThrow();
    });
});

// getPendingVerificationPets 

describe('getPendingVerificationPets', () => {
    it('only returns pets that have a microchip number submitted', async () => {
        const ts = { toDate: () => new Date() };
        mockGetDocs.mockResolvedValue({
            docs: [
                {
                    id: 'pet1',
                    data: () => ({
                        name: 'Buddy', ownerId: 'u1', createdAt: ts, updatedAt: ts,
                        verification: { verified: false, microchipNumber: 'ABC123' },
                    }),
                },
                {
                    id: 'pet2',
                    data: () => ({
                        name: 'Max', ownerId: 'u2', createdAt: ts, updatedAt: ts,
                        verification: { verified: false, microchipNumber: '' },
                    }),
                },
            ],
        });

        const result = await getPendingVerificationPets();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('pet1');
    });

    it('returns an empty array when Firestore throws', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));

        expect(await getPendingVerificationPets()).toEqual([]);
    });
});

// updatePetVerification 
describe('updatePetVerification', () => {
    it('calls updateDoc when approving a pet', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        await updatePetVerification('pet1', true, 'admin1');

        const update = mockUpdateDoc.mock.calls[0][1];
        expect(update['verification.verified']).toBe(true);
        expect(update['verification.verifiedBy']).toBe('admin1');
    });

    it('clears verifiedBy when rejecting a pet', async () => {
        mockUpdateDoc.mockResolvedValue(undefined);

        await updatePetVerification('pet1', false, 'admin1');

        const update = mockUpdateDoc.mock.calls[0][1];
        expect(update['verification.verified']).toBe(false);
        expect(update['verification.verifiedBy']).toBeNull();
    });

    it('throws when updateDoc fails', async () => {
        mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

        await expect(updatePetVerification('pet1', true, 'admin1')).rejects.toThrow();
    });
});
