// Import React and necessary components
import React, { useState } from 'react';
import {
    Dimensions, Image, ScrollView, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';

// Import our types and data
import {
    getOwnerForPet,
    mockPets
} from '@/constants/mockData';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Main Explore Screen Component
export default function ExploreScreen() {
    
    // Which pet card we're currently showing
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    
    // Whether health info section is expanded
    const [showHealthInfo, setShowHealthInfo] = useState<boolean>(false);
    
    // Get current pet and owner based on index
    const currentPet = mockPets[currentIndex];
    const currentOwner = currentPet ? getOwnerForPet(currentPet) : undefined;
    
   
    // Handlers for passing and liking pets
    const handlePass = () => {
        console.log('Passed on:', currentPet?.name);
        setCurrentIndex(prev => prev + 1);
        setShowHealthInfo(false); // Reset health info when moving to next card
    };
    
    // Like handler
    const handleLike = () => {
        console.log('Liked:', currentPet?.name);
        setCurrentIndex(prev => prev + 1);
        setShowHealthInfo(false); // Reset health info when moving to next card
    };
    
    // Toggle health info section
    const toggleHealthInfo = () => {
        setShowHealthInfo(prev => !prev);
    };
    
    // Reset explore to the beginning
    const resetExplore = () => {
        setCurrentIndex(0);
        setShowHealthInfo(false);
    };
    
    // Render the component
    return (
        <View style={styles.container}>
            
            {/* The title*/}
            <View style={styles.header}>
                <Text style={styles.title}>Discover Pets</Text>
            </View>
            
            {/* Card display area */}
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={styles.cardContainer}
                showsVerticalScrollIndicator={false}
            >
                {currentPet && currentOwner ? (
                    <View style={styles.card}>
                        
                        {/* Photo of the pet */}
                        <View style={styles.photoContainer}>
                            <Image 
                                source={{ uri: currentPet.photo }} 
                                style={styles.photo}
                                resizeMode="cover"
                            />
                            
                            {/* Verified badge/text*/}
                            {currentPet.verification.verified && (
                                <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedText}>✓ Verified</Text>
                                </View>
                            )}
                            
                            {/* Pet info overlay */}
                            <View style={styles.petInfoOverlay}>
                                <Text style={styles.petName}>
                                    {currentPet.name}, {currentPet.age}
                                </Text>
                                <Text style={styles.petDetails}>
                                    {currentPet.breed} • {currentPet.gender} • {currentPet.size}
                                </Text>
                                <Text style={styles.distance}>📍 3 miles away</Text>
                            </View>
                        </View>
                        
                        {/* Personality traits */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Personality & Traits</Text>
                            <View style={styles.tagsContainer}>
                                {currentPet.personalityTraits.map((trait, index) => (
                                    <View key={index} style={styles.personalityTag}>
                                        <Text style={styles.personalityTagText}>{trait}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        
                        {/* Looking for section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Looking For</Text>
                            <View style={styles.tagsContainer}>
                                {currentPet.lookingFor.map((item, index) => (
                                    <View key={index} style={styles.lookingForTag}>
                                        <Text style={styles.lookingForTagText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        
                        {/* Collapsible Health Information */}
                        <View style={styles.section}>
                            <TouchableOpacity 
                                style={styles.healthHeader}
                                onPress={toggleHealthInfo}
                            >
                                <Text style={styles.sectionTitle}>Health Information</Text>
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
                        
                        {/* Owner's info */}
                        <View style={styles.ownerSection}>
                            <Image 
                                source={{ uri: currentOwner.profilePicture }} 
                                style={styles.ownerPhoto}
                            />
                            <View style={styles.ownerInfo}>
                                <Text style={styles.ownerLabel}>Owner</Text>
                                <Text style={styles.ownerName}>{currentOwner.name}</Text>
                            </View>
                        </View>
                        
                        {/* Like or pass buttons */}
                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity 
                                style={styles.passButton}
                                onPress={handlePass}
                            >
                                <Text style={styles.passIcon}>✕</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.likeButton}
                                onPress={handleLike}
                            >
                                <Text style={styles.likeIcon}>♥</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // Empty state when no more pets are available
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateTitle}>No More Pets</Text>
                        <Text style={styles.emptyStateText}>
                            You've seen all available pets nearby!
                        </Text>
                        <TouchableOpacity 
                            style={styles.resetButton}
                            onPress={resetExplore}
                        >
                            <Text style={styles.resetButtonText}>Start Over</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

// Styles for the Explore Screen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    
    // Header
    header: {
        padding: 16,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    
    // title
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    
    // Card container
    scrollContainer: {
        flex: 1,
    },
    
    cardContainer: {
        padding: 16,
        alignItems: 'center',
    },
    
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
    
    // Photo section
    photoContainer: {
        width: '100%',
        height: 400,
        position: 'relative',
    },
    
    photo: {
        width: '100%',
        height: '100%',
    },
    
    // verified badge
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
    
    // Pet info overlay
    petInfoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
     
    // Pet details
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
    
    // Sections
    section: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    
    // Personality Tags 
    personalityTag: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: -3,
        marginBottom: 3,
    },
    
    personalityTagText: {
        color: '#065f46',
        fontSize: 12,
        fontWeight: '500',
    },
    
    // Looking for tags
    lookingForTag: {
        backgroundColor: '#fed7aa',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: -3,
        marginBottom: 3,
    },
    
    lookingForTagText: {
        color: '#9a3412',
        fontSize: 12,
        fontWeight: '500',
    },
    
    // Collapsible health info
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
        marginTop: 8,
    },
    
    healthText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
    },
    
    healthNotes: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 3,
    },
    
    // Owner info section
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
    
    // Buttons section (for pass and like)
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
        width: 70,
        height: 70,
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
    
    // Empty state for when there's no more pets
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