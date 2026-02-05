// Import necessary modules and components
import { auth } from '@/config/firebase';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  Alert, ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

// Define the component for the Home Screen
export default function HomeScreen() {
  const { user, logout } = useUserStore();
  const router = useRouter();

  // Handles the confirmation pop out for logging out
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              logout();
              router.replace('/auth/landingPage');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  // Render the home screen
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome to PawsMate!</Text>
          {user && <Text style={styles.email}>Logged in as: {user.email}</Text>}
        </View>
      </View>

      {/* Logout button, bigger than it used to be */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* A little coming soon section, still work in progress(*/}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Nothing to see here yet!
        </Text>
      </View>
    </ScrollView>
  );
}

// Styles for the Home Screen component
const styles = StyleSheet.create({
  // Main container style
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    
  },
  
  // Header section
  header: {
    marginBottom: 20,
    marginTop: 40,
  },

  // Welcome section
  welcomeSection: {
    marginBottom: 20,
  },

  // Title 
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },

  // Email
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },

  // Logout button - NOW MUCH MORE VISIBLE!
  logoutButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Add a subtle shadow for better visibility
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3, // For Android
  },

  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },

  // Placeholder for future content
  placeholder: {
    backgroundColor: '#f9f9f9',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },

  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});