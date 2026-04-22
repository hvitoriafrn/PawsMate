// Autocomplete input with a filtered breed suggestions dropdown

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

interface BreedAutocompleteProps {
    value: string;
    onChangeText: (text: string) => void;
    // When true, the suggestion dropdown appears above the input instead of below.
    // Useful when the input is near the bottom of the screen to prevent it from being cut off.
    dropdownAbove?: boolean;
}

const BreedAutocomplete: React.FC<BreedAutocompleteProps> = ({
    value, onChangeText, dropdownAbove = false }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleChangeText = (text: string) => {
        onChangeText(text);

        if (text.length >= 2) {
            const filtered = dogBreeds.filter((breed) =>
                breed.toLowerCase().includes(text.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 6));
        setShowSuggestions(filtered.length > 0);

        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectBreed = (breed: string) => {
        onChangeText(breed);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleBlur = () => {
        // a small delay so a suggestion tap registers before the dropdown closes
        setTimeout(() => setShowSuggestions(false), 200);
    };

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

            {showSuggestions && (
                <View style={[styles.dropdown, dropdownAbove && styles.dropdownAbove]}>
                    {suggestions.map((breed, index) => (
                        <TouchableOpacity
                            key={breed}
                            style={[
                                styles.suggestionItem,
                                index === suggestions.length - 1 && styles.lastItem,
                            ]}
                            onPressIn={() => handleSelectBreed(breed)}
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

  // When the input is near the bottom of the screen, render the dropdown above
  dropdownAbove: {
    top: undefined,
    bottom: 48,
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
