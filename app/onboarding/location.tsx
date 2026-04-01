import { useLocation } from '@/hooks/useLocation';
import { updateUserLocation } from '@/services/firebase/firestoreService';
import { useUserStore } from '@/store/userStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


export default function LocationOnboardingScreen() {
    const router = useRouter();
    const { location, loading, getCurrentLocation } = useLocation();
    const { user } = useUserStore();
    const [locationEnabled, setLocationEnable] = useState(false);
    const [saving, setSaving] = useState(false);

    // Handle the enable location button when pressed
    const handleEnableLocation = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not found. Please try signing in again.');
            return;
        }

        // get the location
        const userLocation = await getCurrentLocation();

        if (!userLocation) {
            // if getting location fails, show an alert
            return;
        }

        try {
            setSaving(true);

            // Save the location to Firestore
            await updateUserLocation(
                user.uid,
                userLocation.latitude,
                userLocation.longitude,
                userLocation.city && userLocation.region 
                ? `${userLocation.city}, ${userLocation.region}`
                : `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
            );

            setLocationEnable(true);

            console.log('Location saved to Firestore: ', userLocation);

            // A delay to show the success state
            setTimeout(() => {
                // Navigate to next step
                router.replace('/(tabs)')
            }, 800);


            } catch (error) {
                console.error('Error saving location:', error);
                Alert.alert(
                    'Error',
                    'Unable to save your location. Please try again'
                );
            } finally {
                setSaving(false);
            }
        };

        //  Skip button to not add the location

        const handleSkip = () => {
            Alert.alert(
                'Skip location?',
                'Without location access, you won\'t be able to see nearby pets.',
                [
                    { text: 'Go back', style: 'cancel' },
                    {
                        text: 'Skip Anyway',
                        style: 'destructive',
                        onPress: () => router.replace('/(tabs)'),
                    }
                ]
            );
        };
    

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <Feather name="map-pin"  size={24} color='#00000'/>,
                <Text style={styles.title}> Enable Location </Text>
                <Text style={styles.subtitle}>
                    PawsMate uses your location to show nearby Pets & Events
                </Text>ßß
        </View>
    
        {/* Privacy Note */}
        <View style= {styles.privacyNote}>
            <Text style= {styles.privacyText}>
                Your exact location is never shared with other users.
            </Text>
        </View>
 
        {location && locationEnabled && (
            <View style={styles.successBox}>
                <Text style={styles.successIcon}> ✓ </Text>
                <Text style={styles.successTitle}> Location enabled successfully! </Text>
                {location.city && (
                    <Text style={styles.successText}>
                        {location.city}, {location.region}
                    </Text>
                )}
            </View>
        )}

        // Pushes buttons to bottom
        <View style={{ flex: 1 }}/>

        // Action buttons 
        <View style={styles.buttonContainer}>
            //Enable location button
            <TouchableOpacity
                style= {[
                    styles.enableButton, 
                    (locationEnabled || loading || saving) && styles.enableButtonDisabled,
            ]}
            onPress={handleEnableLocation}
            disabled={locationEnabled || loading || saving}
            >
            {loading || saving ? (
                < ActivityIndicator color ="white"/>
            ) : locationEnabled ? (
                <Text style={styles.enableButtonText}> Location enabled </Text>                   
            ) : (
                <Text style={styles.enableButtonText}> Enable location access</Text>
            )}
            </TouchableOpacity>

            {!locationEnabled && (
                <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={loading || saving}
                >
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
            )}
            </View>
        </View>

    );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    marginTop: 60,
    marginBottom: 32,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  privacyNote: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 24,
  },
  privacyText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#d1fae5',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  successText: {
    fontSize: 16,
    color: '#065f46',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  enableButton: {
    backgroundColor: '#F2B949',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  enableButtonDisabled: {
    backgroundColor: '#6ee7b7',
  },
  enableButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 18,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});