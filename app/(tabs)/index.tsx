// Import necessary modules and components
import { auth } from '@/config/firebase';
import { mockEvents, mockUsers } from '@/constants/mockData';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  Alert, ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

// define the component for the Home Screen
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
        <View>
          <Text style={styles.title}>Welcome to PawsMate! 🐾</Text>
          {user && <Text style={styles.email}>Logged in as: {user.email}</Text>}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Section to show nearby pet lovers*/}
       
      <Text style={styles.sectionTitle}>Nearby Pet Lovers</Text>
      {mockUsers.map(user => (
        <View key={user.id} style={styles.card}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
          <Text style={styles.distance}>{user.distance} away</Text>
        </View>
      ))}

       {/* Section for upcoming events  */}
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      {mockEvents.map(event => (
        <View key={event.id} style={styles.card}>
          <Text style={styles.name}>{event.title}</Text>
          <Text style={styles.bio}>{event.date} at {event.time}</Text>
          <Text style={styles.distance}>{event.attendees} attending</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Styles for the Home Screen component

const styles = StyleSheet.create({
  // main container style
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  
  // header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 20,
  },

  // title 
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  // email
  email: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },

  // logout button
  logoutButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },

  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },

  // section titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },

  // card style for user or event
  card: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  // name 
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // bio
  bio: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },

  //distance
  distance: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});
