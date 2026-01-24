// constants/mockData.ts

// ============================================================
// IMPORT OUR TYPES
// ============================================================
// We import the interfaces we just created so TypeScript can check our data

import { Pet, User } from '@/types/database';

// ============================================================
// MOCK USERS (Pet Owners)
// ============================================================
// These are sample user profiles
// In real app, these come from Firebase Auth + Firestore

export const mockUsers: User[] = [
    {
        id: 'user1',
        email: 'sarah.johnson@email.com',
        name: 'Sarah Johnson',
        age: 28,
        location: 'San Francisco, CA',
        geopoint: {
            latitude: 37.7749,      // SF coordinates
            longitude: -122.4194
        },
        profilePicture: 'https://i.pravatar.cc/150?img=1',  // Random avatar service
        bio: 'Dog lover and outdoor enthusiast! Love hiking trails and beach walks with Max.',
        verified: true,
        isActive: true,
        createdAt: new Date('2024-01-15')
    },
    {
        id: 'user2',
        email: 'mike.chen@email.com',
        name: 'Mike Chen',
        age: 32,
        location: 'San Francisco, CA',
        geopoint: {
            latitude: 37.7849,
            longitude: -122.4094
        },
        profilePicture: 'https://i.pravatar.cc/150?img=2',
        bio: 'Cat dad and coffee enthusiast ☕ My cat Whiskers runs my life and I wouldn\'t have it any other way!',
        verified: true,
        isActive: true,
        createdAt: new Date('2024-02-01')
    },
    {
        id: 'user3',
        email: 'emma.wilson@email.com',
        name: 'Emma Wilson',
        age: 25,
        location: 'Oakland, CA',
        geopoint: {
            latitude: 37.8044,
            longitude: -122.2712
        },
        profilePicture: 'https://i.pravatar.cc/150?img=3',
        bio: 'First-time dog owner looking for training tips and socializing opportunities for Luna!',
        verified: false,
        isActive: true,
        createdAt: new Date('2024-03-10')
    },
    {
        id: 'user4',
        email: 'james.rodriguez@email.com',
        name: 'James Rodriguez',
        age: 35,
        location: 'Berkeley, CA',
        geopoint: {
            latitude: 37.8715,
            longitude: -122.2730
        },
        profilePicture: 'https://i.pravatar.cc/150?img=4',
        bio: 'Experienced breeder and trainer. Happy to share knowledge with fellow pet parents!',
        verified: true,
        isActive: false,
        createdAt: new Date('2023-11-20')
    }
];

// ============================================================
// MOCK PETS
// ============================================================
// Sample pet profiles that will show up in Explore cards
// Each pet links to an owner via ownerId

export const mockPets: Pet[] = [
    {
        id: 'pet1',
        ownerId: 'user1',           // Sarah's dog
        name: 'Max',
        type: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
        gender: 'Male',
        size: 'Large',
        temperament: 'Friendly and outgoing, loves meeting new dogs and people',
        photo: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800',
        photos: [
            'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800',
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'
        ],
        personalityTraits: ['Friendly', 'Loves walks', 'Good with kids', 'Well-trained'],
        lookingFor: ['Playdates', 'Walking buddies', 'Hiking buddies'],
        healthInfo: {
            vaccinated: true,
            spayedNeutered: true,
            specialNeeds: 'none',
            healthNotes: 'Up to date on all vaccinations. No known allergies.'
        },
        verification: {
            microchipNumber: '985112345678901',
            verified: true,
            verifiedBy: 'admin1',
            verifiedAt: new Date('2024-01-20')
        },
        active: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    },
    {
        id: 'pet2',
        ownerId: 'user2',           // Mike's cat
        name: 'Whiskers',
        type: 'Cat',
        breed: 'Maine Coon',
        age: 4,
        gender: 'Male',
        size: 'Large',
        temperament: 'Calm and affectionate, enjoys lounging and occasional play',
        photo: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800',
        photos: [
            'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800'
        ],
        personalityTraits: ['Calm', 'Playful', 'Social', 'Indoor'],
        lookingFor: ['Training tips', 'Pet sitting exchange'],
        healthInfo: {
            vaccinated: true,
            spayedNeutered: true,
            specialNeeds: 'none',
            healthNotes: 'Indoor only. Prefers quiet environments.'
        },
        verification: {
            microchipNumber: '985112345678902',
            verified: true,
            verifiedBy: 'admin1',
            verifiedAt: new Date('2024-02-05')
        },
        active: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
    },
    {
        id: 'pet3',
        ownerId: 'user3',           // Emma's dog
        name: 'Luna',
        type: 'Dog',
        breed: 'Border Collie',
        age: 1,
        gender: 'Female',
        size: 'Medium',
        temperament: 'Very energetic and playful, still learning commands',
        photo: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800',
        photos: [
            'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800'
        ],
        personalityTraits: ['Energetic', 'Playful', 'Friendly', 'Puppy'],
        lookingFor: ['Playdates', 'Training tips', 'Walking buddies'],
        healthInfo: {
            vaccinated: true,
            spayedNeutered: false,
            specialNeeds: 'none',
            healthNotes: 'Puppy vaccines complete. Scheduled for spay next month.'
        },
        verification: {
            verified: false
        },
        active: true,
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10')
    },
    {
        id: 'pet4',
        ownerId: 'user4',           // James's dog
        name: 'Bella',
        type: 'Dog',
        breed: 'German Shepherd',
        age: 5,
        gender: 'Female',
        size: 'Large',
        temperament: 'Protective and loyal, well-trained and obedient',
        photo: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800',
        photos: [
            'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800'
        ],
        personalityTraits: ['Protective', 'Well-trained', 'Social', 'Friendly'],
        lookingFor: ['Breeding', 'Training tips', 'Playdates'],
        healthInfo: {
            vaccinated: true,
            spayedNeutered: false,
            specialNeeds: 'none',
            healthNotes: 'Excellent health. Show quality lineage.'
        },
        verification: {
            microchipNumber: '985112345678903',
            verified: true,
            verifiedBy: 'admin1',
            verifiedAt: new Date('2023-12-01')
        },
        active: true,
        createdAt: new Date('2023-11-20'),
        updatedAt: new Date('2023-11-20')
    },
    {
        id: 'pet5',
        ownerId: 'user1',           // Sarah has another pet!
        name: 'Charlie',
        type: 'Dog',
        breed: 'Labrador',
        age: 2,
        gender: 'Male',
        size: 'Large',
        temperament: 'Super energetic, loves water and retrieving',
        photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
        photos: [
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'
        ],
        personalityTraits: ['Energetic', 'Loves walks', 'Playful', 'Good with kids'],
        lookingFor: ['Playdates', 'Hiking buddies', 'Walking buddies'],
        healthInfo: {
            vaccinated: true,
            spayedNeutered: true,
            specialNeeds: '',
            healthNotes: 'Loves swimming. Great with children.'
        },
        verification: {
            microchipNumber: '985112345678904',
            verified: true,
            verifiedBy: 'admin1',
            verifiedAt: new Date('2024-01-25')
        },
        active: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    },
    {
        id: 'pet6',
        ownerId: 'user3',           // Emma has a cat too!
        name: 'Mittens',
        type: 'Cat',
        breed: 'Domestic Shorthair',
        age: 3,
        gender: 'Female',
        size: 'Small',
        temperament: 'Shy and reserved, warms up slowly to new people',
        photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
        photos: [
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'
        ],
        personalityTraits: ['Shy', 'Calm', 'Indoor'],
        lookingFor: ['Pet sitting exchange'],
        healthInfo: {
            vaccinated: true,
            spayedNeutered: true,
            specialNeeds: 'Requires quiet environment, easily stressed',
            healthNotes: 'Sensitive to loud noises. Prefers calm households.'
        },
        verification: {
            verified: false
        },
        active: true,
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10')
    }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
// Utility functions to work with mock data easily

/**
 * Get owner details for a specific pet
 * @param pet - The pet object
 * @returns The owner object or undefined
 */
export const getOwnerForPet = (pet: Pet): User | undefined => {
    return mockUsers.find(user => user.id === pet.ownerId);
};

/**
 * Get all pets belonging to a specific owner
 * @param ownerId - The owner's unique ID
 * @returns Array of pets owned by this person
 */
export const getPetsForOwner = (ownerId: string): Pet[] => {
    return mockPets.filter(pet => pet.ownerId === ownerId);
};

/**
 * Filter pets by type (dog, cat, etc.)
 * @param types - Array of pet types to include
 * @returns Array of pets matching any of those types
 */
export const filterPetsByTypes = (types: string[]): Pet[] => {
    if (types.length === 0) return mockPets;
    return mockPets.filter(pet => types.includes(pet.type));
};

/**
 * Calculate distance between two geopoints (simplified)
 * @param lat1, lon1 - First coordinate
 * @param lat2, lon2 - Second coordinate
 * @returns Distance in miles (approximate)
 */
export const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
): number => {
    // Simplified Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
};