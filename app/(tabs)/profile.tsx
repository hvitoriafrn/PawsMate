// Profile screen, where users can view and edit their information and manage their pets

import { PetCard } from '@/components/PetCard';
import PetFormModal, { PetData } from '@/components/petFormModal';
import { auth } from '@/config/firebase';
import { useUser, useUserPets } from '@/hooks/firestore';
import { deletePet, updatePetsOwnerGeopoint } from '@/services/firebase/petService';
import { getUserById, updateUserLocation, updateUserProfile } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import { geocodeAddress, reverseGeocode } from '@/utils/geocoding';
import { pickImage, uploadImageToStorage } from '@/utils/imageUpload';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {

    // get the logged in user
    const { user: authUser, setProfile } = useUserStore();
    // Get the user data from firestore using the user id
    const { user, loading: userLoading, refetch: refetchUser} = useUser(authUser?.uid || null);
    // Get all pets owned by this user
    const { pets, loading: petsLoading, refetch: refetchPets } = useUserPets(authUser?.uid || null);
   
    // State to control the 'edit profile' modal
    const [isEditing, setIsEditing] = useState(false);
    // State to store form data when editing
    const [editedName, setEditedName] = useState('');
    const [editedBio, setEditedBio] = useState('');
    const [editedLocation, setEditedLocation] = useState('');
    const [locationError, setLocationError] = useState('');
    // Check for profile and pet are being saved
    const [savingProfile, setSavingProfile] = useState(false);
  
    // Controls the avatar upload spinner
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Banner upload!
    const [bannerUri, setBannerUri] = useState<string | null>(null);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Derive from geopoint, {0,0} means no location set
    const hasRealLocation = !!(user?.geopoint &&
        !(user.geopoint.latitude === 0 && user.geopoint.longitude === 0));
    const [locationEnabled, setLocationEnabled] = useState(hasRealLocation);
    const [locationUpdating, setLocationUpdating] = useState(false);

    // Pull to refresh
    const [refreshing, setRefreshing] = useState(false);

    // Controls the petFormModal, which handles add and edit pet modal
    const [petModalVisible, setPetModalVisible] = useState(false);
    const [editingPet, setEditingPet] = useState<PetData | undefined>(undefined);

    // Handler for the pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        // Run both at the same time rather than one and then the other
        await Promise.all([refetchUser(), refetchPets()]);
        setRefreshing(false);
    };

    // Handle the avatar upload
    const handleChangeAvatar = async () => {
        if (!authUser?.uid) return;
        setUploadingAvatar(true);
        try {
            const localUri = await pickImage();
            if (!localUri) return;

            // This will overwrite the old avatar
            const path = `users/${authUser.uid}/avatar.jpg`;
            const url = await uploadImageToStorage(localUri, path);

            // Save the URL to firestore
            await updateUserProfile(authUser.uid, { profilePicture: url });

            // Refresh so it shows immediately
            await refetchUser();
        } catch (error) {
            Alert.alert('Error', 'Could not update photo. Please try again.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Banner upload handler, similar to avatar but with different storage path and state
    const handleChangeBanner = async() => {
        if (!authUser?.uid) return;
        setUploadingBanner(true);
        try {
            const localUri = await pickImage();
            if (!localUri) return; // cancelled by user

            const path = `users/${authUser.uid}/banner.jpg`;
            const url = await uploadImageToStorage(localUri, path);

            // Save the banner URL to firestore
             await updateUserProfile(authUser.uid, { bannerPicture: url });

             // Update the local state 
             setBannerUri(url)
        } catch (error) {
            Alert.alert('Error', 'Could not update banner. Please try again');
        } finally {
            setUploadingBanner(false);
        }
    };


    // Save profile edits
    const handleSaveProfile = async () => {
        if (!authUser?.uid) return;
        if (!editedName.trim()) {
            Alert.alert('Name required', 'Please enter your name.');
            return;
        }

        setSavingProfile(true);
        setLocationError('');

        try {
            await updateUserProfile(authUser.uid, {
                name: editedName.trim(),
                bio: editedBio.trim(),
            });

            // Only update location if the user changed it
            const locationChanged = editedLocation.trim() !== (user?.location || '');
            if (locationChanged && editedLocation.trim()) {
                const coords = await geocodeAddress(editedLocation.trim());

                if (!coords) {
                    setLocationError('Location not found. Try a more specific name.');
                    setSavingProfile(false);
                    return;
                }

                // Update location on the user doc and on all their pets so distance filtering stays correct
                await updateUserLocation(authUser.uid, coords.latitude, coords.longitude, editedLocation.trim());
                await updatePetsOwnerGeopoint(authUser.uid, coords.latitude, coords.longitude);

                // Sync updated geopoint into the Zustand store so explore re-filters immediately
                const refreshed = await getUserById(authUser.uid);
                if (refreshed) setProfile(refreshed);
            }

            await refetchUser();
            setIsEditing(false);
        } catch (error) {
            Alert.alert('Error', 'Could not save profile. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    // Cancel edit, discard changes
    const handleCancelEdit = () =>  {
        // Restore the inputs to the last saved values
        if (user) {
            setEditedName(user.name);
            setEditedBio(user.bio);
            setEditedLocation(user.location || '');
        }
        setLocationError('');
        setIsEditing(false);
    };

    // Pet handlers 

    // Open petFormModal in Add new pet mode
    const handleAddPet = () => {
        setEditingPet(undefined);
        setPetModalVisible(true);
    };

    // open the modal in Edit Pet, prefilled with the existingpoi.k, pet's data
    const handleEditPet = (pet: any) => {
            setEditingPet({
            id: pet.id,
            name: pet.name,
            type: pet.type || 'Dog',
            breed: pet.breed,
            age: pet.age,
            gender: pet.gender || 'Male',
            size: pet.size || 'Medium',
            tags: pet.personalityTraits || [],  
            lookingFor: pet.lookingFor || [],
            vaccinated: pet.healthInfo?.vaccinated || false,
            spayedNeutered: pet.healthInfo?.spayedNeutered || false,
            healthNotes: pet.healthInfo?.healthNotes || '',
            microchipNumber: pet.verification?.microchipNumber || '',
            photo: pet.photo || pet.photos?.[0] || '',
            photos: pet.photos || (pet.photo ? [pet.photo] : []),
    });
    setPetModalVisible(true);
    };

    // Called by the petFormModal when a pet is saved
    const handlePetSaved = async () => {
        await refetchPets();
        setPetModalVisible(false);
    };

   // Delete a pet after a confirmation
   const handleDeletePet = async (pet: any) => {
        const confirmDelete = Platform.OS === 'web'
            ? confirm(`Are you sure you want to delete ${pet.name}?`)
            : await new Promise((resolve) => {
                Alert.alert(
                    'Delete Pet',
                    `Are you sure you want to delete ${pet.name}?`,
                    [
                        { text: 'Cancel', style: 'cancel', onPress:() => resolve(false) },
                        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
                    ]
                );
            });
            
        if (!confirmDelete) return;

        try {
            // deletePet will mark the pet as inactive and remove it from the user's petIds array
            await deletePet(pet.id);
            await refetchPets();
            Alert.alert('Success',`${pet.name} has been deleted`);
        } catch (error) {
            Alert.alert('Error', 'Failed to delete pet');
        }
   };

   // Log out!
   const handleSignOut = async () => {
        Alert.alert(
            'Sign Out', 
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel'},
                { 
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            router.replace('/auth/login');
                        } catch (error) {
                            Alert.alert('Error', 'Could not sign out. Please try again.')
                        }
                     },
                }
            ]
        );
   };

    // Loading state
    if (userLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F2B949"/>
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}> No user data found </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/auth/login')}
                >
                    <Text style={styles.buttonText}>Login again</Text>
                </TouchableOpacity>
            </View>
        );
    }


    // Render user profile card section
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f0f0' }}>  
            <ScrollView 
                style={styles.screen}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> 
                }
            >
            
                {/* Banner and avatar */}
                <View style={styles.bannerContainer}>

                    {/* Tapping the avatar will open the photo picker */}
                    <TouchableOpacity
                        onPress={handleChangeBanner}
                        disabled={!isEditing}
                        activeOpacity={isEditing ? 0.85 : 1}
                        style={{ width: '100%' }}
                    >
                        {uploadingBanner ? (
                            // a spinner overlay while it loads
                            <View style={[styles.banner, styles.bannerLoading]}>
                                <ActivityIndicator color="#fff" size="large"/>
                                <Text style={styles.bannerLoadingText}>Updating banner...</Text>
                            </View>
                        ) : bannerUri || user.bannerPicture ? ( 
                            //Show the uploaded banner
                            <Image 
                                source={{ uri: bannerUri || user.bannerPicture }}
                                style={styles.bannerImage}
                                resizeMode="cover"
                            />
                        ) : (
                            //Default banner 
                            <View style={styles.banner}>
                                { isEditing && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Feather name="camera" size={14} color="#f0f0f0" />
                                    <Text style={styles.bannerHint}>Tap to edit banner</Text>
                                </View>
                                )}
                            </View>
                        )}
                    </TouchableOpacity>

                    {/*Avatar, overlapping with banner */}
                    <TouchableOpacity
                        style={styles.avatarWrapper}
                        onPress={handleChangeAvatar}
                        activeOpacity={isEditing ? 0.85 : 1}
                        disabled={!isEditing}
                    >
                        {uploadingAvatar ? (
                            // A spinner shown while uploading
                            <View style={[styles.avatar, styles.avatarLoading]}>
                                <ActivityIndicator color="#F2B949"/>
                            </View>
                        ) : user.profilePicture ? (
                            <Image
                                source= {{ uri: user.profilePicture}}
                                style={styles.avatar}
                            />
                        ) : (
                            // show the first letter of the user's name as fall back
                            <View style={[styles.avatar, styles.avatarFallback]}>
                                <Text style={styles.avatarInitial}>
                                    {user.name.charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                            )}

                            {/* A camera emoji to show the user they can tap the avatar */}
                            { isEditing && (
                            <View style={styles.cameraBadge}>
                                <Feather name="camera" size={12} color="#555" />
                            </View>
                            )}
                    </TouchableOpacity>
                </View>

                {/* User profile card */}
                <View style={[styles.card, { 
                    marginTop: -1, 
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    paddingTop: 50,
                    }]}>
                    {isEditing ? (
                        <>
                            {/* Name and age */}
                            <View style={styles.fieldRow}>
                                <View style={{ flex:2 }}>
                                    <Text style={styles.fieldLabel}> Name </Text>
                                    <TextInput 
                                        style={styles.fieldInput}
                                        value={editedName}
                                        onChangeText={setEditedName}
                                        placeholder="Your name"
                                        placeholderTextColor="#aaa"
                                    />
                                </View>
                                <View style= {{ flex: 1, marginLeft:10 }}>
                                    <Text style={styles.fieldLabel}>Age</Text>
                                    <TextInput
                                        style={styles.fieldInput}
                                        value={user.age ? String(user.age) : ''}
                                        keyboardType="number-pad"
                                        maxLength={3}
                                        editable={true}
                                        placeholderTextColor="#aaa"
                                    />
                                </View>
                            </View>

                            <Text style={styles.fieldLabel}> Location </Text>
                            <TextInput
                                style={[styles.fieldInput, locationError ? styles.fieldInputError : null]}
                                value={editedLocation}
                                onChangeText={(text) => { setEditedLocation(text); setLocationError(''); }}
                                placeholder="e.g. Battersea, London"
                                placeholderTextColor="#aaa"
                            />
                            {locationError ? (
                                <Text style={styles.fieldErrorText}>{locationError}</Text>
                            ) : null}

                            <Text style={styles.fieldLabel}>Bio</Text>
                            <TextInput
                                style={[styles.fieldInput, styles.bioInput]}      
                                value={editedBio}
                                onChangeText={setEditedBio}
                                multiline
                                placeholder="Here goes your very interesting bio!"
                                placeholderTextColor="#aaa"
                                textAlignVertical="top"
                            />

                            {/* Save and cancel buttons */} 
                            <View style={styles.editBtnRow}>
                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={handleSaveProfile}
                                    disabled={savingProfile}
                                >
                                    {savingProfile
                                        ? <ActivityIndicator color="#fff"/>
                                        : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap:6 }}>
                                            <Feather name="save" size={16} color="#fff"/>
                                            <Text style={styles.saveBtnText}>Save</Text>
                                        </View> 
                                        )
                                    }
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={handleCancelEdit}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Feather name="x" size={16} color="#555" />
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </> 
                    ) : (                  
                    <>
                        {/* View  mode */}
                        <View style={styles.profileNameRow}>
                            <Text style={styles.profileName}>
                                {user.name}{user.age ? `, ${user.age}` : ''}
                            </Text>
                            {/* Tapping the pencil icon opens the edit form */}
                            <TouchableOpacity
                                onPress={() => {
                                    // Prefill the fields with existing values
                                    setEditedName(user.name);
                                    setEditedBio(user.bio);
                                    setEditedLocation(user.location || '');
                                    setLocationError('');
                                    setIsEditing(true);
                                }}
                            >
                                <Feather name="edit-2" size={14} color="#00c489" />
                            </TouchableOpacity>
                        </View>
                        
                        {user.location ? (
                            <Text style={styles.profileLocation}>
                                 {user.location}
                            </Text>
                        ) : null}

                            <Text style={styles.profileBio}>
                                {user.bio || "Tap ✏️  to add a bio"}
                            </Text>
                        </>
                    )}
                </View>

                {/* My pets */}
                <View style={styles.card}>
                    <View style={styles.petsHeader}>
                        <Text style={styles.sectionTitle}>My Pets</Text>
                        <TouchableOpacity
                            style={styles.addPetBtn}
                            onPress={handleAddPet}
                        >
                            <Text style={styles.addPetBtnText}>+ Add Pet</Text>
                        </TouchableOpacity>
                    </View>

                    {petsLoading ? (
                        <ActivityIndicator
                            color="#20B2AA"
                            style={{ marginVertical: 20}}
                        />
                    ) : pets.length === 0 ? (
                        <View style={styles.emptyPets}>
                            <Text style={styles.emptyPetsIcon}>🐾</Text>
                            <Text style={styles.emptyPetsText}>
                                No pets yet. Tap "Add Pet" to get started!
                            </Text>
                        </View>
                    ) : (
                        pets.map((pet) => (
                            <PetCard
                                key={pet.id}
                                pet={pet}
                                onEdit={() => handleEditPet(pet)}
                                onDelete={() => handleDeletePet(pet)}
                            />
                        ))
                    )}
                </View>

                {/* Location settings */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Location Settings</Text>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationLabel}>Share my location</Text>
                        {locationUpdating
                            ? <ActivityIndicator size="small" color="#F2B949" />
                            : <Switch
                                value={locationEnabled}
                                onValueChange={async (value) => {
                                    if (!authUser?.uid) return;
                                    setLocationUpdating(true);
                                    try {
                                        if (value) {
                                            // Ask for GPS permission
                                            const { status } = await Location.requestForegroundPermissionsAsync();
                                            if (status !== 'granted') {
                                                Alert.alert(
                                                    'Permission denied',
                                                    'Please enable location access in your device settings to use this feature.'
                                                );
                                                return;
                                            }
                                            const pos = await Location.getCurrentPositionAsync({});
                                            const { latitude, longitude } = pos.coords;
                                            const displayName = await reverseGeocode(latitude, longitude);
                                            await updateUserLocation(authUser.uid, latitude, longitude, displayName);
                                            await updatePetsOwnerGeopoint(authUser.uid, latitude, longitude);
                                            const refreshed = await getUserById(authUser.uid);
                                            if (refreshed) setProfile(refreshed);
                                            setLocationEnabled(true);
                                        } else {
                                            // Reset geopoint to {0,0} treated as "no location" everywhere
                                            await updateUserLocation(authUser.uid, 0, 0, '');
                                            await updatePetsOwnerGeopoint(authUser.uid, 0, 0);
                                            const refreshed = await getUserById(authUser.uid);
                                            if (refreshed) setProfile(refreshed);
                                            setLocationEnabled(false);
                                        }
                                    } catch (error) {
                                        Alert.alert('Error', 'Could not update location settings. Please try again.');
                                    } finally {
                                        setLocationUpdating(false);
                                    }
                                }}
                                trackColor={{ false: '#d1d5db', true: '#00c489' }}
                                thumbColor="#fff"
                            />
                        }
                    </View>
                    <Text style={styles.locationHelper}>
                        {locationEnabled
                            ? 'Your location is active. You can find and be found by nearby pets.'
                            : 'Location is off. Enable to find pets and events near you.'}
                    </Text>
                </View>

                {/* Admin panel link, only visible to admin users */}
                {user?.isAdmin && (
                    <TouchableOpacity
                        style={styles.adminBtn}
                        onPress={() => router.push('/admin' as any)}
                    >
                        <Feather name="shield" size={16} color="#F2B949" />
                        <Text style={styles.adminBtnText}>Admin panel</Text>
                        <Feather name="chevron-right" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                )}

                {/* Sign out */}
                <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={handleSignOut}
                >
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* Bottom padding */}
                <View style={{ height: 40 }} />
            </ScrollView>
            
            <PetFormModal
                visible={petModalVisible}
                onClose={() => setPetModalVisible(false)}
                onSaved={handlePetSaved}
                initialData={editingPet}
            />
        </SafeAreaView>
    );
}
 // Styles
const styles = StyleSheet.create({

    screen: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },

    // Loading & error states
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafaf0',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#F2B949',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Banner and avatar
    bannerContainer: {
        position: 'relative',
        marginBottom: 0, 
        marginHorizontal:12,
        borderRadius:16,
    },
    banner: {
        height: 100,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 16,  
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0, 
        borderBottomRightRadius: 0,
    },
    bannerImage: {
        width:'100%',
        height: 140,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    bannerLoading: {
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    bannerLoadingText: {
        color: '#fff',
        fontSize: 14,
    },
    bannerHint: {
        // hint text on the default banner
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },
    
    // Avatar style
    avatarWrapper: {
        position: 'absolute',
        bottom: -45,  // pushes the avatar to overlap the banner bottom
        left: 16,
        zIndex:10,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarLoading: {
        backgroundColor: '#e0f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarFallback: {
        backgroundColor: '#e0f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 36,
        fontWeight: '700',
        color: '#000000',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },

    // White card (profile information, pet and location)
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginHorizontal: 12,
        marginBottom: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },

    // Profile view mode
    profileNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },
    profileLocation: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
        marginBottom: 2,
    },
    profileBio: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginTop: 4,
    },

    // Profile edit move
     fieldRow: {
        flexDirection: 'row',
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
        marginTop: 10,
        marginBottom: 4,
    },
    fieldInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#fafafa',
    },
    bioInput: {
        height: 80,
        paddingTop: 8,
    },
    fieldInputError: {
        borderColor: '#ef4444',
    },
    fieldErrorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 3,
    },
    editBtnRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#F2B949',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 15,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    cancelBtnText: {
        color: '#555',
        fontWeight: '600',
        fontSize: 15,
    },

    // 'My pets' section
    petsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        textTransform: 'uppercase',
    },
    addPetBtn: {
        backgroundColor: '#F2B949',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    addPetBtnText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 14,
    },
    emptyPets: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyPetsIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    emptyPetsText: {
        fontSize: 14,
        color: '#aaa',
        textAlign: 'center',
    },

    //Location section
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    locationLabel: {
        fontSize: 16,
        color: '#374151',
    },
    locationHelper: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },

    // Admin button
    adminBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 12,
        marginBottom: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        backgroundColor: '#fffbeb',
    },

    adminBtnText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
    },

    //Sign out button
    signOutBtn: {
        marginHorizontal: 12,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginBottom: 12,
    },
    signOutText: {
        color: '#e05555',
        fontWeight: '600',
        fontSize: 15,
    },
});
