// Hook to handle location access and device's permisions

import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';


// Define the structure of the location data being returned
interface UserLocation {
    latitude: number;
    longitude: number;
    city?: string;
    region?: string;
}

export const useLocation = () => {
    
    //store the current location
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    // Store any errors
    const [error, setError] = useState<string | null>(null);

    // Request location permissions from the user

    const requestLocationPermision = async (): Promise<boolean> => {

        try {
            // Checks what is the current permission status 
            const { status: existingStatus } = 
            await Location.getForegroundPermissionsAsync();
            
            let finalStatus = existingStatus;

            // if not already granted, request the permission
            if (existingStatus !== 'granted') {
                const {status } = 
                await Location.requestForegroundPermissionsAsync();
                finalStatus = status;
            }

            // if the user denies the permission, inform them
            if (finalStatus !== 'granted') {
                setError('Permission to access location services was denied');
                Alert.alert (
                    'Location Permission Required',
                    'PawsMate requires your location to show you nearby pets. Please enable location access.',
                    [{text: 'OK'}]
                );
                return false;
            }
            return true;
        } catch (error) {
            console.log('Error requestion location permisison: ', error);
            setError('Failed to request location permission');
            return false;
        }
};

// Get the user's current location from the devices GPS

const getCurrentLocation = async (): Promise<UserLocation | null> => {
    try {
        setLoading(true);
        setError(null);

        // Check/request permission
        const hasPermission = await requestLocationPermision();
        if (!hasPermission) {
            setLoading(false);
            return null
        }

        const locationData = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = locationData.coords;

        // Uses the geocode to 'translate it' to city + region
        try {
            const address = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (address && address.length > 0) {
                const userLocation: UserLocation = {
                    latitude,
                    longitude,
                    city: address[0].city || undefined,
                    region: address[0].region || undefined,
                };

                setLocation(userLocation);
                setLoading(false);
                return userLocation;
            }

        } catch (geocodeError) {
            console.warn('Reverse geocoding failed: ', geocodeError);
        }

        // If the reverse geocoding fails, returns the coordinates
        const userLocation: UserLocation = {
            latitude,
            longitude,
        };

        setLocation(userLocation);
        setLoading(false);
        return userLocation;

    } catch (error) {
        console.error('Error getting the location: ', error);
        setError('Failed to get the location');
        setLoading(false);

        Alert.alert(
            'Location Error', 
            'Unable to get your current location.',
        [{text: 'OK'}]
        );
        return null;
    }
};

return {
    location,
    loading,
    error, 
    getCurrentLocation,
    requestLocationPermision,
    };
};

