// Render one pet row in the 'My pets' list on the profile screen

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PetCardProps {
    pet: any;
    onEdit: () => void;
    onDelete: () => void;
}

export function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
    return (
        <View style={cardStyles.container}>

            {/* Pet photo, first from the array to show */}
            {pet.photos?.[0] || pet.photo ? (
                <Image
                    source= {{ uri: pet.photos?.[0] || pet.photo }}
                    style={cardStyles.thumb}
                />
            ) : (
                <View style={[cardStyles.thumb, cardStyles.thumbPlaceholder]}>
                    <Text style={{ fontSize: 28 }}>🐶 </Text>
                </View>
            )}

            <View style= {{ flex: 1 }}>
                {/* Name row that includes edit and delete icons */}
                <View style={cardStyles.nameRow}>
                    <Text style={cardStyles.name}>{pet.name}</Text>
                    <View style= {{ flexDirection: 'row', gap:4 }}>
                        <TouchableOpacity
                            onPress={onEdit}
                            style={{ padding: 4}}
                        >
                            <Feather name="edit-2" size={14} color="#00c489" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onDelete}
                            style= {{ padding: 4 }}>
                               <Feather name="trash-2" size={14} color="#ef4444" />
                            </TouchableOpacity>
                    </View>
                </View>

                {/* Breed, age and gender */}
                <Text style={cardStyles.meta}>
                    {pet.breed} · {pet.age} {pet.age !== 1 ? 'years' : 'year'} · {pet.gender}
                </Text>
                <Text style={cardStyles.meta}>Size: {pet.size}</Text>


                {/* Personality tags, the chips, shown max of 3 */}
                {(pet.personalityTraits?.length >0 || pet.tags?.length >0) && (
                    <View style={cardStyles.chipRow}>
                        {(pet.personalityTraits || pet.tags || []).slice(0, 3).map((tag: string) => (
                            <View key={tag} style={cardStyles.tagChip}>
                                <Text style={cardStyles.tagText}> {tag} </Text>
                            </View>
                        ))}
                        {/* Show the count of how many extra tags like "+2 more" */}
                        {(pet.personalityTraits || pet.tags || []).length > 3 && (
                            <Text style={cardStyles.overflow}>
                                +{(pet.personalityTraits || pet.tags || []).length - 3}
                            </Text>
                        )}
                    </View>
                )}

                {/* Looking for tags, max of 2 shown */}
                {pet.lookingFor?.length > 0 && (
                    <View style={cardStyles.chipRow}>
                        {pet.lookingFor.slice(0,2).map((lf: string) => (
                            <View key= {lf} style={cardStyles.lfChip}>
                                <Text style={cardStyles.lfText}>{lf}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

// Styles for the pet card, separate since it's a different component
const cardStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    thumb: {
        width: 62,
        height: 62,
        borderRadius: 30,
        alignSelf: 'center',
    },
    thumbPlaceholder: {
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    meta: {
        fontSize: 13,
        color: '#666',
        marginBottom: 1,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 5,
    },
    tagChip: {
        backgroundColor: '#e0f5f5',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
    },
    tagText: {
        fontSize: 11,
        color: '#20B2AA',
        fontWeight: '600',
    },
    lfChip: {
        backgroundColor: '#fff3e0',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F5A623',
    },
    lfText: {
        fontSize: 11,
        color: '#F5A623',
        fontWeight: '600',
    },
    overflow: {
        fontSize: 11,
        color: '#aaa',
        alignSelf: 'center',
    },
});
