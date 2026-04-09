// login screen
import { auth } from '@/config/firebase';
import { getUserById } from '@/services/firebase/firestoreService';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setLoading, setError } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }

    setSubmitting(true);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);

      // Store the full Firestore user (which includes geopoint) rather than
      // the Firebase Auth object, so distance filtering works immediately
      const firestoreUser = await getUserById(userCredential.user.uid);
      setUser(firestoreUser ?? userCredential.user);

      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('Login error:', error);

      let message = 'Something went wrong. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Incorrect email or password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please wait a moment before trying again.';
      }

      setError(error.message);
      Alert.alert('Sign in failed', message);

    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/pawsmateLanding.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>

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
            returnKeyType="next"
          />

          <FieldLabel text="Password" required />
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {text}
      {required && <Text style={styles.fieldLabelRequired}> *</Text>}
    </Text>
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
    marginBottom: 32,
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
});
