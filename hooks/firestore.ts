import { getActivePets, getPetsByOwnerId } from '@/services/firebase/petService';
import { getAllUsers, getUserById } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import { Pet, User } from '@/types/database';
import { calculateDistance } from '@/utils/distance';
import { useEffect, useState } from "react";


interface UseActivePetsProps {
    maxDistance?: number;
}
export const useActivePets = ({ maxDistance }: UseActivePetsProps = {}) => {

    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { profile, user } = useUserStore();

    // Re-fetch when the radius changes or when the user's own geopoint changes
    const geoKey = profile?.geopoint
        ? `${profile.geopoint.latitude},${profile.geopoint.longitude}`
        : null;

    useEffect(() => {
        if (user?.uid) fetchPets();
    }, [maxDistance, geoKey, user?.uid]);

    const fetchPets = async () => {
        try {
            setLoading(true);
            setError(null);

            const fetchedPets = await getActivePets();

            // Always read the latest profile from the store rather than relying on the
            // render-time closure, preventing stale location data on Android where closures
            // can outlive multiple renders before the effect re-runs
            const currentProfile = useUserStore.getState().profile;

            // Skip distance filtering if no radius set, or geopoint is still the 0,0
            // placeholder set at signup before the user has added a real location
            const hasRealLocation = currentProfile?.geopoint &&
               !(currentProfile.geopoint.latitude === 0 && currentProfile.geopoint.longitude === 0);

            if (!maxDistance || !hasRealLocation) {
                setPets(fetchedPets);
                console.log(`Fetched ${fetchedPets.length} pets (no location filter)`);
                return;
            }

            const petsWithDistance = await Promise.all(
                fetchedPets.map(async (pet) => {
                    try {
                        const owner = await getUserById(pet.ownerId);
                        if (!owner?.geopoint) {
                            return { pet, distance: 0, includeAnyway: true };
                        }

                        const distance = calculateDistance(
                            currentProfile.geopoint.latitude,
                            currentProfile.geopoint.longitude,
                            owner.geopoint.latitude,
                            owner.geopoint.longitude
                        );

                        return { pet, distance, includeAnyway: false };
                    } catch (error) {
                        console.error(`Error getting owner for pet ${pet.id}:`, error);
                        return { pet, distance: 0, includeAnyway: true };
                    }
                })
            );

            const filteredPets = petsWithDistance
                .filter(({ distance, includeAnyway }) => includeAnyway || distance <= maxDistance)
                .map(({ pet }) => pet);

            setPets(filteredPets);
            console.log(`Fetched ${filteredPets.length}/${fetchedPets.length} pets within ${maxDistance}km`);

        } catch (error: any) {
            console.error('Error getting pets: ', error);
            setError(error.message || 'Failed to load pets');
        } finally {
            setLoading(false);
        }
    };

    return {
        pets,
        loading,
        error,
        refetch: fetchPets
    };
};

export const useUser = (userId: string | null) => {

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [userId]);


    const fetchUser = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            const fetchedUser = await getUserById(userId);
            setUser(fetchedUser);

        } catch (error: any) {
            console.error('Error getting user:', error);
            setError(error.message);

        } finally {
            setLoading(false);
        }
    };

    return { user, loading, error, refetch: fetchUser };
};

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

export const usePetWithOwner = (pet: Pet | null) => {

    const [owner, setOwner] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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