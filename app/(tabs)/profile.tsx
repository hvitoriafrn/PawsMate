// placeholder for profile screen

import { useUser, useUserPets } from '@/hooks/firestore';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    createPet,
    deletePet,
    updatePet,
    updateUserProfile
} from '@/services/firebase/firestoreService';


export default function ProfileScreen() {
    // get the logged in user 
    const { user: authUser } = useUserStore();
    const router = useRouter();

    // Get the user data from firestore using the user id
    const { user, loading: userLoading, refetch: refetchUser} = useUser(authUser?.uid || null);
    
    // Get all pets owned by this user
    const { pets, loading: petsLoading, refetch: refetchPets } = useUserPets(authUser?.uid || null);
   
    // State to control the 'edit profile' modal
    const [editProfileVisible, setEditProfileVisible] = useState(false);
   
    // State for controlling the Add pet modal
    const [addPetVisible, setAddPetVisible] = useState(false);
   
    // State to store form data when editing
    const [editedName, setEditedName] = useState('');
    const [editedBio, setEditedBio] = useState('');

    // State to store new pet data
    const [newPetName, setNewPetName] = useState('');
    const [newPetBreed, setNewPetBreed] = useState('');
    const [newPetAge, setNewPetAge] = useState('1');

    // State to control the edit pet modal
    const [editPetVisible, setEditPetVisible] = useState(false);
    const [editingPetId, setEditingPetId] = useState<string | null>(null);
    const [editPetName, setEditPetName] = useState('');
    const [editPetBreed, setEditPetBreed] = useState('');
    const [editPetAge, setEditPetAge] = useState('1');

    // Check for profile and pet are being saved
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPet, setSavingPet] = useState(false);

    // Show loading while the user data is fetched from Firestore
    if (userLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading profile...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No user data found</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/auth/login')}
                >
                    <Text style={styles.buttonText}>Login again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // User profile card section
    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* User profile card */}
                <View style={styles.profileCard}>
                    <Image 
                        source={{ uri: user.profilePicture }}
                        style={styles.profileImage}
                    />

                    {/* User name and age */}
                    <Text style={styles.userName}>
                        {user.name}, {user.age}
                    </Text>

                    {/* Location */}
                    <Text style={styles.userLocation}>
                        📍 {user.location}
                    </Text>

                    {/* Bio */}
                    <Text style={styles.userBio}>{user.bio}</Text>

                    {/* Edit Profile button */}
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                            setEditedName(user.name);
                            setEditedBio(user.bio);
                            //show the edit modal
                            setEditProfileVisible(true);
                        }}
                    >
                        <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Location section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location settings</Text>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationLabel}>Share my location</Text>
                        {/* Switch component to toggle on or off*/}
                        <Switch 
                            value={true}
                            onValueChange={(value) => {
                                Alert.alert(
                                    'Location',
                                    value ? 'Location enabled' : 'Location disabled'
                                );
                            }}
                            trackColor={{ false: '#d1d5db', true: '#10b981' }}
                            thumbColor="#fff"
                        />
                    </View>

                    <Text style={styles.locationHelper}>
                        When enabled, users nearby can see your pets and you will be able to find nearby users!
                    </Text>
                </View>

                {/* Pets Section */}
                <View style={styles.section}>
                    {/* Section header */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>My Pets:</Text>

                        <TouchableOpacity
                            style={styles.addButton} 
                            onPress={() => setAddPetVisible(true)}
                        >
                            <Text style={styles.addButtonText}>+ Add Pet</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Show loading while pets are being fetched */}
                    {petsLoading ? (
                        <Text style={styles.loadingText}>Loading pets...</Text>
                    ) : pets.length === 0 ? (
                        // Show empty state if user has no pets yet
                        <View style={styles.emptyPets}>
                            <Text style={styles.emptyPetsText}>🐾</Text>
                            <Text style={styles.emptyPetsSubtext}>
                                You have no pets yet. Add your first pet!
                            </Text>
                        </View>
                    ) : (
                        // Show list of pets if they have any
                        pets.map((pet) => (
                            <View key={pet.id} style={styles.petCard}>
                                {/* Pet Photo */}
                                <Image
                                    source={{ uri: pet.photo }}
                                    style={styles.petPhoto}
                                />
                                
                                {/* Pet Info */}
                                <View style={styles.petInfo}>
                                    <Text style={styles.petName}>{pet.name}</Text>
                                    <Text style={styles.petDetails}>
                                        {pet.breed} • {pet.age} years
                                    </Text>
                                    <Text style={styles.petSize}>Size: {pet.size}</Text>
                                </View>
                                
                                {/* Edit button for this pet */}
                                <TouchableOpacity
                                    onPress={() => {
                                        // Store the pet being edited
                                        setEditingPetId(pet.id);

                                        // The form is prefilled with the current data (so it doesn't show blank)
                                        setEditPetName(pet.name);
                                        setEditPetBreed(pet.breed);
                                        setEditPetAge(pet.age.toString());
                                        // Show the edit modal
                                        setEditPetVisible(true);
                                    }}
                                >
                                    <Text style={styles.editIcon}>✏️</Text>
                                </TouchableOpacity>
                
                                {/* Delete pet button */}
                                <TouchableOpacity 
                                    onPress={async () =>{
                                        console.log('Delete button pressed for pet : ', pet.name);
                                        // Confirm deletion with an alert
                                        const confirmDelete = Platform.OS === 'web'
                                            ? confirm(`Are you sure you want to delete ${pet.name}?`)
                                            : await new Promise((resolve) => {
                                                Alert.alert(
                                                    'Delete Pet',
                                                    `Are you sure you want to delete ${pet.name}?`,
                                            [
                                                { 
                                                    text: 'Cancel',
                                                    style: 'cancel',
                                                    onPress: () => resolve(false)
                                                },
                                                {
                                                    text: 'Delete',
                                                    style: 'destructive',
                                                    onPress: () => resolve(true),
                                                },
                                            ]
                                        );
                                    });

                                    if (!confirmDelete) {
                                        console.log('Delete cancelled');
                                        return;
                                    }

                                    console.log('Delete confirmed');
                                    try {
                                        await deletePet(pet.id);
                                        await refetchPets();
                                        Alert.alert('Success', `${pet.name} has been deleted`)
                                    } catch (error) {
                                        console.error('Error deleting the pet: ', error);
                                        Alert.alert('Error', 'Failed to delete pet');
                                    }
                                    }}
                                >
                                    <Text style={styles.editIcon}> 🗑️ </Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={editProfileVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    {/* Content Card */}
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>

                        {/* Name input */}
                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput 
                            style={styles.input}
                            value={editedName}
                            onChangeText={setEditedName}
                            placeholder="Your name" 
                        />

                        {/* Bio input */}
                        <Text style={styles.inputLabel}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editedBio}
                            onChangeText={setEditedBio}
                            placeholder='Tell us about yourself...'
                            multiline
                            numberOfLines={3}
                        />

                        {/* Action buttons */}
                        <View style={styles.modalButtons}>
                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setEditProfileVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    savingProfile && styles.saveButtonDisabled,
                                ]}
                                    onPress={ async () => {
                                        if (!editedName.trim()) {
                                            Alert.alert('Error', 'Name cannot be empty');
                                            return;
                                        }

                                        try {
                                            // Show loading state
                                            setSavingProfile(true);

                                            //Save to firestore
                                            await updateUserProfile(authUser!.uid, {
                                                name: editedName.trim(), 
                                                bio: editedBio.trim(),
                                            });

                                                //Refresh the data immediately
                                                await refetchUser();
                                                
                                                // show success message
                                                Alert.alert('Success', 'Profile updated!');

                                                // close modal
                                                setEditProfileVisible(false);
                                            
                                        } catch (error) {
                                            console.error('Error updating profile:', error);
                                            Alert.alert(
                                                'Error',
                                                'Failed to update profile. Try again'
                                            );
                                        } finally {
                                            // stop loading 
                                            setSavingProfile(false);
                                        }
                                    }} disabled = {savingProfile}
                            >
                            {savingProfile ? (
                                <ActivityIndicator color="white" />
                            ) : ( 
                                <Text style={styles.saveButtonText}>Save</Text>
                            )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Pet Modal */}
            <Modal
                visible={addPetVisible}
                animationType='slide'
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add new pet</Text>

                        {/* Pet name */}
                        <Text style={styles.inputLabel}>Pet Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={newPetName}
                            onChangeText={setNewPetName}
                            placeholder="e.g., Cookie"
                        />

                        {/* Breed */}
                        <Text style={styles.inputLabel}>Breed</Text>
                        <TextInput
                            style={styles.input}
                            value={newPetBreed}
                            onChangeText={setNewPetBreed}
                            placeholder="e.g., Chihuahua"
                        />

                        {/* Age */}
                        <Text style={styles.inputLabel}>Age *</Text>
                        <TextInput
                            style={styles.input}
                            value={newPetAge}
                            onChangeText={setNewPetAge}
                            placeholder="Age in years"
                            keyboardType="numeric" // Shows number keyboard on mobile
                        />

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    // Close modal and clear form
                                    setAddPetVisible(false);
                                    setNewPetName('');
                                    setNewPetBreed('');
                                    setNewPetAge('1');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                        {/* Save button*/}
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    savingPet && styles.saveButtonDisabled,
                                ]}
                                onPress={async () => {
                                    // Validate all required fields
                                    if (!newPetName.trim()) {
                                    Alert.alert('Error', 'Please enter pet name');
                                    return;
                                    }
                                    
                                    if (!newPetBreed.trim()) {
                                    Alert.alert('Error', 'Please enter breed');
                                    return;
                                    }
                                    
                                    // Validate age is a valid number
                                    const ageNum = parseInt(newPetAge);
                                    if (isNaN(ageNum) || ageNum < 0 || ageNum > 20) {
                                    Alert.alert('Error', 'Please enter a valid age');
                                    return;
                                    }

                                    try {
                                    // Show loading state
                                    setSavingPet(true);
                                    
                                    // Create pet object with user's ID as owner
                                    const newPet = {
                                        ownerId: authUser!.uid,      // Current user is the owner
                                        name: newPetName.trim(),
                                        breed: newPetBreed.trim(),
                                        age: ageNum,                 // Convert string to number
                                    };
                                    
                                    // Save pet to Firestore (create the pet)
                                    const petId = await createPet(newPet);
                                    
                                    console.log('Pet created with ID: ${petId}');
                                    
                                    // Wait and sync with firestore
                                    await new Promise(resolve => setTimeout(resolve,500));
                                    
                                    // refresh
                                    await refetchPets();

                                    // Show success messag
                                    Alert.alert('Success', `${newPetName} has been added!`);
                                    
                                    // Clear the form
                                    setNewPetName('');
                                    setNewPetBreed('');
                                    setNewPetAge('1');
                                    
                                    // Close the modal
                                    setAddPetVisible(false);
                                    
                                    // Refresh the pets list
                                    // This re-fetches pets from Firestore so the new pet appears
                                    refetchPets();
                                    
                                    } catch (error) {
                                    console.error('Error creating pet:', error);
                                    Alert.alert(
                                        'Error',
                                        'Failed to create pet. Please try again.'
                                    );
                                    } finally {
                                    // Always stop loading
                                    setSavingPet(false);
                                    }
                                }}
                                disabled={savingPet}
                                >
                                {savingPet ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Add Pet</Text>
                                )}
                                </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Pet Modal */}
            <Modal 
                visible={editPetVisible}
                animationType='slide'
                transparent={true}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}> Edit Pet </Text>

                        {/* Pet name */}
                        <Text style={styles.inputLabel}> Pet Name </Text>
                        <TextInput 
                            style={styles.input}
                            value={editPetName}
                            onChangeText={setEditPetName}
                            placeholder='e.g., Cookie'
                        />

                        {/* Breed */}
                        <Text style={styles.inputLabel}> Breed </Text>
                        <TextInput 
                            style={styles.input}
                            value={editPetBreed}
                            onChangeText={setEditPetBreed}
                            placeholder='e.g., Chihuahua'
                        />

                        {/* Age */}
                        <Text style={styles.inputLabel}> Age </Text>
                        <TextInput
                            style={styles.input}
                            value={editPetAge}
                            onChangeText={setEditPetAge}
                            placeholder='Age'
                            keyboardType='numeric'
                        />

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setEditPetVisible(false)
                                    setEditingPetId(null);
                                    setEditPetName('');
                                    setEditPetBreed(''),
                                    setEditPetAge('1')
                                }}
                        >
                            <Text style={styles.cancelButtonText}> Cancel </Text>
                        </TouchableOpacity>

                        {/* Save changes button */}
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                savingPet && styles.saveButtonDisabled,
                            ]}
                            onPress={async() =>{
                                //Validate the inputs
                                if (!editPetName.trim()) {
                                    Alert.alert('Error', 'Please enter pet name')
                                    return;
                                }

                                if (!editPetBreed.trim()) {
                                    Alert.alert('Error', 'Please enter breed');
                                    return;
                                }

                                const ageNum = parseInt(editPetAge);
                                    if (isNaN(ageNum) || ageNum < 0 || ageNum > 20) {
                                        Alert.alert('Error', 'Please enter a valid age');
                                        return;
                                }

                                try {
                                    setSavingPet(true);
                                    await updatePet(editingPetId!, {
                                        name: editPetName.trim(),
                                        breed: editPetBreed.trim(),
                                        age:ageNum,
                                    });

                                    // sync
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    
                                    // refresh
                                    await refetchPets();

                                    setEditPetVisible(false);
                                    setEditingPetId(null);

                                } catch (error) {
                                    console.error('Error updating pet:', error);
                                    Alert.alert('Error', 'Failed to update pet');
                                } finally {
                                    setSavingPet(false);
                                }
                            }}
                            disabled={savingPet}
                        >
                            {savingPet ? (
                                <ActivityIndicator color="white"/>
                            ) : ( 
                                <Text style={styles.saveButtonText}> Save Changes </Text>
                            )}
                    </TouchableOpacity>
                </View>
            </View>
        </View> 
    </Modal>
</View>
);
}

const styles = StyleSheet.create({
    // main container 
    container: {
        flex: 1, 
        backgroundColor: '#f9fafb',
    },

    // Loading container
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },

    // Error container
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        padding: 20,
    },

    errorText: {
        fontSize: 18,
        color: '#ef4444',
        marginBottom: 20,
    },

    button: {
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },

    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // profile card
    profileCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },

    // Profile picture
    profileImage: {
        width: 100, 
        height: 100, 
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 3, 
        borderColor: '#10b981',
    },

    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },

    userLocation: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 12,
    },

    userBio: {
        fontSize: 14,
        color: '#4b5563',
        textAlign: 'center',
        marginBottom: 16,
    },

    editButton: {
        backgroundColor: '#10b981',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
    },

    editButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Section styles
    section: {
        backgroundColor: 'white',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },

    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    locationLabel: {
        fontSize: 16,
        color: '#374151',
    },

    locationHelper: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },

    addButton: {
        backgroundColor: '#10b981',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },

    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },

    loadingText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 14,
        paddingVertical: 20,
    },

    emptyPets: {
        alignItems: 'center',
        paddingVertical: 40,
    },

    emptyPetsText: {
        fontSize: 48,
        marginBottom: 12,
    },

    emptyPetsSubtext: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },

    // Pet card 
    petCard: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },

    petPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },

    petInfo: {
        flex: 1,
    },

    petName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },

    petDetails: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },

    petSize: {
        fontSize: 13,
        color: '#9ca3af',
    },

    editIcon: {
        fontSize: 20,
        padding: 8,
    },

    // Modal overlay
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    // Modal content
    modalContent: {
        backgroundColor: 'white',
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
    },

    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
        textAlign: 'center',
    },

    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },

    // text input
    input: {
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb', 
        marginBottom: 16,
    },

    // Multiline text area
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },

    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },

    cancelButton: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    cancelButtonText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '600',
    },

    // Button styles
    saveButton: {
        flex: 1,
        backgroundColor: '#10b981', 
        padding: 14, 
        borderRadius: 12, 
        alignItems: 'center',
    },

    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    saveButtonDisabled: {
        backgroundColor: '#6ee7b7', 
        opacity: 0.7,             
    }
});
