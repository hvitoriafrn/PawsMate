// File to combine both edit and create pet modal

import BreedAutocomplete from '@/components/breedAutocomplete';
import { auth } from '@/config/firebase';
import { createPet, updatePet } from '@/services/firebase/firestoreService';
import { pickImage, uploadImageToStorage } from '@/utils/imageUpload';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

// Static data first for the tags to be used to preset persoanlity/temperament 

// personality tags
const PERSONALITY_TAGS = [
    'Friendly', 'Energetic', 'Calm', 'Playful', 
    'Good with kids', 'Good with other pets', 'Affectionate', 'Loves walks',
    'Loves cuddles', 'Curious', 'Puppy', 'Senior', 'Rescue'
];

// 'Looking for' tags
const LOOKING_FOR = [ 
    'Playdates', 'Walking buddies', 'Breeding',
    'Training tips', 'Pet sitting exchange', 
    'Grooming tips', 'Hiking buddies',
];

// Maximum amount of photos per pet
const MAX_PHOTOS = 5;

// Describes the shape of a pet object throughout the app.
// This is exported so profile.tsx and other files can use the same tpe

export interface PetData {
    id?: string;
    name: string;
    type: string;
    breed: string;
    age: number;
    gender: string;
    size: string;
    tags: string[];
    lookingFor: string[]; // intent tags
    photo: string; // main photo URL for Explore screen
    photos?: string[]; 
    vaccinated: boolean;
    spayedNeutered: boolean; 
    healthNotes: string;
    microchipNumber: string; // only readable by admins via Firestore rules
}

// Props the parent component passes to control the modal
interface PetFormModalProps {
    visible: boolean; 
    onClose: () => void; 
    onSaved: (pet: PetData) => void; // called with the saved pet data so parent can update its list
    initialData?: PetData; // if it's provided, the form pre-fills for editing
}

// Returns an empty form state, for when adding a new pet
const emptyForm = () => ({
    name: '', type: 'Dog', breed: '', age: 1,
    gender: 'Female', size: 'Medium', tags: [],
    lookingFor: [], vaccinated: false, spayedNeutered: false,
    healthNotes: '', microchipNumber: '', photos: [],
});

// Component
const PetFormModal: React.FC<PetFormModalProps> = ({
    visible,
    onClose,
    onSaved,
    initialData,
}) => {

    // isEditing is true if the initalData was provided and if it has an id
    const isEditing = !!initialData?.id;

    // All the form fields passed individually to then pass it directly to TextInput's onChangeText
    const [name, setName] = useState('');
    const [type, setType] = useState('Dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState(1);
    const [gender, setGender] = useState('Female');
    const [size, setSize] = useState('Medium');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [lookingFor, setLookingFor] = useState<string[]>([]);
    const [vaccinated, setVaccinated] = useState(false);
    const [spayedNeutered, setSpayedNeutered] = useState(false);
    const [healthNotes, setHealthNotes] = useState('');
    const [microchipNumber, setMicrochipNumber] = useState('');
    const [customTag, setCustomTag] = useState(''); // the text input for adding a custom tag
    const [photos, setPhotos] = useState<string[]>([]);
    const [saving, setSaving] = useState(false); // to show loading indicator when saving
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [sizeOpen, setSizeOpen] = useState(false);

    // Populate the form when the modal opens
    useEffect(() => {
    if (!visible) return; // modal is closing or not visible, don't do anything

    if (initialData) {
      // Edit pet mode: pre-fill every field from the existing pet document
      setName(initialData.name);
      setType(initialData.type);
      setBreed(initialData.breed);
      setAge(initialData.age);
      setGender(initialData.gender);
      setSize(initialData.size);
      setSelectedTags(initialData.tags ?? []);
      setLookingFor(initialData.lookingFor ?? []);
      setVaccinated(initialData.vaccinated ?? false);
      setSpayedNeutered(initialData.spayedNeutered ?? false);
      setHealthNotes(initialData.healthNotes ?? '');
      setMicrochipNumber(initialData.microchipNumber ?? '');
      setPhotos(initialData.photos ?? []);
    } else {
      // Create pet mode: reset everything to blank defaults
      const blank = emptyForm();
      setName(blank.name);
      setType(blank.type);
      setBreed(blank.breed);
      setAge(blank.age);
      setGender(blank.gender);
      setSize(blank.size);
      setSelectedTags(blank.tags);
      setLookingFor(blank.lookingFor);
      setVaccinated(blank.vaccinated);
      setSpayedNeutered(blank.spayedNeutered);
      setHealthNotes(blank.healthNotes);
      setMicrochipNumber(blank.microchipNumber);
      setPhotos(blank.photos);
    }
    setCustomTag(''); // clear the custom tag input when modal opens
  }, [visible, initialData]);

    // Toggle a tag in the selectedTags array
    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag)
        ? prev.filter((t) => t !== tag) //remove 
        : [...prev, tag], //add it
        );
    };


    // Same logic for the looking for tags
    const toggleLookingFor = (option: string) => {
        setLookingFor((prev) =>
            prev.includes(option)
        ? prev.filter((o) => o !== option) //remove 
        : [...prev, option], //add it
        );
    };

    // Add custom tag text as a new selected tag
    const addCustomTag = () => {
        const trimmed = customTag.trim();
        if (!trimmed) return; // prevents empty tags from being added
        if (selectedTags.includes(trimmed)) { // prevents duplicates from being added
            setCustomTag('');
            return;
        }
        setSelectedTags((prev) => [...prev,trimmed]);
        setCustomTag('');
    };

    // Handlers for photo management
    const handleAddPhoto = async () => {
        if (photos.length >= MAX_PHOTOS) {
            Alert.alert('Photo limit', `You can only add up to ${MAX_PHOTOS} photos.`);
            return;
        }

        setUploadingPhoto(true);
        try {
            const localUri = await pickImage(); // open the photo library
            if (localUri) {
                // Add the local file to the aray, no upload happens until user presses save
                setPhotos((prev) => [...prev, localUri]);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not pick image. Please try again. ')
        } finally {
            setUploadingPhoto(false);
        }
    };

    const removePhoto = (index: number) => {
        // create a new array using filter() to exclude the photo at index
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };


    // Form validation called before saving
    // Will return error message if something is wrong
    const validate = (): string | null => {
        if (!name.trim()) return "Please enter your pet's name.";
        if (!breed.trim()) return 'Please enter a breed (or "Mixed Breed/Ohter")';
        if (age < 0 || age >30) return 'Please enter a valid age (0-30 years)';
        if (microchipNumber && microchipNumber.length !== 15)
            return 'Microchip numbers must be 15 digits';
        return null;
    };
    

    // Save to firestore
    const handleSave = async () => {
        const error = validate();
        if (error) {
            Alert.alert('Missing information', error);
            return;
        }

        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert('Error', 'You must be logged in to save a pet')
            return;
        }

        setSaving(true);
        try {
            // Upload photos that are still local and keep the ones already uploaded
            const finalPhotoURLs: string[] = [];

            for (let i=0; i < photos.length; i++) {
                const photo = photos[i];

                if (photo.startsWith('https://')) {
                    // Already has a URL (means it's been uploaded)
                    finalPhotoURLs.push(photo);
                } else {
                    //if it's a local file still, upload
                    const path = `pets/${userId}/${Date.now()}_${i}.jpg`;
                    const url = await uploadImageToStorage(photo,path);
                    finalPhotoURLs.push(url);
                }
            }

            // build the object (pet) 
            const petData = {
                ownerId: userId,    // links this pet to the logged-in user
                name: name.trim(),
                type: 'Dog',
                breed: breed.trim(),
                age,
                gender,
                size,
                personalityTraits: selectedTags,
                lookingFor,
                photo: finalPhotoURLs[0] || '',
                photos: finalPhotoURLs,
                healthInfo: {
                    vaccinated,
                    spayedNeutered,
                    healthNotes: healthNotes.trim(),
                },
                //Microchip still optional so only to be included if it was entered
                ...(microchipNumber ? { 
                    verification: {
                        microchipNumber: microchipNumber.trim(),
                        verified: false,
                        verifiedAt: null,
                    }
                }: {}),
            };

            // Create a new doc or update the current one
            if (isEditing && initialData?.id) {
                await updatePet(initialData.id, petData);
                onSaved({ id: initialData.id, ...petData, microchipNumber,
                        tags: selectedTags, vaccinated, spayedNeutered,
                        healthNotes, photos: finalPhotoURLs });
            } else {
                const petId = await createPet(petData);
                onSaved({ id: petId, ...petData, microchipNumber,
                        tags: selectedTags, vaccinated, spayedNeutered,
                        healthNotes, photos: finalPhotoURLs });
            }

            onClose(); // close the modal 
        } catch (error) {
            console.error('Error saving pet', error);
            Alert.alert('Error', 'Error saving the pet. Please try again.');
        } finally {
            setSaving(false); // re-enable the save button even if it correctly saves or not
        }
    };


    // Render the modal
    return (
    <Modal 
        visible = {visible}
        animationType="slide"
        presentationStyle="pageSheet" // for iOs to show the card over the screen
        onRequestClose={onClose}     // on Android, to hanldle the back button
    >
        <KeyboardAvoidingView
            style={{ flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                // without this tapping a breed would dismiss the keyboard and close dropdown
                keyboardShouldPersistTaps="handled" 
            >
                {/* Heading */}
                <Text style={styles.heading}>
                    {isEditing ? 'Edit Pet' : 'Add New Pet' }
                </Text>

                {/* Phtos */}
                <Text style={styles.label}> Photos </Text>
                <Text style={styles.subLabel}>
                    The first photo will the main photo on the Explore screen. Add up to {MAX_PHOTOS}.
                </Text>

                {/* Horizontal scroll for the thumbnails */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoRow}
                >
                    {/* Render each existing or chosen photo */}
                    { photos.map((uri, index) => (
                        <View key={index} style={styles.photoContainer}>
                            <Image source={{ uri }} style={styles.photoThumb} />

                            {/* Red X button to remove button */}
                            <TouchableOpacity
                                style={styles.removePhotoBtn}
                                onPress={() => removePhoto(index)}
                            >
                                <Text style={styles.removePhotoBtnText}>x</Text>
                            </TouchableOpacity>

                            {/* Shoe a main badge to indicate that's the first photo shown on Explore */}
                            {index === 0 && (
                                <View style={styles.mainBadge}>
                                    <Text style={styles.mainBadgeText}>Main photo</Text>
                                </View>
                            )}
                        </View>
                    ))}

                    {/*Add photo button to be shown if there's less than 5 photos added */}
                    {photos.length < MAX_PHOTOS && (
                        <TouchableOpacity
                            style={styles.addPhotoBtn}
                            onPress={handleAddPhoto}
                            disabled={uploadingPhoto}
                        >
                            {uploadingPhoto
                            ? <ActivityIndicator color="#20B2AA" />
                            : <Text style={styles.addPhotoBtnText}>+ Add Photo</Text>
                            }
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* Name */}
                <View style={styles.row}>
                    <View style={styles.halfLeft}>
                        <Text style={styles.label}> Pet Name * </Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., Max"
                            placeholderTextColor="#aaa"
                        />
                    </View>
                </View>

                {/* Breed autocomplete */}
                <View style={{ zIndex: 10 }}>
                    <Text style={styles.label}> Breed *</Text>
                    <BreedAutocomplete
                        value={breed}
                        onChangeText={setBreed}
                    />
                </View>

                {/* Age and Gender row */}
                <View style={[styles.row, { zIndex: 1}]}>

                    {/* A stepper to avoid errors  (letters or decimals) */}
                    <View style={styles.halfLeft}>
                        <Text style={styles.label}>Age *</Text>
                            <TextInput
                                style={styles.input}
                                value={age === 0 ? '' : String(age)}
                                onChangeText={(t) => {
                                    // Only allow numbers, max 2 digits
                                    const num = parseInt(t.replace(/[^0-9]/g, ''));
                                    if (!isNaN(num)) setAge(Math.min(30, num));
                                    if (t === '') setAge(0);
                                }}
                                placeholder="e.g., 2"
                                placeholderTextColor="#aaa"
                                keyboardType="number-pad"
                                maxLength={2}
                            />
                        </View>
                
                    {/* Gender  */}
                    <View style={styles.halfRight}>
                        <Text style={styles.label}> Gender </Text>
                        <View style={styles.radioRow}>
                            {['Male','Female'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.radioOption}
                                    onPress={() => setGender(option)}
                                    activeOpacity={0.7}
                                >
                                    {/* outer ring of radio button */}
                                    <View style={styles.radioCircle}>
                                        {/* Filled when an option is selected */}
                                        {gender === option && <View style={styles.radioFilled} />}
                                    </View>
                                    <Text style={styles.radioLabel}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                    </View>
                </View>
            </View>

             {/* Size*/}   
                <View>
                    <Text style={styles.label}>Size</Text>
                    <TouchableOpacity
                        style={styles.dropdownBtn}
                        onPress={() => setSizeOpen(prev => !prev)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dropdownBtnText}>{size}</Text>
                        <Text style={styles.dropdownArrow}>{sizeOpen ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    
                    {/* Options shown when open */}
                    {sizeOpen && (
                        <View style={styles.dropdownList}>
                            {['Small', 'Medium', 'Large', 'XL'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.dropdownItem,
                                        size === option && styles.dropdownItemSelected
                                    ]}
                                    onPress={() => {
                                        setSize(option);
                                        setSizeOpen(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.dropdownItemText,
                                        size === option && styles.dropdownItemTextSelected
                                    ]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                        ))} 
                        </View>
                    )}
                </View>

                <Text style={styles.label}>Tags</Text>
                <View style={styles.chipContainer}>
                    {/* Preset tags */}
                    {PERSONALITY_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <TouchableOpacity
                                key={tag}
                                style={[styles.chip, isSelected && styles.chipSelectedGreen]}
                                onPress={() => toggleTag(tag)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextWhite]}>
                                    {tag}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Custom tags added by the user */}
                    {selectedTags
                    .filter((t) => !PERSONALITY_TAGS.includes(t))
                    .map((customT) => (
                        <TouchableOpacity
                            key={customT}
                            style={[styles.chip, styles.chipSelectedGreen]}
                            onPress={() => toggleTag(customT)} // tap again to remove
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.chipText, styles.chipTextWhite]}>{customT}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                {/* Custom tag input row */}
                <View style={styles.customTagRow}>
                    <TextInput
                        style={styles.customTagInput}
                        value={customTag}
                        onChangeText={setCustomTag}
                        placeholder="Add custom tag"
                        placeholderTextColor="#aaa"
                        returnKeyType="done"       // shows "Done" on the keyboard
                        onSubmitEditing={addCustomTag} // pressing Done on keyboard will add the tag
                    />
                    <TouchableOpacity style={styles.addTagBtn} onPress={addCustomTag}>
                        <Text style={styles.addTagBtnText}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Looking for tags */}
                <Text style={styles.label}>Looking For</Text>
                <View style={styles.chipContainer}>
                    {LOOKING_FOR.map((option) => {
                        const isSelected = lookingFor.includes(option);
                        return (
                            <TouchableOpacity
                                key={option}
                                style={[styles.chip, isSelected && styles.chipSelectedOrange]}
                                onPress={() => toggleLookingFor(option)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextWhite]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Health information */}
                <View style={styles.divider} />
                <Text style={styles.sectionHeading}> Health Information </Text>

                {/* Custom checkbox rows */}
                <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setVaccinated((v) => !v)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, vaccinated && styles.checkboxChecked]}>
                        {vaccinated && <Text style={styles.checkmark}> ✓ </Text>}
                    </View>
                    <Text style={styles.checkLabel}>Vaccinated</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setSpayedNeutered((v) => !v)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, spayedNeutered && styles.checkboxChecked]}>
                        {spayedNeutered && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkLabel}>Spayed / Neutered </Text>
                </TouchableOpacity>

                <Text style={styles.label}> Health Notes </Text>
                <TextInput 
                    style={[styles.input, styles.textArea]}
                    value={healthNotes}
                    onChangeText={setHealthNotes}
                    placeholder="Any allergies, conditions or special care needed..."
                    placeholderTextColor="#aaa"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />

                {/* Verification */}
                <View style={styles.divider} />
                <View style={styles.verifyHeader}>
                    <Text style={styles.verifyIcon}></Text>
                    <Text style={styles.sectionHeading}> Verification (Optional)</Text>
                </View>
                <Text style={styles.verifyNote}>
                    Add your pet's microchip number to get verified. 
                    This is only visible to admins for verification purposes.
                </Text>
                <TextInput
                    style={styles.input}
                    value={microchipNumber}
                    onChangeText={(t) =>
                        // Only allow digits, max 15 characters (standard microchip length)
                        setMicrochipNumber(t.replace(/[^0-9]/g, '').slice(0, 15))
                    }
                    placeholder="15-digit microchip number"
                    placeholderTextColor="#aaa"
                    keyboardType="number-pad"
                    maxLength={15}
                />

                {/* Cancel / Save buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={onClose}
                        disabled={saving}
                    >
                        <Text style={styles.cancelBtnText}> Cancel </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.saveBtnText}>
                            {isEditing ? 'Save Changes' : 'Add Pet'}
                        </Text>
                        }
                    </TouchableOpacity>
                </View>
                
                <View style={{ height: 40 }} /> 
            </ScrollView>
        </KeyboardAvoidingView>
    </Modal>
    );
};

const styles = StyleSheet.create({

  container: { 
    flex: 1, 
    backgroundColor: '#fff'    
  },

  scrollContent: { 
    padding: 20 
  },

  heading: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#111', 
    marginBottom: 20 
  },

  sectionHeading: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#111', 
    marginBottom: 12 
  },

  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333', 
    marginTop: 16, 
    marginBottom: 6 
  },

  subLabel: { 
    fontSize: 12, 
    color: '#888', 
    marginTop: -4, 
    marginBottom: 8 
  },

  input: {
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8,
    padding: 12, 
    fontSize: 15, 
    color: '#333', 
    backgroundColor: '#fff',
  },

  textArea: { 
    height: 90, 
    paddingTop: 10 
  },

  // Two columns layout
  row: { 
    flexDirection: 'row', 
    marginHorizontal: -4 
  },

  halfLeft: { 
    flex: 1, 
    marginHorizontal: 4 
  },

  halfRight: { 
    flex: 1, 
    marginHorizontal: 4 
  },

  thirdLeft: { 
    flex: 1, 
    marginHorizontal: 4 
  },

  thirdMiddle: { 
    flex: 1.2, 
    marginHorizontal: 4 
  },

  thirdRight: { 
    flex: 1.2, 
    marginHorizontal: 4 
  },

  // Dropdown section for size
  dropdownBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  
  dropdownBtnText: {
    fontSize: 15,
    color: '#333',
  },

  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    // Shadow so it appears to float above content below it
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  }, 
  
  dropdownItemSelected: {
    backgroundColor: '#e0f5f5',
  },
  
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
  
  dropdownItemTextSelected: {
    color: '#20B2AA',
    fontWeight: '600',
  },

  // Chips
  chipContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginTop: 4 
  },

  chip: {
    paddingVertical: 7, 
    paddingHorizontal: 14, 
    borderRadius: 20,
    backgroundColor: '#f2f2f2', 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
  },

  chipSelectedGreen: { 
    backgroundColor: '#20B2AA', 
    borderColor: '#20B2AA' 
  },

  chipSelectedOrange: { 
    backgroundColor: '#F5A623', 
    borderColor: '#F5A623' 
  },

  chipText: { 
    fontSize: 13, 
    color: '#555' 
  },

  chipTextWhite: { 
    color: '#fff', 
    fontWeight: '600' 
  },

  // Custom tag row
  customTagRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    gap: 8 
  },

  customTagInput: {
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8,
    padding: 10, 
    fontSize: 14, 
    color: '#333',
  },

  addTagBtn: {
    width: 40, 
    height: 40, 
    borderRadius: 10,
    backgroundColor: '#20B2AA', 
    alignItems: 'center', 
    justifyContent: 'center',
  },

  addTagBtnText: { 
    color: '#fff', 
    fontSize: 22, 
    lineHeight: 26 
  },

  // Photos
  photoRow: { 
    flexDirection: 'row', 
    paddingVertical: 8 
  },
  
  photoContainer: { 
    position: 'relative', 
    marginRight: 10 
  },

  photoThumb: { 
    width: 90, 
    height: 90, 
    borderRadius: 10, 
    backgroundColor: '#eee'
  },

  removePhotoBtn: {
    position: 'absolute', 
    top: -6, 
    right: -6,
    width: 22, height: 22, 
    borderRadius: 11,
    backgroundColor: '#ff4444', 
    alignItems: 'center', 
    justifyContent: 'center',
  },

  removePhotoBtnText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '700' 
  },

  mainBadge: {
    position: 'absolute', 
    bottom: 4, 
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6,
  },

  mainBadgeText: { 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: '600' 
 },

  addPhotoBtn: {
    width: 90,
    height: 90, 
    borderRadius: 10,
    borderWidth: 2, 
    borderColor: '#20B2AA', 
    borderStyle: 'dashed',
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f0fafa',
  },

  addPhotoBtnText: { 
    color: '#20B2AA', 
    fontSize: 13, 
    fontWeight: '600' 
  },

  // Health checkboxes
  checkRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },

  checkbox: {
    width: 22, 
    height: 22, 
    borderRadius: 5,
    borderWidth: 2, 
    borderColor: '#ccc',
    alignItems: 'center', 
    justifyContent: 'center',
     marginRight: 10,
  },

  checkboxChecked: { 
    backgroundColor: '#20B2AA', 
    borderColor: '#20B2AA' 
  },

  checkmark: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '700' 
  },

  checkLabel: { 
    fontSize: 15, 
    color: '#333'
  },

  // Verification
  verifyHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 4 
  },

  verifyIcon: { 
    fontSize: 16 
  },

  verifyNote: { 
    fontSize: 13, 
    color: '#888', 
    marginBottom: 10, 
    lineHeight: 18 
  },

  // Divider
  divider: { 
    height: 1, 
    backgroundColor: '#eee', 
    marginVertical: 20 
  },

  // Buttons
  buttonRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 24 
  },

  cancelBtn: {
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: '#ddd', 
    alignItems: 'center', 
    backgroundColor: '#fff',
  },

  cancelBtnText: { 
    fontSize: 16, 
    color: '#555', 
    fontWeight: '500' 
  },

  saveBtn: {
    flex: 2, 
    paddingVertical: 14, 
    borderRadius: 12,
    backgroundColor: '#F2B949', 
    alignItems: 'center',
  },

  saveBtnText: { 
    fontSize: 16, 
    color: '#000000', 
    fontWeight: '700' 
  },

   // Gender radio buttons
  radioRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },

  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#20B2AA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#20B2AA',
  },

  radioLabel: {
    fontSize: 14,
    color: '#333',
  },

});

export default PetFormModal;