// app/tabs/messages/index.tsx
// This is where all the matched conversations will be displayed 

import {
    getMatchesForUser,
    getPetsByOwnerId,
    getUserById
} from '@/services/firebase/firestoreService';
import { useUserStore } from '@/store/userStore';
import { Match, Pet, User } from '@/types/database';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Combining the match datsa with the other user's profile
interface ConversationItem {
    match: Match;
    otherUser: User;
    otherPet: Pet | null;
}

export default function MessagesScreen() {
    const { user } = useUserStore();

    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Load all the matches when the screen mounts
    useFocusEffect(
        useCallback(() => {
            if (user?.uid) {
                loadConversations();
            }
        }, [user?.uid])
    );

    const loadConversations = async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);

            // Get all the matches the user is part of
            const matches = await getMatchesForUser(user.uid);
            console.log('Matches found: ', matches.length);

            // For each match, get the other's users info
            const conversationData = await Promise.all(
                matches.map(async (match) => {
                    // Checks which user is the other one in the match
                    const otherUserId = match.userIds.find(id => id !== user.uid);
                    if (!otherUserId) return null;

                    const otherUser = await getUserById(otherUserId);
                    if (!otherUser) return null;

                    // find which pet was involved in the match
                    const ohterUserPets = await getPetsByOwnerId(otherUserId);
                    const matchedPetId = match.petIds.find(pid =>
                        ohterUserPets.some(p => p.id === pid)
                    );
                    const otherPet = ohterUserPets.find(p => p.id === matchedPetId)
                        || ohterUserPets[0] 
                        || null;
                    return { match, otherUser, otherPet } as ConversationItem;
                })
            );

            // Filter out nulls where the data couldnt be loaded
            setConversations(conversationData.filter(Boolean) as ConversationItem[]);
        }  catch (error) {
            console.error('Error loading conversations: ', error);
        } finally {
            setLoading(false);
        }
    };


    //Format the timestamp for display 
    const formatTime = (date: Date | null | undefined): string => {
        if (!date) return '';
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short'});
        } else {
            return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
        }
    };

    // Render one onversation 
    const renderConversation = ({ item }: { item: ConversationItem }) => {
        const { match, otherUser, otherPet } = item;

        return (
            <TouchableOpacity
                style={styles.conversationRow} 
                onPress={() => {
                    // Pass the otherUserId so the chat header can show their name
                    router.push({
                        pathname: '/messages/[matchId]',
                        params: {
                        matchId: match.id,
                        otherUserId: otherUser.uid
                        }
                    } as any);
                }}
                
                activeOpacity={0.7}
                >

                {/* Show the matched pet's photo or their profile photo*/}
                <Image
                    source={{ uri: otherPet?.photo || otherUser.profilePicture }}
                    style={styles.avatar}
                />

                <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                        <Text style={styles.userName}>{otherUser.name}</Text>
                        {match.lastMessageAt && (
                        <Text style={styles.timeText}>
                            {formatTime(match.lastMessageAt)}
                        </Text>
                    )}
                    </View>

                    {/* The pet's name as a subtitle */}
                    {otherPet && (
                        <Text style={styles.petSubtitle}> 🐾 {otherPet.name}</Text>
                    )}

                    {/* Last message preview or a little placeholder message 
                    if there have been no messages exchanged */}
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {match.lastMessage ?? "Start a conversation! Say hi 👋"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#F2B949" />
                <Text style={styles.loadingText}> Loading conversations... </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}> Messages </Text>
            </View>

            {conversations.length === 0 ? ( 
                /* No matches at the moment */
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}> 🐾 </Text>
                    <Text style={styles.emptyTitle}>This feature is locked</Text>
                    <Text style={styles.emptyText}>
                        Head to Explore to find pets near you.
                        When you get a match, they will appear here, where you can chat and get to know each other! 
                    </Text>
                    <TouchableOpacity 
                        style={styles.exploreButton}
                        onPress={() => router.push('/(tabs)/explore')}
                    >
                        <Text style={styles.exploreButtonText}> Find pets near you</Text>
                    </TouchableOpacity>
                </View>
            ) : ( 
                <FlatList 
                    data={conversations}
                    keyExtractor={item => item.match.id}
                    renderItem={renderConversation}
                    onRefresh={loadConversations}
                    refreshing={loading}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // main container
    container: { 
        flex: 1,
        backgroundColor: '##f0f0f0'
     },
    
     centeredContainer: {
        flex: 1, 
        alignItems: 'center',
        justifyContent: 'center', 
        backgroundColor: '#f9fafb',
    },

    loadingText: { 
        marginTop: 12, 
        fontSize: 16, 
        color: '#6b7280' 
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
        color: '#111827' 
    },

    listContent: { 
        paddingVertical: 8 
    },

    conversationRow: {
        flexDirection: 'row', 
        alignItems: 'center',
        padding: 16, 
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 16,
    },

    avatar: {
        width: 60, 
        height: 60, 
        borderRadius: 30,
        marginRight: 14, 
        backgroundColor: '#e5e7eb',
    },

    conversationInfo: { 
        flex: 1 
    },

    conversationHeader: {
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },

    userName: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#111827' 
    },

    timeText: { 
        fontSize: 12, 
        color: '#9ca3af' 
    },

    petSubtitle: { 
        fontSize: 13, 
        color: '#10b981', 
        marginBottom: 3 
    },

    lastMessage: { 
        fontSize: 14, 
        color: '#6b7280' 
    },

    separator: { 
        height: 1, 
        backgroundColor: '#f3f4f6', 
        marginLeft: 90 
    },

    emptyState: {
        flex: 1, 
        alignItems: 'center',
        justifyContent: 'center', 
        padding: 32,
    },

    emptyIcon: { 
        fontSize: 64, 
        marginBottom: 16
    },

    emptyTitle: {
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#111827',
        marginBottom: 8
    },

    emptyText: {
        color: '#6b7280',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28
    },

    exploreButton: {
        backgroundColor: '#F2B949',
        paddingHorizontal: 28,
        paddingVertical: 13,
        borderRadius: 24 
    },

    exploreButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight:'600'
    },
    
});