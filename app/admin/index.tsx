// Admin panel for event management + microchip verification queue

import { SCREEN_BG, SCREEN_TITLE } from '@/constants/styles';
import { createEvent, deleteEvent, getEvents, updateEvent } from '@/services/firebase/eventService';
import { getPendingVerificationPets, updatePetVerification } from '@/services/firebase/petService';
import { useUserStore } from '@/store/userStore';
import { Event, EventType, Pet, PetType } from '@/types/database';
import { geocodeAddress } from '@/utils/geocoding';
import { pickImage, uploadImageToStorage } from '@/utils/imageUpload';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EVENT_TYPES: EventType[] = [
    'Dog Walk',
    'Playdate',
    'Training',
    'Dog Park Meetup',
    'Grooming',
    'General Meetup',
];

const PET_TYPES: PetType[] = ['Dog', 'Cat'];

// Empty form helper 

const emptyEventForm = () => ({
    title: '',
    description: '',
    type: 'General Meetup' as EventType,
    dateObj: new Date(),
    location: '',
    maxAttendees: '',
    breed: '',
    petType: '' as PetType | '',
    imageUrl: '',
});

type EventFormState = ReturnType<typeof emptyEventForm>;

export default function AdminScreen() {
    const { user, profile } = useUserStore();

    // Block non-admins
    if (!profile?.isAdmin) {
        return (
            <SafeAreaView style={[styles.container, styles.centred]}>
                <Feather name="lock" size={40} color="#9ca3af" />
                <Text style={styles.emptyTitle}>Access restricted</Text>
                <Text style={styles.emptySubtitle}>You need admin privileges to view this screen.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Tab: events & verifications
    const [tab, setTab] = useState<'events' | 'verifications'>('events');

    // Events state
    const [events, setEvents] = useState<Event[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);

    // Verifications state
    const [pendingPets, setPendingPets] = useState<Pet[]>([]);
    const [verifyLoading, setVerifyLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Event form modal
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [form, setForm] = useState<EventFormState>(emptyEventForm());
    const [saving, setSaving] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [androidPickerMode, setAndroidPickerMode] = useState<'date' | 'time'>('date');
    const [tempDate, setTempDate] = useState(new Date());

    useFocusEffect(
        useCallback(() => {
            loadEvents();
            loadPending();
        }, [])
    );

    const loadEvents = async () => {
        setEventsLoading(true);
        try {
            const fetched = await getEvents();
            setEvents(fetched);
        } finally {
            setEventsLoading(false);
        }
    };

    const loadPending = async () => {
        setVerifyLoading(true);
        try {
            const pets = await getPendingVerificationPets();
            setPendingPets(pets);
        } finally {
            setVerifyLoading(false);
        }
    };

    // Event form helpers

    const openCreate = () => {
        setEditingEvent(null);
        setForm(emptyEventForm());
        setLocationError('');
        setShowForm(true);
    };

    const openEdit = (event: Event) => {
        setEditingEvent(event);
        setForm({
            title: event.title,
            description: event.description,
            type: event.type,
            dateObj: event.date,
            location: event.location,
            maxAttendees: event.maxAttendees ? String(event.maxAttendees) : '',
            breed: event.breed || '',
            petType: event.petType || '',
            imageUrl: event.imageUrl || '',
        });
        setLocationError('');
        setShowForm(true);
    };

    const handleSaveEvent = async () => {
        if (!form.title.trim()) {
            Alert.alert('Validation', 'Please enter an event title.');
            return;
        }
        if (!form.location.trim()) {
            Alert.alert('Validation', 'Please enter a location.');
            return;
        }

        setSaving(true);
        setLocationError('');

        try {
            // Geocode the location
            const coords = await geocodeAddress(form.location.trim());
            if (!coords) {
                setLocationError('Could not find this location. Please be more specific.');
                setSaving(false);
                return;
            }

            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                type: form.type,
                date: form.dateObj,
                location: form.location.trim(),
                latitude: coords.latitude,
                longitude: coords.longitude,
                maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees, 10) : undefined,
                breed: form.breed.trim() || undefined,
                petType: (form.petType as PetType) || undefined,
                imageUrl: form.imageUrl || undefined,
            };

            if (editingEvent) {
                await updateEvent(editingEvent.id, payload);
                setEvents(prev =>
                    prev.map(e =>
                        e.id === editingEvent.id
                            ? {
                                  ...e,
                                  ...payload,
                                  geopoint: { latitude: coords.latitude, longitude: coords.longitude },
                              }
                            : e
                    )
                );
            } else {
                const newId = await createEvent({ ...payload, createdBy: user!.uid, createdByName: 'PawsMate' });
                // Reload to get the full object from Firestore
                await loadEvents();
                console.log('Event created:', newId);
            }

            setShowForm(false);
        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert('Error', 'Could not save the event. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = (event: Event) => {
        Alert.alert('Delete event', `Delete "${event.title}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteEvent(event.id);
                        setEvents(prev => prev.filter(e => e.id !== event.id));
                    } catch {
                        Alert.alert('Error', 'Could not delete the event.');
                    }
                },
            },
        ]);
    };

    // Verification helpers 

    const handleVerify = async (pet: Pet, approved: boolean) => {
        Alert.alert(
            approved ? 'Approve verification' : 'Reject verification',
            `${approved ? 'Approve' : 'Reject'} microchip verification for ${pet.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: approved ? 'Approve' : 'Reject',
                    style: approved ? 'default' : 'destructive',
                    onPress: async () => {
                        setProcessingId(pet.id);
                        try {
                            await updatePetVerification(pet.id, approved, user!.uid);
                            setPendingPets(prev => prev.filter(p => p.id !== pet.id));
                        } catch {
                            Alert.alert('Error', 'Could not update verification status.');
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ]
        );
    };

    // ── Renderers ──

    const formatDate = (date: Date) =>
        date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const renderEvent = ({ item: event }: { item: Event }) => (
        <View style={styles.adminCard}>
            <View style={styles.adminCardContent}>
                <Text style={styles.adminCardTitle}>{event.title}</Text>
                <Text style={styles.adminCardSub}>{event.type}  ·  {formatDate(event.date)}</Text>
                <Text style={styles.adminCardSub} numberOfLines={1}>{event.location}</Text>
                <Text style={styles.adminCardSub}>{event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.adminCardActions}>
                <TouchableOpacity style={styles.adminIconBtn} onPress={() => openEdit(event)}>
                    <Feather name="edit-2" size={18} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.adminIconBtn} onPress={() => handleDeleteEvent(event)}>
                    <Feather name="trash-2" size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPendingPet = ({ item: pet }: { item: Pet }) => {
        const isProcessing = processingId === pet.id;
        return (
            <View style={styles.adminCard}>
                {pet.photo ? (
                    <Image source={{ uri: pet.photo }} style={styles.petThumb} />
                ) : (
                    <View style={[styles.petThumb, styles.petThumbFallback]}>
                        <Feather name="image" size={20} color="#9ca3af" />
                    </View>
                )}
                <View style={styles.adminCardContent}>
                    <Text style={styles.adminCardTitle}>{pet.name}</Text>
                    <Text style={styles.adminCardSub}>{pet.breed}  ·  {pet.type}</Text>
                    <View style={styles.chipRow}>
                        <Feather name="cpu" size={12} color="#6b7280" />
                        <Text style={styles.adminCardSub}>  {pet.verification.microchipNumber}</Text>
                    </View>
                </View>
                <View style={styles.verifyActions}>
                    {isProcessing ? (
                        <ActivityIndicator color="#F2B949" />
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.approveBtn}
                                onPress={() => handleVerify(pet, true)}
                            >
                                <Feather name="check" size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleVerify(pet, false)}
                            >
                                <Feather name="x" size={16} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
                    <Feather name="arrow-left" size={22} color="#111" />
                </TouchableOpacity>
                <Text style={styles.title}>Admin</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Segmented tabs */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tabItem, tab === 'events' && styles.tabItemActive]}
                    onPress={() => setTab('events')}
                >
                    <Text style={[styles.tabText, tab === 'events' && styles.tabTextActive]}>Events</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, tab === 'verifications' && styles.tabItemActive]}
                    onPress={() => setTab('verifications')}
                >
                    <Text style={[styles.tabText, tab === 'verifications' && styles.tabTextActive]}>
                        Verifications
                    </Text>
                    {pendingPets.length > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{pendingPets.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Events tab */}
            {tab === 'events' && (
                <>
                    {eventsLoading ? (
                        <View style={styles.centred}>
                            <ActivityIndicator size="large" color="#F2B949" />
                        </View>
                    ) : (
                        <FlatList
                            data={events}
                            keyExtractor={item => item.id}
                            renderItem={renderEvent}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={
                                <View style={styles.centred}>
                                    <Feather name="calendar" size={36} color="#d1d5db" />
                                    <Text style={styles.emptyTitle}>No events yet</Text>
                                    <Text style={styles.emptySubtitle}>Tap + to create the first one.</Text>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {/* FAB */}
                    <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
                        <Feather name="plus" size={26} color="#111" />
                    </TouchableOpacity>
                </>
            )}

            {/* Verifications tab */}
            {tab === 'verifications' && (
                <>
                    {verifyLoading ? (
                        <View style={styles.centred}>
                            <ActivityIndicator size="large" color="#F2B949" />
                        </View>
                    ) : (
                        <FlatList
                            data={pendingPets}
                            keyExtractor={item => item.id}
                            renderItem={renderPendingPet}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={
                                <View style={styles.centred}>
                                    <View style={styles.emptyIconWrap}>
                                        <Feather name="check-circle" size={36} color="#111" />
                                    </View>
                                    <Text style={styles.emptyTitle}>All clear</Text>
                                    <Text style={styles.emptySubtitle}>No pending microchip verifications.</Text>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </>
            )}

            {/* Event form modal */}
            <Modal
                visible={showForm}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowForm(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <SafeAreaView style={styles.formContainer} edges={['top']}>
                        {/* Modal header */}
                        <View style={styles.formHeader}>
                            <TouchableOpacity onPress={() => setShowForm(false)}>
                                <Text style={styles.formCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.formTitle}>
                                {editingEvent ? 'Edit event' : 'New event'}
                            </Text>
                            <TouchableOpacity onPress={handleSaveEvent} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator size="small" color="#F2B949" />
                                ) : (
                                    <Text style={styles.formSave}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={styles.formScroll}
                            keyboardShouldPersistTaps="handled"
                        >
                            <FormLabel text="Title" required />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Morning walk in the park"
                                placeholderTextColor="#999"
                                value={form.title}
                                onChangeText={v => setForm(prev => ({ ...prev, title: v }))}
                            />

                            <FormLabel text="Description" />
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="What's the event about?"
                                placeholderTextColor="#999"
                                value={form.description}
                                onChangeText={v => setForm(prev => ({ ...prev, description: v }))}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            <FormLabel text="Event type" required />
                            <View style={styles.chips}>
                                {EVENT_TYPES.map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.chip, form.type === type && styles.chipActive]}
                                        onPress={() => setForm(prev => ({ ...prev, type }))}
                                    >
                                        <Text style={[styles.chipText, form.type === type && styles.chipTextActive]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <FormLabel text="Date & time" required />
                            <TouchableOpacity
                                style={styles.dateBtn}
                                onPress={() => { setTempDate(form.dateObj); setAndroidPickerMode('date'); setShowDatePicker(true); }}
                            >
                                <Text style={styles.dateBtnText}>
                                    {form.dateObj.toLocaleString('en-GB', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                                <Feather name="calendar" size={18} color="#999" />
                            </TouchableOpacity>

                            {/* Android date/time pickers, two steps: date then time */}
                            {Platform.OS === 'android' && showDatePicker && (
                                <DateTimePicker
                                    value={tempDate}
                                    mode={androidPickerMode}
                                    minimumDate={androidPickerMode === 'date' ? new Date() : undefined}
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (event.type === 'set' && date) {
                                            if (androidPickerMode === 'date') {
                                                setTempDate(date);
                                                setAndroidPickerMode('time');
                                                setShowDatePicker(true);
                                            } else {
                                                setForm(prev => ({ ...prev, dateObj: date }));
                                                setTempDate(date);
                                            }
                                        }
                                    }}
                                />
                            )}

                            <FormLabel text="Location" required hint="UK address or postcode" />
                            <TextInput
                                style={[styles.input, locationError ? styles.inputError : undefined]}
                                placeholder="e.g. Victoria Park, London"
                                placeholderTextColor="#999"
                                value={form.location}
                                onChangeText={v => {
                                    setForm(prev => ({ ...prev, location: v }));
                                    if (locationError) setLocationError('');
                                }}
                            />
                            {!!locationError && <Text style={styles.errorText}>{locationError}</Text>}

                            <FormLabel text="Max attendees" hint="Leave blank for unlimited" />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 20"
                                placeholderTextColor="#999"
                                value={form.maxAttendees}
                                onChangeText={v => setForm(prev => ({ ...prev, maxAttendees: v.replace(/\D/g, '') }))}
                                keyboardType="number-pad"
                            />

                            <FormLabel text="Breed focus" hint="Optional" />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Golden Retriever"
                                placeholderTextColor="#999"
                                value={form.breed}
                                onChangeText={v => setForm(prev => ({ ...prev, breed: v }))}
                            />

                            <FormLabel text="Pet type" hint="Optional" />
                            <View style={styles.chips}>
                                {(['', ...PET_TYPES] as (PetType | '')[]).map(pt => (
                                    <TouchableOpacity
                                        key={pt || 'all'}
                                        style={[styles.chip, form.petType === pt && styles.chipActive]}
                                        onPress={() => setForm(prev => ({ ...prev, petType: pt }))}
                                    >
                                        <Text style={[styles.chipText, form.petType === pt && styles.chipTextActive]}>
                                            {pt || 'Any'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <FormLabel text="Cover photo" hint="Optional" />
                            {form.imageUrl ? (
                                <View style={styles.imagePreviewWrap}>
                                    <Image source={{ uri: form.imageUrl }} style={styles.imagePreview} />
                                    <TouchableOpacity
                                        style={styles.imageRemoveBtn}
                                        onPress={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                                    >
                                        <Feather name="x" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.imagePickerBtn}
                                    onPress={async () => {
                                        const uri = await pickImage({ allowsEditing: false });
                                        if (!uri) return;
                                        setSaving(true);
                                        try {
                                            const path = `events/${Date.now()}.jpg`;
                                            const url = await uploadImageToStorage(uri, path);
                                            setForm(prev => ({ ...prev, imageUrl: url }));
                                        } catch (err: any) {
                                            console.error('Event image upload error:', err);
                                            Alert.alert('Upload failed', err?.message || 'Could not upload image. Check Firebase Storage rules.');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                >
                                    <Feather name="image" size={20} color="#9ca3af" />
                                    <Text style={styles.imagePickerText}>Add cover photo</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </KeyboardAvoidingView>

                {/* iOS datetime picker modal */}
                {Platform.OS === 'ios' && (
                    <Modal
                        visible={showDatePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <View style={styles.dateModalOverlay}>
                            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDatePicker(false)} />
                            <View style={styles.dateModal}>
                                <View style={styles.dateModalHeader}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.dateModalCancel}>Cancel</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.dateModalTitle}>Date & Time</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setForm(prev => ({ ...prev, dateObj: tempDate }));
                                            setShowDatePicker(false);
                                        }}
                                    >
                                        <Text style={styles.dateModalDone}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="datetime"
                                    display="spinner"
                                    minimumDate={new Date()}
                                    onChange={(_, date) => { if (date) setTempDate(date); }}
                                    style={{ height: 200 }}
                                />
                            </View>
                        </View>
                    </Modal>
                )}
            </Modal>
        </SafeAreaView>
    );
}

// Small label helper
function FormLabel({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
    return (
        <View style={styles.labelRow}>
            <Text style={styles.label}>
                {text}
                {required && <Text style={styles.labelRequired}> *</Text>}
            </Text>
            {hint && <Text style={styles.labelHint}>{hint}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SCREEN_BG,
    },

    centred: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 8,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 8,
    },

    backIcon: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        ...SCREEN_TITLE,
    },

    // Segmented tabs
    tabRow: {
        flexDirection: 'row',
        marginHorizontal: 18,
        marginBottom: 12,
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

    list: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        gap: 10,
    },

    // Admin card
    adminCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },

    adminCardContent: {
        flex: 1,
        gap: 2,
    },

    adminCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },

    adminCardSub: {
        fontSize: 13,
        color: '#6b7280',
    },

    adminCardActions: {
        flexDirection: 'row',
        gap: 4,
    },

    adminIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Pet thumbnail
    petThumb: {
        width: 52,
        height: 52,
        borderRadius: 8,
    },

    petThumbFallback: {
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },

    chipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },

    // Verification action buttons
    verifyActions: {
        flexDirection: 'row',
        gap: 6,
    },

    approveBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },

    rejectBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 6,
    },

    // Empty states
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },

    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },

    emptySubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 20,
    },

    backBtn: {
        marginTop: 16,
        backgroundColor: '#F2B949',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },

    backBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },

    // Event form modal
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },

    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },

    formCancel: {
        fontSize: 15,
        color: '#9ca3af',
    },

    formTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },

    formSave: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F2B949',
    },

    formScroll: {
        padding: 20,
        paddingBottom: 40,
        gap: 6,
    },

    // Label
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 12,
        marginBottom: 4,
    },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },

    labelRequired: {
        color: '#F2B949',
        fontWeight: '700',
    },

    labelHint: {
        fontSize: 11,
        color: '#9ca3af',
    },

    // Inputs
    input: {
        backgroundColor: '#f9fafb',
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 10,
        fontSize: 15,
        color: '#111',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
    },

    inputError: {
        borderColor: '#ef4444',
    },

    multilineInput: {
        height: 80,
        paddingTop: 12,
    },

    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },

    // Date button
    dateBtn: {
        backgroundColor: '#f9fafb',
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    dateBtnText: {
        fontSize: 15,
        color: '#111',
    },

    // Chips
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
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
        backgroundColor: '#FEF3C7',
        borderColor: '#F2B949',
    },

    chipText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },

    chipTextActive: {
        color: '#92400e',
        fontWeight: '700',
    },

    // iOS datetime picker modal
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },

    dateModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 36,
    },

    dateModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },

    dateModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
    },

    dateModalCancel: {
        fontSize: 15,
        color: '#9ca3af',
    },

    dateModalDone: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F2B949',
    },

    imagePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f9fafb',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        borderRadius: 10,
        paddingVertical: 18,
        paddingHorizontal: 14,
    },

    imagePickerText: {
        fontSize: 15,
        color: '#9ca3af',
    },

    imagePreviewWrap: {
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
    },

    imagePreview: {
        width: '100%',
        height: 160,
        borderRadius: 10,
        resizeMode: 'cover',
    },

    imageRemoveBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
