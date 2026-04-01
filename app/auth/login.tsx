// Import necessary modules and components
import { auth } from '@/config/firebase'; // import firebase auth configuration
import { useUserStore } from '@/store/userStore'; // import the user store
import { useRouter } from 'expo-router'; // router for navigation
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react'; // React state management
import {
  Alert,
  Image,
  KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';


// Login Screen Component
export default function LoginScreen() {
  const router = useRouter();
  // Access user store actions
  const { setUser, setLoading, setError } = useUserStore();
  
  // Local state for email and password inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle user login when the login button is pressed
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Set loading state to true 
    setLoading(true);

    // try to sign in with email and password
    try {
      // Firebase authentication, checks if the details are correct and exists
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      //if correct, it sets the user in the store
      setUser(userCredential.user);
      
      // Navigate to main app
      router.replace('/(tabs)');

    } catch (error: any) {
      // if error occurs, log it and set error state
      console.error('Login error:', error);
      setError(error.message);
      // Show error to the user
      Alert.alert('Login Failed', error.message);
      
    } finally {
      // Stops the loading state
      setLoading(false);
    }
  };

  // Render the login form
  return (
    <KeyboardAvoidingView // pushes the content up when the keyboard opens
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      
      <View style={styles.content}>
         <Image
                  source={require('@/assets/images/pawsmateLanding.png')} // logo image
                  style={styles.logo}
                  resizeMode="contain"
                />
        {/* Welcome message */}
        <Text style={styles.title}>Welcome Back! 🐾</Text>
        
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Form section for the login with email input field */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={'grey'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {/* Password input field */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={'grey'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {/* Changes the style of the button when touched */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            {/* Sign In button */}
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          {/* footer */}
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

// Styles for the login screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Main content area
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },

  logo: {
    width: 380,
    height: 160,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 2,
  },
  
  // Title 
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111',
    alignSelf: 'center',
  },

  // Subtitles style
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },

  // Form container
  form: {
    gap: 15,
  },

  // Input styling
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  // Primary button (Sign In)
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

  // Blue link 
  linkText: {
    color: '#F2B949',
    fontSize: 16,
    fontWeight: '600',
  },
});