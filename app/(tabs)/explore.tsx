// Explore screen that shows all active pets available for matching for the like / pass

import BreedAutocomplete from '@/components/breedAutocomplete';
import { db } from '@/config/firebase';
import { SCREEN_BG, SCREEN_TITLE } from '@/constants/styles';
import { useActivePets } from '@/hooks/firestore';
import { checkAndCreateMatch, createLike } from '@/services/firebase/matchService';
import { getPetsByOwnerId } from '@/services/firebase/petService';
import { getUserById } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import { LookingFor, Pet, User } from '@/types/database';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import {
    collection,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

const LOOKING_FOR_OPTIONS: LookingFor[] = [
    'Playdates',
    'Walking buddies',
    'Hiking buddies',
    //'Breeding',
    'Training tips',
    'Pet sitting exchange',
    'Grooming tips',
];

const getSeenPetsKey = (userId: string) => `seenPets_${userId}`;

// Load the seen pet ids, checks asyncStorage, Firestore only if that fails
const getSeenPetIds = async (userId: string): Promise<Set<string>> => {
    try {
        const cached = await AsyncStorage.getItem(getSeenPetsKey(userId));
        if (cached) {
            return new Set(JSON.parse(cached));
        }

        // This will only run on a fresh install if app data is cleared 
        console.log('No local cache, falling back to Firestore.');
        const likesRef = collection(db, 'likes');
        const q = query(likesRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const seenIds = snapshot.docs.map(doc => doc.data().petId);

        // Populate cache for next session
        await AsyncStorage.setItem(getSeenPetsKey(userId), JSON.stringify(seenIds));
        return new Set(seenIds);
    } catch (error) {
        console.error('Error loading the already seen pets: ', error);
        return new Set(); 
    }
};

// To be called everytime a user likes or pass a profile to keep cache synced
const markPetAsSeen = async (userId: string, petId: string): Promise<void> => {
    try {
        const key = getSeenPetsKey(userId);
        const cached = await AsyncStorage.getItem(key);
        const seenIds: string[] = cached ? JSON.parse(cached) : [];
        
        if (!seenIds.includes(petId)) {
            seenIds.push(petId);
            await AsyncStorage.setItem(key, JSON.stringify(seenIds));
        }
    } catch (error) {
        console.error('Error updating seen pets cache:', error);
    }
};

export default function ExploreScreen() {

    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [unseenPets, setUnseenPets] = useState<Pet[]>([]);
    const [seenLoading, setSeenLoading] = useState(true);

    // for the pet photos carousel
    const [photoIndex, setPhotoIndex] = useState(0);

    const [currentOwner, setCurrentOwner] = useState<User | null>(null);
    const [ownerLoading, setOwnerLoading] = useState<boolean>(false);

    const [userPetId, setUserPetId] = useState<string | null>(null);

    const [showMatchModal, setShowMatchModal] = useState<boolean>(false);
    const [newMatchId, setNewMatchId] = useState<string | null>(null);

    // Filter state: draft is what the user is editing in the sheet,
    // active is what's currently applied to the card stack
    const [showFilters, setShowFilters] = useState(false);
    const [draftRadius, setDraftRadius] = useState(10);
    const [draftLookingFor, setDraftLookingFor] = useState<LookingFor[]>([]);
    const [draftBreed, setDraftBreed] = useState('');
    const [activeRadius, setActiveRadius] = useState(10);
    const [activeLookingFor, setActiveLookingFor] = useState<LookingFor[]>([]);
    const [activeBreed, setActiveBreed] = useState('');

    const { pets: allPets, loading, error, refetch } = useActivePets({
        maxDistance: activeRadius,
    });
    const { user } = useUserStore();

    // Strip out the user's own pets, then apply lookingFor / breed filters client-side
    const pets = allPets.filter(pet => pet.ownerId !== user?.uid);

    const displayPets = unseenPets.filter(pet => {
        if (activeLookingFor.length > 0 && !activeLookingFor.some(tag => pet.lookingFor.includes(tag))) return false;
        if (activeBreed.trim() && !pet.breed.toLowerCase().includes(activeBreed.trim().toLowerCase())) return false;
        return true;
    });

    const currentPet = displayPets[currentIndex];

    const currentPhotos = currentPet
    ? (currentPet.photos && currentPet.photos.length > 0
        ? currentPet.photos
        : currentPet.photo ? [currentPet.photo] : [])
    : [];

    // How many non-default filters are active, drives the badge on the filter button
    const activeFilterCount =
        (activeRadius !== 10 ? 1 : 0) +
        activeLookingFor.length +
        (activeBreed.trim() ? 1 : 0);

    // Keep a ref to the latest refetch so useFocusEffect never captures a stale closure
    const refetchRef = useRef(refetch);
    useEffect(() => { refetchRef.current = refetch; });

    useFocusEffect(
        useCallback(() => {
            if (user?.uid) {
                refetchRef.current();
                loadUserPet();
            }
        }, [user?.uid])
    );
    
    const loadUserPet = async () => {
        if (!user?.uid) return;
        try {
            const myPets = await getPetsByOwnerId(user.uid);
            if (myPets.length > 0) {
                setUserPetId(myPets[0].id);
                console.log('Active pet for liking:', myPets[0].name);
            }
            } catch (error) {
            console.error('Couldnt load user pets:', error);
            }
    };

    // Filter the seen pets
    useEffect(() => {
        if (!user?.uid || loading) return;

        // Still run when pets is empty so seenLoading gets cleared
        if (pets.length === 0) {
            setUnseenPets([]);
            setCurrentIndex(0);
            setSeenLoading(false);
            return;
        }

        const filterSeenPets = async () => {
            try {
                setSeenLoading(true);
                // Check for all the pet ids the user has already liked or passed on
                // using AsyncStorage first as it's faster
                const seenIds = await getSeenPetIds(user.uid);
                const unseen = pets.filter(pet => !seenIds.has(pet.id));
                setUnseenPets(unseen);
                // If currentIndex is past the end of the new list (e.g. after a
                // location change shrinks the result set), reset to the beginning
                setCurrentIndex(prev => (prev >= unseen.length ? 0 : prev));
            } catch (error) {
                console.error('Error filtering seen pets:', error);
                setUnseenPets(pets);
                setCurrentIndex(0);
            } finally {
                setSeenLoading(false);
            }
        };

        filterSeenPets();
    }, [user?.uid, pets.length, loading]);

    useEffect(() => {
        if (currentPet) {
            getOwner();
            setPhotoIndex(0);
        }
    }, [currentPet?.id]);

    const getOwner = async () => {
        if (!currentPet) return;
        try {
            setOwnerLoading(true);
            const owner = await getUserById(currentPet.ownerId);
            setCurrentOwner(owner);
        } catch (error) {
            console.error('Error getting pet owner: ', error);
            setCurrentOwner(null);
        } finally {
            setOwnerLoading(false);
        }
    };

    // Photo navigation, taping the left photo goes back and right goes forward
    const handlePhotoTap = (side: 'left' | 'right') => {
        if (side === 'left') {
            setPhotoIndex(prev => Math.max(0, prev - 1));
        } else {
            // Navigation to lock photos but only if they exist
            setPhotoIndex(prev => Math.min(currentPhotos.length - 1, prev +1));
        }
    };

    const advanceCard = () => {
        setCurrentIndex(prev => prev + 1);
        setPhotoIndex(0);
    };

    const handlePass = async () => {
        if (!currentPet || !user) return;

        // Prevent user from passing on a pet unless they have an active pet
        if (!userPetId) {
            Alert.alert(
                'No active pet', 'You need to add a pet before you can pass on others.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add a pet', onPress: () => router.push('/(tabs)/profile') }
                ]
            );
            return;
        }

        await markPetAsSeen(user.uid, currentPet.id);
        try {
            await createLike(
                user.uid,
                currentPet.id,
                currentPet.ownerId,
                userPetId,
                'pass',
            );
            console.log('Passed on: ', currentPet.name);
        } catch (error) {
            console.error('Error saving the pass: ', error);
        }

       advanceCard();
    };

    // Handle the like functionality
    const handleLike = async() => {
        if (!currentPet || !user ) return;

        // Keep users from liking other pets unless they have an active pet
        if (!userPetId) {
            Alert.alert(
                'No active pet', 'You need to add a pet before you can like others.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add a pet', onPress: () => router.push('/(tabs)/profile') }
                ]
            );
            return;
        }
        await markPetAsSeen(user.uid, currentPet.id);

        try {
             await createLike(
                user.uid,
                currentPet.id,
                currentPet.ownerId,
                userPetId,
                'like'
            );
            console.log('Liked:', currentPet.name);

            // Check if user already liked back to create the match
            const matchId = await checkAndCreateMatch(
                user.uid,
                userPetId,
                currentPet.ownerId,
                currentPet.id
            );

            if (matchId) {
                setNewMatchId(matchId);
                setShowMatchModal(true);
                // don't change the card as the user needs to acknowledge the modal
                return;
            }
        } catch (error) {
            console.error('Error saving the like: ', error);
        }
        advanceCard();
    };

    const handleGoToChat = () => {
        setShowMatchModal(false);
        setCurrentIndex(prev => prev + 1);
        console.log('handleGoToChat called');
        console.log('newMatchId:', newMatchId);
        console.log('currentPet:', currentPet?.id);

        if (newMatchId && currentPet) {
            router.push({
                pathname: '/(tabs)/messages/[matchId]',
                params: {
                    matchId: newMatchId,
                    otherUserId: currentPet.ownerId
                }
            } as any);

        }
    };

    const handleDismissMatch = () => {
        setShowMatchModal(false);
        advanceCard();
    };

    // Reset the card stack whenever the client-side filters change
    useEffect(() => {
        setCurrentIndex(0);
        setPhotoIndex(0);
    }, [activeLookingFor, activeBreed]);

    // Open the filter sheet, pre-populating draft values with what's currently active
    const openFilters = () => {
        setDraftRadius(activeRadius);
        setDraftLookingFor([...activeLookingFor]);
        setDraftBreed(activeBreed);
        setShowFilters(true);
    };

    const toggleLookingFor = (tag: LookingFor) => {
        setDraftLookingFor(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const applyFilters = () => {
        setActiveRadius(draftRadius);
        setActiveLookingFor(draftLookingFor);
        setActiveBreed(draftBreed);
        setCurrentIndex(0);
        setShowFilters(false);
    };

    const clearFilters = () => {
        setDraftRadius(10);
        setDraftLookingFor([]);
        setDraftBreed('');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Discover Pets</Text>
                    <TouchableOpacity style={styles.filterBtn} onPress={openFilters}>
                        <Feather name="sliders" size={18} color="#111" />
                        {activeFilterCount > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* content area */}
                <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle = {styles.cardContainer}
                    showsVerticalScrollIndicator = {false}
                    >
                        {loading || seenLoading ? (
                            <View style={styles.loadingState}>
                                <ActivityIndicator size = "large" color="#F2B949"/>
                                <Text style={styles.loadingText}>Loading pets...</Text>
                            </View>
                    
                        ) : /* Error state */
                            error ? (
                                <View style={styles.centeredState}>
                                    <Text style={styles.emptyStateTitle}>Something went wrong</Text>
                                    <Text style={styles.emptyStateText}>{error}</Text>
                                    <TouchableOpacity
                                        style={styles.resetButton}
                                        onPress={refetch} 
                                        >
                                            <Text style={styles.resetButtonText}>Try Again</Text>
                                        </TouchableOpacity>
                                </View>
                            ) : // Show current pet
                            currentPet && currentOwner && !ownerLoading ? (
                                <>
                                <View style = {styles.card}>
                                    {/* Photo section */}
                                    <View style={styles.photoContainer}>
                                    <Image 
                                        source={{ uri: currentPhotos[photoIndex] || currentPet.photo }}
                                        style={styles.photo}
                                        resizeMode= "cover"
                                        />


                                        {/* Tap zones (left goes back, right goes forward) */}
                                        <View style={styles.tapZones}>
                                            <TouchableOpacity
                                                style={styles.tapZoneLeft}
                                                onPress={() => handlePhotoTap('left')}
                                                activeOpacity={1}
                                            />
                                            <TouchableOpacity
                                                style={styles.tapZoneRight}
                                                onPress={() => handlePhotoTap('right')}
                                                activeOpacity={1}
                                            />
                                        </View>

                                        {/* Verified badge (top left) */}
                                        {currentPet.verification.verified && (
                                            <View style={styles.verifiedBadge}>
                                                <View style={styles.verifiedDot}/>
                                                <Text style={styles.verifiedText}>✓ Verified</Text>
                                        </View>
                                        )}
                                        
                                        {/* Info button by top right */}
                                        <TouchableOpacity style={styles.infoBtn}>
                                        <Feather name="info" size={16} color="#666" />
                                        </TouchableOpacity>

                                        {/* Photo indicators */}
                                        {currentPhotos.length > 1 && (
                                            <View style={styles.dotsContainer}>
                                                {currentPhotos.map((_, i) => (
                                                    <View
                                                        key={i}
                                                        style={[
                                                            styles.dot,
                                                            i === photoIndex && styles.dotActive,
                                                        ]}
                                                    />
                                                ))}
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
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Feather name="map-pin" size={12} color="#fff" />
                                                <Text style={styles.distance}>{currentOwner.location}</Text>
                                            </View>
                                        </View>
                                    </View>
                            
                                    {/* Personality Traits Section */}
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Personality & Traits</Text>
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
                                        <Text style={styles.sectionTitle}>Looking For</Text>
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
                                        <Text style={styles.sectionTitle}>Health Information</Text>
                                        <View style={styles.healthRow}>
                                            <Feather
                                                name={currentPet.healthInfo.vaccinated ? 'check-circle' : 'circle'}
                                                size={16}
                                                color={currentPet.healthInfo.vaccinated ? '#F2B949' : '#9CA3AF'}
                                            />
                                            <Text style={styles.healthText}>
                                                Vaccinated: {currentPet.healthInfo.vaccinated ? 'Yes' : 'No'}
                                            </Text>
                                        </View>
                                        <View style={styles.healthRow}>
                                            <Feather
                                                name={currentPet.healthInfo.spayedNeutered ? 'check-circle' : 'circle'}
                                                size={16}
                                                color={currentPet.healthInfo.spayedNeutered ? '#F2B949' : '#9CA3AF'}
                                            />
                                            <Text style={styles.healthText}>
                                                Spayed/Neutered: {currentPet.healthInfo.spayedNeutered ? 'Yes' : 'No'}
                                            </Text>
                                        </View>
                                    </View>
                        
                        {/* Owner Info */}
                        <View style={styles.ownerSection}>
                            <Image
                                source={{ uri: currentOwner.profilePicture }}
                                style={styles.ownerPhoto}
                                />
                            < View style={styles.ownerInfo}>
                                <Text style={styles.ownerLabel}>Owner</Text>
                                <Text style={styles.ownerName}>{currentOwner.name}</Text>
                            </View>
                        </View>
                    </View>

                        {/* Like and Pass action buttons */}
                        <View style={styles.buttonsContainer}>
                            {/* Pass button*/}
                            <TouchableOpacity style={styles.passButton} onPress={handlePass}>
                               <Feather name="x" size={28} color="#ef4444" />
                            </TouchableOpacity>

                            {/* Like button */}
                            <TouchableOpacity
                                style={styles.likeButton}
                                onPress={handleLike}
                            >
                                <Text style={styles.likeIcon}> ♥ </Text>
                            </TouchableOpacity>
                        </View>
                    </> 

                ) : /* No more pets or owner loading */
                ownerLoading ? (
                        <View style={styles.centeredState}>
                            <ActivityIndicator size="large" color="#F2B949" />
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : (
                        //Empty state after there are no more new pets
                        <View style={styles.centeredState}>
                            <View style={styles.emptyIconWrap}>
                                <Feather name="search" size={28} color="#111" />
                            </View>
                            <Text style={styles.emptyStateTitle}>
                            {displayPets.length === 0 && unseenPets.length === 0
                                ? 'No pets nearby'
                                : 'You\'ve seen all pets!'}
                        </Text>
                        <Text style={styles.emptyStateText}>
                            {displayPets.length === 0 && unseenPets.length === 0
                                ? `No pets found within ${activeRadius} km. 
                                Try increasing the search radius in filters.`
                                : 'Check back soon for new profiles!'}
                        </Text>
                        {/* Button to check if new pets were added */}
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={refetch}
                        >
                            <Text style={styles.resetButtonText}>
                                {displayPets.length === 0 && unseenPets.length === 0
                                    ? 'Refresh'
                                    : 'Check for New Pets'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    )}
        </ScrollView>
    
    {/* 'Its a match' modal, rendered outside scrollview so it floats */}
    <Modal 
        visible={showMatchModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDismissMatch}
    > 
        <View style={styles.modalOverlay}>
            <View style={styles.matchCard}>
                <View style={styles.matchIconWrap}>
                    <Feather name="heart" size={32} color="#111" />
                </View>
                <Text style={styles.matchTitle}>It's a Match!</Text>
                <Text style={styles.matchSubtitle}>
                    You and {currentOwner?.name} liked each other's pets!
                </Text>
                {currentPet && (
                    <Text style={styles.matchPetName}>
                        {currentPet.name} is excited to meet your pet!
                    </Text>
                )}

                {/* Opens chat for this match */}
                <TouchableOpacity 
                    style={styles.chatButton}
                    onPress={handleGoToChat}
                >
                    <Text style={styles.chatButtonText}>Send Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.keepExploringButton}
                    onPress={handleDismissMatch}
                >
                    <Text style={styles.keepExploringText}>Keep Exploring</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>

    {/* Filter bottom sheet */}
    <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
    >
        <View style={{ flex: 1 }}>
            {/* Tap outside to close */}
            <TouchableOpacity
                style={styles.filterOverlay}
                activeOpacity={1}
                onPress={() => setShowFilters(false)}
            />

            <View style={styles.filterSheet}>
                {/* Handle bar */}
                <View style={styles.filterHandle} />

                {/* Sheet header */}
                <View style={styles.filterHeader}>
                    <Text style={styles.filterTitle}>Filters</Text>
                    <TouchableOpacity onPress={clearFilters}>
                        <Text style={styles.filterClearAll}>Clear all</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 24 }}>

                    {/* Radius */}
                    <Text style={styles.filterSectionLabel}>Search radius</Text>
                    <View style={styles.filterChipRow}>
                        {RADIUS_OPTIONS.map(km => (
                            <TouchableOpacity
                                key={km}
                                style={[styles.filterChip, draftRadius === km && styles.filterChipActive]}
                                onPress={() => setDraftRadius(km)}
                            >
                                <Text style={[styles.filterChipText, draftRadius === km && styles.filterChipTextActive]}>
                                    {km} km
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Looking For */}
                    <Text style={styles.filterSectionLabel}>Looking for</Text>
                    <View style={styles.filterChipRow}>
                        {LOOKING_FOR_OPTIONS.map(option => {
                            const selected = draftLookingFor.includes(option);
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.filterChip, selected && styles.filterChipActive]}
                                    onPress={() => toggleLookingFor(option)}
                                >
                                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Breed */}
                    <Text style={styles.filterSectionLabel}>Breed</Text>
                    <BreedAutocomplete
                        value={draftBreed}
                        onChangeText={setDraftBreed}
                        dropdownAbove
                    />

                </ScrollView>

                <TouchableOpacity style={styles.filterApplyBtn} onPress={applyFilters}>
                    <Text style={styles.filterApplyBtnText}>
                        Show results{activeFilterCount > 0 ? ` · ${activeFilterCount} active` : ''}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>

</SafeAreaView>

    );
}

// Styles
const styles = StyleSheet.create ({

    safeArea: {
        flex: 1,
        backgroundColor: SCREEN_BG,
    },

    //Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
        backgroundColor: SCREEN_BG,
        paddingHorizontal: 18,
    },

    title: {
        ...SCREEN_TITLE,
    },
    
    scrollContainer: {
        flex: 1,
    },
    
    filterBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        position: 'relative',
    },

    // Pet card styles
    card: {
        width: SCREEN_WIDTH - 24,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },

    cardContainer: {
        padding: 12,
        alignItems: 'center',
        paddingBottom: 32,
        borderRadius: 20,
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

     tapZones: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
    },
    tapZoneLeft: { 
        flex: 1 
    },

    tapZoneRight: { 
        flex: 1 
    },

    // Verified badge
    verifiedBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    
    verifiedDot: {
        width: 7,
        height: 7, 
        borderRadius: 4,
        backgroundColor: '#fff',
    },

    verifiedText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    
    // Info button
    infoBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Photo dot indicators
    dotsContainer: {
        position: 'absolute',
        bottom: 70, // above the pet info overlay
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 18,
    },
    petInfoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.30)',
    },

    petName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 3,
    },
    
    petDetails: {
        fontSize: 14,
        color: 'white',
        marginBottom: 3,
        fontWeight: '500',
    },
    
    distance: {
        fontSize: 13,
        color: 'white',
    },
    
    // Card section
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    
    sectionTitle: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#111',
    },
    
    //Tags
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    
    personalityTag: {
        backgroundColor: '#e0f5f5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    
    personalityTagText: {
        color: '#065f46',
        fontSize: 11,
        fontWeight: '500',
    },
    
    lookingForTag: {
        backgroundColor: '#fff3e0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth:1, 
        borderColor:'#F2B949',
    },
    
    lookingForTagText: {
        color: '#F5A623',
        fontSize: 11,
        fontWeight: '500',
    },
    
    //Health rows
    healthRow: {
        flexDirection: 'row',
        alignItems:'center',
        gap: 8,
        marginBottom:6,
    },
    
    healthText: {
        fontSize: 14,
        color: '#374151',
    },
    
    //Owner section

    ownerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9fafb',
    },
    
    ownerPhoto: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    
    ownerInfo: {
        flex: 1,
    },
    
    ownerLabel: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 1,
    },
    
    ownerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
    },
    
    // Like & pass buttons
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems:'center',
        gap: 24,
        paddingVertical: 20,
    },
    
    passButton: {
        width: 58,
        height: 58,
        borderRadius: 30,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    
    likeButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    
    likeIcon: {
        fontSize: 32,
        color: 'white',
    },
    
    // states
    centeredState: {
        alignItems: 'center',
        padding: 32,
        marginTop: 80,
    },

    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    
    loadingState: {
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
    },
    
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 12,
    },
    
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    
    emptyStateText: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    
    resetButton: {
        backgroundColor: '#F2B949',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
    },

    resetButtonText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '600',
    },

    // Match modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },

    matchCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
    },

    matchIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    matchTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111',
        marginBottom: 8,
    },

    matchSubtitle: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 4,
    },

    matchPetName: {
        fontSize: 14,
        color: '#F2B949',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
    },

    chatButton: {
        backgroundColor: '#F2B949',
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
    },

    chatButtonText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '600',
    },

    keepExploringButton: {
        paddingVertical: 8,
    },

    keepExploringText: {
        color: '#6b7280',
        fontSize: 14,
    },

    // Filter button badge
    filterBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
    },

    filterBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#111',
    },

    // Filter bottom sheet
    filterOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },

    filterSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 36,
        maxHeight: '80%',
    },

    filterHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e5e7eb',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 16,
    },

    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },

    filterTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },

    filterClearAll: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '500',
    },

    filterSectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: '#111',
        marginBottom: 10,
        marginTop: 20,
    },

    filterChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },

    filterChipActive: {
        backgroundColor: '#F2B949',
        borderColor: '#F2B949',
    },

    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },

    filterChipTextActive: {
        color: '#111',
        fontWeight: '600',
    },

    filterApplyBtn: {
        backgroundColor: '#F2B949',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },

    filterApplyBtnText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '700',
    },
});