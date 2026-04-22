// Signup screen, handles user registration with email, password, date of birth and GDPR consent
import { auth } from '@/config/firebase';
import { createUserDocument } from '@/services/firebase/userService';
import { useUserStore } from '@/store/userStore';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Earliest selectable date of birth (100 years ago) and latest (must be 18+)
const MAX_DOB = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })();
const MIN_DOB = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 100); return d; })();

const formatDob = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const computeAge = (dob: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
};

export default function SignUpScreen() {
    const router = useRouter();
    const { setUser } = useUserStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Date of birth, tempDob tracks the spinner before "Done" is tapped (for iOS only)
    const [dob, setDob] = useState<Date | null>(null);
    const [tempDob, setTempDob] = useState<Date>(MAX_DOB);
    const [showDobPicker, setShowDobPicker] = useState(false);

    const handleSignUp = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name.');
            return;
        }

        if (!dob) {
            Alert.alert('Error', 'Please enter your date of birth.');
            return;
        }

        if (computeAge(dob) < 18) {
            Alert.alert('Error', 'You must be at least 18 years old to register.');
            return;
        }

        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        if (!password.trim() || password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        if (!termsAccepted) {
            Alert.alert('Terms required', 'Please accept the Terms of Service and Privacy Policy to continue.');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            console.log('User acct created: ', user.uid);

            try {
                await createUserDocument(
                    user.uid,
                    email,
                    name,
                    computeAge(dob),
                    'Location pending...',
                    bio || undefined,
                    true,
                    new Date().toISOString()
                );
            } catch (firestoreError) {
                // Firestore write failed: delete the Auth account so the user can retry signup
                // cleanly instead of ending up with an Auth account but no profile document
                console.error('Firestore doc creation failed, rolling back Auth account:', firestoreError);
                await deleteUser(user);
                throw firestoreError;
            }

            console.log('Firestore doc created');

            // Store the full Firestore user so geopoint is available from the start
            setUser(user);

            Alert.alert('Success', 'Account created successfully!');
            router.replace('/auth/location' as any);

        } catch (error: any) {
            console.error('Signup error:', error);

            let errorMessage = error.message;
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address format.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Use at least 8 characters.';
            }

            Alert.alert('Sign up failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the PawsMate community</Text>

                    <View style={styles.form}>

                        {/* Full name */}
                        <FieldLabel text="Full name" required />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Robin Scherbatsky"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />

                        {/* Email */}
                        <FieldLabel text="Email address" required />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. robin@example.com"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />

                        {/* Password */}
                        <FieldLabel text="Password" required hint="At least 8 characters" />
                        <TextInput
                            style={styles.input}
                            placeholder="Create a password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="new-password"
                        />

                        {/* Confirm password */}
                        <FieldLabel text="Confirm password" required />
                        <TextInput
                            style={styles.input}
                            placeholder="Re-enter your password"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoComplete="new-password"
                        />

                        {/* Date of birth */}
                        <FieldLabel text="Date of birth" required hint="You must be 18 or over to register" />
                        <TouchableOpacity
                            style={styles.dobButton}
                            onPress={() => setShowDobPicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={dob ? styles.dobText : styles.dobPlaceholder}>
                                {dob ? formatDob(dob) : 'Select your date of birth'}
                            </Text>
                            <Feather name="calendar" size={18} color="#999" />
                        </TouchableOpacity>

                        {/* Android: native dialog, shown inline */}
                        {Platform.OS === 'android' && showDobPicker && (
                            <DateTimePicker
                                value={tempDob}
                                mode="date"
                                maximumDate={MAX_DOB}
                                minimumDate={MIN_DOB}
                                onChange={(event, selectedDate) => {
                                    setShowDobPicker(false);
                                    if (event.type === 'set' && selectedDate) {
                                        setDob(selectedDate);
                                        setTempDob(selectedDate);
                                    }
                                }}
                            />
                        )}

                        {/* Bio */}
                        <FieldLabel text="Bio" />
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            placeholder="Tell everyone a little about yourself..."
                            placeholderTextColor="#999"
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />

                        {/* Terms */}
                        <View style={styles.checkboxRow}>
                            <TouchableOpacity
                                style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
                                onPress={() => setTermsAccepted(prev => !prev)}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: termsAccepted }}
                            >
                                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                            <Text style={styles.checkboxLabel}>
                                I have read and agree to the{' '}
                                <Text style={styles.link} onPress={() => Linking.openURL('')}>
                                    Terms of Service
                                </Text>
                                {' '}and{' '}
                                <Text style={styles.link} onPress={() => Linking.openURL('')}>
                                    Privacy Policy
                                </Text>
                                , including how PawsMate processes my personal data under UK GDPR.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <Text style={styles.primaryButtonText}>
                                {loading ? 'Creating account...' : 'Create Account'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/auth/login')}>
                                <Text style={styles.linkText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </ScrollView>

            {/* iOS spinner inside a bottom sheet modal */}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={showDobPicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowDobPicker(false)}
                >
                    <View style={styles.dobModalOverlay}>
                        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDobPicker(false)} />
                        <View style={styles.dobModal}>
                            <View style={styles.dobModalHeader}>
                                <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                                    <Text style={styles.dobModalCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.dobModalTitle}>Date of Birth</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setDob(tempDob);
                                        setShowDobPicker(false);
                                    }}
                                >
                                    <Text style={styles.dobModalDone}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={tempDob}
                                mode="date"
                                display="spinner"
                                maximumDate={MAX_DOB}
                                minimumDate={MIN_DOB}
                                onChange={(_, selectedDate) => {
                                    if (selectedDate) setTempDob(selectedDate);
                                }}
                                style={{ height: 200 }}
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </KeyboardAvoidingView>
    );
}

// Small helper to render a label row above an input
function FieldLabel({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
    return (
        <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>
                {text}
                {required && <Text style={styles.fieldLabelRequired}> *</Text>}
            </Text>
            {hint && <Text style={styles.fieldLabelHint}>{hint}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    scrollContent: {
        flexGrow: 1,
    },

    content: {
        flex: 1,
        padding: 24,
        paddingTop: 56,
        paddingBottom: 40,
    },

    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#111',
        marginBottom: 6,
        alignSelf: 'center',
        letterSpacing: -0.5,
    },

    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        marginBottom: 36,
        alignSelf: 'center',
    },

    form: {
        gap: 6,
    },

    // Field label
    fieldLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 12,
        marginBottom: 4,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    fieldLabelRequired: {
        color: '#F2B949',
        fontWeight: '700',
    },
    fieldLabelHint: {
        fontSize: 11,
        color: '#9ca3af',
    },

    // Text inputs
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

    bioInput: {
        height: 90,
        paddingTop: 12,
    },

    // Date of birth button
    dobButton: {
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
    dobText: {
        fontSize: 15,
        color: '#111',
    },
    dobPlaceholder: {
        fontSize: 15,
        color: '#999',
    },

    // iOS DOB picker modal
    dobModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    dobModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 36,
    },
    dobModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    dobModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
    },
    dobModalCancel: {
        fontSize: 15,
        color: '#9ca3af',
    },
    dobModalDone: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F2B949',
    },

    // Buttons
    primaryButton: {
        backgroundColor: '#F2B949',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '700',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 15,
    },
    linkText: {
        color: '#F2B949',
        fontSize: 15,
        fontWeight: '600',
    },

    // Terms checkbox
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        marginBottom: 4,
        gap: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: '#F2B949',
        borderColor: '#F2B949',
    },
    checkmark: {
        color: '#111',
        fontSize: 13,
        fontWeight: '700',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 19,
    },
    link: {
        color: '#111',
        textDecorationLine: 'underline',
    },
});
