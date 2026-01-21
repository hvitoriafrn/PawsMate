// Import the necessary libraries and components 
import { auth } from '@/config/firebase';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';

// Sign Up Screen Component
export default function SignUpScreen() {
  const router = useRouter(); // Router for navigation
  // Get the functions from Zustand store
  const { setUser, setLoading, setError } = useUserStore();
  
  // Get the necessary information from the user 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  //  Handle user sign up when the sign up button is pressed
  const handleSignUp = async () => {
    // Validation to check if all the fields are filled
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields'); // if a field is empty, error
      return;
    }
    // Password validation for both entered passwords to ensure they match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    // Check if password meets minimum character requirement
    if (password.length < 8) {
      Alert.alert('Error', 'Password must contain at least 8 characters');
      return;
    }
    
    // Start loading state
    setLoading(true);

    // If all the validation passed, try to create account
    try {
      // Sends user's details (email and password to Firebase)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user); 
      // if all correct, create user, show a message to user to let them know
      Alert.alert('Success', 'Account created successfully!');
      
      // Navigate to main app
      router.replace('/(tabs)'); // because of 'replace' the user can't go to signup scren
      
      // If any errors occuer, show the error to the user
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message);
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
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

              {/* Input for email */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
              {/* Password input */}
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
              
              {/* Confirm password */}
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password"
            />

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
    color: '#333',
  },

  // Subtitle
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
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
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
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
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});
