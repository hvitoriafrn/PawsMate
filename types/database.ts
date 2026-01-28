
export type PetType = 'Dog' | 'Cat';
export type PetSize = 'Small' | 'Medium' | 'Large';
export type PetGender = 'Male' | 'Female';

// Personality traits that can be associated with pets
export type PersonalityTrait =
  | 'Friendly'
  | 'Energetic'
  | 'Calm'
  | 'Playful'
  | 'Good with kids'
  | 'Good with other pets'
  | 'Loves walks'
  | 'Loves cuddles'
  | 'Well-trained'
  | 'Shy'
  | 'Protective'
  | 'Social'
  | 'Reserved'
  | 'Puppy'
  | 'Senior'
  | 'Rescue'
  | 'Indoor'
  | 'Outdoor';

// Types of interactions or connections users might be looking for
  export type LookingFor =
  | 'Playdates' 
  | 'Walking buddies' 
  | 'Hiking buddies'
  | 'Breeding'
  | 'Training tips'
  | 'Pet sitting exchange'
  | 'Grooming tips';

// Represent a user profile in the database
export interface User {
    uid: string;
    email: string;
    name: string;
    age: number;
    isActive: boolean;
    createdAt: Date;
    location: string;
    geopoint: { // this field represents geographical coordinates
        latitude: number;
        longitude: number;
    };
    profilePicture: string;
    bio: string;
    verified: boolean;
    interests: string[];
    petIds: string[];
}

// Represent the pet profile
export interface Pet {
    id: string;
    ownerId: string; // reference to User id
    name: string;
    age: number;
    type: PetType;
    breed: string;
    gender: PetGender;
    size: PetSize
    temperament: string;
    photo: string;
    photos?: string[];
    personalityTraits: PersonalityTrait[];
    lookingFor: LookingFor[];
    healthInfo: {
        spayedNeutered: boolean;
        specialNeeds?: string;
        vaccinated: boolean;
        healthNotes?: string;
    }
    verification: {
        microchipNumber?: string;
        verified: boolean;
        verifiedAt?: Date;
        verifiedBy?: string; // admin user id
    }
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}


export interface Like {
    id: string;
    userId: string; // reference to User id who did the liking
    petId: string; // which pet was liked 
    ownerId: string; // reference to the owner of the liked pet
    userPetId: string; // reference to which of the pet of the user was used to like
    action: 'like' | 'pass';
    createdAt: Date;
    matched: boolean;
    matchedAt?: Date;
}