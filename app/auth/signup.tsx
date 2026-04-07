// signup
// Import the necessary libraries and components 
import { auth } from '@/config/firebase';
import { createUserDocument } from '@/services/firebase/firestoreService';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';

// Sign Up Screen Component
export default function SignUpScreen() {
  const router = useRouter(); // Router for navigation
  // Get the functions from Zustand store
  const { setUser, setError } = useUserStore();
  
  // Get the necessary information from the user 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  // For terms and conditions
  const [termsAccepted, setTermsAccepted] = useState(false);

  //  Handle user sign up when the sign up button is pressed
  const handleSignUp = async () => {
    // Validation to check if all the fields are filled
    if (!name.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
    }

    if (!age || isNaN(parseInt(age)) || parseInt(age) < 18) { 
        Alert.alert('Error','You must be at least 18 years old');
        return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert('Error','Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error','Password must be at least 8 characters');
      return;
    }
  
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    // Start loading state
    setLoading(true);

    // If all the validation passed, try to create account
    try {
      // Sends user's details (email and password to Firebase)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email, 
        password
      ); 
      const user = userCredential.user
      
      // Log to the console the acct has been created
      console.log('User acct created: ', user.uid);

      await createUserDocument (
        user.uid,
        email,
        name,
        parseInt(age),
        'Location pending...', 
        bio || undefined,
        true,
        new Date().toISOString()
      );

      // Log to the console
      console.log('Firestore doc created');

      setUser({
        uid: user.uid,
        email: user.email || '',
        displayName: name,
      });

      // if all correct, create user, show a message to user to let them know
      Alert.alert('Success', 'Account created successfully!');
      // Navigate to main app
      router.replace('/onboarding/location'); // because of 'replace' the user can't go to signup screen
      
      // If any errors occuer, show the error to the user
    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = error.message;

      if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'An account linked to this email already exists. Please use login.'
      } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email adress format. Please enter a valid email address.'
      } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password does not meet the requirements. Use at least 8 characters.'
      }
      Alert.alert('Sign Up Failed', error.message);

      // Stops loading
    } finally {
      setLoading(false);
    }
  };

// Render the sign up screen UI
  return (
    // Ensure the keyboard does not cover the input fields
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Allows scrolling */}
      <ScrollView contentContainerStyle={styles.scrollContent}> 
        <View style={styles.content}>
          <Text style={styles.title}>Create Account 🐾</Text>
          <Text style={styles.subtitle}>Join the PawsMate community</Text>

           {/* Render the form inputs */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={'#999'}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

              {/* Input for email */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={'#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
              {/* Password input */}
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor={'#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
              
              {/* Confirm password */}
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={'#999'}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password"
            />

              {/* Age input */}
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor={'#999'}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

              {/* Bio input */}
            <TextInput
              style={styles.input}
              placeholder="It's me, hi, I'm the entirely uninteresting bio."
              placeholderTextColor={'#999'}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />

            {/* Terms & Conditions checkbox */}
            <View style={styles.checkboxRow}> 
              <TouchableOpacity
                style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
                onPress={() =>
                  setTermsAccepted(prev => !prev)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAccepted }}
              >
                {termsAccepted && <Text style={styles.checkmark}></Text>}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the {''}
                <Text 
                  style={styles.link}
                  onPress={() => Linking.openURL('')}
                >
                  Terms of Service
                </Text>
                {''}and{''}
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL('')}
                >
                  Privacy Policy
                </Text>
                , including how PawsMate processes my personal data under UK GDPR.
              </Text>
            </View>

            {/* Sign up button*/}
            <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>
            {/* Link in the footer in case user already has an existing account*/}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles for the sign up screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Ensures the content can scroll if needed
  scrollContent: {
    flexGrow: 1,
  },

  // Main content container
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },

  // Title
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111',
    alignSelf: 'center',
  },

  // Subtitle
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    alignSelf: 'center',
  },

  // Form container
  form: {
    gap: 15,
  },

  // Input fields
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  // Primary button
  primaryButton: {
    backgroundColor: '#F2B949',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#111',
    fontSize: 18,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },

  // text link in the footer
  linkText: {
    color: '#F2B949',
    fontSize: 16,
    fontWeight: '600',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1, // aligns with first line of text
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
  },
  checkmark: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 19,
  },
  link: {
    color: '#10b981',
    textDecorationLine: 'underline',
  },

});
