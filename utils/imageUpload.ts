// Helper functions to pick and upload images to Firebase Storage

import { storage } from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

// Opens the photo picker and uploads the photo chosen by the user
// Returns null if user cancels
export async function pickAndUploadImage(
    storagePath: string,
    onProgress?: (progress: number) => void,
): Promise<string | null> {

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });

    if (result.canceled) return null;

    const localUri = result.assets[0].uri;

    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storage, storagePath);
    const uploadImage = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
        uploadImage.on(
            'state_changed', 
            (snapshot) => {
                const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                onProgress?.(progress);
            },
            (error) => reject(error),
            async () => {
                const downloadURL = await getDownloadURL(uploadImage.snapshot.ref);
                resolve(downloadURL);
            },
        );
    });
}

// open and upload an image,
// doesn't upload immediately (for example when the user needs to pick and confirm multiple photos)
export async function pickImage(options?: { allowsEditing?: boolean; aspect?: [number, number] }): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:['images'],
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [1, 1],
        quality: 0.8,
    });

    if (result.canceled) return null;
    return result.assets[0].uri;
}

export async function uploadImageToStorage(
    localUri: string,
    storagePath: string,
    onProgress?: (progress: number) => void,
): Promise<string> {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storage, storagePath);
    const uploadImage = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
        uploadImage.on(
            'state_changed',
            (snapshot) => {
                const progress = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                onProgress?.(progress);
            },
            (error) => reject(error),
            async () => {
                const downloadURL = await getDownloadURL(uploadImage.snapshot.ref);
                resolve(downloadURL);
            },
        );
    });
}