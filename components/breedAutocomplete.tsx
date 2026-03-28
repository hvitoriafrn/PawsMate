//components/breedAutocomplete.tsx

//A text input that will have a dropdown of brees suggestions for easier profile completion

import { dogBreeds } from '@/constants/dogBreeds';
import React, { useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Props
interface BreedAutocompleteProps {
    value: string;
    onChangeText: (text: string) => void; // called when the text changes
}

// Component 
const BreedAutocomplete: React.FC<BreedAutocompleteProps> = ({ 
    value, onChangeText }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // user types an input
    const handleChangeText = (text: string) => {
        onChangeText(text);

        if (text.length >= 2) {
            // filter the list so it shows only the ones that contain the typed text
            const filtered = dogBreeds.filter((breed) =>
                breed.toLowerCase().includes(text.toLowerCase())
        );
        // show max only 6 suggestions 
        setSuggestions(filtered.slice(0, 6));
        // hide the dropdown if nothing matches
        setShowSuggestions(filtered.length > 0);

        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Handle when user taps a suggestion
    const handleSelectBreed = (breed: string) => {
        onChangeText(breed);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Input loses focus if user taps elsewhere
    const handleBlur = () => {
        // a small delay so a suggestion tap registers before the dropdown closes
        setTimeout(() => setShowSuggestions(false), 200);
    };

    // Render dropdown
    return (
        <View style={styles.wrapper}>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={handleChangeText}
                onFocus={() => handleChangeText(value)}
                onBlur={handleBlur}
                placeholder="e.g., Golden Retriever"
                placeholderTextColor="#aaa"
                autoCorrect={false}
                autoComplete="off"
            />

            {/* Only render when there are suggestions to show */}
            {showSuggestions && (
                <View style={styles.dropdown}>
                    {suggestions.map((breed, index) => (
                        <TouchableOpacity
                            key={breed}
                            style={[
                                styles.suggestionItem,
                                index === suggestions.length - 1 && styles.lastItem, 
                            ]}
                            onPress={() => handleSelectBreed(breed)}
                            activeOpacity={0.7}
                            >
                            
                            <Text style={styles.suggestionText}>{breed}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

// styles 
const styles = StyleSheet.create({

  wrapper: { 
    position: 'relative', 
    zIndex: 10 
  },

  input: {
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8,
    paddingVertical: 12, 
    paddingHorizontal: 12,
    fontSize: 15, 
    color: '#333', 
    backgroundColor: '#fff',
  },

  dropdown: {
    position: 'absolute', 
    top: 48, 
    left: 0, 
    right: 0,
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd',
    borderRadius: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, 
    shadowRadius: 6,
    elevation: 8, 
    zIndex: 999,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },

  suggestionItem: {
    paddingVertical: 12, 
    paddingHorizontal: 14,
    borderBottomWidth: 1, 
    borderBottomColor: '#f2f2f2',
  },

  lastItem: { 
    borderBottomWidth: 0 
  },

  suggestionText: { 
    fontSize: 15, 
    color: '#333' 
  },

});

export default BreedAutocomplete;
