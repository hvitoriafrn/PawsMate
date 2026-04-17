// app/tabs/messages/index.tsx
// This is where all the matched conversations will be displayed 

import { SCREEN_BG, SCREEN_TITLE } from '@/constants/styles';
import { getMatchesForUser } from '@/services/firebase/matchService';
import { getPetsByOwnerId } from '@/services/firebase/petService';
import { getUserById } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import { Match, Pet, User } from '@/types/database';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
                    router.push({
                        pathname: '/messages/[matchId]',
                        params: {
                            matchId: match.id,
                            otherUserId: otherUser.uid,
                        }
                    } as any);
                }}
                activeOpacity={0.7}
            >
                {/* Avatar, pet photo in the list, user photo is used in the chat header */}
                <Image
                    source={{ uri: otherPet?.photos?.[0] || otherPet?.photo || otherUser.profilePicture }}
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

                    {otherPet && (
                        <Text style={styles.petSubtitle}>{otherPet.name}</Text>
                    )}

                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {match.lastMessage ?? "Say hi to start the conversation!"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#F2B949" />
                <Text style={styles.loadingText}>Loading conversations...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Messages</Text>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrap}>
                        <Feather name="message-circle" size={32} color="#111" />
                    </View>
                    <Text style={styles.emptyTitle}>No matches yet</Text>
                    <Text style={styles.emptyText}>
                        Head to Explore to find pets near you.
                        When you get a match they will appear here and you can start chatting!
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => router.push('/(tabs)/explore')}
                    >
                        <Text style={styles.exploreButtonText}>Find pets near you</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={loadConversations} />
                    }
                >
                    <View style={styles.listCard}>
                        {conversations.map(item => (
                            <View key={item.match.id}>
                                {renderConversation({ item })}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SCREEN_BG,
    },

    centeredContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SCREEN_BG,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280'
    },

    header: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: SCREEN_BG,
    },

    title: {
        ...SCREEN_TITLE,
    },

    scrollArea: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 12,
        paddingTop: 4,
        paddingBottom: 24,
    },

    listCard: {
        marginHorizontal: 0,
        marginTop: 8,
        marginBottom: 0,
        borderRadius: 14,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },

    conversationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
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
        color: '#F2B949',
        marginBottom: 3
    },

    lastMessage: { 
        fontSize: 14, 
        color: '#6b7280' 
    },


    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
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

    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },

    emptyText: {
        color: '#6b7280',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },

    exploreButton: {
        backgroundColor: '#F2B949',
        paddingHorizontal: 28,
        paddingVertical: 13,
        borderRadius: 24,
    },

    exploreButtonText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '600',
    },
    
});