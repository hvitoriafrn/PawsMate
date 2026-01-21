// Import necessary modules and components
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

// define the component for the Modal Screen
export default function ModalScreen() {
  return (
    // main container view for the modal
    <ThemedView style={styles.container}>
      {/* title text for the modal */}
      <ThemedText type="title">This is a modal</ThemedText>
      
      {/* Link to go back to the home screen */}
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

//Styles for the modal components
const styles = StyleSheet.create({

  //main container
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  // style for the link
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
