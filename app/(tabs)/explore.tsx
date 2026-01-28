// Explore screen that shows all active pets available for matching for the like / pass

// Import necessary modules
import { useActivePets } from '@/hooks/firestore';
import { getUserById } from '@/services/firebase/firestoreService';
import { useUserStore } from '@/store/userStore'; // this gets the current logged in user
import { User } from '@/types/database';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ExploreScreen() {

    // The pet card currently on display
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    
    // Pet health info section, is it expanded?
    const [showHealthInfo, setShowHealthInfo] = useState<boolean>(false);

    // Get the owner of the current pet on display
    const [currentOwner, setCurrentOwner] = useState<User | null>(null);

    const [ownerLoading, setOwnerLoading] = useState<boolean>(false);


    // Get all the active pets from Firestore
    const { pets, loading, error, refetch } = useActivePets({
        maxDistance: 10, // in kilometers
    });

    // Get the current logged in users from Zustand 
    const { user } = useUserStore();

    const currentPet = pets[currentIndex];

    // Function for when pet changes, the owner is fetched for that pet (changing it too)
    useEffect(() => {
        if (currentPet) {
            getOwner();
        }
    }, [currentPet?.id]);

    // Get owner of the current pet when pet changes
    const getOwner = async () => {
        if (!currentPet) return;

        try {
            setOwnerLoading(true);

            // Get user from Firestore
            const owner = await getUserById(currentPet.ownerId);
            setCurrentOwner(owner);

        } catch (error) {
            console.error('Error getting pet owner: ', error);
            setCurrentOwner(null);

        } finally {
            setOwnerLoading(false);
        }
    };


    // Handle the pass option (save the pass to database and move to next pet)
    const handlePass = async () => {
        if (!currentPet || !user) {
            console.log('No pets found');
            return;
        }

        try {
            console.log('Passed on: ', currentPet.name);

            // await createLike(
            //     user.uid,
            //     currentPet.id,
            //     currentPet.ownerId,
            //     'yourPetId',
            //     'pass',
            // );

            // Moves to next pet
            setCurrentIndex(prev => prev + 1);

            // Reset health info expansion when moves to next pet
            setShowHealthInfo(false);

        } catch (error) {
            console.error('Error saving the pass: ', error);
        }
    };

    // Handle the like functionality

    const handleLike = async() => {
        if (!currentPet || !user) {
            console.log('No pets found');
            return;
        }

        try {
            console.log('You liked: ', currentPet.name);

            // await createLike(
            //     user.uid,
            //     currentPet.id,
            //     currentPet.ownerId,
            //     'yourPetId',
            //     'like',
            // );

            // moves to next pet
            setCurrentIndex(prev => prev + 1);

            // Reset health info
            setShowHealthInfo(false);

        } catch (error) {
            console.error('Error saving the like: ', error);
        }
    };

    // Toggle health info section open / closed 
    const toggleHealthInfo = () => {
        setShowHealthInfo(prev => !prev);        
    }; 

    // 

    return (
        <View style ={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}> Discover Pets</Text>
            </View>

            {/* content area */}
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle = {styles.cardContainer}
                showsVerticalScrollIndicator = {false}
                >
                    {loading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size = "large" color="#10b981"/>
                            <Text style={styles.loadingText}>Loading pets...</Text>
                        </View>

                    ) : /* Error state */
                        error ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateTitle}> Error </Text>
                                <Text style={styles.emptyStateText}>{error}</Text>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={refetch} 
                                    >
                                        <Text style={styles.resetButtonText}> Try Again </Text>
                                    </TouchableOpacity>
                            </View>

                        ) : // Show current pet
                        currentPet && currentOwner && !ownerLoading ? (
                            <View style = {styles.card}>

                                <View style={styles.photoContainer}>
                                <Image 
                                    source={{ uri: currentPet.photo }}
                                    style={styles.photo}
                                    resizeMode= "cover"
                                    />
                                    {currentPet.verification.verified && (
                                        <View style={styles.verifiedBadge}>
                                            <Text style={styles.verifiedText}>✓ Verified</Text>
                                    </View>
                                    )}
                                    
                                    {/* Pet Info Overlay */}
                                    <View style={styles.petInfoOverlay}>
                                        <Text style={styles.petName}>
                                            {currentPet.name}, {currentPet.age}
                                        </Text>

                                        <Text style={styles.petDetails}>
                                            {currentPet.breed} • {currentPet.gender} • {currentPet.size}
                                        </Text>
                                        <Text style={styles.distance}>
                                            📍 {currentOwner.location}
                                        </Text>
                                    </View>
                                </View>
                        
                                {/* Personality Traits Section */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}> Pawsonality & Traits</Text>
                                    <View style={styles.tagsContainer}>
                                        {currentPet.personalityTraits.map((trait,index) => (
                                            <View key={index} style={styles.personalityTag}>
                                                <Text style={styles.personalityTagText}>{trait}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                
                                {/* Looking for */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}> Looking For</Text>
                                    <View style={styles.tagsContainer}>
                                        {currentPet.lookingFor.map((item, index) => (
                                            <View key={index} style={styles.lookingForTag}>
                                                <Text style={styles.lookingForTagText}>{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>


                                {/* Health info */}
                                <View style={styles.section}>
                                    <TouchableOpacity
                                        style={styles.healthHeader}
                                        onPress={toggleHealthInfo}
                                    >
                                        <Text style={styles.sectionTitle}> Health Information</Text>
                                        <Text style={styles.expandIcon}>
                                            {showHealthInfo ? '▲' : '▼'}
                                        </Text>
                                    </TouchableOpacity>


                                
                                    {showHealthInfo && (
                                        <View style={styles.healthContent}>
                                            <Text style={styles.healthText}>
                                                {currentPet.healthInfo.vaccinated ? '✓' : '○'} Vaccinated
                                            </Text>
                                            <Text style={styles.healthText}>
                                                {currentPet.healthInfo.spayedNeutered ? '✓' : '○'} Spayed/Neutered
                                            </Text>
                                                {currentPet.healthInfo.healthNotes && (
                                                    <Text style={styles.healthNotes}>
                                                        {currentPet.healthInfo.healthNotes}
                                                    </Text>
                                    )}
                                </View>
                            )}
                     </View>
                    
                    {/* Owner Info */}
                    <View style={styles.ownerSection}>
                        <Image
                            source={{ uri: currentOwner.profilePicture }}
                            style={styles.ownerPhoto}
                            />
                        < View style={styles.ownerInfo}>
                            <Text style={styles.ownerLabel}> Owner </Text>
                            <Text style={styles.ownerName}> {currentOwner.name} </Text>
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.buttonsContainer}>
                        {/* Pass button*/}
                        <TouchableOpacity
                            style={styles.passButton}
                            onPress={handlePass}
                        >
                            <Text style={styles.passIcon}>x</Text>
                        </TouchableOpacity>

                        {/* Like button */}
                        <TouchableOpacity
                            style={styles.likeButton}
                            onPress={handleLike}
                        >
                            <Text style={styles.likeIcon}> ♥ </Text>
                        </TouchableOpacity>
                    </View>
                </View> 

            ) : /* No more pets or owner loading */
              ownerLoading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={styles.loadingText}>Loading owner info...</Text>
                    </View>
                ) : (
                    //Empty state after there are no more new pets
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateTitle}>You've seen all pets!</Text>
                        <Text style={styles.emptyStateText}>
                            You've seen all available pets nearby!
                            Check back soon for new profiles!
                        </Text>
                        {/* Optional: Button to check if new pets were added */}
                    
                    <TouchableOpacity 
                        style={styles.resetButton}
                        onPress={refetch}  // ← Re-fetch from Firestore
                    >
                        <Text style={styles.resetButtonText}>Check for New Pets</Text>
                    </TouchableOpacity>
                </View>
                )}
    </ScrollView>
    
    </View>
            
     );
}

// Styles
const styles = StyleSheet.create ({

    // Main container
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },

    header: {
        padding: 16,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    
    scrollContainer: {
        flex: 1,
    },
    
    cardContainer: {
        padding: 16,
        alignItems: 'center',
    },
    
    // Pet card styles
    card: {
        width: SCREEN_WIDTH - 32,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    
    photoContainer: {
        width: '100%',
        height: 400,
        position: 'relative',
    },
    
    photo: {
        width: '100%',
        height: '100%',
    },
    
    verifiedBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    
    verifiedText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    
    petInfoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    
    petName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    
    petDetails: {
        fontSize: 16,
        color: 'white',
        marginBottom: 4,
    },
    
    distance: {
        fontSize: 14,
        color: 'white',
    },
    
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    
    personalityTag: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    
    personalityTagText: {
        color: '#065f46',
        fontSize: 14,
        fontWeight: '500',
    },
    
    lookingForTag: {
        backgroundColor: '#fed7aa',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    
    lookingForTagText: {
        color: '#9a3412',
        fontSize: 14,
        fontWeight: '500',
    },
    
    healthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    
    expandIcon: {
        fontSize: 16,
        color: '#6b7280',
    },
    
    healthContent: {
        marginTop: 12,
    },
    
    healthText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    
    healthNotes: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 8,
    },
    
    ownerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9fafb',
    },
    
    ownerPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    
    ownerInfo: {
        flex: 1,
    },
    
    ownerLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    
    ownerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        padding: 20,
    },
    
    passButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    
    passIcon: {
        fontSize: 30,
        color: '#ef4444',
        fontWeight: 'bold',
    },
    
    likeButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    
    likeIcon: {
        fontSize: 36,
        color: 'white',
    },
    
    // Loading state
    loadingState: {
        alignItems: 'center',
        padding: 32,
        marginTop: 100,
    },
    
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 16,
    },
    
    // Empty state
    emptyState: {
        alignItems: 'center',
        padding: 32,
        marginTop: 100,
    },
    
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    
    emptyStateText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    
    resetButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});