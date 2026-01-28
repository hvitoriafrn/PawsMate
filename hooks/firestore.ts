// Here go the react hooks related to Firestore

// Import the necessary modules
import {
    getActivePets,
    getAllUsers,
    getPetsByOwnerId,
    getUserById
} from '@/services/firebase/firestoreService';
import { useUserStore } from '@/store/userStore';
import { Pet, User } from '@/types/database';
import { calculateDistance } from '@/utils/distance';
import { useEffect, useState } from "react";


interface UseActivePetsProps {
    maxDistance?: number;
}
// Fetches all the active pets (this is for the Explore screen)

export const useActivePets = ({ maxDistance }: UseActivePetsProps = {}) => {

    // the list of Pets from the database
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useUserStore();
   

    useEffect(() => { 
        fetchPets(); // Gets the data immediately
    }, [maxDistance]);

    const fetchPets = async () => {
        try {
            // Starts loading
            setLoading(true);

            // Clear errors 
            setError(null);

            const fetchedPets = await getActivePets();

           if (!maxDistance || !user?.geopoint) {
                setPets(fetchedPets);
                // Log to console 
                console.log('Fetched ${fetchedPets.length} pets');
                return;
           }
           
           // filter pets by distance
            const petsWithDistance = await Promise.all(
                fetchedPets.map(async (pet) => {
                    try {
                        // Get the pet owner to access their location
                        const owner = await getUserById(pet.ownerId);
                        // If no location, include pet?
                        if (!owner?.geopoint) {
                            return { pet, distance: 0, includeAnyway: true};
                        }
                        
                        const distance = calculateDistance(
                            user.geopoint.latitude,
                            user.geopoint.longitude,
                            owner.geopoint.latitude,
                            owner.geopoint.longitude
                        );

                        return { pet, distance, includeAnyway: false};
                    } catch (error) {
                        console.error('Error getting owner for pet ${pet.id}:', error);
                        // if there was an error getting the owner, show pet anyway
                        return { pet, distance: 0, includeAnyway: true };
                    }
                })
            );

            // Filter pet within the maxDistance radius
            const filteredPets = petsWithDistance 
            .filter(({ distance, includeAnyway }) =>
                includeAnyway || distance <= maxDistance
        )
        .map(({ pet }) => pet);

        // Save filtered pets to state
        setPets(filteredPets);

        // Log to console
        console.log(
            `Fetched ${filteredPets.length}/${fetchedPets.length} pets within ${maxDistance}km`
            );

        } catch ( error: any) {
            // if anything goes wrong
            console.error('Error getting pets: ', error)
            setError(error.message || 'Failed to load pets');

        } finally {
            // Stops loading
            setLoading(false);
        }
    };

    return {
        pets, 
        loading, 
        error,
        refetch : fetchPets
    };
};

// Get a user by ID

export const useUser = (userId: string | null) => {

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Re-run when userId changes
    useEffect(() => {
        if (userId) {
            fetchUser();
        } else {
            // Stops loading if there's no userId provided
            setLoading(false);
        }
    }, [userId]);


    const fetchUser = async () => {
        if (!userId) return; 

        try {
            setLoading(true);
            setError(null);

            // Get user from Firestore
            const fetchedUser = await getUserById(userId);
            setUser(fetchedUser);

        } catch (error: any) {
            console.error('Error getting user:', error);
            setError(error.message);

        } finally {
            setLoading(false);
        }
    };

    return { user, loading, error, refetched: fetchUser };
};

// Get all the pets belonging to one user

export const useUserPets = (ownerId: string | null) => {

    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
 
    useEffect(() => {
        if (ownerId) {
            fetchPets();
        } else {
            setLoading(false);
        }
    }, [ownerId]);


    const fetchPets = async () => {
        if (!ownerId) return; 

        try {
            setLoading(true);
            setError(null);

            const fetchedPets = await getPetsByOwnerId(ownerId);
            setPets(fetchedPets);

        } catch (error: any) {
            console.error('Error fetching user pets: ', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { pets, loading, error, refetch: fetchPets };
};

// Fetch all the users in database 

export const useAllUser = () => {

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {

        try {
            setLoading(true);
            setError(null);

            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);

        } catch (error: any) {
            console.error('Error getting users: ', error);
            setError(error.message);

        } finally {
            setLoading(false);
        }
    };

    return { users, loading, error, refetch: fetchUsers };
};

// 
export const usePetWithOwner = (pet: Pet | null) => {

    const [owner, setOwner] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Reload and get owner when pet changes

    useEffect(() => {
        if (pet) {
            fetchOwner();           
        }
    }, [pet?.id]);

    const fetchOwner = async () => {
        if (!pet) return;

        try {
            setLoading(true);
            setError(null);

            const fetchedOwner = await getUserById(pet.ownerId);
            setOwner(fetchedOwner);

        } catch (error: any) {
            console.error('Error getting owner: ', error);
            setError(error.message);

        } finally {
            setLoading(false);
        }
    };
    
    return { owner, loading, error};
};