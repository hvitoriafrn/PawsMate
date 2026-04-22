// Reset password screen, sends a Firebase password reset email

import { auth } from '@/config/firebase';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ResetPasswordScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                // Don't confirm whether the email exists
                setSent(true);
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please wait a moment before trying again.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Back button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={22} color="#111" />
                </TouchableOpacity>

                <Image
                    source={require('@/assets/images/pawsmateLanding.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {sent ? (
                    /* Success state */
                    <View style={styles.successWrap}>
                        <View style={styles.successIconWrap}>
                            <Feather name="mail" size={32} color="#111" />
                        </View>
                        <Text style={styles.title}>Check your inbox</Text>
                        <Text style={styles.subtitle}>
                            If an account exists for {email.trim()}, you'll receive a password reset link shortly.
                        </Text>
                        <Text style={styles.spamNote}>
                            Don't see it? Check your spam folder.
                        </Text>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.replace('/auth/login')}
                        >
                            <Text style={styles.primaryButtonText}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Form state */
                    <View>
                        <Text style={styles.title}>Forgot password?</Text>
                        <Text style={styles.subtitle}>
                            Enter the email address linked to your account and we'll send you a reset link.
                        </Text>

                        <View style={styles.form}>
                            <Text style={styles.fieldLabel}>
                                Email address <Text style={styles.fieldLabelRequired}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, !!error && styles.inputError]}
                                placeholder="e.g. robin@example.com"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={v => { setEmail(v); if (error) setError(''); }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                                returnKeyType="done"
                                onSubmitEditing={handleSend}
                            />
                            {!!error && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}

                            <TouchableOpacity
                                style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
                                onPress={handleSend}
                                disabled={submitting}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#111" />
                                    : <Text style={styles.primaryButtonText}>Send reset link</Text>
                                }
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.footer} onPress={() => router.back()}>
                                <Text style={styles.footerText}>Remembered it? </Text>
                                <Text style={styles.linkText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },

    backBtn: {
        position: 'absolute',
        top: 56,
        left: 24,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logo: {
        width: 380,
        height: 160,
        alignSelf: 'center',
        marginBottom: 16,
    },

    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#111',
        alignSelf: 'center',
        marginBottom: 6,
        letterSpacing: -0.5,
    },

    subtitle: {
        fontSize: 15,
        color: '#6b7280',
        alignSelf: 'center',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 8,
    },

    form: {
        gap: 6,
    },

    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
        marginBottom: 4,
    },

    fieldLabelRequired: {
        color: '#F2B949',
        fontWeight: '700',
    },

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

    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 2,
    },

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

    // Success state
    successWrap: {
        alignItems: 'center',
        gap: 8,
    },

    successIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F2B949',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },

    spamNote: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 4,
        marginBottom: 16,
    },
});
