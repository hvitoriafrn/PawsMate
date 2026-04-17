// Events screen, where users can browse and join nearby events

import { SCREEN_BG, SCREEN_TITLE } from '@/constants/styles';
import { getEvents, joinEvent, leaveEvent } from '@/services/firebase/eventService';
import { useUserStore } from '@/store/userStore';
import { Event, EventType } from '@/types/database';
import { calculateDistance } from '@/utils/distance';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RADIUS_OPTIONS = [5, 10, 25, 50] as const;

const EVENT_TYPES: EventType[] = [
    'Dog Walk',
    'Playdate',
    'Training',
    'Dog Park Meetup',
    'Grooming',
    'General Meetup',
];

const TYPE_COLORS: Record<EventType, string> = {
    'Dog Walk': '#10b981',
    'Playdate': '#F2B949',
    'Training': '#6366f1',
    'Dog Park Meetup': '#3b82f6',
    'Grooming': '#ec4899',
    'General Meetup': '#6b7280',
};

const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const formatTime = (date: Date): string =>
    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function EventsScreen() {
    const { user, profile } = useUserStore();

    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);

    // Tabs: discover all events vs just the ones you've joined
    const [tab, setTab] = useState<'discover' | 'mine'>('discover');

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [draftRadius, setDraftRadius] = useState(25);
    const [draftTypes, setDraftTypes] = useState<EventType[]>([]);
    const [activeRadius, setActiveRadius] = useState(25);
    const [activeTypes, setActiveTypes] = useState<EventType[]>([]);

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [])
    );

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const fetched = await getEvents();
            setAllEvents(fetched.sort((a, b) => a.date.getTime() - b.date.getTime()));
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasRealLocation = profile?.geopoint &&
        !(profile.geopoint.latitude === 0 && profile.geopoint.longitude === 0);

    // My events, show just the ones the user has joined
    const myEvents = allEvents.filter(e => user?.uid && e.attendees.includes(user.uid));

    // Discover, apply distance + type filters
    const discoverEvents = allEvents.filter(event => {
        if (hasRealLocation) {
            const dist = calculateDistance(
                profile!.geopoint.latitude,
                profile!.geopoint.longitude,
                event.geopoint.latitude,
                event.geopoint.longitude
            );
            if (dist > activeRadius) return false;
        }
        if (activeTypes.length > 0 && !activeTypes.includes(event.type)) return false;
        return true;
    });

    const displayEvents = tab === 'mine' ? myEvents : discoverEvents;
    const activeFilterCount = activeTypes.length > 0 ? 1 : 0;

    const toggleType = (type: EventType) =>
        setDraftTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

    const applyFilters = () => {
        setActiveRadius(draftRadius);
        setActiveTypes(draftTypes);
        setShowFilters(false);
    };

    const openFilters = () => {
        setDraftRadius(activeRadius);
        setDraftTypes([...activeTypes]);
        setShowFilters(true);
    };

    const handleJoinLeave = async (event: Event) => {
        if (!user?.uid) return;
        const isJoined = event.attendees.includes(user.uid);

        if (isJoined) {
            Alert.alert('Leave event', `Leave "${event.title}"?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        setJoiningId(event.id);
                        try {
                            await leaveEvent(event.id, user.uid);
                            setAllEvents(prev =>
                                prev.map(e =>
                                    e.id === event.id
                                        ? { ...e, attendees: e.attendees.filter(id => id !== user.uid) }
                                        : e
                                )
                            );
                        } catch {
                            Alert.alert('Error', 'Could not leave the event. Please try again.');
                        } finally {
                            setJoiningId(null);
                        }
                    },
                },
            ]);
            return;
        }

        if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
            Alert.alert('Event full', 'This event has reached its maximum capacity.');
            return;
        }

        setJoiningId(event.id);
        try {
            await joinEvent(event.id, user.uid);
            setAllEvents(prev =>
                prev.map(e =>
                    e.id === event.id
                        ? { ...e, attendees: [...e.attendees, user.uid] }
                        : e
                )
            );
        } catch {
            Alert.alert('Error', 'Could not join the event. Please try again.');
        } finally {
            setJoiningId(null);
        }
    };

    const renderEvent = ({ item: event }: { item: Event }) => {
        const isJoined = user?.uid ? event.attendees.includes(user.uid) : false;
        const isFull = event.maxAttendees ? event.attendees.length >= event.maxAttendees : false;
        const badgeColor = TYPE_COLORS[event.type] || '#6b7280';
        const isProcessing = joiningId === event.id;

        let distanceLabel: string | null = null;
        if (hasRealLocation) {
            const dist = calculateDistance(
                profile!.geopoint.latitude,
                profile!.geopoint.longitude,
                event.geopoint.latitude,
                event.geopoint.longitude
            );
            distanceLabel = dist < 1 ? '< 1 km' : `${dist.toFixed(1)} km`;
        }

        const creatorLabel = event.createdByName || 'PawsMate';

        return (
            <View style={styles.eventCard}>
                {/* Cover image */}
                {event.imageUrl ? (
                    <View style={styles.cardImageWrap}>
                        <Image source={{ uri: event.imageUrl }} style={styles.cardImage} />
                        {/* "Joined" badge over image */}
                        {isJoined && (
                            <View style={styles.joinedBadge}>
                                <Text style={styles.joinedBadgeText}>Joined</Text>
                            </View>
                        )}
                        {/* Type badge over image */}
                        <View style={[styles.typeBadgeOverlay, { backgroundColor: badgeColor }]}>
                            <Text style={styles.typeBadgeOverlayText}>{event.type}</Text>
                        </View>
                    </View>
                ) : (
                    /* No image, then show inline badges in a row */
                    <View style={styles.cardTopRow}>
                        <View style={[styles.typeBadge, { backgroundColor: badgeColor + '22' }]}>
                            <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{event.type}</Text>
                        </View>
                        <View style={styles.cardTopRight}>
                            {isJoined && (
                                <View style={styles.joinedBadgeSmall}>
                                    <Text style={styles.joinedBadgeSmallText}>Joined</Text>
                                </View>
                            )}
                            {distanceLabel && (
                                <View style={styles.distanceRow}>
                                    <Feather name="map-pin" size={12} color="#9ca3af" />
                                    <Text style={styles.distanceText}>{distanceLabel}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.cardBody}>
                    {/* Distance label when there IS an image (shown below image) */}
                    {event.imageUrl && distanceLabel && (
                        <View style={styles.distanceRow}>
                            <Feather name="map-pin" size={12} color="#9ca3af" />
                            <Text style={styles.distanceText}>{distanceLabel} away</Text>
                        </View>
                    )}

                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {!!event.description && (
                        <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                    )}

                    {/* Meta info */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Feather name="calendar" size={13} color="#6b7280" />
                            <Text style={styles.metaText}>{formatDate(event.date)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Feather name="clock" size={13} color="#6b7280" />
                            <Text style={styles.metaText}>{formatTime(event.date)}</Text>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Feather name="map-pin" size={13} color="#6b7280" />
                            <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Feather name="users" size={13} color="#6b7280" />
                            <Text style={styles.metaText}>
                                {event.attendees.length}{event.maxAttendees ? `/${event.maxAttendees}` : ''} going
                            </Text>
                        </View>
                    </View>

                    {/* Footer row: creator name + join/leave pill */}
                    <View style={styles.cardFooter}>
                        <Text style={styles.creatorText}>by {creatorLabel}</Text>

                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#F2B949" />
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.joinPill,
                                    isJoined && styles.joinPillLeave,
                                    isFull && !isJoined && styles.joinPillFull,
                                ]}
                                onPress={() => handleJoinLeave(event)}
                                disabled={isFull && !isJoined}
                            >
                                <Text style={[
                                    styles.joinPillText,
                                    isJoined && styles.joinPillTextLeave,
                                    isFull && !isJoined && styles.joinPillTextFull,
                                ]}>
                                    {isJoined ? 'Leave' : isFull ? 'Full' : 'Join'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Events</Text>
                {tab === 'discover' && (
                    <TouchableOpacity style={styles.filterBtn} onPress={openFilters} activeOpacity={0.7}>
                        <Feather name="sliders" size={18} color="#111" />
                        {activeFilterCount > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* Segmented tabs */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tabItem, tab === 'discover' && styles.tabItemActive]}
                    onPress={() => setTab('discover')}
                >
                    <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>Discover</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, tab === 'mine' && styles.tabItemActive]}
                    onPress={() => setTab('mine')}
                >
                    <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My Events</Text>
                    {myEvents.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{myEvents.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Radius pill, only on discover tab */}
            {tab === 'discover' && (
                <View style={styles.radiusPill}>
                    <Feather name="map-pin" size={13} color="#111" />
                    <Text style={styles.radiusPillText}>Within {activeRadius} km</Text>
                </View>
            )}

            {/* Content */}
            {loading ? (
                <View style={styles.centred}>
                    <ActivityIndicator size="large" color="#F2B949" />
                </View>
            ) : displayEvents.length === 0 ? (
                <View style={styles.centred}>
                    <View style={styles.emptyIconWrap}>
                        <Feather name="calendar" size={36} color="#111" />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {tab === 'mine' ? "No events joined yet" : "No events nearby"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {tab === 'mine'
                            ? "Head to Discover to find events near you."
                            : "Try increasing the search radius or check back later."}
                    </Text>
                    {tab === 'mine' && (
                        <TouchableOpacity style={styles.discoverBtn} onPress={() => setTab('discover')}>
                            <Text style={styles.discoverBtnText}>Browse events</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={displayEvents}
                    keyExtractor={item => item.id}
                    renderItem={renderEvent}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Filter sheet */}
            <Modal
                visible={showFilters}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilters(false)}
            >
                <View style={styles.sheetOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowFilters(false)} />
                    <View style={styles.sheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Filters</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.sheetSectionLabel}>Search radius</Text>
                            <View style={styles.chips}>
                                {RADIUS_OPTIONS.map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.chip, draftRadius === r && styles.chipActive]}
                                        onPress={() => setDraftRadius(r)}
                                    >
                                        <Text style={[styles.chipText, draftRadius === r && styles.chipTextActive]}>
                                            {r} km
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.sheetSectionLabel}>Event type</Text>
                            <View style={styles.chips}>
                                {EVENT_TYPES.map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.chip, draftTypes.includes(type) && styles.chipActive]}
                                        onPress={() => toggleType(type)}
                                    >
                                        <Text style={[styles.chipText, draftTypes.includes(type) && styles.chipTextActive]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.sheetActions}>
                            <TouchableOpacity
                                style={styles.sheetClearBtn}
                                onPress={() => { setDraftTypes([]); setDraftRadius(25); }}
                            >
                                <Text style={styles.sheetClearText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sheetApplyBtn} onPress={applyFilters}>
                                <Text style={styles.sheetApplyText}>Show results</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SCREEN_BG,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 4,
    },

    title: {
        ...SCREEN_TITLE,
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

    // Segmented tabs
    tabRow: {
        flexDirection: 'row',
        marginHorizontal: 18,
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 10,
        padding: 3,
    },

    tabItem: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },

    tabItemActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },

    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
    },

    tabTextActive: {
        color: '#111',
    },

    tabBadge: {
        backgroundColor: '#F2B949',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 1,
        minWidth: 18,
        alignItems: 'center',
    },

    tabBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#111',
    },

    radiusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        marginHorizontal: 18,
        marginBottom: 10,
        backgroundColor: '#F2B949',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    radiusPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111',
    },

    list: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 14,
    },

    // Card
    eventCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },

    // Image section
    cardImageWrap: {
        width: '100%',
        height: 160,
        position: 'relative',
    },

    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    // "Joined" badge shown over the image (top-right)
    joinedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },

    joinedBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },

    // Type badge over image (top-left)
    typeBadgeOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    typeBadgeOverlayText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },

    // Top row when there is NO image
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 2,
    },

    cardTopRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },

    typeBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Small "Joined" badge for no-image cards
    joinedBadgeSmall: {
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },

    joinedBadgeSmallText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#065f46',
    },

    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },

    distanceText: {
        fontSize: 12,
        color: '#9ca3af',
    },

    cardBody: {
        padding: 14,
        gap: 4,
    },

    eventTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 2,
    },

    eventDesc: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
        marginBottom: 6,
    },

    metaRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 2,
    },

    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },

    metaText: {
        fontSize: 13,
        color: '#6b7280',
        flex: 1,
    },

    // Footer: creator name + join pill
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },

    creatorText: {
        fontSize: 13,
        color: '#9ca3af',
    },

    joinPill: {
        backgroundColor: '#F2B949',
        paddingHorizontal: 20,
        paddingVertical: 7,
        borderRadius: 20,
    },

    joinPillLeave: {
        backgroundColor: '#fee2e2',
    },

    joinPillFull: {
        backgroundColor: '#f3f4f6',
    },

    joinPillText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },

    joinPillTextLeave: {
        color: '#ef4444',
    },

    joinPillTextFull: {
        color: '#9ca3af',
    },

    // Empty / loading
    centred: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },

    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 6,
    },

    emptySubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },

    discoverBtn: {
        backgroundColor: '#F2B949',
        paddingHorizontal: 24,
        paddingVertical: 11,
        borderRadius: 20,
    },

    discoverBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },

    // Filter sheet
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },

    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 36,
        maxHeight: '80%',
    },

    sheetHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },

    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 16,
    },

    sheetSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },

    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },

    chipActive: {
        backgroundColor: '#F2B949',
        borderColor: '#F2B949',
    },

    chipText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },

    chipTextActive: {
        color: '#111',
        fontWeight: '700',
    },

    sheetActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },

    sheetClearBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },

    sheetClearText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6b7280',
    },

    sheetApplyBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 10,
        backgroundColor: '#F2B949',
        alignItems: 'center',
    },

    sheetApplyText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },
});
