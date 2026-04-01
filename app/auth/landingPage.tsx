// Import necessary modules and components
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// main landing page component
export default function landingPage() {
  const router = useRouter(); // gets the router object for navigation

  return (
    // main container view of the landing page
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to</Text>
        {/* Logo image */}
        <Image
          source={require('@/assets/images/pawsmateLanding.png')} // logo image
          style={styles.logo}
          resizeMode="contain"
        />
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
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: -2,
    color: '#000000',
  },

  logo: {
    width: 520,
    height: 240,
    marginBottom: 2,
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
    backgroundColor: '#F2B949',
    borderColor: '#000000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },

  // primary button text style 
  primaryButtonText: {
    color: '#111',
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
    borderColor: '#111',
  },

  // secondary button text style
  secondaryButtonText: {
    color: '#111',
    fontSize: 18,
    fontWeight: '600',
  },
});