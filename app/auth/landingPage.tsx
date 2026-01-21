// Import necessary modules and components
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// main landing page component
export default function WelcomeScreen() {
  const router = useRouter(); // gets the router object for navigation

  return (
    // main container view of the landing page
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>Welcome to PawsMate</Text>
        <Text style={styles.subtitle}>
          Connect with pet lovers in your area for walks, playdates, and friendship and more!
        </Text>
      </View>

    {/* buttons container with styling */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} /* Sign up/create an account button*/
          onPress={() => router.push('/auth/signup')}
        >
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          /* Sign in button */
          style={styles.secondaryButton} 
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles for the landing page components
const styles = StyleSheet.create({
  // main container style
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-between',
  },
  
  // content section style
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // emoji style (paws)
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },

  // title text style
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },

  // subtitle text style
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 30,
    lineHeight: 24,
  },
  // buttons container style
  buttonContainer: {
    gap: 15,
    marginBottom: 40,
  },
  // primary button style (Create Account)
  primaryButton: {
    backgroundColor: '#4A90E2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },

  // primary button text style 
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // secondary button style (Sign In)
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },

  // secondary button text style
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: '600',
  },
});