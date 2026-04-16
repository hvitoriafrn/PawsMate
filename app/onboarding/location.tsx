// app/onboarding/location.tsx
// After signup onboarding screen, used to collect the user's location.
// Shows a UK GDPR Article 13 consent notice before any data is collected,
// then lets the user choose between GPS or manual text entry.

import { updateUserLocation } from '@/services/firebase/firestoreService';
import { useUserStore } from '@/store/userStore';
import { geocodeAddress, reverseGeocode } from '@/utils/geocoding';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Which step of the flow 
type Step = 'consent' | 'choose' | 'manual' | 'saving' | 'done';

export default function LocationOnboardingScreen() {
    const router = useRouter();
    const { user } = useUserStore();

    const [step, setStep] = useState<Step>('consent');
    const [manualInput, setManualInput] = useState('');
    const [manualError, setManualError] = useState('');
    const [savedLocation, setSavedLocation] = useState('');
    const [isBusy, setIsBusy] = useState(false);

    // Save coordinates to Firestore then navigate to the main app
    const saveAndProceed = async (lat: number, lon: number, displayName: string) => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not found. Please try signing in again.');
            return;
        }

        setIsBusy(true);
        setStep('saving');

        try {
            await updateUserLocation(user.uid, lat, lon, displayName);
            setSavedLocation(displayName);
            setStep('done');

            // Short timeout so the success state is visible before navigating
            setTimeout(() => router.replace('/(tabs)'), 900);
        } catch (error) {
            console.error('Error saving location:', error);
            Alert.alert('Error', 'Unable to save your location. Please try again.');
            setStep('choose');
        } finally {
            setIsBusy(false);
        }
    };

    // GPS path, if user chooses to share. Requests permission then get coordinates
    const handleUseGPS = async () => {
        setIsBusy(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission denied',
                    'Location permission is required to use this feature. You can enable it in your device settings.',
                    [{ text: 'OK' }]
                );
                setIsBusy(false);
                return;
            }

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = position.coords;

            // Reverse geocode using Nominatim for the readable display name
            const displayName = await reverseGeocode(latitude, longitude);

            await saveAndProceed(latitude, longitude, displayName);

        } catch (error) {
            console.error('GPS error:', error);
            Alert.alert('Error', 'Could not get your location. Try again or enter it manually.');
            setIsBusy(false);
        }
    };

    // Manual path, if user choses not to share GPS data. Geocode the typed address text
    const handleManualSubmit = async () => {
        const trimmed = manualInput.trim();
        if (!trimmed) {
            setManualError('Please enter a location.');
            return;
        }

        setManualError('');
        setIsBusy(true);

        const coords = await geocodeAddress(trimmed);

        if (!coords) {
            setManualError('Location not found. Try a more specific name, e.g. "Battersea Park, London".');
            setIsBusy(false);
            return;
        }

        // Reverse geocode the coordinates so we store an area name, not the raw input
        // (important if the user typed a postcode, since we never want to store that)
        const displayName = await reverseGeocode(coords.latitude, coords.longitude);

        await saveAndProceed(coords.latitude, coords.longitude, displayName);
    };

    // Warn the user before skipping
    const handleSkip = () => {
        Alert.alert(
            'Skip location?',
            "Without location access you won't be able to see nearby pets or events.",
            [
                { text: 'Go back', style: 'cancel' },
                {
                    text: 'Skip anyway',
                    style: 'destructive',
                    onPress: () => router.replace('/(tabs)'),
                },
            ]
        );
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            {/* Icon + heading shown on all steps */}
            <View style={styles.iconWrap}>
                <Feather name="map-pin" size={30} color="#111" />
            </View>
            <Text style={styles.title}>Your location</Text>
            <Text style={styles.subtitle}>
                PawsMate uses your location to show nearby pets and events
            </Text>

            {/* GDPR consent notice is shown first */}
            {step === 'consent' && (
                <View style={styles.card}>
                    <View style={styles.gdprTitleRow}>
                        <Feather name="shield" size={16} color="#F2B949" />
                        <Text style={styles.gdprHeading}>How we use your location</Text>
                    </View>
                    <Text style={styles.gdprLegal}>UK GDPR Article 13 notice</Text>

                    <View style={styles.gdprItems}>
                        <GdprItem icon="user"        text="Controller: PawsMate (dissertation project)" />
                        <GdprItem icon="map-pin"     text="Purpose: Show nearby pets and events, and calculate distances between owners" />
                        <GdprItem icon="check-circle" text="Legal basis: Your consent (Art. 6(1)(a) UK GDPR)" />
                        <GdprItem icon="lock"        text="Your precise coordinates are never shared. Only approximate distance is shown to others" />
                        <GdprItem icon="clock"       text="Retention: Your location is stored until you update or delete your account" />
                        <GdprItem icon="info"        text="Your rights: Access, rectification, erasure, portability. Contact us via the in-app Help page" />
                        <GdprItem icon="x-circle"    text="You can update or remove your location at any time in your profile settings" />
                    </View>

                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('choose')}>
                        <Text style={styles.primaryBtnText}>I understand. Let's continue</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                        <Text style={styles.skipBtnText}>Skip for now</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Choose GPS or manual */}
            {step === 'choose' && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Set your location</Text>
                    <Text style={styles.cardSubtitle}>Choose how you'd like to share your location</Text>

                    <TouchableOpacity
                        style={[styles.optionBtnFilled, isBusy && styles.disabled]}
                        onPress={handleUseGPS}
                        disabled={isBusy}
                    >
                        {isBusy ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Feather name="navigation" size={18} color="#" style={styles.optionIcon} />
                                <View>
                                    <Text style={styles.optionLabelFilled}>Use my current location</Text>
                                    <Text style={styles.optionDesc}>Detected automatically via GPS</Text>
                                </View>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionBtnOutline, isBusy && styles.disabled]}
                        onPress={() => setStep('manual')}
                        disabled={isBusy}
                    >
                        <Feather name="edit-2" size={18} color="#111" style={styles.optionIcon} />
                        <View>
                            <Text style={styles.optionLabelOutline}>Enter location manually</Text>
                            <Text style={styles.optionDesc}>Type a neighbourhood, city, or postcode</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                        <Text style={styles.skipBtnText}>Skip for now</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Manual text entry */}
            {step === 'manual' && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ width: '100%' }}
                >
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.backRow}
                            onPress={() => { setStep('choose'); setManualError(''); }}
                        >
                            <Feather name="arrow-left" size={16} color="#6b7280" />
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>

                        <Text style={styles.cardTitle}>Enter your location</Text>
                        <Text style={styles.cardSubtitle}>
                            Try a neighbourhood or city, e.g. "Battersea" or "Manchester"
                        </Text>

                        <TextInput
                            style={[styles.textInput, manualError ? styles.textInputError : null]}
                            placeholder="e.g. Battersea, London"
                            placeholderTextColor="#9ca3af"
                            value={manualInput}
                            onChangeText={(text) => { setManualInput(text); setManualError(''); }}
                            returnKeyType="search"
                            onSubmitEditing={handleManualSubmit}
                            autoFocus
                        />

                        {manualError ? (
                            <Text style={styles.errorText}>{manualError}</Text>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.primaryBtn, isBusy && styles.disabled]}
                            onPress={handleManualSubmit}
                            disabled={isBusy}
                        >
                            {isBusy ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryBtnText}>Set location</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                            <Text style={styles.skipBtnText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* Saving spinner */}
            {step === 'saving' && (
                <View style={styles.centred}>
                    <ActivityIndicator size="large" color="#F2B949" />
                    <Text style={styles.savingText}>Saving your location…</Text>
                </View>
            )}

            {/* Success state */}
            {step === 'done' && (
                <View style={styles.centred}>
                    <View style={styles.successCircle}>
                        <Feather name="check" size={32} color="#fff" />
                    </View>
                    <Text style={styles.successTitle}>Location set!</Text>
                    {savedLocation ? (
                        <Text style={styles.successLocation}>{savedLocation}</Text>
                    ) : null}
                </View>
            )}
        </ScrollView>
    );
}

// Small helper to render a single GDPR notice row
function GdprItem({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.gdprRow}>
            <Feather name={icon as any} size={13} color="#F2B949" style={styles.gdprRowIcon} />
            <Text style={styles.gdprRowText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 24,
        paddingTop: 64,
        paddingBottom: 48,
        alignItems: 'center',
    },
    iconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        paddingHorizontal: 8,
    },

    // Card wrapper
    card: {
        width: '100%',
        backgroundColor: '#fafafa',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },

    // GDPR notice
    gdprTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    gdprHeading: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    gdprLegal: {
        fontSize: 11,
        color: '#9ca3af',
        marginBottom: 16,
    },
    gdprItems: {
        gap: 10,
        marginBottom: 20,
    },
    gdprRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    gdprRowIcon: {
        marginTop: 2,
        marginRight: 10,
        flexShrink: 0,
    },
    gdprRowText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 19,
        flex: 1,
    },

    // Card content
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },

    // Option buttons
    optionBtnFilled: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2B949',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        minHeight: 58,
    },
    optionBtnOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        minHeight: 58,
        borderWidth: 1.5,
        borderColor: '#F2B949',
    },
    optionIcon: {
        marginRight: 14,
    },
    optionLabelFilled: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 2,
    },
    optionLabelOutline: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 2,
    },
    optionDesc: {
        fontSize: 12,
        color: '#111',
    },

    // Manual input
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 6,
    },
    backText: {
        fontSize: 14,
        color: '#6b7280',
    },
    textInput: {
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    textInputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: 13,
        color: '#ef4444',
        marginBottom: 10,
    },

    // Buttons
    primaryBtn: {
        backgroundColor: '#F2B949',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        minHeight: 52,
        justifyContent: 'center',
        marginTop: 4,
    },
    primaryBtnText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '600',
    },
    skipBtn: {
        padding: 14,
        alignItems: 'center',
    },
    skipBtnText: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
    },
    disabled: {
        opacity: 0.6,
    },

    // Saving / done
    centred: {
        alignItems: 'center',
        paddingTop: 40,
    },
    savingText: {
        marginTop: 16,
        fontSize: 15,
        color: '#6b7280',
    },
    successCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },
    successLocation: {
        fontSize: 15,
        color: '#6b7280',
    },
});
